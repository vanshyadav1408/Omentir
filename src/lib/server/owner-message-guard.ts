import "server-only";

import { getConversation, listLeadEnrollments, stopLeadOutreach } from "./data";
import { OWNER_MESSAGED_OUTREACH_ERROR } from "./reply-automation-policy";
import { findMigratedMessage, MIGRATED_REPLY_WINDOW, MIGRATED_SEND_WINDOW } from "./migrated-message-match";
import type { LinkedInInboxMessage } from "./types";
import {
  findLinkedInChatWithAttendee,
  isLinkedInConfiguredFor,
  listLinkedInChatMessagesPage,
  retrieveLinkedInProfile,
} from "./linkedin";

// LinkedIn files the note of an accepted invite into the thread as a message
// from the owner. The old Unipile integration tagged it INVITATION and both
// checks below skipped it. The own client has no such tag, so the note is
// recognised by its text; otherwise every accepted invite that carried a note
// stopped its sequence.
function isInviteNote(body: string, inviteNotes: string[] | undefined) {
  const text = body.replace(/\s+/g, " ").trim();
  return Boolean(text) && Boolean(inviteNotes?.some((note) => note.replace(/\s+/g, " ").trim() === text));
}

// How long a send waits for reply sync to store a reply LinkedIn already
// shows. A reply sync never stores (one it matched to another lead) holds the
// send no longer than this.
const UNSYNCED_REPLY_WINDOW_MS = 2 * 60 * 60_000;

// The lead replied and reply sync has not stored it yet. Nothing was sent;
// the send waits for sync to hand the conversation to the reply flow.
export class LeadReplyNotSyncedError extends Error {
  constructor() {
    super("The lead just replied on LinkedIn. Waiting for the reply to sync before sending.");
    this.name = "LeadReplyNotSyncedError";
  }
}

// Used by reply sync when the owner typed in the LinkedIn app. Provider echoes
// of our own automated sends must not stop the campaign; a real manual message
// must. The old Unipile webhook called this; polling calls it the same way.
export async function stopForOwnerMessageWebhook(input: {
  workspaceId: string;
  leadId: string;
  providerMessageId?: string;
  body?: string;
  // LinkedIn's send time, for recognising messages stored before a switch.
  createdAt?: string;
  inviteNotes?: string[];
}) {
  if (isInviteNote(input.body || "", input.inviteNotes)) return false;
  const conversation = await getConversation(input.workspaceId, input.leadId);
  const stored = conversation?.messages || [];
  const recorded =
    stored.find((message) => message.id === input.providerMessageId) ||
    findMigratedMessage(
      stored,
      { id: input.providerMessageId, direction: "outbound", body: input.body || "", createdAt: input.createdAt },
      MIGRATED_SEND_WINDOW,
    );
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
  inviteNotes?: string[];
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
  const matchesMigratedAutomationMessage = (id: string, body: string, createdAt: string) =>
    Boolean(findMigratedMessage(outbound, { id, direction: "outbound", body, createdAt }, MIGRATED_SEND_WINDOW));
  if (!isLinkedInConfiguredFor(input.accountId)) throw new Error("This LinkedIn account needs to be reconnected.");
  const providerProfileId = input.providerProfileId || (await retrieveLinkedInProfile({
    accountId: input.accountId,
    identifier: input.linkedInUrl,
  }))?.providerProfileId;
  if (!providerProfileId) throw new Error("Could not resolve the lead's LinkedIn message history.");
  const chatId = await findLinkedInChatWithAttendee({ accountId: input.accountId, providerProfileId });
  if (!chatId) return false;

  const stored = conversation?.messages || [];
  const storedIds = new Set(stored.map((message) => message.id));
  const unsyncedSince = Date.now() - UNSYNCED_REPLY_WINDOW_MS;
  // A reply LinkedIn shows that reply sync has not stored yet. Sync runs every
  // few minutes; a follow-up sent in that gap went out on top of the reply.
  // Only messages reply sync would store count: a deleted or empty one never
  // gets stored and must not hold the send.
  const isUnsyncedReply = (message: LinkedInInboxMessage) =>
    message.direction === "inbound" && !message.event && !message.deleted &&
    message.messageType !== "INVITATION" && Boolean(message.body.trim()) &&
    Date.parse(message.createdAt) >= unsyncedSince &&
    !storedIds.has(message.id) &&
    !findMigratedMessage(stored, { id: message.id, direction: "inbound", body: message.body, createdAt: message.createdAt }, MIGRATED_REPLY_WINDOW);

  let unsyncedReply = false;
  let cursor: string | undefined;
  const cursors = new Set<string>();
  do {
    const page = await listLinkedInChatMessagesPage({ chatId, limit: 100, cursor });
    if (page.messages.some((message) => message.direction === "outbound" &&
        !message.event && message.messageType !== "INVITATION" &&
        !isInviteNote(message.body, input.inviteNotes) &&
        !automationIds.has(message.id) &&
        !matchesMigratedAutomationMessage(message.id, message.body, message.createdAt))) return stop();
    if (page.messages.some(isUnsyncedReply)) unsyncedReply = true;
    cursor = page.cursor;
    if (cursor && cursors.has(cursor)) throw new Error("LinkedIn message history pagination repeated.");
    if (cursor) cursors.add(cursor);
  } while (cursor);
  if (unsyncedReply) throw new LeadReplyNotSyncedError();
  return false;
}
