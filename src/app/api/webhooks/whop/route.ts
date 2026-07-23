import { clerkClient } from "@clerk/nextjs/server";
import { isLocalMode } from "@/lib/runtime-mode";
import { NextResponse, type NextRequest } from "next/server";
import { logAutomationRun, updateWorkspaceBilling } from "@/lib/server/data";
import { syncMailingListPlan } from "@/lib/server/mailing-list";
import { readTextBody, RequestBodyTooLargeError } from "@/lib/server/request-body";
import {
  getConfiguredWhopPlanIds,
  getWhopClient,
  planFromWhopPayload,
  type BillingPlan,
} from "@/lib/server/whop";

export const dynamic = "force-dynamic";

function unixToIso(value?: string | null) {
  if (!value) return undefined;
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Date(timestamp * 1000).toISOString();
}

function metadataString(metadata: { [key: string]: unknown } | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requestedPlanFromMetadata(metadata: { [key: string]: unknown } | null | undefined) {
  const plan = metadataString(metadata, "plan");
  return plan === "solo" || plan === "startup" ? plan : null;
}

async function expectedWhopPlan(
  payload: unknown,
  sourceId: string,
  metadata?: { [key: string]: unknown } | null,
): Promise<BillingPlan | null> {
  const configuredPlans = getConfiguredWhopPlanIds();
  const hasConfiguredPlan = Boolean(configuredPlans.solo || configuredPlans.startup);

  // Never default to a plan when ids are missing — misconfigured deploys must
  // fail closed rather than activating every payment as "startup".
  if (!hasConfiguredPlan) {
    await logAutomationRun({
      kind: "webhook",
      status: "completed",
      message: `Ignored Whop activation ${sourceId}: no WHOP_*_PLAN_ID configured.`,
    });
    return null;
  }

  // Configured plan ids are the strongest signal; checkout metadata (set by
  // our /checkout route on a signature-verified webhook) covers plan labels.
  const plan = planFromWhopPayload(payload) || requestedPlanFromMetadata(metadata);
  if (plan) return plan;

  await logAutomationRun({
    kind: "webhook",
    status: "completed",
    message: `Ignored Whop activation ${sourceId}: payload did not match a configured Whop plan id.`,
  });
  return null;
}

async function activateWorkspace(
  workspaceId: string,
  sourceId: string,
  plan: BillingPlan,
  payerEmail?: string | null,
  currentPeriodEnd?: string,
) {
  await updateWorkspaceBilling(workspaceId, {
    provider: "whop",
    plan,
    status: "active",
    payerEmail: payerEmail?.trim().toLowerCase() || undefined,
    currentPeriodEnd,
  });

  await syncMailingListPlan(workspaceId, plan);

  await logAutomationRun({
    workspaceId,
    kind: "webhook",
    status: "completed",
    message: `Activated workspace from Whop ${sourceId}.`,
  });

  return { ok: true };
}

async function activateWorkspaceFromEmail(
  email: string,
  sourceId: string,
  plan: BillingPlan,
  currentPeriodEnd?: string,
) {
  const clerk = await clerkClient();
  const users = await clerk.users.getUserList({ emailAddress: [email] });
  const workspaceUser = users.data.length === 1 ? users.data[0] : null;
  if (!workspaceUser) {
    await logAutomationRun({
      kind: "webhook",
      status: "completed",
      message: `Ignored Whop activation ${sourceId}: ${users.data.length} Clerk users match ${email}.`,
    });
    return { ok: true, ignored: "no_workspace" };
  }

  return activateWorkspace(workspaceUser.id, sourceId, plan, email, currentPeriodEnd);
}

async function deactivateWorkspace(workspaceId: string, sourceId: string) {
  // Keep the provider/plan on record but drop access. The cron and server
  // actions gate on status === "active", so this stops all paid background work.
  await updateWorkspaceBilling(workspaceId, {
    provider: "whop",
    plan: "startup",
    status: "cancelled",
  });

  await syncMailingListPlan(workspaceId, "none");

  await logAutomationRun({
    workspaceId,
    kind: "webhook",
    status: "completed",
    message: `Deactivated workspace from Whop ${sourceId}.`,
  });

  return { ok: true };
}

// Resolve a Clerk user/workspace id from a membership payload the same way the
// activation path does: metadata first, then the buyer email, then a member
// lookup to recover the email.
async function resolveWorkspaceId(
  whop: ReturnType<typeof getWhopClient>,
  membership: {
    metadata?: { [key: string]: unknown } | null;
    user?: { email?: string | null } | null;
    member?: { id?: string | null } | null;
  },
): Promise<string | null> {
  const metadataWorkspaceId =
    metadataString(membership.metadata, "workspaceId") ||
    metadataString(membership.metadata, "clerkUserId");
  if (metadataWorkspaceId) return metadataWorkspaceId;

  let email = membership.user?.email?.trim().toLowerCase();
  if (!email && membership.member?.id) {
    const member = await whop.members.retrieve(membership.member.id);
    email = member.user?.email?.trim().toLowerCase();
  }
  if (!email) return null;

  const clerk = await clerkClient();
  const users = await clerk.users.getUserList({ emailAddress: [email] });
  return users.data.length === 1 ? users.data[0].id : null;
}

export async function POST(request: NextRequest) {
  if (isLocalMode()) return new NextResponse(null, { status: 404 });
  let whop;
  try {
    whop = getWhopClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Whop client init failed.";
    console.error("[whop webhook] client init failed:", message);
    return NextResponse.json({ error: "Webhook service is unavailable." }, { status: 500 });
  }

  let event;
  try {
    const body = await readTextBody(request, 256 * 1024);
    const headers = Object.fromEntries(request.headers);
    event = whop.webhooks.unwrap(body, { headers });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    // Keep verification detail in server logs without returning provider or
    // configuration information to an unauthenticated caller.
    const message = error instanceof Error ? error.message : "Webhook verification failed.";
    console.error("[whop webhook] verification failed:", message);
    return NextResponse.json(
      { error: "Whop webhook verification failed." },
      { status: 401 },
    );
  }

  if (
    event.type !== "payment.succeeded" &&
    event.type !== "membership.activated" &&
    event.type !== "membership.deactivated"
  ) {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  if (event.type === "membership.deactivated") {
    const membership = event.data;
    const workspaceId = await resolveWorkspaceId(whop, membership);
    if (!workspaceId) {
      await logAutomationRun({
        kind: "webhook",
        status: "completed",
        message: `Ignored Whop deactivation ${membership.id}: no matching workspace.`,
      });
      return NextResponse.json({ ok: true, ignored: "no_workspace" });
    }
    const result = await deactivateWorkspace(workspaceId, `membership ${membership.id}`);
    return NextResponse.json(result);
  }

  if (event.type === "membership.activated") {
    const membership = event.data;
    const plan = await expectedWhopPlan(
      membership,
      `membership ${membership.id}`,
      membership.metadata,
    );
    if (!plan) {
      return NextResponse.json({ ok: true, ignored: "wrong_plan" });
    }
    const metadataWorkspaceId =
      metadataString(membership.metadata, "workspaceId") ||
      metadataString(membership.metadata, "clerkUserId");
    if (metadataWorkspaceId) {
      const result = await activateWorkspace(
        metadataWorkspaceId,
        `membership ${membership.id}`,
        plan,
        membership.user?.email,
        unixToIso(membership.renewal_period_end),
      );
      return NextResponse.json(result);
    }

    const email = membership.user?.email?.trim().toLowerCase();
    if (email) {
      const result = await activateWorkspaceFromEmail(
        email,
        `membership ${membership.id}`,
        plan,
        unixToIso(membership.renewal_period_end),
      );
      return NextResponse.json(result);
    }

    const memberId = membership.member?.id;
    if (!memberId) {
      await logAutomationRun({
        kind: "webhook",
        status: "completed",
        message: `Ignored Whop membership ${membership.id}: no email or member id on payload.`,
      });
      return NextResponse.json({ ok: true, ignored: "no_member" });
    }

    const member = await whop.members.retrieve(memberId);
    const memberEmail = member.user?.email?.trim().toLowerCase();
    if (!memberEmail) {
      await logAutomationRun({
        kind: "webhook",
        status: "completed",
        message: `Ignored Whop membership ${membership.id}: no email on member ${memberId}.`,
      });
      return NextResponse.json({ ok: true, ignored: "no_email" });
    }

    const result = await activateWorkspaceFromEmail(
      memberEmail,
      `membership ${membership.id}`,
      plan,
      unixToIso(membership.renewal_period_end),
    );
    return NextResponse.json(result);
  }

  const payment = event.data;
  const plan = await expectedWhopPlan(payment, `payment ${payment.id}`, payment.metadata);
  if (!plan) {
    return NextResponse.json({ ok: true, ignored: "wrong_plan" });
  }
  const metadataWorkspaceId =
    metadataString(payment.metadata, "workspaceId") ||
    metadataString(payment.metadata, "clerkUserId");
  if (metadataWorkspaceId) {
    const result = await activateWorkspace(
      metadataWorkspaceId,
      `payment ${payment.id}`,
      plan,
      payment.user?.email,
    );
    return NextResponse.json(result);
  }

  const paymentEmail = payment.user?.email?.trim().toLowerCase();
  if (paymentEmail) {
    const result = await activateWorkspaceFromEmail(paymentEmail, `payment ${payment.id}`, plan);
    return NextResponse.json(result);
  }

  // The payment payload carries only a member id, not the buyer's email, so we
  // look the member up to get the email and match it to a Clerk user.
  const memberId = payment.member?.id;
  if (!memberId) {
    await logAutomationRun({
      kind: "webhook",
      status: "completed",
      message: `Ignored Whop payment ${payment.id}: no member id on payload.`,
    });
    return NextResponse.json({ ok: true, ignored: "no_member" });
  }

  const member = await whop.members.retrieve(memberId);
  const memberEmail = member.user?.email?.trim().toLowerCase();
  if (!memberEmail) {
    await logAutomationRun({
      kind: "webhook",
      status: "completed",
      message: `Ignored Whop payment ${payment.id}: no email on member ${memberId}.`,
    });
    return NextResponse.json({ ok: true, ignored: "no_email" });
  }

  const result = await activateWorkspaceFromEmail(memberEmail, `payment ${payment.id}`, plan);
  return NextResponse.json(result);
}
