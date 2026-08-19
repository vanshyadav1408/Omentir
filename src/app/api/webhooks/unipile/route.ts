import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getLinkedInAccountByAccountId,
  listCampaigns,
  listCampaignEnrollments,
  logAutomationRun,
  updateLead,
} from "@/lib/server/data";
import {
  applyAcceptanceIfFirstDegree,
  applyConnectionAccepted,
  enrollmentCanReceiveAcceptance,
  findLeadForInboundEvent,
  processInboundMessage,
} from "@/lib/server/inbound";
import { passwordsMatch } from "@/lib/local-session";
import { rateLimitRequestShared } from "@/lib/request-rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/request-body";

export const dynamic = "force-dynamic";

function revalidateWorkspaceDataPages() {
  revalidatePath("/actions");
  revalidatePath("/dashboard");
  revalidatePath("/agents");
  revalidatePath("/campaigns");
  revalidatePath("/leads");
  revalidatePath("/messages");
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.UNIPILE_WEBHOOK_SECRET;
  if (!secret) return false;
  return passwordsMatch(request.headers.get("x-omentir-webhook-secret") || "", secret);
}

type UnipileWebhookSender = {
  name?: string;
  profile_url?: string;
  provider_id?: string;
  attendee_name?: string;
  attendee_profile_url?: string;
  attendee_provider_id?: string;
};

type UnipileWebhook = {
  event?: string;
  type?: string;
  account_id?: string;
  // Provider message id, used to dedupe retried webhook deliveries.
  message_id?: string;
  // Unipile's new_message payload carries the text directly in `message`;
  // older/custom payloads nest it as `message.text`.
  message?:
    | string
    | {
        id?: string;
        text?: string;
        body?: string;
        content?: string;
        sender?: UnipileWebhookSender;
        is_sender?: boolean;
      };
  sender?: UnipileWebhookSender;
  attendees?: UnipileWebhookSender[];
  attachments?: unknown[];
  is_sender?: boolean;
  account_info?: { user_id?: string; user_provider_id?: string };
  profile_url?: string;
  provider_id?: string;
  // new_relation payloads identify the accepted contact with user_* fields.
  user_provider_id?: string;
  user_public_identifier?: string;
  user_profile_url?: string;
  user_full_name?: string;
  workspace_id?: string;
  lead_id?: string;
  campaign_id?: string;
  user_email?: string;
};

function compactEventName(eventName: string) {
  return eventName.toLowerCase().replace(/[._-]/g, "");
}

// Unipile fires message_read / message_delivered / message_reaction on the
// same messaging webhook. Those are not inbound replies, and storing them
// under the real message id blocks the later text delivery from being armed.
function isInboundReplyEvent(eventName: string) {
  const compact = compactEventName(eventName);
  return (
    compact === "messagereceived" ||
    compact === "newmessage" ||
    compact === "messagenew" ||
    compact === "messagecreated" ||
    compact.includes("newmessage") ||
    compact.includes("messagecreated") ||
    compact.includes("reply")
  );
}

