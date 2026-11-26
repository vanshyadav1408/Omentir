import type { WorkspaceBilling } from "@/lib/server/types";

// The AppSumo lifetime deal. AppSumo sends the tier as an integer on every
// license webhook. The limits here are what the listing sells for each tier,
// so a change in this table has to be matched on the AppSumo listing.
export type AppSumoTier = 1 | 2 | 3;

// Where a buyer manages the license: upgrade, downgrade, refund.
export const APPSUMO_PRODUCTS_URL = "https://appsumo.com/account/products/";

export type AppSumoTierLimits = {
  linkedInAccounts: number;
  // One workspace per included LinkedIn account. Each workspace runs its own
  // daily lead discovery, so a one-time price cannot cover an open number.
  workspaces: number;
};

const TIER_LIMITS: Record<AppSumoTier, AppSumoTierLimits> = {
  1: { linkedInAccounts: 1, workspaces: 1 },
  2: { linkedInAccounts: 3, workspaces: 3 },
  3: { linkedInAccounts: 10, workspaces: 10 },
};

export function isAppSumoTier(tier: unknown): tier is AppSumoTier {
  return tier === 1 || tier === 2 || tier === 3;
}

/** A tier this code does not know lands on tier 1, the least anyone can have bought. */
export function normalizeAppSumoTier(tier: unknown): AppSumoTier {
  const value = Number(tier);
  return isAppSumoTier(value) ? value : 1;
}

export function appSumoTierLimits(tier: unknown): AppSumoTierLimits {
  return TIER_LIMITS[normalizeAppSumoTier(tier)];
}

/** The tier this billing grants, or undefined when it is not an AppSumo license. */
export function appSumoTierOf(
  billing: Pick<WorkspaceBilling, "provider" | "plan" | "appsumoTier"> | undefined,
): AppSumoTier | undefined {
  if (billing?.provider !== "appsumo" || billing.plan !== "lifetime") return undefined;
  return normalizeAppSumoTier(billing.appsumoTier);
}
