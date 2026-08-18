import type { CampaignEnrollment, CampaignReplyHandling, ReplyIntent } from "./types";

export const HOT_INTEREST_CONFIDENCE = 0.7;
export const MEETING_BOOKED_CONFIDENCE = 0.7;

export type LeadOutcomeNotificationKind = "interest" | "meeting";

export function leadOutcomeNotificationLockId(
  workspaceId: string,
  leadId: string,
  kind: LeadOutcomeNotificationKind,
) {
  return `${workspaceId}-${leadId}-${kind}`;
}

export function isTerminalReplyIntent(intent: ReplyIntent | undefined) {
  return intent === "negative" || intent === "not_now" || intent === "ooo";
}

export function isHotReply(intent: ReplyIntent | undefined, confidence: number | undefined) {
  return intent === "hot" && (confidence || 0) >= HOT_INTEREST_CONFIDENCE;
}

export function isMeetingBooked(intent: ReplyIntent | undefined, confidence?: number) {
  return intent === "meeting_booked" && (confidence ?? 1) >= MEETING_BOOKED_CONFIDENCE;
}

export function asksAboutPricing(message: string) {
  return (
    /\b(?:price|pricing|cost|costs|fee|fees)\b/i.test(message) ||
    /\bhow much\b/i.test(message) ||
    /\b(?:monthly|annual|yearly|hourly|daily) rates?\b/i.test(message) ||
    /\brate card\b/i.test(message) ||
    /\b(?:subscription|billing) plans?\b/i.test(message) ||
    /\b(?:free|paid) (?:plan|tier|trial)\b/i.test(message) ||
    /\bwhat (?:do|does|would|will) .{0,40}\bcharge\b/i.test(message)
  );
}

export function containsPricingDetails(message: string) {
  return (
    /\b(?:price|pricing|fee|fees|discount|discounts)\b/i.test(message) ||
    /\b(?:subscription|billing) plans?\b/i.test(message) ||
    /\b(?:free|paid) (?:plan|tier|trial)\b/i.test(message) ||
    /[$€£₹]\s*\d/.test(message) ||
    /\b\d+(?:\.\d+)?\s*(?:usd|eur|gbp|inr|dollars?|euros?|pounds?|rupees?|per month|per year|\/month|\/year|\/mo|\/yr)\b/i.test(
      message,
    ) ||
    /\bcosts?\s+(?:about\s+)?\d/i.test(message)
  );
}

export function shouldStopForReply(input: {
  replyHandling: CampaignReplyHandling | undefined;
  intent: ReplyIntent | undefined;
  confidence: number | undefined;
}) {
  if (input.replyHandling === "handoff") return true;
  if (isTerminalReplyIntent(input.intent) || isMeetingBooked(input.intent, input.confidence)) return true;
  return input.replyHandling !== "ai_until_booked" && isHotReply(input.intent, input.confidence);
}

export function shouldShareBookingLink(input: {
  replyHandling: CampaignReplyHandling | undefined;
  intent: ReplyIntent | undefined;
  confidence: number | undefined;
  bookingLink: string | undefined;
  bookingLinkAlreadyShared: boolean;
  pricingDiscussionNeeded?: boolean;
}) {
  return (
    input.replyHandling === "ai_until_booked" &&
    Boolean(input.bookingLink) &&
    !input.bookingLinkAlreadyShared &&
    (isHotReply(input.intent, input.confidence) || Boolean(input.pricingDiscussionNeeded))
  );
}

export const USER_STOPPED_OUTREACH_ERROR =
  "Outreach stopped by the user from the Actions page.";

const PERMANENT_AI_REPLY_BLOCK = [
  /agent that sourced this lead was deleted/i,
  /leads-only agent/i,
  /anonymized LinkedIn Member/i,
  /recipient unreachable/i,
  /outreach stopped by the user/i,
];

export function enrollmentBlocksAiReply(enrollment: Pick<CampaignEnrollment, "lastError">) {
  const err = enrollment.lastError || "";
  return PERMANENT_AI_REPLY_BLOCK.some((pattern) => pattern.test(err));
}

export function canEnrollLeadForOutreach(outreachStatus: string | undefined) {
  return outreachStatus === "new";
}

export function enrollmentIsTerminalForSequence(status: string | undefined) {
  return status === "stopped" || status === "replied";
}

export type OutreachSendKind = "sequence" | "ai_reply" | "manual";

// Every LinkedIn send path (tick, Run now, AI reply) consults this before a
// provider call. The Actions-page Stop button writes status=stopped plus
// USER_STOPPED_OUTREACH_ERROR (and outreachStatus=stopped when the lead was
// still new), so a later refactor that drops one field still has to fail this.
export function shouldHaltOutreachSend(input: {
  enrollmentStatus?: string;
  lastError?: string;
  outreachStatus?: string;
  kind: OutreachSendKind;
}) {
  if (input.outreachStatus === "stopped") return true;
  if (input.kind === "ai_reply") return enrollmentBlocksAiReply({ lastError: input.lastError });
  return enrollmentIsTerminalForSequence(input.enrollmentStatus);
}

export function shouldArmAiReply(input: {
  replyHandling: CampaignReplyHandling | undefined;
  enrollmentStatus: CampaignEnrollment["status"];
  previousIntent?: ReplyIntent;
  previousIntentConfidence?: number;
  lastError?: string;
}) {
  if (enrollmentBlocksAiReply({ lastError: input.lastError })) return false;
  if (input.replyHandling === "handoff") return false;

  // connection_sent: LinkedIn often delivers the accept-and-message webhook
  // before the relation webhook, so the enrollment is still waiting on the
  // invite when the first inbound lands. error/stopped: a missed arm, a
  // sequence that finished unanswered, or a recovered provider blip must not
  // discard a real reply.
  if (
    [
      "connection_sent",
      "connected",
      "message_sent",
      "reply_received",
      "error",
      "stopped",
    ].includes(input.enrollmentStatus)
  ) {
    return true;
  }

  // After each AI response the enrollment rests in "replied". A later inbound
  // message may re-arm it only while the prior reply was non-terminal. This is
  // what lets AI own a multi-turn conversation without reviving a deal after
  // a terminal reply. Booking mode is the exception for hot interest because
  // it keeps ownership until the meeting is confirmed. Missing previousIntent
  // is not a stop: classify the new message instead of going silent.
  return (
    input.enrollmentStatus === "replied" &&
    !shouldStopForReply({
      replyHandling: input.replyHandling,
      intent: input.previousIntent,
      confidence: input.previousIntentConfidence,
    })
  );
}
