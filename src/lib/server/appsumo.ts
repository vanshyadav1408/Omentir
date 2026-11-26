import "server-only";

import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { appSumoTierLimits, isAppSumoTier, normalizeAppSumoTier } from "@/lib/appsumo-tiers";
import {
  appSumoClaimMatches,
  applyAppSumoWebhook,
  hashAppSumoClaimToken,
  parseAppSumoClaim,
  type AppSumoLicense,
  type AppSumoWebhook,
} from "@/lib/appsumo-license";
import { findWorkspace, logAutomationRun, updateWorkspaceBilling } from "./data";
import { getDb, nowIso } from "./firebase";
import { enforceLinkedInAccountCap } from "./linkedin-accounts";
import { syncMailingListPlan } from "./mailing-list";
import { getAppBaseUrl } from "./runtime-config";
import { cancelWhopSeatMembership } from "./whop";

// AppSumo lifetime licenses. A buyer pays AppSumo once and gets a license key
// with a tier. Webhooks keep the key's state current in `appsumoLicenses`; the
// redeem flow attaches the key to an Omentir account; from then on the key's
// state decides that account's billing.

export const APPSUMO_REDEEM_PATH = "/appsumo/redeem";
export const APPSUMO_CLAIM_COOKIE = "omentir_appsumo_claim";
// Long enough to create an account and confirm an email, short enough that an
// abandoned redemption does not linger.
export const APPSUMO_CLAIM_MAX_AGE_SECONDS = 60 * 60;

export function appSumoConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    // Signs webhooks. Shown on the product page in the AppSumo Partner Portal.
    apiKey: env.APPSUMO_API_KEY?.trim() || undefined,
    // Issued by the Partner Portal once both URLs are saved there.
    clientId: env.APPSUMO_CLIENT_ID?.trim() || undefined,
    clientSecret: env.APPSUMO_CLIENT_SECRET?.trim() || undefined,
  };
}

/** The OAuth redirect URL to save in the Partner Portal. AppSumo compares it exactly. */
export function appSumoRedirectUri() {
  return `${getAppBaseUrl()}${APPSUMO_REDEEM_PATH}`;
}

function licenseRef(licenseKey: string) {
  return getDb().collection("appsumoLicenses").doc(licenseKey);
}

// Documents are written whole, so a field set to undefined is removed.
function stored(license: AppSumoLicense) {
  return Object.fromEntries(Object.entries(license).filter(([, value]) => value !== undefined));
}

function shortKey(licenseKey: string) {
  return licenseKey.slice(0, 8);
}

export async function getAppSumoLicense(licenseKey: string) {
  const snap = await licenseRef(licenseKey).get();
  return snap.exists ? (snap.data() as AppSumoLicense) : null;
}

/**
 * Make the owner's Omentir billing match the license. Safe to call any number
 * of times: it writes only when the two disagree.
 */
export async function syncAppSumoAccess(license: AppSumoLicense, source: string, email?: string) {
  const ownerId = license.ownerId;
  if (!ownerId) return;
  const billing = (await findWorkspace(ownerId))?.billing;
  const onThisLicense =
    billing?.provider === "appsumo" && billing.appsumoLicenseKey === license.licenseKey;

  if (license.status === "deactivated") {
    // A refund. Only the license the account is on right now can end its
    // access, so the old key that an upgrade leaves behind takes nothing away.
    if (!onThisLicense || billing?.status !== "active") return;
    await cancelWhopSeatMembership(billing.seatMembershipId);
    await updateWorkspaceBilling(ownerId, {
      provider: "appsumo",
      plan: "lifetime",
      status: "cancelled",
      payerEmail: billing.payerEmail,
      appsumoLicenseKey: license.licenseKey,
      appsumoTier: normalizeAppSumoTier(license.tier),
      extraLinkedInSeats: 0,
    });
    await syncMailingListPlan(ownerId, "none");
    // LinkedIn sessions are not deleted here. The billing purge removes them a
    // week after the license ended, the same grace a lapsed plan gets, so a
    // license AppSumo reactivates in that week needs no new LinkedIn sign-in.
    await logAutomationRun({
      workspaceId: ownerId,
      kind: "webhook",
      status: "completed",
      message: `AppSumo license ${shortKey(license.licenseKey)} was deactivated (${source}). Access ended.`,
    });
    return;
  }

  if (license.status !== "active") return;
  const tier = normalizeAppSumoTier(license.tier);
  if (
    onThisLicense &&
    billing?.status === "active" &&
    billing.plan === "lifetime" &&
    billing.appsumoTier === tier
  ) {
    return;
  }

  await updateWorkspaceBilling(ownerId, {
    provider: "appsumo",
    plan: "lifetime",
    status: "active",
    payerEmail: email?.trim().toLowerCase() || billing?.payerEmail,
    appsumoLicenseKey: license.licenseKey,
    appsumoTier: tier,
  });
  await syncMailingListPlan(ownerId, "lifetime");
  // A downgrade can leave more accounts connected than the new tier includes.
  const trimmed = await enforceLinkedInAccountCap(ownerId);
  const accounts = appSumoTierLimits(tier).linkedInAccounts;
  await logAutomationRun({
    workspaceId: ownerId,
    kind: "webhook",
    status: "completed",
    message: `AppSumo license ${shortKey(license.licenseKey)} active on Tier ${tier}, ${accounts} LinkedIn account${accounts === 1 ? "" : "s"} (${source}).${
      trimmed.removed
        ? ` Disconnected ${trimmed.removed} account${trimmed.removed === 1 ? "" : "s"} over the tier.`
        : ""
    }`,
  });
}

