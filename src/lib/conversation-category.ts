import type { ReplyIntent } from "@/lib/server/types";
import { MEETING_BOOKED_CONFIDENCE } from "@/lib/server/reply-automation-policy";

export type ConversationCategory = "successful" | "interested" | "follow" | "denied";

type MeetingEvidenceMessage = {
  direction?: string;
  body?: string;
  createdAt?: string;
};

type MeetingEvidenceConversation = {
  messages?: MeetingEvidenceMessage[];
};

const CALENDAR_EVENT_LINK_RE =
  /\bhttps?:\/\/(?:calendar\.app\.google|calendar\.google\.com|meet\.google\.com)\/\S+/i;
const BOOKING_LANGUAGE_RE =
  /\b(?:book(?:ed|ing)?|schedule(?:d|ing)?|arrange(?:d)?|reserve(?:d)?|confirm(?:ed)?)\b[\s\S]{0,80}\b(?:meeting|demo|call|calendar|calander|time)\b|\b(?:meeting|demo|call)\b[\s\S]{0,80}\b(?:book(?:ed|ing)?|schedule(?:d|ing)?|calendar|calander|time)\b/i;

function calendarBookingMessage(conversation?: MeetingEvidenceConversation) {
  let bookingContext = false;
  for (const message of conversation?.messages || []) {
    if (message.direction !== "inbound") continue;
    const body = message.body || "";
    const hasBookingLanguage = BOOKING_LANGUAGE_RE.test(body);
    if (
      CALENDAR_EVENT_LINK_RE.test(body) &&
      (bookingContext || hasBookingLanguage)
    ) {
      return message;
    }
    if (hasBookingLanguage) bookingContext = true;
  }
  return undefined;
}

/**
 * A prospect's calendar event link is a useful fallback when the calendar
 * provider does not send Omentir a webhook. Require booking language in the
 * inbound thread so a generic profile or availability link is not counted.
 */
export function inferredMeetingBookedAt(conversation?: MeetingEvidenceConversation) {
  return calendarBookingMessage(conversation)?.createdAt;
}

export function hasCalendarBookingEvidence(conversation?: MeetingEvidenceConversation) {
  return Boolean(calendarBookingMessage(conversation));
}

export function conversationHasMeetingBooked(conversation?: {
  replyIntent?: string;
  replyIntentConfidence?: number;
  replyIntentAt?: string;
  meetingBookedAt?: string;
  messages?: MeetingEvidenceMessage[];
}) {
  const calendarEvidence = calendarBookingMessage(conversation);
  return Boolean(
    conversation?.meetingBookedAt ||
      (conversation?.replyIntent === "meeting_booked" &&
        (conversation.replyIntentConfidence ?? 1) >= MEETING_BOOKED_CONFIDENCE &&
        conversation.replyIntentAt) ||
      calendarEvidence,
  );
}

export function conversationCategory(conversation?: {
  replyIntent?: ReplyIntent;
  replyIntentConfidence?: number;
  replyIntentAt?: string;
  meetingBookedAt?: string;
  manualFollowUpCompletedAt?: string;
  messages?: MeetingEvidenceMessage[];
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
