import "server-only";

import { currentUser } from "./auth";
import { logAutomationRun, updateWorkspaceBilling, updateWorkspaceLinkedInSeats } from "./data";
import { hasActiveSubscription } from "./subscription";
import { findActiveLinkedInSeatMembershipByEmail, findActiveWhopMembershipByEmail } from "./whop";
import { extraLinkedInSeatsCount } from "@/lib/linkedin-seat-pricing";
import { shouldRecoverLinkedInSeatsFromWhop } from "@/lib/linkedin-seat-visibility";
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

function emailsForWorkspace(workspace: Workspace, user: Awaited<ReturnType<typeof currentUser>>) {
  return uniqueEmails([
    user?.primaryEmailAddress?.emailAddress,
    ...(user?.emailAddresses.map((item) => item.emailAddress) ?? []),
    workspace.notificationEmail,
    workspace.billing?.payerEmail,
  ]);
}

/** If Firestore still says unpaid, copy an active Whop membership onto the workspace. */
export async function syncWorkspaceBillingIfInactive(workspace: Workspace): Promise<Workspace> {
  if (isLocalMode() || hasActiveSubscription(workspace)) return workspace;

  const user = await currentUser();
  for (const email of emailsForWorkspace(workspace, user)) {
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

/** Copy a paid Extra Seats membership onto the workspace when the webhook never stored it. */
export async function syncWorkspaceLinkedInSeatsFromWhop(workspace: Workspace): Promise<Workspace> {
  if (
    !shouldRecoverLinkedInSeatsFromWhop({
      localMode: isLocalMode(),
      subscriptionActive: hasActiveSubscription(workspace),
      plan: workspace.billing?.plan,
    })
  ) {
    return workspace;
  }

  const user = await currentUser();
  for (const email of emailsForWorkspace(workspace, user)) {
    try {
      const seats = await findActiveLinkedInSeatMembershipByEmail(email);
      if (!seats) continue;
      const current = extraLinkedInSeatsCount(workspace.billing?.extraLinkedInSeats);
      if (current === seats.extraSeats && workspace.billing?.seatMembershipId === seats.membershipId) {
        return workspace;
      }
      const billing = await updateWorkspaceLinkedInSeats(workspace.id, {
        extraLinkedInSeats: seats.extraSeats,
        seatMembershipId: seats.membershipId,
      });
      await logAutomationRun({
        workspaceId: workspace.id,
        kind: "webhook",
        status: "completed",
        message: `Set ${seats.extraSeats} extra LinkedIn seat${seats.extraSeats === 1 ? "" : "s"} from Whop membership check ${seats.membershipId}.`,
      });
      return { ...workspace, billing };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Whop extra-seat membership check failed.";
      console.error("[billing sync] Whop extra-seat membership check failed:", message);
    }
  }

  return workspace;
}
