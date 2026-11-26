import { createHmac } from "node:crypto";
import { describe, expect, test } from "bun:test";
import {
  AppSumoOAuthError,
  appSumoClaimMatches,
  applyAppSumoWebhook,
  exchangeAppSumoCode,
  hashAppSumoClaimToken,
  parseAppSumoClaim,
  parseAppSumoWebhook,
  verifyAppSumoSignature,
  type AppSumoLicense,
  type AppSumoWebhook,
} from "./appsumo-license";

const now = "2026-11-21T12:00:00.000Z";
const KEY = "3794577c-3dbc-11ec-9bbc-0242ac130002";
const NEW_KEY = "11111111-2222-3333-4444-555555555555";

function webhook(patch: Partial<AppSumoWebhook> = {}): AppSumoWebhook {
  return { event: "purchase", licenseKey: KEY, tier: 1, test: false, ...patch };
}

function license(patch: Partial<AppSumoLicense> = {}): AppSumoLicense {
  return {
    licenseKey: KEY,
    status: "active",
    tier: 1,
    lastEvent: "activate",
    createdAt: now,
    updatedAt: now,
    ...patch,
  };
}

describe("verifyAppSumoSignature", () => {
  const apiKey = "c73455d8-0f64-4354-bd64-1f454a227104";
  const timestamp = "1625165884119";
  const body = `{"license_key":"${KEY}","event":"purchase","tier":1,"test":false}`;
  // The recipe from AppSumo's licensing docs: HMAC SHA256 over the timestamp
  // followed by the raw body, keyed with the API key, as hex.
  const signature = createHmac("sha256", apiKey).update(`${timestamp}${body}`).digest("hex");

  test("accepts a webhook signed the way AppSumo documents it", () => {
    expect(verifyAppSumoSignature({ apiKey, timestamp, signature, body })).toBe(true);
    expect(verifyAppSumoSignature({ apiKey, timestamp, signature: signature.toUpperCase(), body })).toBe(true);
  });

  test("refuses anything that was not signed with our key, because a forged webhook could hand out or revoke a paid license", () => {
    const tampered = body.replace('"tier":1', '"tier":3');
    expect(verifyAppSumoSignature({ apiKey, timestamp, signature, body: tampered })).toBe(false);
    expect(verifyAppSumoSignature({ apiKey, timestamp: "1625165884120", signature, body })).toBe(false);
    expect(verifyAppSumoSignature({ apiKey: "another-key", timestamp, signature, body })).toBe(false);
    expect(verifyAppSumoSignature({ apiKey, timestamp, signature: "", body })).toBe(false);
    expect(verifyAppSumoSignature({ apiKey, timestamp: null, signature, body })).toBe(false);
    expect(verifyAppSumoSignature({ apiKey: undefined, timestamp, signature, body })).toBe(false);
  });
});

describe("parseAppSumoWebhook", () => {
  test("reads the fields AppSumo sends", () => {
    expect(
      parseAppSumoWebhook(
        JSON.stringify({
          license_key: NEW_KEY,
          prev_license_key: KEY,
          event: "upgrade",
          license_status: "inactive",
          tier: 2,
          test: false,
        }),
      ),
    ).toEqual({
      event: "upgrade",
      licenseKey: NEW_KEY,
      prevLicenseKey: KEY,
      tier: 2,
      test: false,
      parentLicenseKey: undefined,
    });
  });

  test("marks the Partner Portal's test event so it is acknowledged and nothing is stored", () => {
    const parsed = parseAppSumoWebhook(
      JSON.stringify({ license_key: "00000000-aaaa-1111-bbbb-abcdef012345", event: "purchase", test: true }),
    );
    expect(parsed?.test).toBe(true);
  });

  test("refuses a license key that is not a plain id, since the key becomes a Firestore document path", () => {
    expect(parseAppSumoWebhook(JSON.stringify({ license_key: "a/b/c/d/e/f", event: "purchase" }))).toBeNull();
    expect(parseAppSumoWebhook(JSON.stringify({ license_key: "", event: "purchase" }))).toBeNull();
    expect(parseAppSumoWebhook(JSON.stringify({ license_key: KEY }))).toBeNull();
    expect(parseAppSumoWebhook("not json")).toBeNull();
    expect(parseAppSumoWebhook("[]")).toBeNull();
  });
});

