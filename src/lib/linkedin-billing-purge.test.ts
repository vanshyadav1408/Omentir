import { describe, expect, test } from "bun:test";
import { shouldMarkBillingExpired, shouldPurgeLinkedInAccounts } from "./linkedin-billing-purge";

const now = Date.parse("2026-09-08T12:00:00.000Z");

describe("shouldPurgeLinkedInAccounts", () => {
  test("purges cancelled and expired plans so a lapsed seat does not keep a LinkedIn session that can still act for the customer", () => {
    expect(shouldPurgeLinkedInAccounts({ plan: "solo", status: "cancelled" }, now)).toBe(true);
    expect(shouldPurgeLinkedInAccounts({ plan: "solo", status: "expired" }, now)).toBe(true);
    expect(shouldPurgeLinkedInAccounts({ plan: "solo", status: "suspended" }, now)).toBe(true);
  });

  test("keeps the connection for 7 days after the plan ends so a resubscribe never forces a fresh LinkedIn sign-in", () => {
    const billing = { plan: "solo" as const, status: "cancelled" as const, currentPeriodEnd: "2026-09-05T00:00:00.000Z" };
    expect(shouldPurgeLinkedInAccounts(billing, Date.parse("2026-09-11T00:00:00.000Z"))).toBe(false);
    expect(shouldPurgeLinkedInAccounts(billing, Date.parse("2026-09-12T00:00:00.000Z"))).toBe(true);
  });

  test("a cancelled plan that is still paid up is not cut before its period ends", () => {
    const billing = { plan: "solo" as const, status: "cancelled" as const, currentPeriodEnd: "2026-10-01T00:00:00.000Z" };
    expect(shouldPurgeLinkedInAccounts(billing, now)).toBe(false);
  });

  test("without a period end, the 7 days run from when billing last changed", () => {
    const billing = { plan: "solo" as const, status: "expired" as const, updatedAt: "2026-09-05T00:00:00.000Z" };
    expect(shouldPurgeLinkedInAccounts(billing, Date.parse("2026-09-10T00:00:00.000Z"))).toBe(false);
    expect(shouldPurgeLinkedInAccounts(billing, Date.parse("2026-09-13T00:00:00.000Z"))).toBe(true);
  });

  test("purges an active plan whose period ended over a week ago when the Whop webhook never arrived", () => {
    expect(
      shouldPurgeLinkedInAccounts(
        { plan: "solo", status: "active", currentPeriodEnd: "2026-09-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(true);
    expect(
      shouldPurgeLinkedInAccounts(
        { plan: "solo", status: "active", currentPeriodEnd: "2026-09-05T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });

  test("leaves paying, lifetime, and bypassed workspaces connected", () => {
    expect(
      shouldPurgeLinkedInAccounts(
        { plan: "solo", status: "active", currentPeriodEnd: "2026-10-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
    expect(shouldPurgeLinkedInAccounts({ plan: "lifetime", status: "cancelled" }, now)).toBe(false);
    expect(shouldPurgeLinkedInAccounts({ plan: "solo", status: "bypassed" }, now)).toBe(false);
    expect(shouldPurgeLinkedInAccounts(undefined, now)).toBe(false);
  });
});

describe("shouldMarkBillingExpired", () => {
  test("marks an active plan expired only after currentPeriodEnd so we do not cut a paid week short", () => {
    expect(
      shouldMarkBillingExpired(
        { plan: "solo", status: "active", currentPeriodEnd: "2026-09-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(true);
    expect(
      shouldMarkBillingExpired(
        { plan: "solo", status: "active", currentPeriodEnd: "2026-10-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
    expect(shouldMarkBillingExpired({ plan: "solo", status: "cancelled" }, now)).toBe(false);
  });
});
