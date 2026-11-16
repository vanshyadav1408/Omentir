import type { WorkspaceBilling } from "@/lib/server/types";

// When Omentir access ends, delete the workspace's stored LinkedIn sessions,
// not just mark the accounts disconnected, so nothing keeps acting on the
// customer's LinkedIn after they stopped paying. The deletion waits 7 days
// after the plan ends: a customer who resubscribes inside that week keeps
// their connection and never has to sign in to LinkedIn again.

const INACTIVE_BILLING = new Set(["cancelled", "expired", "suspended"]);

export const LAPSED_PLAN_DISCONNECT_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

function periodEnded(currentPeriodEnd: string | undefined, now: number) {
  if (!currentPeriodEnd) return false;
  const end = Date.parse(currentPeriodEnd);
  return Number.isFinite(end) && end < now;
}

export function shouldMarkBillingExpired(
  billing: Pick<WorkspaceBilling, "plan" | "status" | "currentPeriodEnd"> | undefined,
  now = Date.now(),
) {
  if (!billing) return false;
  if (billing.plan === "lifetime") return false;
  if (billing.status !== "active") return false;
  return periodEnded(billing.currentPeriodEnd, now);
}

// When the plan ended. currentPeriodEnd is the moment the paid time runs
// out, so a plan cancelled early still counts as live until then. Records
// without a period end fall back to when billing last changed, which is
// when the inactive status was recorded.
type BillingDates = Pick<WorkspaceBilling, "currentPeriodEnd"> & Partial<Pick<WorkspaceBilling, "updatedAt">>;

function lapsedAt(billing: BillingDates) {
  const end = billing.currentPeriodEnd ? Date.parse(billing.currentPeriodEnd) : Number.NaN;
  if (Number.isFinite(end)) return end;
  const updated = billing.updatedAt ? Date.parse(billing.updatedAt) : Number.NaN;
  return Number.isFinite(updated) ? updated : null;
}

export function shouldPurgeLinkedInAccounts(
  billing: (Pick<WorkspaceBilling, "plan" | "status"> & BillingDates) | undefined,
  now = Date.now(),
) {
  if (!billing) return false;
  if (billing.plan === "lifetime") return false;
  if (billing.status === "bypassed") return false;
  if (!INACTIVE_BILLING.has(billing.status) && !shouldMarkBillingExpired(billing, now)) return false;
  const lapsed = lapsedAt(billing);
  // No dates to measure the grace week from. The plan is already inactive,
  // so keep the long-standing behaviour and disconnect now.
  if (lapsed === null) return true;
  return now >= lapsed + LAPSED_PLAN_DISCONNECT_GRACE_MS;
}
