import "server-only";

// Shared handling for provider events about a lead: an accepted connection
// request and an inbound reply. Both arrive through two independent paths -
// the Unipile webhook (primary, instant) and the tick's provider sync
// (fallback, batched) - which must apply identical state transitions, so the
// logic lives here instead of inside the webhook route.

import {
  claimInterestNotification,
  claimReplyNotification,
  createConversationMessage,
  getConversation,
  getLinkedInAccountForWorkspace,
  getProductProfile,
  getWorkspace,
  listCampaignEnrollments,
  listCampaigns,
  logAutomationRun,
  stopLeadEnrollments,
  updateEnrollment,
  updateLead,
} from "./data";
import { findNextScheduledStepIndex } from "./campaign-sequence";
import { classifyReplyIntent, draftCampaignMessage } from "./gemini";
import { renderTemplate } from "./outreach-rules";
import {
  isHotReply,
  isTerminalReplyIntent,
  shouldArmAiReply,
} from "./reply-automation-policy";
import { hasActiveSubscription } from "./subscription";
import {
  sendInterestedLeadNotification,
  sendReplyNotification,
} from "./email";
import type {
  Campaign,
  CampaignEnrollment,
  Lead,
  LinkedInAccount,
} from "./types";

// Pre-drafts the upcoming AI message when a wait step starts, so the Actions
// page shows the exact text that will go out instead of "will be generated at
// send time". The send path reuses the draft (matched by stepIndex). Manual
// templates that render cleanly are already previewable, so they're skipped.
// Never throws: a failed preview just means the message drafts at send time.
export async function draftUpcomingMessagePreview(input: {
  campaign: Campaign;
  lead: Lead;
  account: LinkedInAccount;
  // First step index the enrollment will look at after the wait completes.
  fromStepIndex: number;
}): Promise<CampaignEnrollment["nextMessageDraft"]> {
  const { campaign, lead, account, fromStepIndex } = input;
  const messageStepIndex = findNextScheduledStepIndex(campaign.steps, fromStepIndex);
  const messageStep = campaign.steps[messageStepIndex];
  if (!messageStep || messageStep.type !== "message") return undefined;
  const rendered = renderTemplate(messageStep.messageTemplate, lead);
  if (rendered.natural && rendered.text) return undefined;

  try {
    const [profile, conversation] = await Promise.all([
      getProductProfile(campaign.workspaceId),
      getConversation(campaign.workspaceId, lead.id),
    ]);
    const sequencePosition = campaign.steps
      .slice(0, messageStepIndex + 1)
      .filter((candidate) => candidate.type === "message").length;
    const body = await draftCampaignMessage({
      lead,
      productProfile: profile,
      campaignName: campaign.name,
      templateHint: messageStep.messageTemplate,
      senderName: account.displayName,
      sequencePosition,
      conversation: conversation?.messages || [],
      campaignGoal: campaign.campaignGoal,
      messageTone: campaign.messageTone,
    });
    if (!body.trim()) return undefined;
    return { stepIndex: messageStepIndex, body, createdAt: new Date().toISOString() };
  } catch (error) {
    console.error(
      `[automation] failed to pre-draft message preview for lead ${lead.id}:`,
      error,
    );
    return undefined;
  }
}

