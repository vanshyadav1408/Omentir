import "server-only";

import { currentUser } from "./auth";
import { logAutomationRun, updateWorkspaceBilling } from "./data";
import { hasActiveSubscription } from "./subscription";
import { findActiveWhopMembershipByEmail } from "./whop";
import { isLocalMode } from "@/lib/runtime-mode";
import type { Workspace } from "./types";

function normalizeEmail(email?: string | null) {
  const normalized = email?.trim().toLowerCase();
  return normalized || null;
}

function uniqueEmails(emails: Array<string | null | undefined>) {
  return Array.from(
    new Set(emails.map(normalizeEmail).filter((email): email is string => Boolean(email))),
  );
}

/** If Firestore still says unpaid, copy an active Whop membership onto the workspace. */
export async function syncWorkspaceBillingIfInactive(workspace: Workspace): Promise<Workspace> {
  if (isLocalMode() || hasActiveSubscription(workspace)) return workspace;

  const user = await currentUser();
  const emails = uniqueEmails([
    user?.primaryEmailAddress?.emailAddress,
    ...(user?.emailAddresses.map((item) => item.emailAddress) ?? []),
    workspace.notificationEmail,
    workspace.billing?.payerEmail,
  ]);

  for (const email of emails) {
    try {
      const membership = await findActiveWhopMembershipByEmail(email);
      if (!membership) continue;
      const billing = await updateWorkspaceBilling(workspace.id, {
        provider: "whop",
        plan: membership.plan,
        status: "active",
        payerEmail: membership.payerEmail,
        currentPeriodEnd: membership.currentPeriodEnd,
      });
      await logAutomationRun({
        workspaceId: workspace.id,
        kind: "webhook",
        status: "completed",
        message: `Activated workspace from Whop membership check ${membership.membershipId}.`,
      });
      return { ...workspace, billing };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Whop membership check failed.";
      console.error("[billing sync] Whop membership check failed:", message);
    }
  }

  return workspace;
}
