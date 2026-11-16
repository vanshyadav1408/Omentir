import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

mock.module("server-only", () => ({}));
let workspaceId = "owned-workspace";
let submitResult: unknown;
let submitError: Error | undefined;
let pending: Record<string, unknown> | null;
const submissions: Array<Record<string, unknown>> = [];
const connections: Array<Record<string, unknown>> = [];
const updates: Array<Record<string, unknown>> = [];
const deleted: string[] = [];

class LoginError extends Error {
  constructor(readonly reason: string, message: string) {
    super(message);
  }
}
class ConnectError extends Error {}

const challenge = { pageUrl: "https://www.linkedin.com/checkpoint/challenge/x", action: "https://www.linkedin.com/checkpoint/challenge/verify", fields: [["challengeId", "x"]], codeField: "pin" };

mock.module("@/lib/server/auth", () => ({ auth: async () => ({ userId: "user-1" }) }));
mock.module("@/lib/server/active-workspace", () => ({ resolveActiveWorkspace: async () => ({ id: workspaceId }) }));
mock.module("@/lib/server/runtime-config", () => ({ getAppBaseUrl: () => "https://omentir.test" }));
mock.module("@/lib/request-rate-limit", () => ({ rateLimitRequestShared: async () => true }));
mock.module("@/lib/server/linkedin-own/login", () => ({
  LinkedInLoginError: LoginError,
  submitLinkedInChallenge: async (input: Record<string, unknown>) => {
    submissions.push(input);
    if (submitError) throw submitError;
    return submitResult;
  },
}));
mock.module("@/lib/server/linkedin-own/browser-login", () => ({
  getLiveBrowserLogin: () => undefined,
  closeLiveBrowserLogin: async () => {},
  submitBrowserLinkedInChallenge: async () => { throw new Error("no live browser in this test"); },
}));
mock.module("@/lib/server/linkedin-own/pending-logins", () => ({
  MAX_CODE_ATTEMPTS: 5,
  loadPendingLogin: async (id: string, userId: string) => (pending && id === pending.id && userId === pending.userId ? pending : null),
  updatePendingLogin: async (id: string, input: Record<string, unknown>) => { updates.push({ id, ...input }); },
  deletePendingLogin: async (id: string) => { deleted.push(id); },
}));
const released: string[] = [];
mock.module("@/lib/server/linkedin-own/proxy-pool", () => ({
  releaseProxy: async (proxySessionId: string) => { released.push(proxySessionId); },
}));
mock.module("@/lib/server/linkedin-own/connect", () => ({
  LinkedInConnectError: ConnectError,
  connectOwnLinkedInAccount: async (input: Record<string, unknown>) => {
    connections.push(input);
    return { displayName: "Sam Owner" };
  },
}));

const { POST } = await import("./route");
const LOGIN_ID = "pending-login-id-000000000000";
function request(body: unknown = { loginId: LOGIN_ID, code: "123456" }) {
  return new NextRequest("https://omentir.test/api/connect/linkedin/own/verify", {
    method: "POST", headers: { origin: "https://omentir.test", "content-type": "application/json" }, body: JSON.stringify(body),
  });
}

beforeEach(() => {
  workspaceId = "owned-workspace";
  submitResult = { kind: "signed_in", cookies: { li_at: "AQED", JSESSIONID: '"ajax:1"' } };
  submitError = undefined;
  pending = {
    id: LOGIN_ID, userId: "user-1", workspaceId: "owned-workspace", cookies: { JSESSIONID: '"ajax:1"' }, challenge,
    userAgent: "Mozilla/5.0 test", proxySessionId: "0123456789abcdef", timezone: "Asia/Kolkata",
    method: "email", attempts: 0,
  };
  submissions.length = 0;
  connections.length = 0;
  updates.length = 0;
  deleted.length = 0;
});

afterAll(() => {
  mock.restore();
});

test("the right code connects with the stored session details and clears the pending sign-in", async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true, displayName: "Sam Owner" });
  expect(submissions[0]).toMatchObject({ code: "123456", challenge, proxySessionId: "0123456789abcdef", userAgent: "Mozilla/5.0 test" });
  expect(deleted).toEqual([LOGIN_ID]);
  expect(connections).toEqual([{
    workspaceId: "owned-workspace", cookieHeader: 'li_at=AQED; JSESSIONID="ajax:1"', userAgent: "Mozilla/5.0 test",
    proxySessionId: "0123456789abcdef", timezone: "Asia/Kolkata",
  }]);
});

test("the code step finishes on the static IP the sign-in started on", async () => {
  released.length = 0;
  pending = { ...pending!, proxyPort: 8001, proxyCountry: "IN" };
  expect((await POST(request())).status).toBe(200);
  expect(submissions[0]).toMatchObject({ proxySessionId: "0123456789abcdef", proxyPort: 8001, proxyCountry: "IN" });
  expect(connections[0]).toMatchObject({ proxySessionId: "0123456789abcdef", proxyPort: 8001, proxyCountry: "IN" });
  expect(released).toEqual(["0123456789abcdef"]);
});

test("a wrong code keeps the sign-in open and counts the attempt", async () => {
  submitResult = { kind: "challenge", cookies: { JSESSIONID: '"ajax:2"' }, challenge, method: "email", retryError: "That code didn't work." };
  const response = await POST(request());
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ needsVerification: true, loginId: LOGIN_ID, method: "email", error: "That code didn't work." });
  expect(updates[0]).toMatchObject({ id: LOGIN_ID, attempts: 1 });
  expect(deleted).toHaveLength(0);
  expect(connections).toHaveLength(0);
});

test("someone else's or an expired sign-in cannot be continued", async () => {
  pending = { ...pending!, userId: "user-2" };
  const response = await POST(request());
  expect(response.status).toBe(410);
  expect((await response.json()).restart).toBe(true);
  expect(submissions).toHaveLength(0);
});

test("too many codes or a workspace switch end the sign-in", async () => {
  pending = { ...pending!, attempts: 5 };
  expect((await POST(request())).status).toBe(429);
  pending = { ...pending!, attempts: 0 };
  workspaceId = "other-workspace";
  expect((await POST(request())).status).toBe(409);
  expect(deleted).toEqual([LOGIN_ID, LOGIN_ID]);
  expect(submissions).toHaveLength(0);
});

test("a malformed code is refused without closing the sign-in; a LinkedIn refusal closes it", async () => {
  submitError = new LoginError("bad_credentials", "Enter the code exactly as LinkedIn shows it.");
  const malformed = await POST(request({ loginId: LOGIN_ID, code: "12" }));
  expect(malformed.status).toBe(400);
  expect(deleted).toHaveLength(0);

  submitError = new LoginError("unsupported_check", "LinkedIn wants a security puzzle.");
  const puzzle = await POST(request());
  expect(await puzzle.json()).toEqual({ error: "LinkedIn wants a security puzzle.", fallback: true, restart: true });
  expect(deleted).toEqual([LOGIN_ID]);
});
