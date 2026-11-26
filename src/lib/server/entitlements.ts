import "server-only";

import { appSumoTierLimits, appSumoTierOf } from "@/lib/appsumo-tiers";
import { isLocalMode } from "@/lib/runtime-mode";
import { billedLinkedInAccountLimit, planLimits, type PlanLimits } from "@/lib/plan-limits";
import type { Workspace } from "./types";

export type Entitlements = {
  planId: "self-hosted" | NonNullable<Workspace["billing"]>["plan"] | "solo";
  subscriptionActive: boolean;
  billingManaged: boolean;
  limits: PlanLimits;
};

const unlimited: PlanLimits = {
  linkedInAccounts: Number.POSITIVE_INFINITY,
  agents: Number.POSITIVE_INFINITY,
  campaigns: Number.POSITIVE_INFINITY,
  dailyDiscoveredLeads: Number.POSITIVE_INFINITY,
  workspaces: Number.POSITIVE_INFINITY,
};

export function entitlementsFor(workspace: Pick<Workspace, "billing">): Entitlements {
  if (isLocalMode()) {
    return {
      planId: "self-hosted",
      subscriptionActive: true,
      billingManaged: false,
      limits: unlimited,
    };
  }
  const active = workspace.billing?.status === "active" || workspace.billing?.status === "bypassed";
  const plan = workspace.billing?.plan || "solo";
  const limits = planLimits(plan);
  // An AppSumo license is the lifetime plan with its tier's account and
  // workspace counts in place of the plan's own.
  const appSumoTier = appSumoTierOf(workspace.billing);
  return {
    planId: plan,
    subscriptionActive: active,
    billingManaged: true,
    limits: {
      ...limits,
      workspaces: appSumoTier ? appSumoTierLimits(appSumoTier).workspaces : limits.workspaces,
      linkedInAccounts: billedLinkedInAccountLimit(
        plan,
        workspace.billing?.extraLinkedInSeats,
        appSumoTier,
      ),
    },
  };
}
