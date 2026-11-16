import { afterAll, beforeEach, expect, mock, setSystemTime, test } from "bun:test";
import * as fx from "./test-fixtures";
import type { ConversationMessage } from "../types";

mock.module("server-only", () => ({}));
let conversations: ReturnType<typeof fx.conversation>[] = [];
let histories: Record<string, ReturnType<typeof fx.message>[]> = {};
let stored: ConversationMessage[] = [];
let migrated = false;
let ignoreHistoryCursor = false;
let stops = 0;
let conversationReads = 0;
mock.module("../data", () => ({
  consumeAvatarViewBudget: async () => "ok", consumeProfileViewBudget: async () => true,
  listLinkedInAccounts: async () => [], getConversation: async () => ({ messages: stored }),
  listLeadEnrollments: async () => [], stopLeadOutreach: async () => { stops += 1; },
}));
mock.module("./session-store", () => ({
  loadOwnSession: async (accountId: string) => ({ accountId, memberId: fx.SELF, cookies: {}, userAgent: "Mozilla/5.0", proxySessionId: "p", ...(migrated ? { legacyAccountId: "legacy" } : {}) }),
  sessionHooks: () => ({}), deleteOwnSession: async () => {},
}));
mock.module("./transport", () => ({
  voyagerRequest: async (_session: unknown, request: { path: string }) => {
    const path = decodeURIComponent(request.path);
    if (path.includes("messengerConversations")) {
      conversationReads += 1;
      const offset = Number(path.match(/nextCursor:(\d+)/)?.[1]) || 0;
      return fx.graphql("messengerConversations", conversations.slice(offset, offset + 20), offset + 20 < conversations.length ? String(offset + 20) : undefined);
    }
    if (path.includes("messengerMessages")) {
      const id = path.match(/,2-([^)]+)\)/)?.[1] || "";
      const before = Number(path.match(/deliveredAt:(\d+)/)?.[1]) || Infinity;
      return fx.graphql("messengerMessages", (histories[id] || []).filter((message) => ignoreHistoryCursor || message.deliveredAt < before).slice(0, 20));
    }
    throw new Error(`Unexpected call ${path}`);
  },
  fetchLinkedInMedia: async () => new Response(""), uploadLinkedInMedia: async () => {},
  fetchLinkedInWebPage: async () => "",
  flagshipWebRequest: async () => "",
  proxyUrlForSession: () => undefined,
  proxyIdentityOf: (value: { proxySessionId: string }) => value,
  fetchOptionsForProxy: () => ({}),
  mergeSetCookies: () => null,
  serializeCookies: () => "",
  setCookieHeaders: () => [],
}));
const { findLinkedInChatWithAttendee, listRecentInboundMessages } = await import("../linkedin");
const { stopForOwnerMessage } = await import("../owner-message-guard");
let seq = 0;
let accountId = "";
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
beforeEach(() => {
  accountId = `own_${fx.SELF}regression${++seq}`;
  conversations = []; histories = {}; stored = []; migrated = false; ignoreHistoryCursor = false; stops = 0; conversationReads = 0;
});

afterAll(() => {
  mock.restore();
});

test("manual outreach in a conversation older than the newest 100 chats still blocks automation", async () => {
  conversations = Array.from({ length: 101 }, (_, index) => fx.conversation(`thread-${index}`, index === 100 ? fx.bobParticipant : fx.participant(`ACoOtherPerson${index}`, "Other", String(index)), ago((index + 1) / 60), []));
  histories["thread-100"] = [fx.message("manual", fx.selfParticipant, "Already contacted", ago(2))];
  const blocked = await stopForOwnerMessage({ workspaceId: "ws", leadId: "lead", accountId, providerProfileId: fx.BOB, linkedInUrl: "https://www.linkedin.com/in/bob", allowLegacyAutomatedMessages: false });
  expect(blocked).toBe(true);
  expect(stops).toBe(1);
});

test("incomplete conversation coverage never becomes permission to send", async () => {
  conversations = Array.from({ length: 5001 }, (_, index) => fx.conversation(`thread-${index}`, fx.aliceParticipant, ago((index + 1) / 60), []));
  await expect(stopForOwnerMessage({ workspaceId: "ws", leadId: "lead", accountId, providerProfileId: fx.BOB, linkedInUrl: "https://www.linkedin.com/in/bob", allowLegacyAutomatedMessages: false })).rejects.toMatchObject({ errorType: "errors/incomplete_history" });
});

