import type { ReplyIntent } from "@/lib/server/types";

export type ConversationCategory = "successful" | "interested" | "follow" | "denied";

export function conversationHasMeetingBooked(conversation?: {
  replyIntent?: ReplyIntent;
  replyIntentAt?: string;
  meetingBookedAt?: string;
}) {
  return Boolean(
    conversation?.meetingBookedAt ||
      (conversation?.replyIntent === "meeting_booked" && conversation.replyIntentAt),
  );
}

export function conversationCategory(conversation?: {
  replyIntent?: ReplyIntent;
  replyIntentAt?: string;
  manualFollowUpCompletedAt?: string;
}): ConversationCategory | null {
  if (!conversation?.replyIntent) return null;

  if (conversation.replyIntent === "hot" || conversation.replyIntent === "meeting_booked") {
    return "successful";
  }
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
