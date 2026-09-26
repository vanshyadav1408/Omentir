import "server-only";

import { z } from "zod";
import { AgentApiOperationError } from "./agent-api-operations";
import type { AgentApiContext } from "./agent-api";
import { executeScheduledActionNow } from "./automation";
import {
  claimActionSlot,
  completeConversationManualFollowUp,
  consumeDailyQuota,
  createConversationMessage,
  deleteGroup,
  findOwnedWorkspace,
  getAgent,
  getLinkedInAccount,
  getLinkedInAccountByAccountId,
  getProductProfile,
  hasDailyQuotaRemaining,
  listLeads,
  listLinkedInAccounts,
  listWorkspaceIdsSharingLinkedIn,
  listWorkspacesForOwner,
  ownerWorkspaceForBilling,
  setAgentApiKeyWorkspace,
  stopLeadOutreach,
  upsertLead,
  upsertProductProfile,
} from "./data";
import { isLocalMode } from "@/lib/runtime-mode";
import { LOCAL_USER_ID } from "@/lib/local-session";
import { planHasApiAccess } from "@/lib/plan-limits";
import { hasActiveSubscription } from "./subscription";
import { workspaceDisplayName } from "@/lib/workspace-ownership";
import {
  agentWorkspaceSwitchDenied,
  ownedWorkspacesVisibleInLocalMode,
  summarizeOwnedWorkspaces,
} from "@/lib/agent-workspace-switch";
import { analyzeWebsiteOrSearch, draftAgentSetupWithGemini } from "./gemini";
import { parseLinkedInLeadCsv } from "@/lib/linkedin-csv";
import { buildLeadsCsv } from "@/lib/leads-csv";
import { normalizeLinkedInProfileUrl } from "./firebase";
import { resolveTimeZone } from "@/lib/time-zone";
import { dedupeLinkedInInboxThreads } from "@/lib/inbox-threads";
import {
  listLinkedInChatMessagesPage,
  linkedInChatBelongsToAccount,
  listLinkedInInbox,
  sendLinkedInChatMessage,
} from "./unipile";

function asAgentError(error: unknown, fallback: string, status = 400): never {
  if (error instanceof AgentApiOperationError) throw error;
  throw new AgentApiOperationError(
    error instanceof Error ? error.message : fallback,
    status,
  );
}

const groupIdSchema = z.object({ groupId: z.string().trim().min(1) });
const leadIdSchema = z.object({ leadId: z.string().trim().min(1) });
const switchWorkspaceSchema = z.object({ workspaceId: z.string().trim().min(1) });

export async function listWorkspaceResources(context: AgentApiContext) {
  const ownerId = context.workspace.ownerId || context.workspace.id;
  const owned = ownedWorkspacesVisibleInLocalMode(
    await listWorkspacesForOwner(ownerId),
    isLocalMode(),
    LOCAL_USER_ID,
  );
  return {
    currentWorkspaceId: context.workspace.id,
    workspaces: summarizeOwnedWorkspaces(owned, context.workspace.id),
  };
}

export async function switchWorkspaceResource(context: AgentApiContext, payload: unknown) {
  const parsed = switchWorkspaceSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid workspace payload.", 400, parsed.error.flatten());
  }

  const ownerId = context.workspace.ownerId || context.workspace.id;
  const target = await findOwnedWorkspace(ownerId, parsed.data.workspaceId);
  const billed = target ? await ownerWorkspaceForBilling(target) : null;
  const denied = agentWorkspaceSwitchDenied({
    ownerId,
    target,
    localMode: isLocalMode(),
    localWorkspaceId: LOCAL_USER_ID,
    subscriptionActive: billed ? hasActiveSubscription(billed) : false,
    apiAccess: billed ? planHasApiAccess(billed.billing?.plan) : false,
  });
  if (denied || !target) {
    throw new AgentApiOperationError(
      denied?.message ?? "Workspace not found.",
      denied?.status ?? 404,
    );
  }

  try {
    await setAgentApiKeyWorkspace(context.tokenId, context.workspace.id, target.id);
  } catch (error) {
    asAgentError(error, "Agent token not found.", 404);
  }

  return {
    ok: true,
    previousWorkspaceId: context.workspace.id,
    workspace: {
      id: target.id,
      name: workspaceDisplayName(target),
    },
    note: "This token now runs against the new workspace. Call omentir_get_context again before other tools.",
  };
}

const attachmentSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().max(120).optional(),
  contentBase64: z.string().min(1),
});

function filesFromAttachments(
  attachments: Array<z.infer<typeof attachmentSchema>> | undefined,
) {
  return (attachments || []).map((item) => {
    const bytes = Buffer.from(item.contentBase64, "base64");
    if (!bytes.length) {
      throw new AgentApiOperationError(`Attachment "${item.filename}" is empty.`, 400);
    }
    if (bytes.length > 15 * 1024 * 1024) {
      throw new AgentApiOperationError(
        `"${item.filename}" is too large. Attachments must be under 15MB.`,
        400,
      );
    }
    return new File([bytes], item.filename, {
      type: item.mimeType || "application/octet-stream",
    });
  });
}

async function requireOwnedInboxAccount(context: AgentApiContext, accountId?: string) {
  const requested = accountId?.trim()
    ? await getLinkedInAccountByAccountId(accountId.trim())
    : null;
  const ownedIds = requested ? await listWorkspaceIdsSharingLinkedIn(context.workspace.id) : [];
  const account =
    requested && ownedIds.includes(requested.workspaceId)
      ? requested
      : await getLinkedInAccount(context.workspace.id);
  if (!account) {
    throw new AgentApiOperationError("Connect LinkedIn in Omentir before using the inbox.", 409);
  }
  return account;
}

export async function draftAgentSetupResource(context: AgentApiContext) {
  const profile = await getProductProfile(context.workspace.id);
  return { draft: await draftAgentSetupWithGemini(profile) };
}

export async function analyzeWebsiteResource(context: AgentApiContext, payload: unknown) {
  const parsed = z
    .object({ websiteUrl: z.string().trim().min(1).max(500) })
    .safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("websiteUrl is required.", 400, parsed.error.flatten());
  }

  let analysis;
  try {
    analysis = await analyzeWebsiteOrSearch(parsed.data.websiteUrl);
  } catch (error) {
    asAgentError(error, "Website analysis failed.", 409);
  }

  const existing = await getProductProfile(context.workspace.id);
  const productProfile = await upsertProductProfile(context.workspace.id, {
    websiteUrl: parsed.data.websiteUrl,
    description: analysis.productOverview,
    companyName: analysis.companyName,
    industry: analysis.industry,
    companySize: analysis.companySize,
    painPointsText: analysis.painPointsText,
    pricingDetails: analysis.pricingDetails,
    schedulingLink: existing?.schedulingLink || "",
    keyFeatures: analysis.keyFeatures,
    socialProof: analysis.socialProof,
    linkedInCompanyPage: existing?.linkedInCompanyPage || "",
    useCases: analysis.useCases,
    targetBuyers: analysis.targetBuyers,
    buyerTitles: analysis.buyerTitles,
    roleVocabulary: analysis.roleVocabulary,
    industries: analysis.industries,
    companySizes: analysis.companySizes,
    painPoints: analysis.painPoints,
    keywords: analysis.keywords,
    preferredLocations: analysis.preferredLocations,
    averageTicketSize: existing?.averageTicketSize,
  });

  return { productProfile };
}

