import type { WorkspaceBilling } from "@/lib/server/types";
import { isLocalMode } from "./runtime-mode.ts";

export type PlanLimits = {
  linkedInAccounts: number;
  agents: number;
  campaigns: number;
  dailyDiscoveredLeads: number;
};

export function planLimits(plan: WorkspaceBilling["plan"] | undefined): PlanLimits {
  if (isLocalMode()) {
    return {
      linkedInAccounts: Number.POSITIVE_INFINITY,
      agents: Number.POSITIVE_INFINITY,
      campaigns: Number.POSITIVE_INFINITY,
      dailyDiscoveredLeads: Number.POSITIVE_INFINITY,
    };
  }
  if (plan === "enterprise") {
    return {
      linkedInAccounts: Number.POSITIVE_INFINITY,
      agents: Number.POSITIVE_INFINITY,
      campaigns: Number.POSITIVE_INFINITY,
      dailyDiscoveredLeads: Number.POSITIVE_INFINITY,
    };
  }

  if (plan === "startup") {
    return {
      linkedInAccounts: 3,
      agents: 3,
      campaigns: Number.POSITIVE_INFINITY,
      dailyDiscoveredLeads: 75,
    };
  }

  return {
    linkedInAccounts: 1,
    agents: 1,
    campaigns: 1,
    dailyDiscoveredLeads: 50,
  };
}

export function formatPlanLimit(limit: number) {
  return Number.isFinite(limit) ? String(limit) : "unlimited";
}
