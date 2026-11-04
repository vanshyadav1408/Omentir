import { afterAll, beforeEach, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
let profileViewsLeft = true;
mock.module("./data", () => ({
  consumeAvatarViewBudget: async () => "exhausted",
  consumeProfileViewBudget: async () => profileViewsLeft,
  listLinkedInAccounts: async () => [],
  getConversation: async () => ({ messages: [] }),
  listLeadEnrollments: async () => [],
  stopLeadOutreach: async () => undefined,
}));
const originalFetch = globalThis.fetch;
const originalEnv = { key: process.env.UNIPILE_API_KEY, dsn: process.env.UNIPILE_DSN };
process.env.UNIPILE_API_KEY = "test-key";
process.env.UNIPILE_DSN = "unipile.test";
const posts: RequestInit[] = [];
let rejectFirst = false;
globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
  const path = new URL(String(url)).pathname;
  if (path === "/api/v1/chats" && init?.method === "POST") {
    posts.push(init);
    if (rejectFirst && posts.length === 1) {
      return Response.json({ type: "errors/invalid_recipient" }, { status: 400 });
    }
    return Response.json({ message_id: "sent-message", chat_id: "chat" });
  }
  if (path === "/api/v1/users/person") return Response.json({ provider_id: "ACo-new-provider" });
  if (path === "/api/v1/users/nobody") return Response.json({ public_identifier: "nobody" });
  if (path === "/api/v1/chat_attendees/ACo-old-provider/chats") return Response.json({
    type: "errors/resource_not_found",
    detail: "The requested resource were not found.\nAttendee not found",
  }, { status: 404 });
  throw new Error(`Unexpected request: ${path}`);
}) as typeof fetch;
const {
  sendConnectionRequest, sendLinkedInMessage, LinkedInMessageSendBlocked, LinkedInRecipientUnresolved,
} = await import("./unipile");
const { stopForOwnerMessage } = await import("./owner-message-guard");
const input = {
  accountId: "account", providerProfileId: "ACo-old-provider",
  linkedInUrl: "https://linkedin.com/in/person", body: "Scheduled message",
};
beforeEach(() => {
  posts.length = 0;
  rejectFirst = false;
  profileViewsLeft = true;
});
afterAll(() => {
  globalThis.fetch = originalFetch;
  process.env.UNIPILE_API_KEY = originalEnv.key;
  process.env.UNIPILE_DSN = originalEnv.dsn;
});

test("owner takeover cancels before any message POST reaches Unipile", async () => {
  await expect(sendLinkedInMessage({
    ...input, beforeSend: async () => { throw new LinkedInMessageSendBlocked(); },
  })).rejects.toBeInstanceOf(LinkedInMessageSendBlocked);
  expect(posts).toHaveLength(0);
});

test("a failed history check also cannot send the message", async () => {
  await expect(sendLinkedInMessage({
    ...input, beforeSend: async () => { throw new Error("History unavailable"); },
  })).rejects.toThrow("History unavailable");
  expect(posts).toHaveLength(0);
});

test("the real owner-message check permits a first send when Unipile has no attendee yet", async () => {
  expect(await sendLinkedInMessage({
    ...input,
    beforeSend: async (providerProfileId) => {
      const blocked = await stopForOwnerMessage({
        workspaceId: "workspace", leadId: "lead", accountId: input.accountId,
        providerProfileId, linkedInUrl: input.linkedInUrl,
        allowLegacyAutomatedMessages: false,
      }).catch(() => true);
      if (blocked) throw new LinkedInMessageSendBlocked();
    },
  })).toEqual({ id: "sent-message", chatId: "chat" });
  expect(posts).toHaveLength(1);
});

test("a verified history check runs before the POST, and the provider request bypasses Next's cache", async () => {
  const beforeSend = mock(async (providerId: string) => {
    expect(providerId).toBe(input.providerProfileId);
    expect(posts).toHaveLength(0);
  });
  expect(await sendLinkedInMessage({ ...input, beforeSend })).toEqual({ id: "sent-message", chatId: "chat" });
  expect(beforeSend).toHaveBeenCalledTimes(1);
  expect(posts[0].cache).toBe("no-store");
});

test("recipient resolution retries check the new recipient's history before a second send attempt", async () => {
  rejectFirst = true;
  const checked: string[] = [];
  await expect(sendLinkedInMessage({
    ...input,
    beforeSend: async (providerId) => {
      checked.push(providerId);
      if (providerId === "ACo-new-provider") throw new LinkedInMessageSendBlocked();
    },
  })).rejects.toBeInstanceOf(LinkedInMessageSendBlocked);
  expect(checked).toEqual(["ACo-old-provider", "ACo-new-provider"]);
  expect(posts).toHaveLength(1);
});

// A lead with no stored member id needs a profile view to resolve one. Agent
// discovery spends the shared 75/day budget early, and every invite to such a
// lead then failed all day (99 enrollments across 4 workspaces on 2026-11-04).
test("send-time recipient lookup still resolves after discovery spent the daily view budget", async () => {
  profileViewsLeft = false;
  expect(await sendLinkedInMessage({ ...input, providerProfileId: undefined }))
    .toEqual({ id: "sent-message", chatId: "chat" });
  expect(posts).toHaveLength(1);
});

// When the profile truly yields no member id, nothing is sent, and the
// automation must know that for certain: a generic error was parked as an
// "unconfirmed send" needing manual review, and connect-step leads stayed
// parked forever.
test("an unresolvable recipient fails with a typed error before any request is sent", async () => {
  const noId = { ...input, providerProfileId: undefined, linkedInUrl: "https://linkedin.com/in/nobody" };
  await expect(sendLinkedInMessage(noId)).rejects.toBeInstanceOf(LinkedInRecipientUnresolved);
  await expect(sendConnectionRequest(noId)).rejects.toBeInstanceOf(LinkedInRecipientUnresolved);
  expect(posts).toHaveLength(0);
});
