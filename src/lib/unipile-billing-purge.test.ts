import { describe, expect, test } from "bun:test";
import { shouldMarkBillingExpired, shouldPurgeUnipileAccounts } from "./unipile-billing-purge";

const now = Date.parse("2026-09-08T12:00:00.000Z");

describe("shouldPurgeUnipileAccounts", () => {
  test("purges cancelled and expired plans so a lapsed seat does not keep a Unipile account we still pay for", () => {
    expect(shouldPurgeUnipileAccounts({ plan: "solo", status: "cancelled" }, now)).toBe(true);
    expect(shouldPurgeUnipileAccounts({ plan: "solo", status: "expired" }, now)).toBe(true);
    expect(shouldPurgeUnipileAccounts({ plan: "solo", status: "suspended" }, now)).toBe(true);
  });

  test("purges an active plan whose period already ended when the Whop webhook never arrived", () => {
    expect(
      shouldPurgeUnipileAccounts(
        { plan: "solo", status: "active", currentPeriodEnd: "2026-09-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(true);
  });

  test("leaves paying, lifetime, and bypassed workspaces connected", () => {
    expect(
      shouldPurgeUnipileAccounts(
        { plan: "solo", status: "active", currentPeriodEnd: "2026-10-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
    expect(shouldPurgeUnipileAccounts({ plan: "lifetime", status: "cancelled" }, now)).toBe(false);
    expect(shouldPurgeUnipileAccounts({ plan: "solo", status: "bypassed" }, now)).toBe(false);
    expect(shouldPurgeUnipileAccounts(undefined, now)).toBe(false);
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