export async function importCsvLeadsResource(context: AgentApiContext, payload: unknown) {
  const parsed = z
    .object({
      agentId: z.string().trim().min(1),
      csvContents: z.string().min(1).max(1_000_000),
    })
    .safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid CSV import payload.", 400, parsed.error.flatten());
  }

  const agent = await getAgent(context.workspace.id, parsed.data.agentId);
  if (!agent || agent.mode !== "outreach") {
    throw new AgentApiOperationError("Outreach agent not found.", 404);
  }

  let parsedCsv;
  try {
    parsedCsv = parseLinkedInLeadCsv(parsed.data.csvContents);
  } catch (error) {
    asAgentError(error, "Could not parse the CSV.");
  }

  const existingLeads = await listLeads(context.workspace.id);
  const existingByUrl = new Map(
    existingLeads.map((lead) => [normalizeLinkedInProfileUrl(lead.linkedInUrl), lead]),
  );
  for (const lead of parsedCsv.leads) {
    const existing = existingByUrl.get(normalizeLinkedInProfileUrl(lead.linkedInUrl));
    await upsertLead(context.workspace.id, agent.targetGroupId, {
      ...lead,
      sourceAgentId: existing?.sourceAgentId || agent.id,
      fitScore: 100,
      scoreReasons: ["Imported by the user from CSV"],
      summary: "Imported from CSV for outreach.",
      leadReason: "Imported by the user from CSV",
      outreachStatus: "new",
    });
  }

  return { imported: parsedCsv.leads.length, skipped: parsedCsv.skipped, agentId: agent.id };
}

export async function exportLeadsResource(context: AgentApiContext, payload: unknown) {
  const parsed = groupIdSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("groupId is required.", 400, parsed.error.flatten());
  }

  const leads = await listLeads(context.workspace.id, parsed.data.groupId);
  if (!leads.length) {
    throw new AgentApiOperationError("This lead group has no leads to export.", 404);
  }

  const timeZone = resolveTimeZone(context.workspace.timezone);
  return {
    filename: `${parsed.data.groupId}-leads.csv`,
    csv: buildLeadsCsv(leads, timeZone),
    exported: leads.length,
    timeZone,
  };
}

export async function deleteGroupResource(context: AgentApiContext, payload: unknown) {
  const parsed = groupIdSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("groupId is required.", 400, parsed.error.flatten());
  }
  try {
    await deleteGroup(context.workspace.id, parsed.data.groupId);
  } catch (error) {
    asAgentError(error, "Could not delete the lead group.", 409);
  }
  return { ok: true, groupId: parsed.data.groupId, deleted: true };
}

export async function runScheduledActionNowResource(context: AgentApiContext, payload: unknown) {
  const parsed = z
    .object({ enrollmentId: z.string().trim().min(1) })
    .safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("enrollmentId is required.", 400, parsed.error.flatten());
  }
  try {
    const result = await executeScheduledActionNow(context.workspace.id, parsed.data.enrollmentId);
    return { ok: true, enrollmentId: parsed.data.enrollmentId, result };
  } catch (error) {
    asAgentError(error, "Could not run that scheduled action.", 409);
  }
}

export async function stopLeadOutreachResource(context: AgentApiContext, payload: unknown) {
  const parsed = leadIdSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("leadId is required.", 400, parsed.error.flatten());
  }
  try {
    const stopped = await stopLeadOutreach(context.workspace.id, parsed.data.leadId);
    return { ok: true, leadId: parsed.data.leadId, stopped };
  } catch (error) {
    asAgentError(error, "Could not stop outreach for that lead.", 404);
  }
}

export async function listInboxResource(context: AgentApiContext, payload: unknown) {
  const parsed = z
    .object({
      accountId: z.string().trim().min(1).optional(),
      query: z.string().trim().max(200).optional(),
      limit: z.number().int().min(1).max(50).default(30),
    })
    .safeParse(payload || {});
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid inbox payload.", 400, parsed.error.flatten());
  }

  const accounts = await listLinkedInAccounts(context.workspace.id);
  const unique = accounts.filter((account, index, list) =>
    list.findIndex((item) => item.accountId === account.accountId) === index,
  );
  const selected = parsed.data.accountId
    ? unique.filter((account) => account.accountId === parsed.data.accountId)
    : unique;
  if (parsed.data.accountId && !selected.length) {
    throw new AgentApiOperationError("LinkedIn account not found or not connected.", 404);
  }

  const errors: string[] = [];
  const inboxes = await Promise.all(
    selected.map(async (account) => {
      try {
        return await listLinkedInInbox({
          accountId: account.accountId,
          limit: parsed.data.limit,
          messageLimit: 50,
          includeMessageHistory: false,
        });
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "LinkedIn inbox could not be loaded.");
        return [];
      }
    }),
  );

  const query = parsed.data.query?.toLocaleLowerCase();
  const threads = dedupeLinkedInInboxThreads(inboxes.flat())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .filter((thread) => {
      if (!query) return true;
      return [thread.profileName, thread.title, thread.messages.at(-1)?.body].some((value) =>
        (value || "").toLocaleLowerCase().includes(query),
      );
    })
    .slice(0, parsed.data.limit);

  return {
    threads,
    senderAccounts: selected.map((account) => ({
      accountId: account.accountId,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
    })),
    error: errors.length ? "LinkedIn messages could not be loaded from Unipile." : undefined,
  };
}

