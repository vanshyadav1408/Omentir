import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { hashAppSumoClaimToken, type AppSumoLicense, type AppSumoWebhook } from "@/lib/appsumo-license";
import type { WorkspaceBilling } from "./types";

// What a license does to an Omentir account: redeeming grants the tier, a
// refund ends access, an upgrade or downgrade changes the tier without ever
// dropping access. Firestore and billing are in-memory stand-ins.

mock.module("server-only", () => ({}));

const licenses = new Map<string, Record<string, unknown>>();
const billingByOwner = new Map<string, WorkspaceBilling>();
const billingWrites: Array<{ ownerId: string; billing: Partial<WorkspaceBilling> }> = [];
const cancelledSeatMemberships: Array<string | undefined> = [];
const mailingListPlans: Array<[string, string]> = [];
const capEnforcedFor: string[] = [];
let failNextBillingWrite = false;

function isDeleteSentinel(value: unknown) {
  return typeof (value as { isEqual?: unknown } | null)?.isEqual === "function";
}

function licenseRef(id: string) {
  return {
    id,
    get: async () => ({ exists: licenses.has(id), data: () => licenses.get(id) }),
    set: async (data: Record<string, unknown>) => {
      licenses.set(id, { ...data });
    },
    update: async (patch: Record<string, unknown>) => {
      const next = { ...(licenses.get(id) || {}) };
      for (const [key, value] of Object.entries(patch)) {
        if (isDeleteSentinel(value)) delete next[key];
        else next[key] = value;
      }
      licenses.set(id, next);
    },
  };
}

type Ref = ReturnType<typeof licenseRef>;

mock.module("./firebase", () => ({
  nowIso: () => "2026-11-21T12:00:00.000Z",
  getDb: () => ({
    collection: () => ({ doc: (id: string) => licenseRef(id) }),
    runTransaction: async <T>(
      run: (transaction: {
        get: (ref: Ref) => ReturnType<Ref["get"]>;
        set: (ref: Ref, data: Record<string, unknown>) => void;
      }) => Promise<T>,
    ) =>
      run({
        get: (ref) => ref.get(),
        set: (ref, data) => {
          licenses.set(ref.id, { ...data });
        },
      }),
  }),
}));
mock.module("./data", () => ({
  findWorkspace: async (id: string) =>
    billingByOwner.has(id) ? { id, ownerId: id, billing: billingByOwner.get(id) } : { id, ownerId: id },
  logAutomationRun: async () => undefined,
  // Firestore merges billing writes: fields left out keep their old value.
  updateWorkspaceBilling: async (ownerId: string, billing: Partial<WorkspaceBilling>) => {
    if (failNextBillingWrite) {
      failNextBillingWrite = false;
      throw new Error("Firestore unavailable");
    }
    billingWrites.push({ ownerId, billing });
    const defined = Object.fromEntries(Object.entries(billing).filter(([, value]) => value !== undefined));
    const next = { ...billingByOwner.get(ownerId), ...defined, updatedAt: "now" } as WorkspaceBilling;
    billingByOwner.set(ownerId, next);
    return next;
  },
}));
mock.module("./linkedin-accounts", () => ({
  enforceLinkedInAccountCap: async (ownerId: string) => {
    capEnforcedFor.push(ownerId);
    return { kept: 0, removed: 0 };
  },
}));
mock.module("./mailing-list", () => ({
  syncMailingListPlan: async (ownerId: string, plan: string) => {
    mailingListPlans.push([ownerId, plan]);
  },
}));
mock.module("./runtime-config", () => ({ getAppBaseUrl: () => "https://omentir.test" }));
mock.module("./whop", () => ({
  cancelWhopSeatMembership: async (id?: string) => {
    cancelledSeatMemberships.push(id);
  },
}));

const { attachAppSumoLicense, handleAppSumoWebhook, pendingAppSumoLicense } = await import("./appsumo");

const KEY = "3794577c-3dbc-11ec-9bbc-0242ac130002";
const NEW_KEY = "11111111-2222-3333-4444-555555555555";
const TOKEN = "ab".repeat(32);
const COOKIE = `${KEY}.${TOKEN}`;

