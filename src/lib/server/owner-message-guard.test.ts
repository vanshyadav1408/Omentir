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
mock.module("./unipile", () => ({
  findLinkedInChatWithAttendee: async () => "chat",
  isUnipileConfigured: () => true,
  listLinkedInChatMessagesPage: read,
  retrieveLinkedInProfile: async () => ({ providerProfileId: "provider" }),
}));
const { stopForOwnerMessage, stopForOwnerMessageWebhook } = await import("./owner-message-guard");
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

test("an owner-written LinkedIn webhook triggers the existing stop feature immediately", async () => {
  expect(await stopForOwnerMessageWebhook({ ...input, providerMessageId: "external-manual" })).toBe(true);
  expect(stop).toHaveBeenCalledWith(input.workspaceId, input.leadId, OWNER_MESSAGED_OUTREACH_ERROR);
  expect(read).not.toHaveBeenCalled();
});

test("a recorded automation echo does not stop its own campaign", async () => {
  stored = [{ ...message("automated"), outboundSource: "automation" }];
  expect(await stopForOwnerMessageWebhook({ ...input, providerMessageId: "automated" })).toBe(false);
  expect(stop).not.toHaveBeenCalled();
});

test("a webhook arriving before the automation send result is saved does not cancel that active send", async () => {
  enrollments = [{ pendingAction: { kind: "message", stepIndex: 1, startedAt: "2026-10-04T00:00:00Z" } }];
  expect(await stopForOwnerMessageWebhook({ ...input, providerMessageId: "not-yet-saved" })).toBe(false);
  expect(stop).not.toHaveBeenCalled();
});

test("a retry of a recorded manual reply still triggers stop even if an automated action is pending", async () => {
  stored = [{ ...message("manual"), outboundSource: "manual" }];
  enrollments = [{ pendingAction: { kind: "reply", stepIndex: 1, startedAt: "2026-10-04T00:00:00Z" } }];
  expect(await stopForOwnerMessageWebhook({ ...input, providerMessageId: "manual" })).toBe(true);
  expect(stop).toHaveBeenCalledTimes(1);
});
