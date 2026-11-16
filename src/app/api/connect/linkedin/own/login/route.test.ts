import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

mock.module("server-only", () => ({}));
let userId: string | null = "user-1";
let loginResult: unknown;
let loginError: Error | undefined;
let connectError: Error | undefined;
const logins: Array<Record<string, unknown>> = [];
const connections: Array<Record<string, unknown>> = [];
const saved: Array<Record<string, unknown>> = [];

class LoginError extends Error {
  constructor(readonly reason: string, message: string) {
    super(message);
  }
}
class NoBrowserError extends Error {}
class ConnectError extends Error {}

let httpLoginResult: unknown;
const httpLogins: Array<Record<string, unknown>> = [];

mock.module("@/lib/server/auth", () => ({ auth: async () => ({ userId }) }));
mock.module("@/lib/server/active-workspace", () => ({ resolveActiveWorkspace: async () => ({ id: "owned-workspace" }) }));
mock.module("@/lib/server/runtime-config", () => ({ getAppBaseUrl: () => "https://omentir.test" }));
mock.module("@/lib/request-rate-limit", () => ({ rateLimitRequestShared: async () => true }));
mock.module("@/lib/server/linkedin-own/login", () => ({
  LinkedInLoginError: LoginError,
  startLinkedInLogin: async (input: Record<string, unknown>) => {
    httpLogins.push(input);
    return httpLoginResult;
  },
}));
const registeredLive: Array<Record<string, unknown>> = [];
mock.module("@/lib/server/linkedin-own/browser-login", () => ({
  NoBrowserAvailableError: NoBrowserError,
  startBrowserLinkedInLogin: async (input: Record<string, unknown>) => {
    logins.push(input);
    if (loginError) throw loginError;
    return loginResult;
  },
  registerLiveBrowserLogin: (id: string, live: unknown) => { registeredLive.push({ id, live }); },
}));
mock.module("@/lib/server/linkedin-own/pending-logins", () => ({
  savePendingLogin: async (input: Record<string, unknown>) => {
    saved.push(input);
    return "pending-login-id-000000000000";
  },
}));
// The pool hands out a static IP for the person's country; the route must
// carry it through every step and give it back when nothing keeps it.
const reserved: Array<{ proxySessionId: string; country?: string }> = [];
const released: string[] = [];
let poolFull = false;
mock.module("@/lib/server/linkedin-own/proxy-pool", () => ({
  NO_FREE_PROXY_MESSAGE: "No free IP right now.",
  requestCountry: (headers: Headers) => headers.get("cf-ipcountry") || undefined,
  reserveProxy: async (proxySessionId: string, country?: string) => {
    reserved.push({ proxySessionId, ...(country ? { country } : {}) });
    return poolFull ? null : { proxySessionId, proxyPort: 8001, proxyCountry: country || "US" };
  },
  releaseProxy: async (proxySessionId: string) => { released.push(proxySessionId); },
}));
mock.module("@/lib/server/linkedin-own/connect", () => ({
  LinkedInConnectError: ConnectError,
  connectOwnLinkedInAccount: async (input: Record<string, unknown>) => {
    connections.push(input);
    if (connectError) throw connectError;
    return { displayName: "Sam Owner" };
  },
}));

const { POST } = await import("./route");
const PASSWORD = "hunter2-correct-horse";
const input = { email: "sam@example.com", password: PASSWORD, userAgent: "Mozilla/5.0 test", timezone: "Asia/Kolkata" };
function request(body: unknown = input, origin = "https://omentir.test") {
  return new NextRequest("https://omentir.test/api/connect/linkedin/own/login", {
    method: "POST", headers: { origin, "content-type": "application/json", "cf-ipcountry": "IN" }, body: JSON.stringify(body),
  });
}

beforeEach(() => {
  userId = "user-1";
  loginResult = { kind: "signed_in", cookies: { li_at: "AQED", JSESSIONID: '"ajax:1"' } };
  loginError = undefined;
  connectError = undefined;
  logins.length = 0;
  connections.length = 0;
  saved.length = 0;
  reserved.length = 0;
  released.length = 0;
  poolFull = false;
});

afterAll(() => {
  mock.restore();
});

