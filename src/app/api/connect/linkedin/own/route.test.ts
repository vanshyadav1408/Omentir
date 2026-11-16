import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

mock.module("server-only", () => ({}));
let userId: string | null = "user-1";
let allowed = true;
let connectError: Error | undefined;
const connections: unknown[] = [];

mock.module("@/lib/server/auth", () => ({ auth: async () => ({ userId }) }));
mock.module("@/lib/server/active-workspace", () => ({ resolveActiveWorkspace: async () => ({ id: "owned-workspace" }) }));
mock.module("@/lib/server/runtime-config", () => ({ getAppBaseUrl: () => "https://omentir.test" }));
mock.module("@/lib/request-rate-limit", () => ({ rateLimitRequestShared: async () => allowed }));
class ConnectError extends Error {}
const reserved: Array<string | undefined> = [];
const released: string[] = [];
let poolFull = false;
mock.module("@/lib/server/linkedin-own/proxy-pool", () => ({
  NO_FREE_PROXY_MESSAGE: "No free IP right now.",
  requestCountry: (headers: Headers) => headers.get("cf-ipcountry") || undefined,
  reserveProxy: async (proxySessionId: string, country?: string) => {
    reserved.push(country);
    return poolFull ? null : { proxySessionId, proxyPort: 8002, proxyCountry: country || "US" };
  },
  releaseProxy: async (proxySessionId: string) => { released.push(proxySessionId); },
}));
mock.module("@/lib/server/linkedin-own/connect", () => ({
  LinkedInConnectError: ConnectError,
  connectOwnLinkedInAccount: async (input: unknown) => {
    connections.push(input);
    if (connectError) throw connectError;
    return { displayName: "Sam Owner" };
  },
}));

const { POST } = await import("./route");
const input = { liAt: "test-session-secret", jsessionId: '"ajax:123"', userAgent: "Mozilla/5.0 test", timezone: "Asia/Kolkata" };
function request(body: unknown = input, origin = "https://omentir.test") {
  return new NextRequest("https://omentir.test/api/connect/linkedin/own", {
    method: "POST", headers: { origin, "content-type": "application/json", "cf-ipcountry": "DE" }, body: JSON.stringify(body),
  });
}

beforeEach(() => {
  userId = "user-1";
  allowed = true;
  connectError = undefined;
  connections.length = 0;
  reserved.length = 0;
  released.length = 0;
  poolFull = false;
});

afterAll(() => {
  mock.restore();
});

test("the signed-in user connects only to their resolved workspace and receives no cookies back", async () => {
  const response = await POST(request({ ...input, workspaceId: "someone-else" }));
  expect(response.status).toBe(200);
  expect(connections).toEqual([{
    workspaceId: "owned-workspace", cookieHeader: 'li_at=test-session-secret; JSESSIONID="ajax:123"',
    userAgent: input.userAgent, timezone: input.timezone,
    proxySessionId: expect.stringMatching(/^[a-f0-9]{16}$/), proxyPort: 8002, proxyCountry: "DE",
  }]);
  // The static IP comes from where the person is connecting from.
  expect(reserved).toEqual(["DE"]);
  expect(await response.json()).toEqual({ ok: true, displayName: "Sam Owner" });
  expect(response.headers.get("cache-control")).toBe("no-store");
});

test("a foreign page cannot replace a customer's LinkedIn session", async () => {
  expect((await POST(request(input, "https://attacker.test"))).status).toBe(403);
  expect(connections).toHaveLength(0);
});

// Every connect is a new account. The form used to offer "reconnecting an
// account?", and naming an old account moved its campaigns onto the new
// sign-in; a request that still names one must not do that.
test("naming an old account to replace is ignored", async () => {
  const response = await POST(request({ ...input, replaceAccountId: "old-account" }));
  expect(response.status).toBe(200);
  expect(connections).toHaveLength(1);
  expect(connections[0]).not.toHaveProperty("replaceAccountId");
});

test("signed-out and rate-limited requests never probe LinkedIn", async () => {
  userId = null;
  expect((await POST(request())).status).toBe(401);
  userId = "user-1";
  allowed = false;
  expect((await POST(request())).status).toBe(429);
  expect(connections).toHaveLength(0);
});

test("malformed and oversized cookie input cannot reach the session client", async () => {
  expect((await POST(request({ ...input, liAt: "secret; li_at=injected" }))).status).toBe(400);
  expect((await POST(request({ ...input, jsessionId: "not-a-session" }))).status).toBe(400);
  expect((await POST(request({ ...input, liAt: "x".repeat(20_000) }))).status).toBe(413);
  expect(connections).toHaveLength(0);
});

test("plan limit errors remain actionable while unexpected errors never disclose credentials", async () => {
  connectError = new ConnectError("Your current plan supports up to 1 LinkedIn account.");
  const rejected = await POST(request());
  expect(rejected.status).toBe(400);
  expect(await rejected.text()).toContain("current plan");
  connectError = new Error("provider echoed li_at=test-session-secret");
  const failed = await POST(request());
  expect(failed.status).toBe(503);
  expect(await failed.text()).not.toContain("test-session-secret");
});

test("a refused connect gives its static IP back for the next person", async () => {
  connectError = new ConnectError("Your current plan supports up to 1 LinkedIn account.");
  expect((await POST(request())).status).toBe(400);
  expect(released).toEqual([(connections[0] as { proxySessionId: string }).proxySessionId]);
});

test("with no static IP free, the session is never probed from a changing IP", async () => {
  poolFull = true;
  const response = await POST(request());
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "No free IP right now." });
  expect(connections).toHaveLength(0);
});