// Records an accepted connection request on one enrollment: store the
// acceptance and start the configured post-acceptance wait before calling
// Gemini - a drafting/provider failure must never lose the primary acceptance
// signal or shift the user's timer.
export async function applyConnectionAccepted(input: {
  workspaceId: string;
  lead: Lead;
  enrollment: CampaignEnrollment;
  campaign: Campaign | undefined;
  // Account the event arrived on, when known; saves a fetch if it matches the
  // campaign's account.
  account?: LinkedInAccount | null;
}) {
  const { workspaceId, lead, enrollment, campaign } = input;
  const currentStep = campaign?.steps[enrollment.currentStepIndex];
  await updateEnrollment(workspaceId, enrollment.id, {
    status: "connected",
    ...(currentStep?.type === "wait"
      ? {
          currentStepIndex: enrollment.currentStepIndex + 1,
          nextActionAt: new Date(
            Date.now() + currentStep.delayMinutes * 60 * 1000,
          ).toISOString(),
        }
      : { nextActionAt: new Date().toISOString() }),
  });

  try {
    if (!campaign) return;
    const campaignAccount =
      input.account &&
      (!campaign.linkedInAccountId || campaign.linkedInAccountId === input.account.id)
        ? input.account
        : await getLinkedInAccountForWorkspace(workspaceId, campaign.linkedInAccountId);
    if (!campaignAccount) return;
    const draftFromStepIndex =
      currentStep?.type === "wait"
        ? enrollment.currentStepIndex + 1
        : enrollment.currentStepIndex;
    const nextMessageDraft = await draftUpcomingMessagePreview({
      campaign,
      lead,
      account: campaignAccount,
      fromStepIndex: draftFromStepIndex,
    });

    if (nextMessageDraft) {
      await updateEnrollment(workspaceId, enrollment.id, { nextMessageDraft });
    }
  } catch (error) {
    console.error(`[inbound] failed to pre-draft accepted lead ${lead.id}:`, error);
  }
}

function campaignHandsOffOnReply(campaignId: string | undefined, campaigns: Campaign[]) {
  return campaigns.find((item) => item.id === campaignId)?.replyHandling === "handoff";
}

export type InboundMessageResult =
  | { duplicate: true }
  | {
      duplicate: false;
      intent: Awaited<ReturnType<typeof classifyReplyIntent>>["intent"];
      confidence: number;
    };

