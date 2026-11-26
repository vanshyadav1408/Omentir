import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { normalizeAppSumoTier } from "./appsumo-tiers";

// AppSumo Licensing API v2 (https://docs.licensing.appsumo.com). Nothing in
// this file touches Firestore or the request, so the license rules can be
// tested on their own.

export type AppSumoLicenseStatus = "inactive" | "active" | "deactivated";

// One document per license key in the appsumoLicenses collection.
export type AppSumoLicense = {
  licenseKey: string;
  status: AppSumoLicenseStatus;
  tier: number;
  // Clerk user id of the Omentir account the license is attached to. AppSumo
  // sends no buyer email, so this is only known once the buyer redeems.
  ownerId?: string;
  // An upgrade or downgrade issues a new key. These link the two documents.
  prevLicenseKey?: string;
  replacedBy?: string;
  // Redemption in progress: sha256 of the token held in the buyer's cookie.
  claimHash?: string;
  claimExpiresAt?: string;
  lastEvent: string;
  createdAt: string;
  updatedAt: string;
};

export type AppSumoWebhook = {
  event: string;
  licenseKey: string;
  prevLicenseKey?: string;
  tier?: number;
  // Sent when the webhook URL is saved in the Partner Portal. Must be
  // answered with success and must change nothing.
  test: boolean;
  // Set only on add-on webhooks. Omentir sells no add-ons.
  parentLicenseKey?: string;
};

// License keys are UUIDs. They become Firestore document ids, so anything that
// is not a plain id is refused.
const LICENSE_KEY = /^[A-Za-z0-9-]{8,64}$/;

export function isAppSumoLicenseKey(value: unknown): value is string {
  return typeof value === "string" && LICENSE_KEY.test(value);
}

export function parseAppSumoWebhook(body: string): AppSumoWebhook | null {
  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    payload = parsed as Record<string, unknown>;
  } catch {
    return null;
  }

  const event = typeof payload.event === "string" ? payload.event.trim().toLowerCase() : "";
  if (!event || !isAppSumoLicenseKey(payload.license_key)) return null;
  const tier = Number(payload.tier);
  return {
    event,
    licenseKey: payload.license_key,
    prevLicenseKey: isAppSumoLicenseKey(payload.prev_license_key)
      ? payload.prev_license_key
      : undefined,
    tier: Number.isInteger(tier) && tier > 0 ? tier : undefined,
    test: payload.test === true,
    parentLicenseKey: isAppSumoLicenseKey(payload.parent_license_key)
      ? payload.parent_license_key
      : undefined,
  };
}

/**
 * AppSumo signs each webhook with HMAC SHA256 over the timestamp header
 * followed by the raw body, keyed with the product's API key, hex encoded.
 */
