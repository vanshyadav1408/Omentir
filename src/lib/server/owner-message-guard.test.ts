import { beforeEach, expect, mock, test } from "bun:test";
import type { CampaignEnrollment, ConversationMessage, LinkedInInboxMessage } from "./types";
import { enrollmentBlocksAiReply, OWNER_MESSAGED_OUTREACH_ERROR, shouldArmAiReply } from "./reply-automation-policy";

mock.module("server-only", () => ({}));
let stored: ConversationMessage[] = [];
let enrollments: Partial<CampaignEnrollment>[] = [];
let pages: Array<{ messages: LinkedInInboxMessage[]; cursor?: string }> = [];
const stop = mock(async () => undefined);
const read = mock(async () => {
  const page = pages.shift();
  if (!page) throw new Error("History unavailable");
  return page;
});
mock.module("./data", () => ({
  getConversation: async () => ({ messages: stored }),
  listLeadEnrollments: async () => enrollments,
  stopLeadOutreach: stop,
}));
mock.module("./linkedin", () => ({
  findLinkedInChatWithAttendee: async () => "chat",
  isLinkedInConfiguredFor: () => true,
  listLinkedInChatMessagesPage: read,
  retrieveLinkedInProfile: async () => ({ providerProfileId: "provider" }),
}));
const { LeadReplyNotSyncedError, stopForOwnerMessage, stopForOwnerMessageWebhook } = await import("./owner-message-guard");
const input = {
  workspaceId: "workspace", leadId: "lead", accountId: "account",
  providerProfileId: "provider", linkedInUrl: "https://linkedin.com/in/lead",
  allowLegacyAutomatedMessages: false,
};
const message = (id: string, direction: "inbound" | "outbound" = "outbound"): LinkedInInboxMessage => ({
  id, direction, chatId: "chat", senderName: "You", body: "Hello", createdAt: "2026-10-04T01:00:00Z",
});
beforeEach(() => {
  stored = [];
  enrollments = [];
  pages = [{ messages: [] }];
  stop.mockClear();
  read.mockClear();
});

test("a LinkedIn owner message before the first scheduled send stops all outreach", async () => {
  pages = [{ messages: [message("owner-message")] }];
  expect(await stopForOwnerMessage(input)).toBe(true);
  expect(stop).toHaveBeenCalledWith("workspace", "lead", OWNER_MESSAGED_OUTREACH_ERROR);
});

test("reply sync stops outreach for an owner LinkedIn-app message the way the old Unipile webhook did", async () => {
  expect(await stopForOwnerMessageWebhook({ workspaceId: "workspace", leadId: "lead", providerMessageId: "owner-app-msg" })).toBe(true);
  expect(stop).toHaveBeenCalledWith("workspace", "lead", OWNER_MESSAGED_OUTREACH_ERROR);
});

test("an automation echo of our own send does not stop outreach during reply sync", async () => {
  stored = [{ ...message("auto-echo"), outboundSource: "automation" }];
  expect(await stopForOwnerMessageWebhook({ workspaceId: "workspace", leadId: "lead", providerMessageId: "auto-echo" })).toBe(false);
  expect(stop).not.toHaveBeenCalled();
});

test("a provider echo that arrives while a send is still pending waits for the pre-send history guard", async () => {
  enrollments = [{ pendingAction: { kind: "message", stepIndex: 0, startedAt: "2026-10-04T01:00:00Z" } }];
  expect(await stopForOwnerMessageWebhook({ workspaceId: "workspace", leadId: "lead", providerMessageId: "not-saved-yet" })).toBe(false);
  expect(stop).not.toHaveBeenCalled();
});

// After an old Unipile account is replaced, LinkedIn returns its earlier
// automated messages under new own-client ids. Matching them by text and send
// time keeps every in-flight sequence from being stopped as an owner takeover.
test("automated messages sent before a Unipile replacement do not falsely trigger an owner takeover", async () => {
  stored = [{ ...message("old-provider-id"), outboundSource: "automation" }];
  pages = [{ messages: [message("own_member~m~new-id")] }];
  expect(await stopForOwnerMessage({ ...input, accountId: "own_member" })).toBe(false);
  expect(stop).not.toHaveBeenCalled();
});

// The first reply sync after the switch reads the last day again under new
// ids. Without this, every lead messaged that day was stopped as if the owner
// had typed to them.
test("reply sync does not treat an automated message stored under its old Unipile id as an owner takeover", async () => {
  stored = [{ ...message("old-provider-id"), outboundSource: "automation" }];
  expect(await stopForOwnerMessageWebhook({
    workspaceId: "workspace", leadId: "lead", providerMessageId: "own_member~m~bmV3",
    body: "Hello", createdAt: "2026-10-04T01:00:40Z",
  })).toBe(false);
  expect(stop).not.toHaveBeenCalled();
});

test("reply sync still stops outreach when the owner sends the same words by hand later", async () => {
  stored = [{ ...message("old-provider-id"), outboundSource: "automation" }];
  expect(await stopForOwnerMessageWebhook({
    workspaceId: "workspace", leadId: "lead", providerMessageId: "own_member~m~bmV3",
    body: "Hello", createdAt: "2026-10-06T09:00:00Z",
  })).toBe(true);
  expect(stop).toHaveBeenCalledTimes(1);
});

test("a manual Omentir message stops outreach even when it is already stored locally", async () => {
  stored = [{ ...message("manual"), outboundSource: "manual" }];
  expect(await stopForOwnerMessage({ ...input, allowLegacyAutomatedMessages: true })).toBe(true);
  expect(stop).toHaveBeenCalledTimes(1);
});

