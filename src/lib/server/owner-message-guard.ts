import "server-only";

import { getConversation, listLeadEnrollments, stopLeadOutreach } from "./data";
import { OWNER_MESSAGED_OUTREACH_ERROR } from "./reply-automation-policy";
import {
  findLinkedInChatWithAttendee,
  isUnipileConfigured,
  listLinkedInChatMessagesPage,
  retrieveLinkedInProfile,
} from "./unipile";

export async function stopForOwnerMessageWebhook(input: {
  workspaceId: string;
  leadId: string;
  providerMessageId?: string;
}) {
  const conversation = await getConversation(input.workspaceId, input.leadId);
  const recorded = conversation?.messages.find((message) => message.id === input.providerMessageId);
  if (recorded && recorded.outboundSource !== "manual") return false;

  // A provider echo can arrive before the send result is saved. Let the
  // pre-send history guard catch manual messages that overlap an active send.
  if (!recorded) {
    const enrollments = await listLeadEnrollments(input.workspaceId, input.leadId);
    if (enrollments.some((enrollment) => enrollment.pendingAction?.kind === "message" ||
        enrollment.pendingAction?.kind === "reply")) return false;
  }
  await stopLeadOutreach(input.workspaceId, input.leadId, OWNER_MESSAGED_OUTREACH_ERROR);
  return true;
}

// Read live history for every send. Stored automation IDs identify our own
// messages; any other owner-sent message hands the conversation to the owner.
export async function stopForOwnerMessage(input: {
  workspaceId: string;
  leadId: string;
  accountId: string;
  providerProfileId?: string;
  linkedInUrl: string;
  allowLegacyAutomatedMessages: boolean;
}) {
  const conversation = await getConversation(input.workspaceId, input.leadId);
  const outbound = (conversation?.messages || []).filter((message) => message.direction === "outbound");
  const stop = async () => {
    await stopLeadOutreach(input.workspaceId, input.leadId, OWNER_MESSAGED_OUTREACH_ERROR);
    return true;
  };
  if (outbound.some((message) => message.outboundSource === "manual" ||
      (!message.outboundSource && !input.allowLegacyAutomatedMessages))) return stop();
  const automationIds = new Set(outbound.map((message) => message.id));
  if (!isUnipileConfigured()) throw new Error("Unipile is not configured.");
  const providerProfileId = input.providerProfileId || (await retrieveLinkedInProfile({
    accountId: input.accountId,
    identifier: input.linkedInUrl,
  }))?.providerProfileId;
  if (!providerProfileId) throw new Error("Could not resolve the lead's LinkedIn message history.");
  const chatId = await findLinkedInChatWithAttendee({ accountId: input.accountId, providerProfileId });
  if (!chatId) return false;

  let cursor: string | undefined;
  const cursors = new Set<string>();
  do {
    const page = await listLinkedInChatMessagesPage({ chatId, limit: 100, cursor });
    if (page.messages.some((message) => message.direction === "outbound" &&
        !message.event && message.messageType !== "INVITATION" &&
        !automationIds.has(message.id))) return stop();
    cursor = page.cursor;
    if (cursor && cursors.has(cursor)) throw new Error("LinkedIn message history pagination repeated.");
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return false;
}
