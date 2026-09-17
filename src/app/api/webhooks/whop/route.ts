import { clerkClient } from "@clerk/nextjs/server";
import { isLocalMode } from "@/lib/runtime-mode";
import { NextResponse, type NextRequest } from "next/server";
import { getWorkspace, listWorkspacesForOwner, logAutomationRun, ownerWorkspaceForBilling, updateWorkspaceBilling, updateWorkspaceLinkedInSeats } from "@/lib/server/data";
import { enforceLinkedInAccountCap, purgeWorkspaceUnipileAccounts } from "@/lib/server/linkedin-accounts";
import { syncMailingListPlan } from "@/lib/server/mailing-list";
import { readTextBody, RequestBodyTooLargeError } from "@/lib/server/request-body";
import {
  cancelWhopSeatMembership,
  extraLinkedInSeatsFromWhopSource,
  getConfiguredWhopPlanIds,
  getWhopClient,
  isLifetimePlan,
  planFromWhopPayload,
  type BillingPlan,
} from "@/lib/server/whop";
import {
  extraLinkedInSeatMonthlyTotalUsd,
  isLinkedInSeatCheckoutMetadata,
  isLinkedInSeatWhopObject,
} from "@/lib/linkedin-seat-pricing";
import { capturePostHogEvent, revenueFromWhopPayment } from "@/lib/posthog-server";
import { CHANNEL_LABELS, type ReferralChannel } from "@/lib/referral-channel";
import { hasActiveSubscription } from "@/lib/server/subscription";

export const dynamic = "force-dynamic";

function metadataAttribution(metadata: { [key: string]: unknown } | null | undefined) {
  const channel = metadataString(metadata, "channel");
  const referringDomain = metadataString(metadata, "referring_domain");
  const initialChannel = metadataString(metadata, "initial_channel");
  const initialReferringDomain = metadataString(metadata, "initial_referring_domain");
  const properties: Record<string, string> = {};
  if (channel) {
    properties.channel = channel;
    properties.channel_name =
      channel in CHANNEL_LABELS ? CHANNEL_LABELS[channel as ReferralChannel] : channel;
  }
  if (referringDomain) properties.referring_domain = referringDomain;
  if (initialChannel) properties.initial_channel = initialChannel;
  if (initialReferringDomain) properties.initial_referring_domain = initialReferringDomain;
  const landingPath = metadataString(metadata, "landing_path");
  const utmSource = metadataString(metadata, "utm_source");
  const utmMedium = metadataString(metadata, "utm_medium");
  const utmCampaign = metadataString(metadata, "utm_campaign");
  if (landingPath) properties.landing_path = landingPath;
  if (utmSource) properties.utm_source = utmSource;
  if (utmMedium) properties.utm_medium = utmMedium;
  if (utmCampaign) properties.utm_campaign = utmCampaign;
  return properties;
}

async function capturePaymentSucceeded(
  workspaceId: string,
  payment: { id: string; metadata?: { [key: string]: unknown } | null; user?: { email?: string | null } | null },
  plan: BillingPlan,
) {
  const revenue = revenueFromWhopPayment(payment, plan);
  await capturePostHogEvent({
    event: "payment_succeeded",
    distinctId: workspaceId,
    insertId: `payment_succeeded:${payment.id}`,
    properties: {
      plan,
      email: payment.user?.email || undefined,
      revenue,
      currency: "USD",
      ...metadataAttribution(payment.metadata),
    },
  });
}

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
  return plan === "solo" || plan === "lifetime" || plan === "startup" ? plan : null;
}

async function expectedWhopPlan(
  payload: unknown,
  sourceId: string,
  metadata?: { [key: string]: unknown } | null,
): Promise<BillingPlan | null> {
  const configuredPlans = getConfiguredWhopPlanIds();
  const hasConfiguredPlan = Boolean(
    configuredPlans.solo || configuredPlans.lifetime || configuredPlans.startup,
  );

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
): Promise<{ ok: true; workspaceId: string }> {
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

  return { ok: true, workspaceId };
}

