import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  findLeadForWorkspace,
  getLinkedInAccountByAccountId,
  listCampaigns,
  listCampaignEnrollments,
  logAutomationRun,
  updateLead,
} from "@/lib/server/data";
import {
  applyConnectionAccepted,
  processInboundMessage,
} from "@/lib/server/inbound";
import { passwordsMatch } from "@/lib/local-session";
import { rateLimit } from "@/lib/request-rate-limit";

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
        sender?: UnipileWebhookSender;
      };
  sender?: UnipileWebhookSender;
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

export async function POST(request: NextRequest) {
  const source = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`unipile-webhook:${source}`, 600, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as UnipileWebhook;
  const eventName = payload.event || payload.type || "";
  const normalizedEventName = eventName.toLowerCase();
  const isReply =
    normalizedEventName.includes("message") || normalizedEventName.includes("reply");
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
  const workspaceId = payload.workspace_id || account?.workspaceId;
  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspace_id or known account_id is required in webhook payload." },
      { status: 400 },
    );
  }

  const nestedMessage = typeof payload.message === "object" ? payload.message : undefined;
  const messageSender = payload.sender || nestedMessage?.sender;
  const profileUrl =
    payload.profile_url ||
    payload.user_profile_url ||
    messageSender?.profile_url ||
    messageSender?.attendee_profile_url;
  const providerId =
    payload.provider_id ||
    payload.user_provider_id ||
    messageSender?.provider_id ||
    messageSender?.attendee_provider_id;
  const publicIdentifier = payload.user_public_identifier;

  // Messages we send through Unipile come back as message webhooks too; treating
  // them as replies would stop the campaign right after its first message.
  const ownerId = payload.account_info?.user_provider_id || payload.account_info?.user_id;
  if (isReply && ownerId && providerId && ownerId === providerId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const lead = await findLeadForWorkspace({
    workspaceId,
    leadId: payload.lead_id,
    linkedInUrl: profileUrl,
    providerProfileId: providerId,
    publicIdentifier,
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found for webhook." }, { status: 404 });
  }

  if (isConnectionApproved && !isReply) {
    const [enrollments, campaigns] = await Promise.all([
      listCampaignEnrollments(workspaceId),
      listCampaigns(workspaceId),
    ]);
    const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
    await Promise.all(
      enrollments
        .filter(
          (enrollment) =>
            enrollment.leadId === lead.id && enrollment.status === "connection_sent",
        )
        .map((enrollment) =>
          applyConnectionAccepted({
            workspaceId,
            lead,
            enrollment,
            campaign: campaignsById.get(enrollment.campaignId),
            account,
          }),
        ),
    );
    await updateLead(workspaceId, lead.id, { outreachStatus: "connected" });
    revalidateWorkspaceDataPages();
    await logAutomationRun({
      workspaceId,
      kind: "webhook",
      status: "completed",
      message: `Stored connection approval from ${lead.name}`,
    });
    return NextResponse.json({ ok: true });
  }

  const body =
    typeof payload.message === "string"
      ? payload.message
      : nestedMessage?.text || nestedMessage?.body || "";
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
    return NextResponse.json({ ok: true, duplicate: true });
  }
  revalidateWorkspaceDataPages();

  return NextResponse.json({
    ok: true,
    intent: result.intent,
    confidence: result.confidence,
  });
}