// The full inbound-reply pipeline: classify intent, store the message (deduped
// on the provider message id), mark the lead replied, stop or arm campaign
// enrollments, and notify the workspace owner.
export async function processInboundMessage(input: {
  workspaceId: string;
  lead: Lead;
  body: string;
  senderName: string;
  providerMessageId?: string;
  campaignIdHint?: string;
  // Account the message arrived on, when known - used in notification emails.
  account?: LinkedInAccount | null;
  // Webhook payloads may carry an explicit notification address.
  notifyEmailOverride?: string;
}): Promise<InboundMessageResult> {
  const { workspaceId, lead } = input;

  const [enrollments, campaigns, existingConversation, productProfile] = await Promise.all([
    listCampaignEnrollments(workspaceId),
    listCampaigns(workspaceId),
    getConversation(workspaceId, lead.id),
    getProductProfile(workspaceId),
  ]);

  // Recognize a retried webhook delivery (or a sync pass over an
  // already-stored message) before spending a Gemini classification on it.
  // createConversationMessage still dedupes transactionally below.
  if (
    input.providerMessageId &&
    (existingConversation?.messages || []).some(
      (message) => message.id === input.providerMessageId,
    )
  ) {
    return { duplicate: true };
  }

  // Classify before storing so the conversation doc carries intent for the AI
  // reply tick. Failures fall back to neutral inside classifyReplyIntent.
  const classification = await classifyReplyIntent({
    lead,
    productProfile,
    conversation: existingConversation?.messages || [],
    latestInbound: input.body,
  });

  const leadEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.leadId === lead.id &&
      ["connected", "message_sent", "reply_received", "replied"].includes(enrollment.status),
  );
  // Hand-off campaigns never auto-reply: the user chose to take over the
  // conversation at the first reply, so their enrollments stop instead.
  const handoffEnrollments = leadEnrollments.filter(
    (enrollment) => campaignHandsOffOnReply(enrollment.campaignId, campaigns),
  );
  const aiReplyEnrollments = leadEnrollments.filter(
    (enrollment) => {
      const enrollmentCampaign = campaigns.find((item) => item.id === enrollment.campaignId);
      return shouldArmAiReply({
        replyHandling: enrollmentCampaign?.replyHandling,
        enrollmentStatus: enrollment.status,
        previousIntent: existingConversation?.replyIntent,
        previousIntentConfidence: existingConversation?.replyIntentConfidence,
      });
    },
  );

  const campaignId =
    input.campaignIdHint || leadEnrollments[0]?.campaignId || aiReplyEnrollments[0]?.campaignId;
  const campaign = campaigns.find((item) => item.id === campaignId);

  const inserted = await createConversationMessage({
    workspaceId,
    leadId: lead.id,
    campaignId,
    userId: workspaceId,
    senderName: input.senderName,
    body: input.body,
    providerMessageId: input.providerMessageId,
    replyIntent: classification.intent,
    replyIntentReason: classification.reason,
    replyIntentConfidence: classification.confidence,
    replyIntentNextStepHint: classification.nextStepHint,
  });
  if (!inserted) {
    return { duplicate: true };
  }

  await updateLead(workspaceId, lead.id, { outreachStatus: "replied" });

  const isHotInterest = isHotReply(classification.intent, classification.confidence);
  if (isTerminalReplyIntent(classification.intent) || isHotInterest) {
    await stopLeadEnrollments(workspaceId, lead.id);
  } else if (aiReplyEnrollments.length) {
    const now = new Date().toISOString();
    await Promise.all([
      ...aiReplyEnrollments.map((enrollment) =>
        updateEnrollment(workspaceId, enrollment.id, {
          status: "reply_received",
          nextActionAt: now,
        }),
      ),
      // A lead can sit in both an AI campaign and a hand-off campaign; the
      // hand-off ones still stop here while the AI ones keep the conversation.
      ...handoffEnrollments.map((enrollment) =>
        updateEnrollment(workspaceId, enrollment.id, { status: "replied" }),
      ),
    ]);
  } else {
    await stopLeadEnrollments(workspaceId, lead.id);
  }

  const workspace = await getWorkspace(workspaceId);
  // Product notification emails only go to active (or billing-bypassed) workspaces.
  const email =
    hasActiveSubscription(workspace)
      ? input.notifyEmailOverride || workspace.notificationEmail
      : undefined;
  if (email && isHotInterest) {
    if (await claimInterestNotification(workspaceId, lead.id)) {
      try {
        await sendInterestedLeadNotification({
          to: email,
          lead: {
            name: lead.name,
            title: lead.title,
            company: lead.company,
            location: lead.location,
            linkedInUrl: lead.linkedInUrl,
            summary: lead.summary,
            fitScore: lead.fitScore,
            scoreReasons: lead.scoreReasons,
            signalText: lead.signalText,
          },
          campaignName: campaign?.name,
          linkedInAccountName: input.account?.displayName,
          interestSignal: input.body,
          interestReason:
            classification.nextStepHint || classification.reason || "Showed buying interest",
          idempotencyKey: input.providerMessageId
            ? `interest-${workspaceId}-${lead.id}-${input.providerMessageId}`
            : `interest-${workspaceId}-${lead.id}`,
        });
        await logAutomationRun({
          workspaceId,
          kind: "webhook",
          status: "completed",
          message: `Interest detected: ${lead.name} (hot, ${classification.confidence.toFixed(2)}) — ${classification.reason}`,
        });
      } catch (error) {
        console.error("[inbound] failed to send interested-lead notification:", error);
      }
    }
  } else if (email && (await claimReplyNotification(workspaceId, lead.id))) {
    // Non-hot replies: lightweight "someone replied" email. Hot leads get the
    // rich interest email instead so the user is not double-notified.
    await sendReplyNotification({
      to: email,
      leadName: input.senderName,
      campaignName: campaign?.name,
      body: input.body,
      handoff: handoffEnrollments.length > 0,
      idempotencyKey: input.providerMessageId
        ? `reply-${workspaceId}-${lead.id}-${input.providerMessageId}`
        : undefined,
    });
  }

  await logAutomationRun({
    workspaceId,
    kind: "webhook",
    status: "completed",
    message: `Stored reply from ${input.senderName} (intent: ${classification.intent}, confidence: ${classification.confidence.toFixed(2)})`,
  });

  return {
    duplicate: false,
    intent: classification.intent,
    confidence: classification.confidence,
  };
}