test("more than five read threads can all contribute replies hidden by later outbound previews", async () => {
  for (let index = 0; index < 6; index += 1) {
    const reply = fx.message(`reply-${index}`, fx.aliceParticipant, `Interested ${index}`, ago(2));
    const answer = fx.message(`answer-${index}`, fx.selfParticipant, "Thanks", ago(1));
    conversations.push(fx.conversation(`thread-${index}`, fx.aliceParticipant, ago((index + 1) / 60), [answer]));
    histories[`thread-${index}`] = [answer, reply];
  }
  const messages = await listRecentInboundMessages({ accountId, sinceMs: Date.now() - 5 * 60_000 });
  // Six inbound replies plus the six outbound "Thanks" previews that hide them.
  expect(messages?.filter((message) => !message.isSender)).toHaveLength(6);
  expect(messages?.filter((message) => message.isSender)).toHaveLength(6);
});

test("reply sync pages beyond a thread's first twenty messages", async () => {
  histories.busy = Array.from({ length: 25 }, (_, index) => fx.message(`reply-${index}`, fx.aliceParticipant, `Reply ${index}`, ago(index + 1)));
  conversations = [fx.conversation("busy", fx.aliceParticipant, ago(1), [histories.busy[0]])];
  const messages = await listRecentInboundMessages({ accountId, sinceMs: Date.now() - 30 * 60_000 });
  expect(messages?.filter((message) => !message.isSender)).toHaveLength(25);
});

test("after replacing an old Unipile account, recorded automated messages are still recognised by text and send time", async () => {
  migrated = true;
  const sentAt = ago(2);
  const sent = fx.message("automated-no-alias", fx.selfParticipant, "Quick question about Acme", sentAt);
  conversations = [fx.conversation("existing", fx.bobParticipant, sentAt, [sent])];
  histories.existing = [sent];
  stored = [{ id: "unipile-msg-id", body: "Quick question about Acme", direction: "outbound", outboundSource: "automation", createdAt: sentAt, senderName: "You" }];
  expect(await stopForOwnerMessage({ workspaceId: "ws", leadId: "lead", accountId, providerProfileId: fx.BOB, linkedInUrl: "https://www.linkedin.com/in/bob", allowLegacyAutomatedMessages: true })).toBe(false);
});

test("a provider ignoring the message cursor cannot silently clear an outreach history check", async () => {
  ignoreHistoryCursor = true;
  histories.busy = Array.from({ length: 25 }, (_, index) => fx.message(`reply-${index}`, fx.bobParticipant, `Reply ${index}`, ago(index + 1)));
  conversations = [fx.conversation("busy", fx.bobParticipant, ago(1), [histories.busy[0]])];
  await expect(stopForOwnerMessage({ workspaceId: "ws", leadId: "lead", accountId, providerProfileId: fx.BOB, linkedInUrl: "https://www.linkedin.com/in/bob", allowLegacyAutomatedMessages: false })).rejects.toMatchObject({ errorType: "errors/incomplete_history" });
});

// Before the chat index, every first message to a lead with no chat paged
// through the whole inbox: here 50 reads per send, and an inbox past 5,000
// conversations never finished. The index is built over a few bounded calls,
// then a lookup only reads the newest page.
test("a large inbox is indexed across a few bounded lookups, then each lookup reads only the newest page", async () => {
  conversations = Array.from({ length: 1000 }, (_, index) => fx.conversation(`thread-${index}`, fx.participant(`ACoOtherPerson${index}`, "Other", String(index)), ago((index + 1) / 60), []));
  await expect(findLinkedInChatWithAttendee({ accountId, providerProfileId: fx.BOB })).rejects.toMatchObject({ errorType: "errors/incomplete_history" });
  expect(conversationReads).toBe(40);
  expect(await findLinkedInChatWithAttendee({ accountId, providerProfileId: fx.BOB })).toBeNull();
  conversationReads = 0;
  expect(await findLinkedInChatWithAttendee({ accountId, providerProfileId: fx.BOB })).toBeNull();
  expect(conversationReads).toBeLessThanOrEqual(1);
  expect(await findLinkedInChatWithAttendee({ accountId, providerProfileId: "ACoOtherPerson900" })).toBeTruthy();
});

test("a chat that starts after the index was built is found from the top of the inbox", async () => {
  conversations = Array.from({ length: 30 }, (_, index) => fx.conversation(`thread-${index}`, fx.participant(`ACoOtherPerson${index}`, "Other", String(index)), ago(index + 5), []));
  expect(await findLinkedInChatWithAttendee({ accountId, providerProfileId: fx.BOB })).toBeNull();
  conversations = [fx.conversation("new-with-bob", fx.bobParticipant, ago(1), []), ...conversations];
  setSystemTime(new Date(Date.now() + 61_000));
  try {
    expect(await findLinkedInChatWithAttendee({ accountId, providerProfileId: fx.BOB })).toBeTruthy();
  } finally {
    setSystemTime();
  }
});
