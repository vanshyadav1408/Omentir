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
  planActionSlots,
  updateEnrollment,
  updateLead,
} from "./data";
import { findNextScheduledStepIndex } from "./campaign-sequence";
import { sendWindowTimeZoneForLead } from "./lead-time-zone";
import { SPACING_MINUTES } from "./send-schedule";
import { classifyReplyIntent, draftCampaignMessage } from "./gemini";
import { renderTemplate } from "./outreach-rules";
import {
  isHotReply,
  isMeetingBooked,
  shouldArmAiReply,
  shouldStopForReply,
} from "./reply-automation-policy";
import { hasActiveSubscription } from "./subscription";
import {
  sendInterestedLeadNotification,
  sendReplyNotification,
} from "./email";
import {
  getLinkedInPostCreatedAt,
  getLinkedInPostText,
  listLinkedInPostsForProfile,
  retrieveLinkedInProfile,
} from "./unipile";
import type {
  Campaign,
  CampaignEnrollment,
  Lead,
  LinkedInAccount,
} from "./types";

export async function refreshLeadProfileForDrafting(
  lead: Lead,
  account: LinkedInAccount,
) {
  const identifier = lead.providerProfileId || lead.linkedInUrl;
  if (!identifier) return lead;

  try {
    const [profile, posts] = await Promise.all([
      retrieveLinkedInProfile({
        accountId: account.accountId,
        identifier,
      }),
      listLinkedInPostsForProfile({
        accountId: account.accountId,
        identifier,
        limit: 3,
      }).catch(() => []),
    ]);
    if (!profile) {
      if (lead.profileContext) return lead;
      throw new Error("Full LinkedIn profile context is not available yet.");
    }

    const recentPosts = posts
      .map((post) => {
        const text = getLinkedInPostText(post).replace(/\s+/g, " ").trim().slice(0, 600);
        if (!text) return "";
        const createdAt = getLinkedInPostCreatedAt(post);
        return `${createdAt.slice(0, 10)} | ${text}`;
      })
      .filter(Boolean);
    const existingContext = profile.profileContext || lead.profileContext;
    const profileContext =
      existingContext || recentPosts.length
        ? {
            about: existingContext?.about || "",
            experience: existingContext?.experience || [],
            education: existingContext?.education || [],
            skills: existingContext?.skills || [],
            certifications: existingContext?.certifications || [],
            projects: existingContext?.projects || [],
            volunteering: existingContext?.volunteering || [],
            languages: existingContext?.languages || [],
            recentPosts,
            capturedAt: new Date().toISOString(),
          }
        : undefined;
    const enrichedLead: Lead = {
      ...lead,
      ...Object.fromEntries(
        Object.entries(profile).filter(
          ([, value]) => value !== undefined && value !== "",
        ),
      ),
      ...(profileContext ? { profileContext } : {}),
    };

    await updateLead(lead.workspaceId, lead.id, {
      providerProfileId: enrichedLead.providerProfileId,
      linkedInUrl: enrichedLead.linkedInUrl,
      avatarUrl: enrichedLead.avatarUrl,
      name: enrichedLead.name,
      title: enrichedLead.title,
      company: enrichedLead.company,
      location: enrichedLead.location,
      summary: enrichedLead.summary,
      profileContext: enrichedLead.profileContext,
    });
    return enrichedLead;
  } catch (error) {
    console.error(`[automation] failed to refresh profile context for lead ${lead.id}:`, error);
    if (lead.profileContext) return lead;
    throw error;
  }
}

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
    const sequencePosition = campaign.steps
      .slice(0, messageStepIndex + 1)
      .filter((candidate) => candidate.type === "message").length;
    const leadForDrafting =
      sequencePosition === 1
        ? await refreshLeadProfileForDrafting(lead, account)
        : lead;
    const [profile, conversation] = await Promise.all([
      getProductProfile(campaign.workspaceId),
      getConversation(campaign.workspaceId, lead.id),
    ]);
    const body = await draftCampaignMessage({
      lead: leadForDrafting,
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

// Webhook-side wrapper around the send planner. Provider events land at
// arbitrary hours, so every enrollment woken from here gets a real slot inside
// the campaign's send window rather than "now" or "now + wait". Falls back to
// the naive time if planning fails: a slightly-off schedule beats dropping the
// acceptance or reply signal entirely.
async function planFirstAvailableSlot(input: {
  workspaceId: string;
  campaign: Campaign | undefined;
  enrollmentId: string;
  kind: "message" | "reply";
  earliestAt: number;
  // Where the lead is: an acceptance or reply arriving at any hour is planned
  // into the next opening of THEIR window, not the workspace's.
  leadLocation: string | undefined;
}) {
  const fallback = new Date(input.earliestAt).toISOString();
  if (!input.campaign) return fallback;

  try {
    const workspace = await getWorkspace(input.workspaceId);
    const plan = await planActionSlots({
      workspace,
      campaign: input.campaign,
      actions: [
        {
          id: input.enrollmentId,
          kind: input.kind,
          earliestAt: input.earliestAt,
          timezone: sendWindowTimeZoneForLead(input.leadLocation, workspace.timezone),
        },
      ],
    });
    const slot = plan.get(input.enrollmentId);
    return slot === undefined ? fallback : new Date(slot).toISOString();
  } catch (error) {
    console.error(
      `[automation] slot planning failed for enrollment ${input.enrollmentId}:`,
      error,
    );
    return fallback;
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
  // The wait step's delay is the EARLIEST the first message may go, not the
  // time it goes. Acceptances arrive whenever the lead happens to click, so
  // without the planner a 3am acceptance produced a 3:15am first message.
  const earliestAt =
    Date.now() + (currentStep?.type === "wait" ? currentStep.delayMinutes * 60 * 1000 : 0);
  const nextActionAt = await planFirstAvailableSlot({
    workspaceId,
    campaign,
    enrollmentId: enrollment.id,
    kind: "message",
    earliestAt,
    leadLocation: lead.location,
  });

  await updateEnrollment(workspaceId, enrollment.id, {
    status: "connected",
    ...(currentStep?.type === "wait"
      ? { currentStepIndex: enrollment.currentStepIndex + 1, nextActionAt }
      : { nextActionAt }),
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
  const aiReplyCandidates = leadEnrollments.filter(
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
  const aiReplyEnrollments = aiReplyCandidates.filter((enrollment) => {
    const enrollmentCampaign = campaigns.find((item) => item.id === enrollment.campaignId);
    return !shouldStopForReply({
      replyHandling: enrollmentCampaign?.replyHandling,
      intent: classification.intent,
      confidence: classification.confidence,
    });
  });
  const stoppedEnrollments = leadEnrollments.filter(
    (enrollment) => !aiReplyEnrollments.some((active) => active.id === enrollment.id),
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
  const meetingBooked = isMeetingBooked(classification.intent);
  if (aiReplyEnrollments.length) {
    // Replies are planned as kind "reply", so they outrank queued cold invites
    // for the next free slot - but they still land inside the send window
    // rather than firing back at 3am just because that is when it arrived.
    const armed = await Promise.all(
      aiReplyEnrollments.map(async (enrollment) => ({
        enrollment,
        nextActionAt: await planFirstAvailableSlot({
          workspaceId,
          campaign: campaigns.find((item) => item.id === enrollment.campaignId),
          enrollmentId: enrollment.id,
          kind: "reply",
          // Keep automated replies human-paced even when the account has been
          // idle. The shared account drip alone would otherwise allow a reply
          // on the next tick, only seconds after the lead wrote.
          earliestAt: Date.now() + SPACING_MINUTES * 60 * 1000,
          leadLocation: lead.location,
        }),
      })),
    );
    await Promise.all([
      ...armed.map(({ enrollment, nextActionAt }) =>
        updateEnrollment(workspaceId, enrollment.id, {
          status: "reply_received",
          nextActionAt,
          // Any message drafted before this inbound reply is now stale. The
          // reply path must generate from the complete conversation instead.
          nextMessageDraft: undefined,
        }),
      ),
      // A lead can sit in campaigns with different reply modes. Stop only the
      // enrollments whose selected outcome has been reached.
      ...stoppedEnrollments.map((enrollment) =>
        updateEnrollment(workspaceId, enrollment.id, { status: "replied" }),
      ),
    ]);
  } else {
    await Promise.all(
      leadEnrollments.map((enrollment) =>
        updateEnrollment(workspaceId, enrollment.id, { status: "replied" }),
      ),
    );
  }

  const workspace = await getWorkspace(workspaceId);
  // Product notification emails only go to active (or billing-bypassed) workspaces.
  const email =
    hasActiveSubscription(workspace)
      ? input.notifyEmailOverride || workspace.notificationEmail
      : undefined;
  // Who gets told about an ordinary (not-yet-hot) reply, decided by the reply
  // mode picked when the agent was created:
  // - "hand the conversation off to me": yes. Automation just stopped and the
  //   user owns this conversation from the first reply, so they must hear about
  //   it the moment it lands, whatever the lead said.
  // - "continue until interest": no. AI handles ordinary replies and emails
  //   when qualified interest is detected.
  // - "continue until booked": no. AI keeps working until the lead confirms a
  //   booking, then sends the outcome email.
  // A lead with no live enrollment has no automation behind them at all, so
  // nothing else would ever surface the reply - notify.
  // A hand-off campaign can still opt out of the email (notifyOnReply false):
  // the user writes every message themselves and reads replies in LinkedIn.
  const notifyOnPlainReply =
    handoffEnrollments.some(
      (enrollment) =>
        campaigns.find((item) => item.id === enrollment.campaignId)?.notifyOnReply !== false,
    ) || leadEnrollments.length === 0;
  const stoppedAtInterest =
    isHotInterest &&
    (leadEnrollments.length === 0 ||
      stoppedEnrollments.some((enrollment) => {
        const mode = campaigns.find((item) => item.id === enrollment.campaignId)?.replyHandling;
        return mode !== "handoff" && mode !== "ai_until_booked";
      }));
  if (email && (meetingBooked || stoppedAtInterest)) {
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
            classification.nextStepHint ||
            classification.reason ||
            (meetingBooked ? "Confirmed a booked meeting" : "Showed buying interest"),
          idempotencyKey: input.providerMessageId
            ? `interest-${workspaceId}-${lead.id}-${input.providerMessageId}`
            : `interest-${workspaceId}-${lead.id}`,
        });
        await logAutomationRun({
          workspaceId,
          kind: "webhook",
          status: "completed",
          message: `${meetingBooked ? "Meeting booked" : "Interest detected"}: ${lead.name} (${classification.intent}, ${classification.confidence.toFixed(2)}), ${classification.reason}`,
        });
      } catch (error) {
        console.error("[inbound] failed to send interested-lead notification:", error);
      }
    }
  } else if (email && notifyOnPlainReply && (await claimReplyNotification(workspaceId, lead.id))) {
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