describe("applyAppSumoWebhook", () => {
  test("a purchase is stored as an unactivated license with the tier that was bought", () => {
    const result = applyAppSumoWebhook({ webhook: webhook({ tier: 2 }), current: null, previous: null, now });
    expect(result?.license).toMatchObject({ licenseKey: KEY, status: "inactive", tier: 2 });
    expect(result?.license.ownerId).toBeUndefined();
  });

  test("a purchase that AppSumo delivers late or twice never undoes an activation or a refund", () => {
    const active = applyAppSumoWebhook({
      webhook: webhook(),
      current: license({ status: "active", ownerId: "user-1" }),
      previous: null,
      now,
    });
    expect(active?.license).toMatchObject({ status: "active", ownerId: "user-1" });

    const refunded = applyAppSumoWebhook({
      webhook: webhook(),
      current: license({ status: "deactivated" }),
      previous: null,
      now,
    });
    expect(refunded?.license.status).toBe("deactivated");
  });

  test("a refund deactivates the license and keeps its owner, so the owner's access can be found and ended", () => {
    const result = applyAppSumoWebhook({
      webhook: webhook({ event: "deactivate" }),
      current: license({ ownerId: "user-1" }),
      previous: null,
      now,
    });
    expect(result?.license).toMatchObject({ status: "deactivated", ownerId: "user-1" });
  });

  test("a license AppSumo reactivates after a refund works again for the same account", () => {
    const result = applyAppSumoWebhook({
      webhook: webhook({ event: "activate" }),
      current: license({ status: "deactivated", ownerId: "user-1" }),
      previous: null,
      now,
    });
    expect(result?.license).toMatchObject({ status: "active", ownerId: "user-1" });
  });

  test("an upgrade moves the buyer's account to the new key, so they keep their workspace and get the new tier", () => {
    const result = applyAppSumoWebhook({
      webhook: webhook({ event: "upgrade", licenseKey: NEW_KEY, prevLicenseKey: KEY, tier: 3 }),
      current: null,
      previous: license({ ownerId: "user-1", tier: 1 }),
      now,
    });
    expect(result?.license).toMatchObject({
      licenseKey: NEW_KEY,
      status: "active",
      tier: 3,
      ownerId: "user-1",
      prevLicenseKey: KEY,
    });
    expect(result?.previous).toMatchObject({ licenseKey: KEY, replacedBy: NEW_KEY });
    expect(result?.previous?.ownerId).toBeUndefined();
  });

  test("the deactivation AppSumo sends for the old key after an upgrade finds no owner, so the upgrade never costs the buyer their access", () => {
    const upgraded = applyAppSumoWebhook({
      webhook: webhook({ event: "upgrade", licenseKey: NEW_KEY, prevLicenseKey: KEY, tier: 2 }),
      current: null,
      previous: license({ ownerId: "user-1" }),
      now,
    });
    const oldKeyDeactivated = applyAppSumoWebhook({
      webhook: webhook({ event: "deactivate", licenseKey: KEY }),
      current: upgraded!.previous!,
      previous: null,
      now,
    });
    expect(oldKeyDeactivated?.license.status).toBe("deactivated");
    expect(oldKeyDeactivated?.license.ownerId).toBeUndefined();
  });

  test("an upgrade delivered twice leaves the owner on the new key", () => {
    const first = applyAppSumoWebhook({
      webhook: webhook({ event: "upgrade", licenseKey: NEW_KEY, prevLicenseKey: KEY, tier: 2 }),
      current: null,
      previous: license({ ownerId: "user-1" }),
      now,
    })!;
    const retry = applyAppSumoWebhook({
      webhook: webhook({ event: "upgrade", licenseKey: NEW_KEY, prevLicenseKey: KEY, tier: 2 }),
      current: first.license,
      previous: first.previous!,
      now,
    });
    expect(retry?.license.ownerId).toBe("user-1");
    expect(retry?.previous?.ownerId).toBeUndefined();
  });

  test("a downgrade works like an upgrade and carries the lower tier", () => {
    const result = applyAppSumoWebhook({
      webhook: webhook({ event: "downgrade", licenseKey: NEW_KEY, prevLicenseKey: KEY, tier: 1 }),
      current: null,
      previous: license({ ownerId: "user-1", tier: 3 }),
      now,
    });
    expect(result?.license).toMatchObject({ tier: 1, ownerId: "user-1", status: "active" });
  });

  test("add-on webhooks and events with no license meaning change nothing: Omentir sells no add-ons", () => {
    expect(
      applyAppSumoWebhook({
        webhook: webhook({ event: "purchase", parentLicenseKey: NEW_KEY }),
        current: null,
        previous: null,
        now,
      }),
    ).toBeNull();
    expect(
      applyAppSumoWebhook({ webhook: webhook({ event: "migrate" }), current: license(), previous: null, now }),
    ).toBeNull();
  });
});

