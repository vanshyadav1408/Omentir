import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
mock.module("./data", () => ({
  consumeAvatarViewBudget: async () => "exhausted",
  consumeProfileViewBudget: async () => false,
  listLinkedInAccounts: async () => [],
}));

const originalFetch = globalThis.fetch;
const originalEnv = { key: process.env.UNIPILE_API_KEY, dsn: process.env.UNIPILE_DSN };
process.env.UNIPILE_API_KEY = "test-key";
process.env.UNIPILE_DSN = "unipile.test";

type Route = (url: URL) => Response;
let routes: Record<string, Route> = {};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = new URL(String(input));
  const route = routes[url.pathname];
  if (!route) throw new Error(`Unexpected Unipile call: ${url.pathname}`);
  return route(url);
}) as typeof fetch;

const { linkedInChatBelongsToAccount, listLinkedInInbox } = await import("./unipile");

const healthy: Record<string, Route> = {
  "/api/v1/chats": () =>
    json({ items: [{ id: "chat-1", account_id: "acc-1", attendee_provider_id: "ACoPriya" }] }),
  "/api/v1/chat_attendees": () =>
    json({ items: [{ id: "att-1", provider_id: "ACoPriya", name: "Priya Nair" }] }),
  "/api/v1/messages": () =>
    json({
      items: [
        {
          id: "msg-1",
          chat_id: "chat-1",
          text: "Sounds good, send it over",
          timestamp: "2026-09-25T10:00:00.000Z",
          is_sender: false,
        },
      ],
    }),
};

const listInbox = () =>
  listLinkedInInbox({ accountId: "acc-1", limit: 30, includeMessageHistory: false });

afterAll(() => {
  globalThis.fetch = originalFetch;
  process.env.UNIPILE_API_KEY = originalEnv.key;
  process.env.UNIPILE_DSN = originalEnv.dsn;
});

describe("listLinkedInInbox (inbox list)", () => {
  beforeEach(() => {
    routes = { ...healthy };
  });

  test("names each chat from the bulk attendee list and carries its last message", async () => {
    const threads = await listInbox();
    expect(threads.map((thread) => thread.profileName)).toEqual(["Priya Nair"]);
    expect(threads[0].messages.at(-1)?.body).toBe("Sounds good, send it over");
  });

  test("a failed attendee lookup fails the load instead of returning nameless chats that the inbox would drop", async () => {
    routes["/api/v1/chat_attendees"] = () => json({ type: "errors/unknown" }, 500);
    await expect(listInbox()).rejects.toThrow();
  });

  test("a failed recent-messages lookup fails the load instead of blanking every preview", async () => {
    routes["/api/v1/messages"] = () => json({ type: "errors/unknown" }, 500);
    await expect(listInbox()).rejects.toThrow();
  });
});

describe("linkedInChatBelongsToAccount", () => {
  beforeEach(() => {
    routes = {
      "/api/v1/chats/chat-1": () => json({ id: "chat-1", account_id: "acc-1" }),
      "/api/v1/chats/missing": () => json({ type: "errors/resource_not_found" }, 404),
      "/api/v1/chats/flaky": () => json({ type: "errors/unknown" }, 500),
    };
  });

  test("accepts a chat on the given account", async () => {
    expect(await linkedInChatBelongsToAccount("chat-1", "acc-1")).toBe(true);
  });

  test("rejects a chat that lives on another account, so nobody reads or replies through someone else's inbox", async () => {
    expect(await linkedInChatBelongsToAccount("chat-1", "acc-2")).toBe(false);
  });

  test("treats an unknown chat as not owned", async () => {
    expect(await linkedInChatBelongsToAccount("missing", "acc-1")).toBe(false);
  });

  test("a provider outage is an error, not a false 'chat not found'", async () => {
    await expect(linkedInChatBelongsToAccount("flaky", "acc-1")).rejects.toThrow();
  });
});
