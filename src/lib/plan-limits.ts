import type { WorkspaceBilling } from "@/lib/server/types";
import { isLocalMode } from "./runtime-mode.ts";

export type PlanId = WorkspaceBilling["plan"];

export type PlanLimits = {
  linkedInAccounts: number;
  agents: number;
  campaigns: number;
  dailyDiscoveredLeads: number;
};

const unlimitedLimits: PlanLimits = {
  linkedInAccounts: Number.POSITIVE_INFINITY,
  agents: Number.POSITIVE_INFINITY,
  campaigns: Number.POSITIVE_INFINITY,
  dailyDiscoveredLeads: Number.POSITIVE_INFINITY,
};

/**
 * Commercial plan ceilings used for marketing and enforcement.
 * Does not apply self-hosted/local overrides. Call planLimits() at runtime.
 */
export function commercialPlanLimits(plan: PlanId | undefined): PlanLimits {
  // Enterprise workspaces receive the uncapped commercial limits advertised
  // on the sales-assisted plan.
  if (plan === "enterprise") {
    return {
      linkedInAccounts: Number.POSITIVE_INFINITY,
      agents: Number.POSITIVE_INFINITY,
      campaigns: Number.POSITIVE_INFINITY,
      dailyDiscoveredLeads: Number.POSITIVE_INFINITY,
    };
  }

  // Every purchasable plan now shares one ceiling: a single LinkedIn account
  // with everything else uncapped. Both purchasable options, and retired plan
  // ids held by existing subscribers, land here. This is also the fail-closed
  // default for an unknown plan.
  //
  // if (plan === "solo") {
  //   return {
  //     linkedInAccounts: 1,
  //     agents: 1,
  //     campaigns: 1,
  //     dailyDiscoveredLeads: 50,
  //   };
  // }
  return {
    linkedInAccounts: 1,
    agents: Number.POSITIVE_INFINITY,
    campaigns: Number.POSITIVE_INFINITY,
    dailyDiscoveredLeads: Number.POSITIVE_INFINITY,
  };
}

/** Runtime limits for the current environment (local mode is unlimited). */
export function planLimits(plan: PlanId | undefined): PlanLimits {
  if (isLocalMode()) return unlimitedLimits;
  return commercialPlanLimits(plan);
}

/**
 * API keys, MCP, and REST agent API. Included on every paid plan since the
 * Startup feature set moved down to the Pro tier; an unsubscribed workspace
 * (undefined plan) still gets nothing.
 */
export function planHasApiAccess(plan: PlanId | undefined) {
  if (isLocalMode()) return true;
  return (
    plan === "solo" || plan === "lifetime" || plan === "startup" || plan === "enterprise"
  );
}

export function formatPlanLimit(limit: number) {
  return Number.isFinite(limit) ? String(limit) : "unlimited";
}

/** Serializable limit for client components (Infinity is not JSON-safe). */
export function serializablePlanLimit(limit: number): number | null {
  return Number.isFinite(limit) ? limit : null;
}

function countLabel(count: number, singular: string, plural: string) {
  if (!Number.isFinite(count)) return `Unlimited ${plural}`;
  if (count === 1) return `1 ${singular}`;
  return `${count} ${plural}`;
}

function leadLabel(daily: number) {
  if (!Number.isFinite(daily)) return "Unlimited leads";
  return `${daily} leads per day`;
}

/**
 * Marketing feature lines derived from commercialPlanLimits so pricing cards
 * cannot drift from enforcement. Extra non-limit benefits are passed in by the
 * pricing catalog (support, SSO, managed campaigns, API, etc.).
 */
export function limitFeatureLines(plan: PlanId): string[] {
  const limits = commercialPlanLimits(plan);
  return [
    countLabel(limits.linkedInAccounts, "LinkedIn account", "LinkedIn accounts"),
    countLabel(limits.agents, "AI agent", "AI agents"),
    leadLabel(limits.dailyDiscoveredLeads),
    countLabel(limits.campaigns, "campaign", "campaigns"),
  ];
}

/**
 * The LinkedIn-account row on its own. Upgrade cards drop it when the count
 * matches the previous tier, but a card may still want to state it outright as
 * a listed benefit. Derived from commercialPlanLimits like every other line so
 * it cannot drift from enforcement.
 */
export function linkedInAccountFeatureLine(plan: PlanId): string {
  const limits = commercialPlanLimits(plan);
  return countLabel(limits.linkedInAccounts, "LinkedIn account", "LinkedIn accounts");
}

/**
 * Upgrade-card lines: only the limit rows that improve over the previous tier,
 * so "Includes everything in X and" stays accurate.
 */
export function limitUpgradeFeatureLines(plan: PlanId, previous: PlanId): string[] {
  const next = commercialPlanLimits(plan);
  const prev = commercialPlanLimits(previous);
  const lines: string[] = [];

  if (next.linkedInAccounts !== prev.linkedInAccounts) {
    lines.push(countLabel(next.linkedInAccounts, "LinkedIn account", "LinkedIn accounts"));
  }
  if (next.agents !== prev.agents) {
    lines.push(countLabel(next.agents, "AI agent", "AI agents"));
  }
  if (next.dailyDiscoveredLeads !== prev.dailyDiscoveredLeads) {
    lines.push(leadLabel(next.dailyDiscoveredLeads));
  }
  if (next.campaigns !== prev.campaigns) {
    lines.push(countLabel(next.campaigns, "campaign", "campaigns"));
  }

  return lines;
}
