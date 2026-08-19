import type { ReplyIntent } from "@/lib/server/types";
import { MEETING_BOOKED_CONFIDENCE } from "@/lib/server/reply-automation-policy";

export type ConversationCategory = "successful" | "interested" | "follow" | "denied";

export function conversationHasMeetingBooked(conversation?: {
  replyIntent?: string;
  replyIntentConfidence?: number;
  replyIntentAt?: string;
  meetingBookedAt?: string;
}) {
  return Boolean(
    conversation?.meetingBookedAt ||
      (conversation?.replyIntent === "meeting_booked" &&
        (conversation.replyIntentConfidence ?? 1) >= MEETING_BOOKED_CONFIDENCE &&
        conversation.replyIntentAt),
  );
}

export function conversationCategory(conversation?: {
  replyIntent?: ReplyIntent;
  replyIntentConfidence?: number;
  replyIntentAt?: string;
  meetingBookedAt?: string;
  manualFollowUpCompletedAt?: string;
}): ConversationCategory | null {
  if (!conversation) return null;

  if (conversationHasMeetingBooked(conversation) || conversation.replyIntent === "hot") {
    return "successful";
  }
  if (!conversation.replyIntent) return null;
  if (conversation.replyIntent === "warm" || conversation.replyIntent === "question") {
    return "interested";
  }
  if (conversation.replyIntent === "negative") return "denied";

  const completedAt = Date.parse(conversation.manualFollowUpCompletedAt || "");
  const replyAt = Date.parse(conversation.replyIntentAt || "");
  const followUpIsComplete = Number.isFinite(completedAt) &&
    (!Number.isFinite(replyAt) || completedAt >= replyAt);
  return followUpIsComplete ? null : "follow";
}