export async function getChatMessagesResource(context: AgentApiContext, payload: unknown) {
  const parsed = z
    .object({
      chatId: z.string().trim().min(1),
      accountId: z.string().trim().min(1).optional(),
      cursor: z.string().trim().min(1).optional(),
      limit: z.number().int().min(1).max(50).default(30),
    })
    .safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("chatId is required.", 400, parsed.error.flatten());
  }

  const account = await requireOwnedInboxAccount(context, parsed.data.accountId);
  if (!(await linkedInChatBelongsToAccount(parsed.data.chatId, account.accountId))) {
    throw new AgentApiOperationError("Chat not found.", 404);
  }

  return listLinkedInChatMessagesPage({
    chatId: parsed.data.chatId,
    limit: parsed.data.limit,
    cursor: parsed.data.cursor,
  });
}

export async function replyToChatResource(context: AgentApiContext, payload: unknown) {
  const parsed = z
    .object({
      chatId: z.string().trim().min(1),
      accountId: z.string().trim().min(1).optional(),
      message: z.string().trim().max(4000).optional(),
      leadId: z.string().trim().min(1).optional(),
      attachments: z.array(attachmentSchema).max(5).optional(),
    })
    .safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid chat reply payload.", 400, parsed.error.flatten());
  }

  const files = filesFromAttachments(parsed.data.attachments);
  const body = parsed.data.message?.trim() || "";
  if (!body && !files.length) {
    throw new AgentApiOperationError("Message cannot be empty.", 400);
  }

  const account = await requireOwnedInboxAccount(context, parsed.data.accountId);
  if (!(await linkedInChatBelongsToAccount(parsed.data.chatId, account.accountId))) {
    throw new AgentApiOperationError("Chat not found.", 404);
  }

  if (
    !(await hasDailyQuotaRemaining(
      context.workspace.id,
      "messages",
      context.workspace.settings.dailyMessageLimit,
      context.workspace.timezone,
    ))
  ) {
    throw new AgentApiOperationError("Daily message limit reached. Try again tomorrow.", 429);
  }
  const nextSlotAllowedAt = await claimActionSlot(context.workspace.id, account.id);
  if (nextSlotAllowedAt) {
    throw new AgentApiOperationError(
      `This LinkedIn account can send again at ${nextSlotAllowedAt}.`,
      429,
    );
  }

  const result = await sendLinkedInChatMessage({
    chatId: parsed.data.chatId,
    accountId: account.accountId,
    body,
    attachments: files,
  });
  await consumeDailyQuota(
    context.workspace.id,
    "messages",
    context.workspace.settings.dailyMessageLimit,
    context.workspace.timezone,
  );
  if (parsed.data.leadId && body) {
    await createConversationMessage({
      workspaceId: context.workspace.id,
      leadId: parsed.data.leadId,
      userId: context.workspace.id,
      senderName: "You",
      body,
      direction: "outbound",
      providerMessageId: result.id,
    });
  }

  return { ok: true, chatId: parsed.data.chatId, sent: true };
}

export async function completeFollowUpResource(context: AgentApiContext, payload: unknown) {
  const parsed = leadIdSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("leadId is required.", 400, parsed.error.flatten());
  }
  try {
    await completeConversationManualFollowUp(context.workspace.id, parsed.data.leadId);
  } catch (error) {
    asAgentError(error, "Could not mark that follow-up done.", 404);
  }
  return { ok: true, leadId: parsed.data.leadId, completed: true };
}