async function activateWorkspaceFromEmail(
  email: string,
  sourceId: string,
  plan: BillingPlan,
  currentPeriodEnd?: string,
): Promise<{ ok: true; workspaceId: string } | { ok: true; ignored: string }> {
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

async function applyLinkedInSeatPurchase(
  workspaceId: string,
  extraSeats: number,
  membershipId: string | undefined,
  sourceId: string,
) {
  const workspace = await getWorkspace(workspaceId);
  if (!hasActiveSubscription(workspace)) {
    await logAutomationRun({
      workspaceId,
      kind: "webhook",
      status: "completed",
      message: `Ignored extra LinkedIn seats ${sourceId}: workspace is not subscribed.`,
    });
    return { ok: true as const, ignored: "no_subscription" };
  }
  const owner = await ownerWorkspaceForBilling(workspace);
  const ownerId = owner.id;
  const previousSeatMembershipId = owner.billing?.seatMembershipId;
  await updateWorkspaceLinkedInSeats(
    workspace.id,
    {
      extraLinkedInSeats: extraSeats,
      seatMembershipId: membershipId || previousSeatMembershipId,
    },
    { ownerId },
  );
  if (previousSeatMembershipId && previousSeatMembershipId !== membershipId) {
    await cancelWhopSeatMembership(previousSeatMembershipId);
  }
  const trimmed = await enforceLinkedInAccountCap(ownerId);
  await logAutomationRun({
    workspaceId,
    kind: "webhook",
    status: "completed",
    message: `Set ${extraSeats} extra LinkedIn seat${extraSeats === 1 ? "" : "s"} from Whop ${sourceId}.${
      trimmed.removed
        ? ` Disconnected ${trimmed.removed} account${trimmed.removed === 1 ? "" : "s"} over the new cap.`
        : ""
    }`,
  });
  return { ok: true as const, workspaceId };
}

async function clearLinkedInSeats(workspaceId: string, sourceId: string) {
  const workspace = await getWorkspace(workspaceId).catch(() => null);
  const ownerId = workspace?.ownerId || workspaceId;
  await updateWorkspaceLinkedInSeats(workspace?.id || workspaceId, { extraLinkedInSeats: 0 }, { ownerId });
  const trimmed = await enforceLinkedInAccountCap(ownerId);
  await logAutomationRun({
    workspaceId,
    kind: "webhook",
    status: "completed",
    message: `Cleared extra LinkedIn seats from Whop ${sourceId}.${
      trimmed.removed
        ? ` Disconnected ${trimmed.removed} account${trimmed.removed === 1 ? "" : "s"} over the included cap.`
        : ""
    }`,
  });
  return { ok: true as const };
}

async function deactivateWorkspace(workspaceId: string, sourceId: string) {
  // Keep the provider/plan on record but drop access. The cron and server
  // actions gate on status === "active", so this stops all paid background work.
  //
  // The plan must be carried over, never defaulted: hard-coding "startup" here
  // silently promoted a cancelled Basic buyer to Startup limits (unlimited
  // agents/leads), which a later manual bypass or reactivation would honour.
  // Fail closed to "solo" when nothing is on record.
  const existing = await getWorkspace(workspaceId).catch(() => null);
  const existingPlan = existing?.billing?.plan;

  // A lifetime buyer paid once and can never be re-charged, so a deactivation
  // here is unrecoverable without manual work. Whop can emit this event for a
  // one-time purchase whose payment schedule simply finished, which must not
  // revoke access. Keep the workspace active and log loudly instead - a real
  // refund or chargeback still surfaces in the run log for manual revocation.
  if (isLifetimePlan(existingPlan)) {
    await logAutomationRun({
      workspaceId,
      kind: "webhook",
      status: "completed",
      message: `Ignored Whop deactivation ${sourceId}: workspace is on the lifetime plan. Revoke manually if this was a refund or chargeback.`,
    });
    return { ok: true, ignored: "lifetime_plan" };
  }

  await cancelWhopSeatMembership(existing?.billing?.seatMembershipId);

  await updateWorkspaceBilling(workspaceId, {
    provider: "whop",
    plan: existingPlan ?? "solo",
    status: "cancelled",
    payerEmail: existing?.billing?.payerEmail,
    currentPeriodEnd: existing?.billing?.currentPeriodEnd,
    extraLinkedInSeats: 0,
  });

  await syncMailingListPlan(workspaceId, "none");

  let purgeNote = "";
  try {
    const ownerWorkspace = await getWorkspace(workspaceId);
    const owned = await listWorkspacesForOwner(ownerWorkspace.ownerId || workspaceId);
    const purges = await Promise.all(owned.map((item) => purgeWorkspaceUnipileAccounts(item.id)));
    const considered = purges.reduce((sum, item) => sum + item.considered, 0);
    const deleted = purges.reduce((sum, item) => sum + item.deleted, 0);
    const failed = purges.reduce((sum, item) => sum + item.failed, 0);
    purgeNote =
      considered > 0
        ? ` Removed ${deleted} Unipile LinkedIn account${deleted === 1 ? "" : "s"} so they stop being billed.`
        : "";
    if (failed) {
      purgeNote += ` ${failed} Unipile delete${failed === 1 ? "" : "s"} failed and will retry on the next tick.`;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unipile purge failed.";
    console.error("[whop webhook] Unipile purge after deactivation failed:", message);
    purgeNote = " Unipile purge failed and will retry on the next tick.";
  }

  await logAutomationRun({
    workspaceId,
    kind: "webhook",
    status: "completed",
    message: `Deactivated workspace from Whop ${sourceId}.${purgeNote}`,
  });

  await capturePostHogEvent({
    event: "subscription_cancelled",
    distinctId: workspaceId,
    insertId: `subscription_cancelled:${sourceId}`,
    properties: {
      plan: existingPlan ?? "solo",
      source: sourceId,
    },
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

function payloadMembershipId(payload: { membership?: { id?: string | null } | null }) {
  const id = payload.membership?.id?.trim();
  return id || undefined;
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

    const workspace = await getWorkspace(workspaceId).catch(() => null);
    const currentSeatMembershipId = workspace?.billing?.seatMembershipId;
    const isSeatMembership =
      isLinkedInSeatWhopObject(membership) ||
      isLinkedInSeatCheckoutMetadata(membership.metadata) ||
      membership.id === currentSeatMembershipId;
    if (isSeatMembership) {
      if (currentSeatMembershipId && membership.id !== currentSeatMembershipId) {
        return NextResponse.json({ ok: true, ignored: "stale_seat_membership" });
      }
      const result = await clearLinkedInSeats(workspaceId, `membership ${membership.id}`);
      return NextResponse.json(result);
    }

    const plan = await expectedWhopPlan(
      membership,
      `membership ${membership.id}`,
      membership.metadata,
    );
    if (!plan) {
      return NextResponse.json({ ok: true, ignored: "wrong_plan" });
    }

    const result = await deactivateWorkspace(workspaceId, `membership ${membership.id}`);
    return NextResponse.json(result);
  }

  if (event.type === "membership.activated") {
    const membership = event.data;
    const extraSeats = await extraLinkedInSeatsFromWhopSource(membership);
    if (extraSeats) {
      const workspaceId = await resolveWorkspaceId(whop, membership);
      if (!workspaceId) {
        await logAutomationRun({
          kind: "webhook",
          status: "completed",
          message: `Ignored extra LinkedIn seats ${membership.id}: no matching workspace.`,
        });
        return NextResponse.json({ ok: true, ignored: "no_workspace" });
      }
      const result = await applyLinkedInSeatPurchase(
        workspaceId,
        extraSeats,
        membership.id,
        `membership ${membership.id}`,
      );
      return NextResponse.json(result);
    }

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
  let extraSeats = await extraLinkedInSeatsFromWhopSource(payment);
  const membershipId = payloadMembershipId(payment);
  if (!extraSeats && membershipId) {
    try {
      extraSeats = await extraLinkedInSeatsFromWhopSource(
        await whop.memberships.retrieve(membershipId),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Whop membership retrieve failed.";
      console.error("[whop webhook] extra-seat membership retrieve failed:", message);
    }
  }
  if (extraSeats) {
    const workspaceId =
      metadataString(payment.metadata, "workspaceId") ||
      metadataString(payment.metadata, "clerkUserId") ||
      (await resolveWorkspaceId(whop, payment));
    if (!workspaceId) {
      await logAutomationRun({
        kind: "webhook",
        status: "completed",
        message: `Ignored extra LinkedIn seats payment ${payment.id}: no matching workspace.`,
      });
      return NextResponse.json({ ok: true, ignored: "no_workspace" });
    }
    const result = await applyLinkedInSeatPurchase(
      workspaceId,
      extraSeats,
      membershipId,
      `payment ${payment.id}`,
    );
    await capturePostHogEvent({
      event: "payment_succeeded",
      distinctId: workspaceId,
      insertId: `payment_succeeded:${payment.id}`,
      properties: {
        plan: "linkedin_seats",
        extraSeats,
        email: payment.user?.email || undefined,
        revenue: revenueFromWhopPayment(payment, null) ?? extraLinkedInSeatMonthlyTotalUsd(extraSeats),
        currency: "USD",
        ...metadataAttribution(payment.metadata),
      },
    });
    return NextResponse.json(result);
  }

  const plan = await expectedWhopPlan(payment, `payment ${payment.id}`, payment.metadata);
  if (!plan) {
    return NextResponse.json({ ok: true, ignored: "wrong_plan" });
  }

  const captureIfPaid = async (result: { ok: true; workspaceId?: string; ignored?: string }) => {
    if (result.workspaceId) {
      await capturePaymentSucceeded(result.workspaceId, payment, plan);
    }
    return result;
  };

  const metadataWorkspaceId =
    metadataString(payment.metadata, "workspaceId") ||
    metadataString(payment.metadata, "clerkUserId");
  if (metadataWorkspaceId) {
    const result = await captureIfPaid(
      await activateWorkspace(
        metadataWorkspaceId,
        `payment ${payment.id}`,
        plan,
        payment.user?.email,
      ),
    );
    return NextResponse.json(result);
  }

  const paymentEmail = payment.user?.email?.trim().toLowerCase();
  if (paymentEmail) {
    const result = await captureIfPaid(
      await activateWorkspaceFromEmail(paymentEmail, `payment ${payment.id}`, plan),
    );
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

  const result = await captureIfPaid(
    await activateWorkspaceFromEmail(memberEmail, `payment ${payment.id}`, plan),
  );
  return NextResponse.json(result);
}