function seedLicense(patch: Partial<AppSumoLicense> = {}) {
  const license: AppSumoLicense = {
    licenseKey: KEY,
    status: "active",
    tier: 2,
    lastEvent: "activate",
    createdAt: "2026-11-21T11:00:00.000Z",
    updatedAt: "2026-11-21T11:00:00.000Z",
    ...patch,
  };
  licenses.set(license.licenseKey, { ...license });
  return license;
}

function seedClaim(patch: Partial<AppSumoLicense> = {}) {
  return seedLicense({
    claimHash: hashAppSumoClaimToken(TOKEN),
    claimExpiresAt: "2099-01-01T00:00:00.000Z",
    ...patch,
  });
}

function event(patch: Partial<AppSumoWebhook>): AppSumoWebhook {
  return { event: "activate", licenseKey: KEY, tier: 2, test: false, ...patch };
}

beforeEach(() => {
  licenses.clear();
  billingByOwner.clear();
  billingWrites.length = 0;
  cancelledSeatMemberships.length = 0;
  mailingListPlans.length = 0;
  capEnforcedFor.length = 0;
  failNextBillingWrite = false;
});

afterAll(() => {
  mock.restore();
});

describe("redeeming a license", () => {
  test("the buyer's account gets lifetime access on the tier they bought", async () => {
    seedClaim({ tier: 2 });
    const result = await attachAppSumoLicense({ cookieValue: COOKIE, userId: "user-1", email: "Sam@Example.com" });

    expect(result.ok).toBe(true);
    expect(billingByOwner.get("user-1")).toMatchObject({
      provider: "appsumo",
      plan: "lifetime",
      status: "active",
      appsumoLicenseKey: KEY,
      appsumoTier: 2,
      payerEmail: "sam@example.com",
    });
    expect(licenses.get(KEY)).toMatchObject({ ownerId: "user-1", status: "active" });
    // The claim is spent: the same cookie cannot be replayed.
    expect(licenses.get(KEY)?.claimHash).toBeUndefined();
    expect(await pendingAppSumoLicense(COOKIE)).toBeNull();
  });

  test("a license cannot be attached to a second account", async () => {
    seedClaim({ ownerId: "user-1" });
    const result = await attachAppSumoLicense({ cookieValue: COOKIE, userId: "user-2" });
    expect(result).toEqual({ ok: false, reason: "claimed" });
    expect(billingByOwner.has("user-2")).toBe(false);
  });

  test("a refunded license grants nothing", async () => {
    seedClaim({ status: "deactivated" });
    expect(await attachAppSumoLicense({ cookieValue: COOKIE, userId: "user-1" })).toEqual({
      ok: false,
      reason: "refunded",
    });
    expect(billingWrites).toHaveLength(0);
  });

  test("an expired or made-up claim grants nothing", async () => {
    seedClaim({ claimExpiresAt: "2020-01-01T00:00:00.000Z" });
    expect(await attachAppSumoLicense({ cookieValue: COOKIE, userId: "user-1" })).toEqual({
      ok: false,
      reason: "expired",
    });
    expect(await attachAppSumoLicense({ cookieValue: `${KEY}.${"cd".repeat(32)}`, userId: "user-1" })).toEqual({
      ok: false,
      reason: "expired",
    });
    expect(await attachAppSumoLicense({ cookieValue: undefined, userId: "user-1" })).toEqual({
      ok: false,
      reason: "expired",
    });
    expect(billingWrites).toHaveLength(0);
  });

  test("an account already on a live license cannot stack a second one: tiers change by upgrading on AppSumo", async () => {
    seedLicense({ licenseKey: NEW_KEY, ownerId: "user-1", tier: 1 });
    billingByOwner.set("user-1", {
      provider: "appsumo",
      plan: "lifetime",
      status: "active",
      appsumoLicenseKey: NEW_KEY,
      appsumoTier: 1,
      updatedAt: "now",
    });
    seedClaim({ tier: 3 });

    expect(await attachAppSumoLicense({ cookieValue: COOKIE, userId: "user-1" })).toEqual({
      ok: false,
      reason: "has_license",
    });
    expect(billingByOwner.get("user-1")?.appsumoTier).toBe(1);
    expect(licenses.get(KEY)?.ownerId).toBeUndefined();
  });

  test("if writing billing fails, pressing the button again finishes the job without going back to AppSumo", async () => {
    seedClaim();
    failNextBillingWrite = true;
    await expect(attachAppSumoLicense({ cookieValue: COOKIE, userId: "user-1" })).rejects.toThrow();
    expect(billingByOwner.has("user-1")).toBe(false);

    const retry = await attachAppSumoLicense({ cookieValue: COOKIE, userId: "user-1" });
    expect(retry.ok).toBe(true);
    expect(billingByOwner.get("user-1")).toMatchObject({ status: "active", appsumoLicenseKey: KEY });
  });
});