export function verifyAppSumoSignature(input: {
  apiKey: string | undefined;
  timestamp: string | null | undefined;
  signature: string | null | undefined;
  body: string;
}) {
  if (!input.apiKey || !input.timestamp || !input.signature) return false;
  const expected = Buffer.from(
    createHmac("sha256", input.apiKey).update(`${input.timestamp}${input.body}`).digest("hex"),
  );
  const given = Buffer.from(input.signature.trim().toLowerCase());
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/**
 * The license documents after one webhook, or null when the event changes
 * nothing (add-ons, migrate, anything unknown).
 *
 * `current` is the stored license for the webhook's key and `previous` the one
 * for prev_license_key. Applying the same webhook twice gives the same result,
 * because AppSumo retries any delivery that did not get a 200.
 */
export function applyAppSumoWebhook(input: {
  webhook: AppSumoWebhook;
  current: AppSumoLicense | null;
  previous: AppSumoLicense | null;
  now: string;
}): { license: AppSumoLicense; previous?: AppSumoLicense } | null {
  const { webhook, current, previous, now } = input;
  if (webhook.parentLicenseKey) return null;

  const base: AppSumoLicense = current ?? {
    licenseKey: webhook.licenseKey,
    status: "inactive",
    tier: normalizeAppSumoTier(webhook.tier),
    lastEvent: webhook.event,
    createdAt: now,
    updatedAt: now,
  };
  const next: AppSumoLicense = {
    ...base,
    tier: webhook.tier ?? base.tier,
    lastEvent: webhook.event,
    updatedAt: now,
  };

  switch (webhook.event) {
    case "purchase":
      // A late or repeated purchase must not undo an activation or a refund.
      return { license: next };
    case "activate":
      return { license: { ...next, status: "active" } };
    case "deactivate":
      return { license: { ...next, status: "deactivated" } };
    case "upgrade":
    case "downgrade": {
      // The buyer keeps their Omentir account: its owner moves to the new key.
      // AppSumo then deactivates the old key, which by then has no owner, so
      // that deactivation takes nothing away.
      const license: AppSumoLicense = {
        ...next,
        status: "active",
        prevLicenseKey: webhook.prevLicenseKey ?? next.prevLicenseKey,
        ownerId: next.ownerId ?? previous?.ownerId,
      };
      if (!previous || previous.licenseKey === license.licenseKey) return { license };
      return {
        license,
        previous: {
          ...previous,
          ownerId: undefined,
          claimHash: undefined,
          claimExpiresAt: undefined,
          replacedBy: license.licenseKey,
          updatedAt: now,
        },
      };
    }
    default:
      return null;
  }
}

// Redemption. After the OAuth exchange names a license, the buyer still has to
// sign up or log in before it can be attached. The browser holds
// `<licenseKey>.<token>` in an httpOnly cookie and the license stores only the
// token's hash, so the cookie alone proves who started this redemption.

export function hashAppSumoClaimToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function parseAppSumoClaim(value: string | null | undefined) {
  const parts = (value || "").split(".");
  if (parts.length !== 2) return null;
  const [licenseKey, token] = parts;
  if (!isAppSumoLicenseKey(licenseKey) || !/^[a-f0-9]{64}$/.test(token)) return null;
  return { licenseKey, token };
}

export function appSumoClaimMatches(
  license: Pick<AppSumoLicense, "claimHash" | "claimExpiresAt">,
  token: string,
  now = Date.now(),
) {
  if (!license.claimHash || !license.claimExpiresAt) return false;
  const expiresAt = Date.parse(license.claimExpiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;
  const expected = Buffer.from(license.claimHash);
  const given = Buffer.from(hashAppSumoClaimToken(token));
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export class AppSumoOAuthError extends Error {}

const APPSUMO_TOKEN_URL = "https://appsumo.com/openid/token/";
const APPSUMO_LICENSE_URL = "https://appsumo.com/openid/license_key/";

/**
 * Trade the single-use `code` AppSumo puts on the redirect for the license
 * key. `redirectUri` must be the exact OAuth redirect URL saved in the Partner
 * Portal, or AppSumo answers 403.
 */
export async function exchangeAppSumoCode(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  fetchImpl?: typeof fetch;
}): Promise<{ licenseKey: string; status: string }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const tokenResponse = await fetchImpl(APPSUMO_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      code: input.code,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const token = (await tokenResponse.json().catch(() => null)) as
    | { access_token?: unknown; error?: unknown }
    | null;
  const accessToken = typeof token?.access_token === "string" ? token.access_token : "";
  if (!tokenResponse.ok || !accessToken) {
    throw new AppSumoOAuthError(
      `AppSumo token exchange failed (${tokenResponse.status}${
        typeof token?.error === "string" && token.error ? `: ${token.error}` : ""
      }).`,
    );
  }

  const licenseResponse = await fetchImpl(
    `${APPSUMO_LICENSE_URL}?access_token=${encodeURIComponent(accessToken)}`,
    { cache: "no-store", signal: AbortSignal.timeout(15_000) },
  );
  const license = (await licenseResponse.json().catch(() => null)) as
    | { license_key?: unknown; status?: unknown }
    | null;
  if (!licenseResponse.ok || !isAppSumoLicenseKey(license?.license_key)) {
    throw new AppSumoOAuthError(`AppSumo license lookup failed (${licenseResponse.status}).`);
  }
  return {
    licenseKey: license.license_key,
    status: typeof license.status === "string" ? license.status : "",
  };
}