test("a direct sign-in connects through the same proxy session and returns no secrets", async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const body = await response.text();
  expect(JSON.parse(body)).toEqual({ ok: true, displayName: "Sam Owner" });
  expect(body).not.toContain("AQED");
  expect(logins[0].proxySessionId).toMatch(/^[a-f0-9]{16}$/);
  expect(reserved).toEqual([{ proxySessionId: logins[0].proxySessionId as string, country: "IN" }]);
  expect(logins[0]).toMatchObject({ proxyPort: 8001, proxyCountry: "IN" });
  expect(connections).toEqual([{
    workspaceId: "owned-workspace",
    cookieHeader: 'li_at=AQED; JSESSIONID="ajax:1"',
    userAgent: input.userAgent,
    proxySessionId: logins[0].proxySessionId,
    proxyPort: 8001,
    proxyCountry: "IN",
    timezone: "Asia/Kolkata",
  }]);
  // Offered back after connect: a no-op when the account kept this IP, and
  // frees it when a reconnect kept the account's earlier one.
  expect(released).toEqual([logins[0].proxySessionId as string]);
});

test("a verification check is parked without the password", async () => {
  registeredLive.length = 0;
  loginResult = {
    kind: "challenge",
    method: "email",
    hint: "We sent a code to s***@example.com",
    live: { fakeBrowser: true },
  };
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    needsVerification: true, loginId: "pending-login-id-000000000000", method: "email", hint: "We sent a code to s***@example.com",
  });
  expect(connections).toHaveLength(0);
  expect(saved[0]).toMatchObject({ userId: "user-1", workspaceId: "owned-workspace", proxySessionId: logins[0].proxySessionId, proxyPort: 8001 });
  // The code step finishes on this same IP, so it stays held.
  expect(released).toHaveLength(0);
  expect(registeredLive).toEqual([{ id: "pending-login-id-000000000000", live: { fakeBrowser: true } }]);
  expect(JSON.stringify(saved)).not.toContain(PASSWORD);
});

test("only Omentir's own signed-in page can send a password", async () => {
  expect((await POST(request(input, "https://attacker.test"))).status).toBe(403);
  userId = null;
  expect((await POST(request())).status).toBe(401);
  expect(logins).toHaveLength(0);
});

test("LinkedIn refusals map to actionable responses", async () => {
  loginError = new LoginError("bad_credentials", "LinkedIn didn't accept that sign-in.");
  const rejected = await POST(request());
  expect(rejected.status).toBe(400);
  expect(await rejected.json()).toEqual({ error: "LinkedIn didn't accept that sign-in." });

  loginError = new LoginError("unsupported_check", "LinkedIn wants a security puzzle.");
  const puzzle = await POST(request());
  expect(await puzzle.json()).toEqual({ error: "LinkedIn wants a security puzzle.", fallback: true });

  loginError = new LoginError("refused", "LinkedIn refused the sign-in request.");
  expect(await (await POST(request())).json()).toEqual({ error: "LinkedIn refused the sign-in request.", fallback: true });

  loginError = new LoginError("blocked", "Too many attempts.");
  expect((await POST(request())).status).toBe(429);
});

test("with no static IP free, the password never reaches LinkedIn", async () => {
  poolFull = true;
  const response = await POST(request());
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "No free IP right now." });
  expect(logins).toHaveLength(0);
  expect(connections).toHaveLength(0);
});

test("a failed sign-in gives its static IP back for the next person", async () => {
  loginError = new LoginError("bad_credentials", "LinkedIn didn't accept that sign-in.");
  expect((await POST(request())).status).toBe(400);
  expect(released).toEqual([reserved[0].proxySessionId]);
});

test("unexpected failures never echo the password", async () => {
  loginError = new Error(`proxy said: password=${PASSWORD}`);
  const failed = await POST(request());
  expect(failed.status).toBe(503);
  expect(await failed.text()).not.toContain(PASSWORD);
});

test("incomplete input never reaches LinkedIn", async () => {
  expect((await POST(request({ ...input, password: "" }))).status).toBe(400);
  expect((await POST(request({ ...input, userAgent: "curl/8" }))).status).toBe(400);
  expect(logins).toHaveLength(0);
});

test("hosts without a Chromium binary fall back to direct checkpoint sign-in instead of failing", async () => {
  httpLogins.length = 0;
  loginError = new NoBrowserError("No Chromium installed");
  httpLoginResult = { kind: "signed_in", cookies: { li_at: "AQEDhttp", JSESSIONID: '"ajax:9"' } };
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(httpLogins).toHaveLength(1);
  expect(httpLogins[0]).toMatchObject({ proxySessionId: logins[0].proxySessionId, proxyPort: 8001 });
  expect(connections[0]).toMatchObject({
    cookieHeader: 'li_at=AQEDhttp; JSESSIONID="ajax:9"',
    proxySessionId: logins[0].proxySessionId,
  });
});
