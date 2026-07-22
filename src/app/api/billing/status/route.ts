import { auth, currentUser } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import {
  getLinkedInAccount,
  getWorkspace,
  logAutomationRun,
  updateWorkspaceBilling,
} from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { findActiveWhopMembershipByEmail } from "@/lib/server/whop";
import { isLocalMode } from "@/lib/runtime-mode";

export const dynamic = "force-dynamic";

function normalizeEmail(email?: string | null) {
  const normalized = email?.trim().toLowerCase();
  return normalized || null;
}

function uniqueEmails(emails: Array<string | null | undefined>) {
  return Array.from(
    new Set(emails.map(normalizeEmail).filter((email): email is string => Boolean(email))),
  );
}

export async function GET() {
  if (isLocalMode()) return new NextResponse(null, { status: 404 });
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ active: false }, { status: 401 });
  }

  let workspace = await getWorkspace(userId);
  let active = hasActiveSubscription(workspace);

  if (!active) {
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
        if (membership) {
          const billing = await updateWorkspaceBilling(workspace.id, {
            provider: "whop",
            plan: membership.plan,
            status: "active",
            payerEmail: membership.payerEmail,
            currentPeriodEnd: membership.currentPeriodEnd,
          });
          workspace = { ...workspace, billing };
          active = true;

          await logAutomationRun({
            workspaceId: workspace.id,
            kind: "webhook",
            status: "completed",
            message: `Activated workspace from Whop membership check ${membership.membershipId}.`,
          });
          break;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Whop membership check failed.";
        console.error("[billing status] Whop membership check failed:", message);
      }
    }
  }

  const linkedInAccount = active ? await getLinkedInAccount(workspace.id) : null;

  return NextResponse.json({
    active,
    status: workspace.billing?.status ?? null,
    nextPath: active ? (linkedInAccount ? "/dashboard" : "/onboarding") : null,
  });
}