/** Store what one webhook says about a license, then bring its owner's access in line. */
export async function handleAppSumoWebhook(webhook: AppSumoWebhook) {
  const license = await getDb().runTransaction(async (transaction) => {
    const ref = licenseRef(webhook.licenseKey);
    const previousRef =
      webhook.prevLicenseKey && webhook.prevLicenseKey !== webhook.licenseKey
        ? licenseRef(webhook.prevLicenseKey)
        : null;
    const snap = await transaction.get(ref);
    const previousSnap = previousRef ? await transaction.get(previousRef) : null;
    const result = applyAppSumoWebhook({
      webhook,
      current: snap.exists ? (snap.data() as AppSumoLicense) : null,
      previous: previousSnap?.exists ? (previousSnap.data() as AppSumoLicense) : null,
      now: nowIso(),
    });
    if (!result) return null;
    transaction.set(ref, stored(result.license));
    if (result.previous && previousRef) transaction.set(previousRef, stored(result.previous));
    return result.license;
  });

  if (!license) {
    await logAutomationRun({
      kind: "webhook",
      status: "completed",
      message: `Ignored AppSumo ${webhook.event} for license ${shortKey(webhook.licenseKey)}: nothing to change.`,
    });
    return;
  }
  if (webhook.tier !== undefined && !isAppSumoTier(webhook.tier)) {
    // The listing sells a tier this code has no limits for. The buyer gets
    // tier 1 until appsumo-tiers.ts knows the new one.
    await logAutomationRun({
      workspaceId: license.ownerId,
      kind: "webhook",
      status: "error",
      message: `AppSumo license ${shortKey(license.licenseKey)} arrived with unknown tier ${webhook.tier}. Treated as Tier 1.`,
    });
  }
  await syncAppSumoAccess(license, webhook.event);
}

/** Start a redemption for a license nobody owns yet. Returns the value for the claim cookie. */
export async function startAppSumoClaim(licenseKey: string) {
  const token = randomBytes(32).toString("hex");
  await licenseRef(licenseKey).update({
    claimHash: hashAppSumoClaimToken(token),
    claimExpiresAt: new Date(Date.now() + APPSUMO_CLAIM_MAX_AGE_SECONDS * 1000).toISOString(),
    updatedAt: nowIso(),
  });
  return `${licenseKey}.${token}`;
}

/** The license this browser is in the middle of redeeming, or null. */
export async function pendingAppSumoLicense(cookieValue: string | undefined) {
  const claim = parseAppSumoClaim(cookieValue);
  if (!claim) return null;
  const license = await getAppSumoLicense(claim.licenseKey);
  if (!license || license.status === "deactivated") return null;
  return appSumoClaimMatches(license, claim.token) ? license : null;
}

export type AppSumoAttachFailure = "expired" | "refunded" | "claimed" | "has_license";

/** Attach the license this browser is redeeming to the signed-in account. */
export async function attachAppSumoLicense(input: {
  cookieValue: string | undefined;
  userId: string;
  email?: string;
}): Promise<{ ok: true; license: AppSumoLicense } | { ok: false; reason: AppSumoAttachFailure }> {
  const claim = parseAppSumoClaim(input.cookieValue);
  if (!claim) return { ok: false, reason: "expired" };

  // One live license per account. Tiers change by upgrading that license on
  // AppSumo, which swaps the key through the webhook, not by adding a second.
  const billing = (await findWorkspace(input.userId))?.billing;
  const heldKey =
    billing?.provider === "appsumo" && billing.status === "active"
      ? billing.appsumoLicenseKey
      : undefined;
  if (heldKey && heldKey !== claim.licenseKey) {
    const held = await getAppSumoLicense(heldKey);
    if (held && held.status !== "deactivated" && held.ownerId === input.userId) {
      return { ok: false, reason: "has_license" };
    }
  }

  const result = await getDb().runTransaction(async (transaction) => {
    const ref = licenseRef(claim.licenseKey);
    const snap = await transaction.get(ref);
    const license = snap.exists ? (snap.data() as AppSumoLicense) : null;
    if (!license || !appSumoClaimMatches(license, claim.token)) {
      return { ok: false as const, reason: "expired" as const };
    }
    if (license.status === "deactivated") return { ok: false as const, reason: "refunded" as const };
    if (license.ownerId && license.ownerId !== input.userId) {
      return { ok: false as const, reason: "claimed" as const };
    }
    // AppSumo only hands a key to the OAuth redirect once the buyer chose
    // Activate, so a redeemed license is active even if that webhook is late.
    const attached: AppSumoLicense = {
      ...license,
      status: "active",
      ownerId: input.userId,
      updatedAt: nowIso(),
    };
    transaction.set(ref, stored(attached));
    return { ok: true as const, license: attached };
  });
  if (!result.ok) return result;

  // The claim stays valid until billing is written, so a failure here can be
  // retried from the same page without going back to AppSumo.
  await syncAppSumoAccess(result.license, "redeemed", input.email);
  await licenseRef(claim.licenseKey).update({
    claimHash: FieldValue.delete(),
    claimExpiresAt: FieldValue.delete(),
  });
  return result;
}
