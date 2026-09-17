import "server-only";

import { currentUser } from "./auth";
import {
  logAutomationRun,
  ownerWorkspaceForBilling,
  updateWorkspaceBilling,
  updateWorkspaceLinkedInSeats,
} from "./data";
import { hasActiveSubscription } from "./subscription";
import {
  cancelWhopSeatMembership,
  findActiveLinkedInSeatMembership,
  findActiveWhopMembershipByEmail,
} from "./whop";
import {
  extraLinkedInSeatsCount,
  extraSeatBuyerEmails,
  overlayOwnerExtraLinkedInSeats,
} from "@/lib/linkedin-seat-pricing";
import { commercialPlanLimits } from "@/lib/plan-limits";
import { isLocalMode } from "@/lib/runtime-mode";
import { ownerBillingWorkspaceIds } from "@/lib/workspace-ownership";
import type { Workspace } from "./types";

function emailsForWorkspace(workspace: Workspace, user: Awaited<ReturnType<typeof currentUser>>) {
  return extraSeatBuyerEmails([
    user?.primaryEmailAddress?.emailAddress,
    ...(user?.emailAddresses?.map((item) => item.emailAddress) ?? []),
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

export async function syncHostedWorkspaceBilling(workspace: Workspace): Promise<Workspace> {
  const billed = await syncWorkspaceBillingIfInactive(workspace);
  return syncWorkspaceLinkedInSeatsFromWhop(billed);
}

/** Store Extra Seats on the original account so every owned workspace can use the LinkedIn cap. */
export async function syncWorkspaceLinkedInSeatsFromWhop(workspace: Workspace): Promise<Workspace> {
  if (isLocalMode() || !hasActiveSubscription(workspace)) return workspace;
  if (!Number.isFinite(commercialPlanLimits(workspace.billing?.plan).linkedInAccounts)) {
    return workspace;
  }

  const user = await currentUser();
  const ownerId = workspace.ownerId || user?.id || workspace.id;
  const owner = await ownerWorkspaceForBilling(workspace);
  const emails = extraSeatBuyerEmails([
    ...emailsForWorkspace(workspace, user),
    ...emailsForWorkspace(owner, user),
  ]);
  try {
    const seats = await findActiveLinkedInSeatMembership({
      emails,
      workspaceId: ownerId,
      workspaceIds: ownerBillingWorkspaceIds(ownerId, workspace.id),
    });
    const extraSeats = Math.max(
      seats?.extraSeats || 0,
      extraLinkedInSeatsCount(owner.billing?.extraLinkedInSeats),
      extraLinkedInSeatsCount(workspace.billing?.extraLinkedInSeats),
    );
    const membershipId =
      seats?.membershipId || owner.billing?.seatMembershipId || workspace.billing?.seatMembershipId;
    if (!extraSeats && !seats) return overlayOwnerExtraLinkedInSeats(workspace, owner);

    const monthlyUsd = seats?.monthlyUsd;
    const current = extraLinkedInSeatsCount(owner.billing?.extraLinkedInSeats);
    const sameMembership = owner.billing?.seatMembershipId === membershipId;
    const samePrice = owner.billing?.extraSeatMonthlyUsd === monthlyUsd;
    if (
      current === extraSeats &&
      sameMembership &&
      samePrice &&
      typeof monthlyUsd === "number" &&
      !(seats?.duplicateMembershipIds.length)
    ) {
      return overlayOwnerExtraLinkedInSeats(workspace, owner);
    }
    const billing = await updateWorkspaceLinkedInSeats(
      workspace.id,
      {
        extraLinkedInSeats: extraSeats,
        seatMembershipId: membershipId,
        extraSeatMonthlyUsd: monthlyUsd,
      },
      { ownerId },
    );
    const previousSeatMembershipId = owner.billing?.seatMembershipId;
    const staleIds = new Set(seats?.duplicateMembershipIds || []);
    if (previousSeatMembershipId && membershipId && previousSeatMembershipId !== membershipId) {
      staleIds.add(previousSeatMembershipId);
    }
    await Promise.all([...staleIds].map((id) => cancelWhopSeatMembership(id)));
    if (seats) {
      await logAutomationRun({
        workspaceId: ownerId,
        kind: "webhook",
        status: "completed",
        message: `Set ${seats.extraSeats} extra LinkedIn seat${seats.extraSeats === 1 ? "" : "s"} from Whop membership check ${seats.membershipId}.`,
      });
    }
    const billedOwner = { ...owner, billing };
    return overlayOwnerExtraLinkedInSeats(
      ownerId === workspace.id ? billedOwner : { ...workspace, billing },
      billedOwner,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Whop extra-seat membership check failed.";
    console.error("[billing sync] Whop extra-seat membership check failed:", message);
    return overlayOwnerExtraLinkedInSeats(workspace, owner);
  }
}