describe("license webhooks for an attached account", () => {
  function attached(tier = 2, extra: Partial<WorkspaceBilling> = {}) {
    seedLicense({ ownerId: "user-1", tier });
    billingByOwner.set("user-1", {
      provider: "appsumo",
      plan: "lifetime",
      status: "active",
      appsumoLicenseKey: KEY,
      appsumoTier: tier,
      updatedAt: "now",
      ...extra,
    });
  }

  test("a refund ends access and stops the extra seats being billed for an account that can no longer use them", async () => {
    attached(2, { extraLinkedInSeats: 2, seatMembershipId: "mem_seats" });
    await handleAppSumoWebhook(event({ event: "deactivate" }));

    expect(billingByOwner.get("user-1")).toMatchObject({
      provider: "appsumo",
      status: "cancelled",
      extraLinkedInSeats: 0,
    });
    expect(cancelledSeatMemberships).toEqual(["mem_seats"]);
    expect(mailingListPlans).toEqual([["user-1", "none"]]);
  });

  test("an upgrade raises the tier and the old key's deactivation that follows leaves the account active", async () => {
    attached(1);
    await handleAppSumoWebhook(event({ event: "upgrade", licenseKey: NEW_KEY, prevLicenseKey: KEY, tier: 3 }));
    expect(billingByOwner.get("user-1")).toMatchObject({
      status: "active",
      appsumoLicenseKey: NEW_KEY,
      appsumoTier: 3,
    });

    await handleAppSumoWebhook(event({ event: "deactivate", licenseKey: KEY, tier: 1 }));
    expect(billingByOwner.get("user-1")).toMatchObject({
      status: "active",
      appsumoLicenseKey: NEW_KEY,
      appsumoTier: 3,
    });
    expect(licenses.get(KEY)).toMatchObject({ status: "deactivated", replacedBy: NEW_KEY });
  });

  test("a downgrade lowers the tier and disconnects LinkedIn accounts beyond it", async () => {
    attached(3);
    await handleAppSumoWebhook(event({ event: "downgrade", licenseKey: NEW_KEY, prevLicenseKey: KEY, tier: 1 }));
    expect(billingByOwner.get("user-1")).toMatchObject({ status: "active", appsumoTier: 1 });
    expect(capEnforcedFor).toEqual(["user-1"]);
  });

  test("a webhook AppSumo repeats for a license that is already in place writes nothing", async () => {
    attached(2);
    await handleAppSumoWebhook(event({ event: "activate" }));
    await handleAppSumoWebhook(event({ event: "activate" }));
    expect(billingWrites).toHaveLength(0);
  });

  test("a refund of a license the account has moved off does not touch its current plan", async () => {
    // The account later subscribed through Whop; billing merges, so the old
    // license key is still on record but the provider is no longer AppSumo.
    seedLicense({ ownerId: "user-1" });
    billingByOwner.set("user-1", {
      provider: "whop",
      plan: "solo",
      status: "active",
      appsumoLicenseKey: KEY,
      appsumoTier: 2,
      updatedAt: "now",
    });
    await handleAppSumoWebhook(event({ event: "deactivate" }));
    expect(billingByOwner.get("user-1")).toMatchObject({ provider: "whop", plan: "solo", status: "active" });
    expect(billingWrites).toHaveLength(0);
  });

  test("a purchase nobody has redeemed yet is stored and grants no one anything", async () => {
    await handleAppSumoWebhook(event({ event: "purchase", tier: 3 }));
    expect(licenses.get(KEY)).toMatchObject({ status: "inactive", tier: 3 });
    expect(billingWrites).toHaveLength(0);
  });
});
