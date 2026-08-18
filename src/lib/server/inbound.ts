import "server-only";

// Shared handling for provider events about a lead: an accepted connection
// request and an inbound reply. Both arrive through two independent paths -
// the Unipile webhook (primary, instant) and the tick's provider sync
// (fallback, batched) - which must apply identical state transitions, so the
// logic lives here instead of inside the webhook route.

import {
  claimLeadOutcomeNotification,
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
import { nextAiReplyAt } from "./send-schedule";
import { classifyReplyIntent, draftCampaignMessage } from "./gemini";
import { renderTemplate } from "./outreach-rules";
import {
  enrollmentBlocksAiReply,
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

// Webhook-side wrapper around the send planner. Acceptances arrive at
// arbitrary hours, so the first message gets a real slot inside the campaign's
// send window rather than "now" or "now + wait". Falls back to the naive time
// if planning fails: a slightly-off schedule beats dropping the signal.
async function planFirstAvailableSlot(input: {
  workspaceId: string;
  campaign: Campaign | undefined;
  enrollmentId: string;
  kind: "message";
  earliestAt: number;
  // Where the lead is: an acceptance arriving at any hour is planned into the
  // next opening of THEIR window, not the workspace's.
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

export function enrollmentCanReceiveAcceptance(enrollment: CampaignEnrollment) {
  if (enrollment.status === "connection_sent") return true;
  if (!enrollment.connectionSentAt) return false;
  if (enrollment.status !== "stopped" && enrollment.status !== "error") return false;
  return !enrollmentBlocksAiReply(enrollment);
}

const LIVE_INBOUND_ENROLLMENT_STATUSES: CampaignEnrollment["status"][] = [
  "connection_sent",
  "connected",
  "message_sent",
  "reply_received",
  "replied",
  "error",
  "stopped",
];

function leadEnrollmentsForInbound(
  enrollments: CampaignEnrollment[],
  leadId: string,
) {
  return enrollments.filter(
    (enrollment) =>
      enrollment.leadId === leadId &&
      LIVE_INBOUND_ENROLLMENT_STATUSES.includes(enrollment.status) &&
      !enrollmentBlocksAiReply(enrollment),
  );
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

  // Empty provider events (read receipts, deliveries, reactions) must not be
  // stored under the real message id. That would make the later text delivery
  // look like a duplicate and the lead would never get a reply.
  if (!input.body.trim()) {
    return { duplicate: true };
  }

  const [enrollments, campaigns, existingConversation, productProfile] = await Promise.all([
    listCampaignEnrollments(workspaceId),
    listCampaigns(workspaceId),
    getConversation(workspaceId, lead.id),
    getProductProfile(workspaceId),
  ]);

  const existingMessages = existingConversation?.messages || [];
  const alreadyStored = Boolean(
    input.providerMessageId &&
      existingMessages.some((message) => message.id === input.providerMessageId),
  );

  // Classify before storing so the conversation doc carries intent for the AI
  // reply tick. Failures fall back to neutral inside classifyReplyIntent.
  // Retries reuse the stored classification so a second Gemini call cannot
  // flip a message we already acted on.
  const classification = alreadyStored
    ? {
        intent: existingConversation?.replyIntent || "neutral",
        confidence: existingConversation?.replyIntentConfidence || 0,
        reason: existingConversation?.replyIntentReason || "",
        nextStepHint: existingConversation?.replyIntentNextStepHint || "",
      }
    : await classifyReplyIntent({
        lead,
        productProfile,
        conversation: existingMessages,
        latestInbound: input.body,
      });

  const leadEnrollments = leadEnrollmentsForInbound(enrollments, lead.id);
  // Hand-off campaigns never auto-reply: the user chose to take over the
  // conversation at the first reply, so their enrollments stop instead.
  const handoffEnrollments = leadEnrollments.filter(
    (enrollment) => campaignHandsOffOnReply(enrollment.campaignId, campaigns),
  );
  const previousIntent = existingConversation?.replyIntent;
  const previousIntentConfidence = existingConversation?.replyIntentConfidence;
  const aiReplyCandidates = leadEnrollments.filter((enrollment) => {
    const enrollmentCampaign = campaigns.find((item) => item.id === enrollment.campaignId);
    return shouldArmAiReply({
      replyHandling: enrollmentCampaign?.replyHandling,
      enrollmentStatus: enrollment.status,
      previousIntent,
      previousIntentConfidence,
    });
  });
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

  const inserted = alreadyStored
    ? false
    : await createConversationMessage({
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

  const conversationAfterInsert = inserted
    ? [...existingMessages, { direction: "inbound" as const }]
    : existingMessages;
  const lastMessage = conversationAfterInsert[conversationAfterInsert.length - 1];
  // A retry that stored the inbound but crashed before arming still needs the
  // enrollment woken. If we already sent our reply, the last row is outbound
  // and there is nothing left to arm.
  const needsReplyArm = Boolean(inserted || lastMessage?.direction === "inbound");

  if (needsReplyArm) {
    // Arm enrollments before flipping outreachStatus. The tick used to see
    // "replied" on the lead while the enrollment was still message_sent and
    // permanently stop it, so the inbound never got an AI reply.
    if (aiReplyEnrollments.length) {
      const toArm = aiReplyEnrollments.filter(
        (enrollment) => enrollment.status !== "reply_received",
      );
      const toStop = stoppedEnrollments.filter(
        (enrollment) => enrollment.status !== "replied" && enrollment.status !== "stopped",
      );
      // Do not run replies through the outreach planner. That planner's send
      // window, daily cap, and reserved invite queue are what parked AI replies
      // hours out. A waiting prospect gets a random 2-15 minute pause so the
      // gap between their message and ours does not look like a fixed timer.
      const replyAt = nextAiReplyAt();
      const armed = toArm.map((enrollment) => ({
        enrollment,
        nextActionAt: replyAt,
      }));
      await Promise.all([
        ...armed.map(({ enrollment, nextActionAt }) =>
          updateEnrollment(workspaceId, enrollment.id, {
            status: "reply_received",
            nextActionAt,
            lastError: undefined,
            pendingAction: undefined,
            nextMessageDraft: undefined,
          }),
        ),
        ...toStop.map((enrollment) =>
          updateEnrollment(workspaceId, enrollment.id, { status: "replied" }),
        ),
      ]);
    } else {
      await Promise.all(
        leadEnrollments
          .filter(
            (enrollment) => enrollment.status !== "replied" && enrollment.status !== "stopped",
          )
          .map((enrollment) =>
            updateEnrollment(workspaceId, enrollment.id, { status: "replied" }),
          ),
      );
    }

    await updateLead(workspaceId, lead.id, { outreachStatus: "replied" });
  }

  if (!inserted) {
    return { duplicate: true };
  }

  const isHotInterest = isHotReply(classification.intent, classification.confidence);
  const meetingBooked = isMeetingBooked(classification.intent, classification.confidence);

  const workspace = await getWorkspace(workspaceId);
  // Product notification emails only go to active (or billing-bypassed) workspaces.
  const email =
    hasActiveSubscription(workspace)
      ? input.notifyEmailOverride || workspace.notificationEmail
      : undefined;
  // Notification emails follow the reply mode chosen at campaign setup
  // (GUI or MCP/API):
  // - handoff / manual ("stop after first reply"): email on the first reply
  //   when notifyOnReply is not false (default true).
  // - ai_until_interest: email when qualified interest is detected.
  // - ai_until_booked: email when the lead confirms a meeting was booked.
  // A lead with no live enrollment has no automation behind them, so nothing
  // else would surface the reply - notify.
  const notifyOnPlainReply =
    handoffEnrollments.some(
      (enrollment) =>
        campaigns.find((item) => item.id === enrollment.campaignId)?.notifyOnReply !== false,
    ) || leadEnrollments.length === 0;
  // Interest email for continue-until-interest (and legacy "ai") when that
  // mode just stopped. Booking mode waits for meeting_booked instead.
  const stoppedAtInterest =
    isHotInterest &&
    (leadEnrollments.length === 0 ||
      stoppedEnrollments.some((enrollment) => {
        const mode = campaigns.find((item) => item.id === enrollment.campaignId)?.replyHandling;
        return mode !== "handoff" && mode !== "ai_until_booked";
      }));
  // meetingBooked always wins: the user should hear about a confirmed booking
  // regardless of which reply mode was running.
  if (email && (meetingBooked || stoppedAtInterest)) {
    if (
      await claimLeadOutcomeNotification(
        workspaceId,
        lead.id,
        meetingBooked ? "meeting" : "interest",
      )
    ) {
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
