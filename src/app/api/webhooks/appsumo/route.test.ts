import { createHmac } from "node:crypto";
import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

// AppSumo treats any answer but a 200 that echoes the event as "not delivered"
// and retries. So the status code is the contract: 200 only once the license
// change is stored, 401 for anything unsigned or forged, 5xx to ask for a retry.

mock.module("server-only", () => ({}));

const API_KEY = "c73455d8-0f64-4354-bd64-1f454a227104";
let apiKey: string | undefined = API_KEY;
let handlerError: Error | undefined;
const handled: Array<{ event: string; licenseKey: string }> = [];

mock.module("@/lib/server/appsumo", () => ({
  appSumoConfig: () => ({ apiKey }),
  handleAppSumoWebhook: async (webhook: { event: string; licenseKey: string }) => {
    if (handlerError) throw handlerError;
    handled.push({ event: webhook.event, licenseKey: webhook.licenseKey });
  },
}));
mock.module("@/lib/server/data", () => ({ logAutomationRun: async () => undefined }));

const { POST } = await import("./route");

const KEY = "3794577c-3dbc-11ec-9bbc-0242ac130002";

function request(
  payload: Record<string, unknown>,
  options: { sign?: boolean; signWith?: string; sentAt?: number } = {},
) {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (options.sign !== false) {
    const timestamp = String(options.sentAt ?? Date.now());
    headers["x-appsumo-timestamp"] = timestamp;
    headers["x-appsumo-signature"] = createHmac("sha256", options.signWith ?? API_KEY)
      .update(`${timestamp}${body}`)
      .digest("hex");
  }
  return new NextRequest("https://omentir.test/api/webhooks/appsumo", { method: "POST", headers, body });
}

beforeEach(() => {
  apiKey = API_KEY;
  handlerError = undefined;
  handled.length = 0;
});

afterAll(() => {
  mock.restore();
});

test("a signed webhook is processed and answered the way AppSumo requires", async () => {
  const response = await POST(request({ license_key: KEY, event: "activate", tier: 2, test: false }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ success: true, event: "activate" });
  expect(handled).toEqual([{ event: "activate", licenseKey: KEY }]);
});

test("an unsigned test event is refused: AppSumo signs every webhook, tests included", async () => {
  const response = await POST(
    request({ license_key: "00000000-aaaa-1111-bbbb-abcdef012345", event: "deactivate", test: true }, { sign: false }),
  );
  expect(response.status).toBe(401);
  expect(handled).toEqual([]);
});

test("a correctly signed webhook sent 10 minutes ago is refused as a replay, as AppSumo's QA check requires", async () => {
  const tenMinutes = 10 * 60 * 1000;
  const old = await POST(request({ license_key: KEY, event: "activate", tier: 1 }, { sentAt: Date.now() - tenMinutes }));
  expect(old.status).toBe(401);
  const future = await POST(request({ license_key: KEY, event: "activate", tier: 1 }, { sentAt: Date.now() + tenMinutes }));
  expect(future.status).toBe(401);
  expect(handled).toEqual([]);
});

test("a signed test event is acknowledged and still changes nothing", async () => {
  const response = await POST(request({ license_key: KEY, event: "purchase", test: true }));
  expect(response.status).toBe(200);
  expect(handled).toEqual([]);
});

test("an unsigned or forged webhook is refused before it can grant or revoke a license", async () => {
  const unsigned = await POST(request({ license_key: KEY, event: "activate", tier: 3 }, { sign: false }));
  expect(unsigned.status).toBe(401);

  const forged = await POST(request({ license_key: KEY, event: "deactivate" }, { signWith: "not-our-key" }));
  expect(forged.status).toBe(401);

  // Marking a forged event as a test must not get it past the signature check.
  const forgedTest = await POST(request({ license_key: KEY, event: "activate", test: true }, { signWith: "not-our-key" }));
  expect(forgedTest.status).toBe(401);
  expect(handled).toEqual([]);
});

test("without the API key a real webhook is refused, not trusted", async () => {
  apiKey = undefined;
  const response = await POST(request({ license_key: KEY, event: "activate", tier: 1 }));
  expect(response.status).toBe(503);
  expect(handled).toEqual([]);
});

test("a failure while storing the change answers 500 so AppSumo retries and the license is not lost", async () => {
  handlerError = new Error("Firestore unavailable");
  const response = await POST(request({ license_key: KEY, event: "purchase", tier: 1 }));
  expect(response.status).toBe(500);
  expect((await response.json()).success).toBe(false);
});

test("a payload that is not an AppSumo webhook is refused", async () => {
  const response = await POST(request({ hello: "world" }));
  expect(response.status).toBe(400);
});