describe("redemption claim", () => {
  const token = "ab".repeat(32);
  const claimed = license({
    claimHash: hashAppSumoClaimToken(token),
    claimExpiresAt: "2026-11-21T13:00:00.000Z",
  });
  const at = (iso: string) => Date.parse(iso);

  test("only the browser that started the redemption can finish it", () => {
    expect(appSumoClaimMatches(claimed, token, at("2026-11-21T12:30:00.000Z"))).toBe(true);
    expect(appSumoClaimMatches(claimed, "cd".repeat(32), at("2026-11-21T12:30:00.000Z"))).toBe(false);
  });

  test("a redemption left unfinished expires, so an old cookie cannot attach the license later", () => {
    expect(appSumoClaimMatches(claimed, token, at("2026-11-21T13:00:00.000Z"))).toBe(false);
    expect(appSumoClaimMatches(license(), token, at("2026-11-21T12:30:00.000Z"))).toBe(false);
  });

  test("the cookie is the license key and the token, and anything else is ignored", () => {
    expect(parseAppSumoClaim(`${KEY}.${token}`)).toEqual({ licenseKey: KEY, token });
    expect(parseAppSumoClaim(`${KEY}.short`)).toBeNull();
    expect(parseAppSumoClaim(`${KEY}.${token}.extra`)).toBeNull();
    expect(parseAppSumoClaim(undefined)).toBeNull();
  });
});

describe("exchangeAppSumoCode", () => {
  const input = {
    code: "1d512d96ba99465ba9942bdf282233ea",
    clientId: "client-id",
    clientSecret: "client-secret",
    redirectUri: "https://omentir.com/appsumo/redeem",
  };

  function fakeFetch(responses: Array<{ status: number; body: unknown }>) {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      const next = responses[calls.length - 1];
      return new Response(JSON.stringify(next.body), { status: next.status });
    }) as typeof fetch;
    return { calls, fetchImpl };
  }

  test("trades the code for a token with the saved redirect URL, then reads the license key with that token", async () => {
    const { calls, fetchImpl } = fakeFetch([
      { status: 200, body: { access_token: "token-1", token_type: "bearer", error: "" } },
      { status: 200, body: { license_key: KEY, status: "active", scopes: ["read_license"] } },
    ]);
    expect(await exchangeAppSumoCode({ ...input, fetchImpl })).toEqual({ licenseKey: KEY, status: "active" });

    expect(calls[0].url).toBe("https://appsumo.com/openid/token/");
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      client_id: "client-id",
      client_secret: "client-secret",
      code: input.code,
      redirect_uri: "https://omentir.com/appsumo/redeem",
      grant_type: "authorization_code",
    });
    expect(calls[1].url).toBe("https://appsumo.com/openid/license_key/?access_token=token-1");
  });

  test("a used or rejected code is an OAuth error and never reaches the license lookup", async () => {
    const { calls, fetchImpl } = fakeFetch([{ status: 403, body: { error: "invalid_grant" } }]);
    await expect(exchangeAppSumoCode({ ...input, fetchImpl })).rejects.toBeInstanceOf(AppSumoOAuthError);
    expect(calls).toHaveLength(1);
  });

  test("an answer without a usable license key is an error, not a license", async () => {
    const { fetchImpl } = fakeFetch([
      { status: 200, body: { access_token: "token-1" } },
      { status: 200, body: { status: "active" } },
    ]);
    await expect(exchangeAppSumoCode({ ...input, fetchImpl })).rejects.toBeInstanceOf(AppSumoOAuthError);
  });
});
