import { afterAll, beforeEach, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
mock.module("./data", () => ({
  consumeAvatarViewBudget: async () => "exhausted",
  consumeProfileViewBudget: async () => true,
  listLinkedInAccounts: async () => [],
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
  throw new Error(`Unexpected request: ${path}`);
}) as typeof fetch;
const { sendLinkedInMessage, LinkedInMessageSendBlocked } = await import("./unipile");
const input = {
  accountId: "account", providerProfileId: "ACo-old-provider",
  linkedInUrl: "https://linkedin.com/in/person", body: "Scheduled message",
};
beforeEach(() => {
  posts.length = 0;
  rejectFirst = false;
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
