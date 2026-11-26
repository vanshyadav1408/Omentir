import { describe, expect, test } from "bun:test";
import { appSumoTierLimits, appSumoTierOf, normalizeAppSumoTier } from "./appsumo-tiers";
import { billedLinkedInAccountLimit } from "./plan-limits";

describe("AppSumo tiers", () => {
  test("each tier grants what the listing sells: 1, 3 and 10 LinkedIn accounts", () => {
    expect(appSumoTierLimits(1).linkedInAccounts).toBe(1);
    expect(appSumoTierLimits(2).linkedInAccounts).toBe(3);
    expect(appSumoTierLimits(3).linkedInAccounts).toBe(10);
  });

  test("workspaces are capped at one per included account, because each one runs its own daily lead discovery on a price paid once", () => {
    expect(appSumoTierLimits(1).workspaces).toBe(1);
    expect(appSumoTierLimits(2).workspaces).toBe(3);
    expect(appSumoTierLimits(3).workspaces).toBe(10);
  });

  test("a tier this code does not know gets tier 1, never more than was provably bought", () => {
    expect(normalizeAppSumoTier(4)).toBe(1);
    expect(normalizeAppSumoTier(0)).toBe(1);
    expect(normalizeAppSumoTier(undefined)).toBe(1);
    expect(normalizeAppSumoTier("3")).toBe(3);
  });
});

describe("appSumoTierOf", () => {
  test("reads the tier from an AppSumo license", () => {
    expect(appSumoTierOf({ provider: "appsumo", plan: "lifetime", appsumoTier: 2 })).toBe(2);
  });

  test("ignores tier fields left on billing by an earlier license, so a later Whop plan does not inherit ten accounts", () => {
    expect(appSumoTierOf({ provider: "whop", plan: "solo", appsumoTier: 3 })).toBeUndefined();
    expect(appSumoTierOf({ provider: "whop", plan: "lifetime", appsumoTier: 3 })).toBeUndefined();
    expect(appSumoTierOf(undefined)).toBeUndefined();
  });
});

describe("billedLinkedInAccountLimit with an AppSumo tier", () => {
  test("the tier's accounts replace the plan's single included account", () => {
    expect(billedLinkedInAccountLimit("lifetime", 0, 2)).toBe(3);
    expect(billedLinkedInAccountLimit("lifetime", 0, 3)).toBe(10);
  });

  test("paid extra seats still stack on top, so a license holder can buy more accounts monthly", () => {
    expect(billedLinkedInAccountLimit("lifetime", 2, 2)).toBe(5);
  });

  test("the retired Whop lifetime plan keeps its one account", () => {
    expect(billedLinkedInAccountLimit("lifetime", 0)).toBe(1);
  });
});
