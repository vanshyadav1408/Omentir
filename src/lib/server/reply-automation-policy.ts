import type { CampaignEnrollment, ReplyIntent } from "./types";

export const HOT_INTEREST_CONFIDENCE = 0.7;

export function isTerminalReplyIntent(intent: ReplyIntent | undefined) {
  return intent === "negative" || intent === "not_now" || intent === "ooo";
}

export function isHotReply(intent: ReplyIntent | undefined, confidence: number | undefined) {
  return intent === "hot" && (confidence || 0) >= HOT_INTEREST_CONFIDENCE;
}

export function shouldArmAiReply(input: {
  replyHandling: "ai" | "handoff" | undefined;
  enrollmentStatus: CampaignEnrollment["status"];
  previousIntent?: ReplyIntent;
  previousIntentConfidence?: number;
}) {
  if (input.replyHandling === "handoff") return false;

  if (["connected", "message_sent", "reply_received"].includes(input.enrollmentStatus)) {
    return true;
  }

  // After each AI response the enrollment rests in "replied". A later inbound
  // message may re-arm it only while the prior reply was non-terminal. This is
  // what lets AI own a multi-turn conversation without reviving a deal after
  // hot interest, a rejection, a deferral, or an out-of-office response.
  return (
    input.enrollmentStatus === "replied" &&
    Boolean(input.previousIntent) &&
    !isTerminalReplyIntent(input.previousIntent) &&
    !isHotReply(input.previousIntent, input.previousIntentConfidence)
  );
}