test("the next follow-up checks fresh history again and stops when the owner takes over", async () => {
  stored = [{ ...message("auto"), outboundSource: "automation" }];
  pages = [{ messages: [message("auto")] }, { messages: [message("new-owner-message")] }];
  expect(await stopForOwnerMessage(input)).toBe(false);
  expect(await stopForOwnerMessage(input)).toBe(true);
  expect(read).toHaveBeenCalledTimes(2);
});

test("inbound messages and recorded automated sends do not count as owner takeover", async () => {
  stored = [{ ...message("auto"), outboundSource: "automation" }];
  pages = [{ messages: [message("auto"), message("reply", "inbound")] }];
  expect(await stopForOwnerMessage(input)).toBe(false);
  expect(stop).not.toHaveBeenCalled();
});

test("invitation notes and LinkedIn system events do not stop the scheduled first message", async () => {
  pages = [{ messages: [
    { ...message("invite"), messageType: "INVITATION" },
    { ...message("accepted"), event: true },
  ] }];
  expect(await stopForOwnerMessage(input)).toBe(false);
  expect(stop).not.toHaveBeenCalled();
});

// The own client gets no INVITATION tag from LinkedIn. Without recognising
// the note by its text, every lead who accepted an invite that carried a note
// had their sequence stopped as if the owner had written to them by hand.
test("an untagged invite note in the thread does not stop the first message, but other owner text still does", async () => {
  const note = "Hi Ana, saw your post on hiring.";
  pages = [{ messages: [{ ...message("note"), body: "Hi Ana,  saw your post\non hiring. " }] }];
  expect(await stopForOwnerMessage({ ...input, inviteNotes: [note] })).toBe(false);
  expect(stop).not.toHaveBeenCalled();

  pages = [{ messages: [{ ...message("typed"), body: "Hi Ana, are you free on Friday?" }] }];
  expect(await stopForOwnerMessage({ ...input, inviteNotes: [note] })).toBe(true);
});

test("reply sync does not stop outreach when the owner message it sees is the invite note", async () => {
  const note = "Hi Ana, saw your post on hiring.";
  expect(await stopForOwnerMessageWebhook({
    workspaceId: "workspace", leadId: "lead", providerMessageId: "note-msg", body: note, inviteNotes: [note],
  })).toBe(false);
  expect(stop).not.toHaveBeenCalled();
});

test("repeated pagination fails safely instead of hanging the send or accepting incomplete history", async () => {
  pages = [{ messages: [], cursor: "same" }, { messages: [], cursor: "same" }];
  await expect(stopForOwnerMessage(input)).rejects.toThrow("pagination repeated");
});

test("older pages and attachment-only owner messages still stop outreach", async () => {
  pages = [{ messages: [message("reply", "inbound")], cursor: "older" }, {
    messages: [{ ...message("photo"), body: "", attachments: [{ id: "photo", type: "image" }] }],
  }];
  expect(await stopForOwnerMessage(input)).toBe(true);
  expect(read).toHaveBeenLastCalledWith({ chatId: "chat", limit: 100, cursor: "older" });
});

test("a failed history lookup cannot be treated as permission to send", async () => {
  pages = [];
  await expect(stopForOwnerMessage(input)).rejects.toThrow("History unavailable");
  expect(stop).not.toHaveBeenCalled();
});

test("legacy stored outbound messages block the first send but known legacy campaign sends allow follow-ups", async () => {
  stored = [message("legacy")];
  expect(await stopForOwnerMessage(input)).toBe(true);
  stop.mockClear();
  pages = [{ messages: [message("legacy")] }];
  expect(await stopForOwnerMessage({ ...input, allowLegacyAutomatedMessages: true })).toBe(false);
  expect(stop).not.toHaveBeenCalled();
});

test("a later inbound reply cannot restart automation after the owner took over", () => {
  expect(enrollmentBlocksAiReply({ lastError: OWNER_MESSAGED_OUTREACH_ERROR })).toBe(true);
  expect(shouldArmAiReply({
    replyHandling: "ai_until_booked", enrollmentStatus: "stopped",
    lastError: OWNER_MESSAGED_OUTREACH_ERROR,
  })).toBe(false);
});

// Replies are found by polling every few minutes. The send check reads the
// live thread anyway; a follow-up must not go out on top of a reply LinkedIn
// already shows just because sync has not stored it yet.
test("a follow-up waits while the live thread shows a reply that sync has not stored", async () => {
  const justNow = new Date(Date.now() - 60_000).toISOString();
  pages = [{ messages: [{ ...message("reply-new", "inbound"), body: "Yes, send details", createdAt: justNow }] }];
  await expect(stopForOwnerMessage(input)).rejects.toBeInstanceOf(LeadReplyNotSyncedError);
  expect(stop).not.toHaveBeenCalled();
});

test("a reply sync already stored does not hold the send", async () => {
  const justNow = new Date(Date.now() - 60_000).toISOString();
  stored = [{ ...message("reply-new", "inbound"), createdAt: justNow }];
  pages = [{ messages: [{ ...message("reply-new", "inbound"), createdAt: justNow }] }];
  expect(await stopForOwnerMessage(input)).toBe(false);
});

test("an old reply sync never stored does not hold sends forever", async () => {
  const hoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
  pages = [{ messages: [{ ...message("old-reply", "inbound"), createdAt: hoursAgo }] }];
  expect(await stopForOwnerMessage(input)).toBe(false);
});
