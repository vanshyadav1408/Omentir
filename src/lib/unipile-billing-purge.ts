import type { WorkspaceBilling } from "@/lib/server/types";

// Unipile bills per connected LinkedIn account. When Omentir access ends we
// have to delete those accounts on Unipile, not just mark them disconnected
// locally, or we keep paying after the customer stopped paying us.

const INACTIVE_BILLING = new Set(["cancelled", "expired", "suspended"]);

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

export function shouldPurgeUnipileAccounts(
  billing: Pick<WorkspaceBilling, "plan" | "status" | "currentPeriodEnd"> | undefined,
  now = Date.now(),
) {
  if (!billing) return false;
  if (billing.plan === "lifetime") return false;
  if (billing.status === "bypassed") return false;
  if (INACTIVE_BILLING.has(billing.status)) return true;
  return shouldMarkBillingExpired(billing, now);
}