function inboundMessageBody(payload: UnipileWebhook) {
  const nestedMessage = typeof payload.message === "object" ? payload.message : undefined;
  const text =
    typeof payload.message === "string"
      ? payload.message
      : nestedMessage?.text || nestedMessage?.body || nestedMessage?.content || "";
  if (text.trim()) return text;
  if (Array.isArray(payload.attachments) && payload.attachments.length > 0) {
    return "[Sent an attachment]";
  }
  return "";
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    !(await rateLimitRequestShared(request, "unipile-webhook", {
      sourceKey: "authorized-provider",
      perSource: 600,
      global: 600,
      windowMs: 60_000,
    }))
  ) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let payload: UnipileWebhook | null;
  try {
    payload = await readJsonBody<UnipileWebhook>(request, 128 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    throw error;
  }
  if (!payload) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  const eventName = payload.event || payload.type || "";
  const normalizedEventName = eventName.toLowerCase();
  const isReply = isInboundReplyEvent(eventName);
  // Unipile emits "new_relation" when an invite is accepted.
  const isConnectionApproved =
    normalizedEventName.includes("relation") ||
    normalizedEventName.includes("accepted") ||
    normalizedEventName.includes("approval") ||
    normalizedEventName.includes("connected");

  if (!isReply && !isConnectionApproved) {
    await logAutomationRun({
      workspaceId: payload.workspace_id,
      kind: "webhook",
      status: "completed",
      message: `Ignored Unipile event: ${eventName || "unknown"}`,
    });
    return NextResponse.json({ ok: true, ignored: true });
  }

  const account = payload.account_id
    ? await getLinkedInAccountByAccountId(payload.account_id)
    : null;
  if (account && payload.workspace_id && payload.workspace_id !== account.workspaceId) {
    return NextResponse.json({ error: "Webhook workspace does not match its account." }, { status: 400 });
  }
  const workspaceId = account?.workspaceId || payload.workspace_id;
  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspace_id or known account_id is required in webhook payload." },
      { status: 400 },
    );
  }

  const nestedMessage = typeof payload.message === "object" ? payload.message : undefined;
  const messageSender = payload.sender || nestedMessage?.sender;
  const otherAttendee = (payload.attendees || []).find(
    (attendee) =>
      (attendee.provider_id || attendee.attendee_provider_id) &&
      (attendee.provider_id || attendee.attendee_provider_id) !==
        (payload.account_info?.user_provider_id || payload.account_info?.user_id),
  );
  const profileUrl =
    payload.profile_url ||
    payload.user_profile_url ||
    messageSender?.profile_url ||
    messageSender?.attendee_profile_url ||
    otherAttendee?.profile_url ||
    otherAttendee?.attendee_profile_url;
  const providerId =
    payload.provider_id ||
    payload.user_provider_id ||
    messageSender?.provider_id ||
    messageSender?.attendee_provider_id ||
    otherAttendee?.provider_id ||
    otherAttendee?.attendee_provider_id;
  const publicIdentifier = payload.user_public_identifier;

  const ownerId = payload.account_info?.user_provider_id || payload.account_info?.user_id;
  const isOwnMessage =
    payload.is_sender === true ||
    nestedMessage?.is_sender === true ||
    Boolean(isReply && ownerId && providerId && ownerId === providerId);

  const identityProviderId = isOwnMessage
    ? otherAttendee?.provider_id || otherAttendee?.attendee_provider_id || providerId
    : providerId;
  const identityProfileUrl = isOwnMessage
    ? otherAttendee?.profile_url || otherAttendee?.attendee_profile_url || profileUrl
    : profileUrl;
  const identityName = isOwnMessage
    ? otherAttendee?.name || otherAttendee?.attendee_name || payload.user_full_name
    : payload.user_full_name || messageSender?.name || messageSender?.attendee_name;

  const lead = await findLeadForInboundEvent({
    workspaceId,
    leadId: payload.lead_id,
    linkedInUrl: identityProfileUrl,
    providerProfileId: identityProviderId,
    publicIdentifier: isOwnMessage ? undefined : publicIdentifier,
    fullName: identityName,
    matchPendingAcceptance: isConnectionApproved || isOwnMessage,
  });

  // Messages we send through Unipile come back as message webhooks too; treating
  // them as replies would stop the campaign right after its first message.
  // An invite note that opens a chat is the real-time accept signal, so confirm
  // first-degree and unlock the sequence instead of ignoring the event entirely.
  if (isOwnMessage) {
    if (lead && (await applyAcceptanceIfFirstDegree({ workspaceId, lead, account }))) {
      revalidateWorkspaceDataPages();
      await logAutomationRun({
        workspaceId,
        kind: "webhook",
        status: "completed",
        message: `Stored connection approval from ${lead.name} (invite-note chat)`,
      });
    }
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!lead) {
    return NextResponse.json({ error: "Lead not found for webhook." }, { status: 404 });
  }

  if (providerId && !lead.providerProfileId) {
    await updateLead(workspaceId, lead.id, { providerProfileId: providerId });
    lead.providerProfileId = providerId;
  }

  if (isConnectionApproved && !isReply) {
    const [enrollments, campaigns] = await Promise.all([
      listCampaignEnrollments(workspaceId),
      listCampaigns(workspaceId),
    ]);
    const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
    const pending = enrollments.filter(
      (enrollment) =>
        enrollment.leadId === lead.id && enrollmentCanReceiveAcceptance(enrollment),
    );
    await Promise.all(
      pending.map((enrollment) =>
        applyConnectionAccepted({
          workspaceId,
          lead,
          enrollment,
          campaign: campaignsById.get(enrollment.campaignId),
          account,
        }),
      ),
    );
    if (pending.length) {
      await updateLead(workspaceId, lead.id, { outreachStatus: "connected" });
      revalidateWorkspaceDataPages();
      await logAutomationRun({
        workspaceId,
        kind: "webhook",
        status: "completed",
        message: `Stored connection approval from ${lead.name}`,
      });
    }
    return NextResponse.json({ ok: true });
  }

  const body = inboundMessageBody(payload);
  const senderName =
    messageSender?.name ||
    messageSender?.attendee_name ||
    payload.user_full_name ||
    lead.name;
  const providerMessageId =
    payload.message_id || (typeof payload.message === "object" ? payload.message.id : undefined);

  const result = await processInboundMessage({
    workspaceId,
    lead,
    body,
    senderName,
    providerMessageId,
    campaignIdHint: payload.campaign_id,
    account,
    notifyEmailOverride: payload.user_email,
  });
  if (result.duplicate) {
    revalidateWorkspaceDataPages();
    return NextResponse.json({ ok: true, duplicate: true });
  }
  revalidateWorkspaceDataPages();

  return NextResponse.json({
    ok: true,
    intent: result.intent,
    confidence: result.confidence,
  });
}
