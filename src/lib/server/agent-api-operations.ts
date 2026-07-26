import "server-only";

import { z } from "zod";
export { agentMcpTools, agentToolInputSchemas } from "@/lib/agent-tools";
import {
  consumeDailyQuota,
  hasDailyQuotaRemaining,
  createAgent,
  getAgent,
  createConversationMessage,
  deleteAgent,
  findLeadForWorkspace,
  getCampaign,
  getConversation,
  getDailyQuotaUsage,
  getLinkedInAccountForWorkspace,
  getProductProfile,
  listAgents,
  listAutomationRuns,
  listCampaignEnrollments,
  listCampaigns,
  listLinkedInAccounts,
  listConversations,
  listGroups,
  listLeads,
  pauseAgent,
  resumeAgent,
  setSendWindowForGroup,
  updateAgent,
  updateLead,
  updateWorkspaceSettings,
  updateWorkspaceTimezone,
  upsertProductProfile,
} from "./data";
import { sumAgentLeadTotals } from "@/lib/agent-lead-totals";
import { listScheduledActions } from "./scheduled-actions";
import { SPACING_MINUTES } from "./send-schedule";
import { sendLinkedInMessage } from "./unipile";
import { isValidTimeZone, resolveTimeZone } from "@/lib/time-zone";
import type { AgentApiContext } from "./agent-api";
import type { Agent, Campaign } from "./types";

export class AgentApiOperationError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Every targeting field is mandatory regardless of mode - an agent may not
// run with a partial setup (matches the createAgent/updateAgent guard in data.ts).
const agentFiltersSchema = z.object({
  titles: z.array(z.string().trim().min(1)).min(1, "at least one job title is required"),
  industries: z.array(z.string().trim().min(1)).min(1, "at least one industry is required"),
  locations: z.array(z.string().trim().min(1)).min(1, "at least one location is required"),
  keywords: z.array(z.string().trim().min(1)).min(1, "at least one keyword is required"),
});

const agentSignalSourcesSchema = z.object({
  competitorUrls: z.array(z.string().trim().min(1)).default([]),
  founderUrls: z.array(z.string().trim().min(1)).default([]),
  keywords: z.array(z.string().trim().min(1)).default([]),
});

const sendWindowSchema = z.enum(["always", "business", "extended"]);

export const createAgentPayloadSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  groupName: z.string().trim().min(1).max(120),
  linkedInAccountId: z.string().trim().min(1).optional(),
  mode: z.enum(["prompt", "filters", "signals"]).default("signals"),
  prompt: z.string().trim().min(1, "prompt is required").max(4000),
  filters: agentFiltersSchema,
  signalSources: agentSignalSourcesSchema.default({
    competitorUrls: [],
    founderUrls: [],
    keywords: [],
  }),
});

// Partial edit: omitted fields keep the agent's current values, exactly like
// the prefilled UI edit form.
export const updateAgentPayloadSchema = z.object({
  agentId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  groupName: z.string().trim().min(1).max(120).optional(),
  linkedInAccountId: z.string().trim().min(1).optional(),
  mode: z.enum(["prompt", "filters", "signals"]).optional(),
  prompt: z.string().trim().min(1).max(4000).optional(),
  filters: agentFiltersSchema.optional(),
  signalSources: agentSignalSourcesSchema.optional(),
  // The window lives on the campaigns built on this agent's lead group, so a
  // change here applies to all of them - exactly what the agent edit form does.
  sendWindow: sendWindowSchema.optional(),
  status: z.enum(["active", "paused"]).optional(),
});

const stringList = z.array(z.string().trim().min(1)).optional();

export const updateProductProfilePayloadSchema = z.object({
  websiteUrl: z.string().trim().max(500).optional(),
  description: z.string().trim().max(8000).optional(),
  companyName: z.string().trim().max(200).optional(),
  industry: z.string().trim().max(200).optional(),
  companySize: z.string().trim().max(120).optional(),
  painPointsText: z.string().trim().max(8000).optional(),
  keyFeatures: stringList,
  socialProof: stringList,
  linkedInCompanyPage: z.string().trim().max(500).optional(),
  useCases: stringList,
  targetBuyers: stringList,
  buyerTitles: stringList,
  roleVocabulary: stringList,
  industries: stringList,
  companySizes: stringList,
  painPoints: stringList,
  keywords: stringList,
  preferredLocations: stringList,
  averageTicketSize: z.number().nonnegative().optional(),
});

// Same bounds as the human settings form (saveSettingsAction); omitted fields
// keep their current values.
export const updateSettingsPayloadSchema = z.object({
  dailyInviteLimit: z.number().int().min(1).max(100).optional(),
  dailyMessageLimit: z.number().int().min(1).max(200).optional(),
  firstMessageDelayMinutes: z.number().int().min(5).max(10080).optional(),
  aiFollowUpDelayMinutes: z.number().int().min(0).max(10080).optional(),
  aiFollowUpEnabled: z.boolean().optional(),
  // Stored on the workspace rather than in settings, but it is the same picker
  // on the same Settings page - and it decides which local day the daily caps
  // reset on and when each send window opens.
  timeZone: z.string().trim().min(1).max(80).optional(),
});

export const listLeadsPayloadSchema = z.object({
  groupId: z.string().trim().min(1).optional(),
  query: z.string().trim().max(200).optional(),
  minFitScore: z.number().min(0).max(100).optional(),
  outreachStatus: z.enum(["new", "invited", "connected", "messaged", "replied", "declined", "stopped"]).optional(),
  sortBy: z.enum(["fit_score_desc", "fit_score_asc", "newest", "oldest"]).default("fit_score_desc"),
  limit: z.number().int().min(1).max(200).default(100),
});

export const getLeadPayloadSchema = z.object({
  leadId: z.string().trim().min(1),
});

export const listConversationsPayloadSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
});

export const listActivityPayloadSchema = z.object({
  limit: z.number().int().min(1).max(200).default(100),
});

export const listScheduledActionsPayloadSchema = z.object({
  // Only the leads a single lead finder sourced, matching the Actions page filter.
  agentId: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

export async function getAgentWorkspaceContext(context: AgentApiContext) {
  const workspaceId = context.workspace.id;
  const [profile, linkedInAccounts, agents, groups, leads, quotaUsage] =
    await Promise.all([
      getProductProfile(workspaceId),
      listLinkedInAccounts(workspaceId),
      listAgents(workspaceId),
      listGroups(workspaceId),
      listLeads(workspaceId),
      getDailyQuotaUsage(workspaceId, context.workspace.timezone),
    ]);

  const timeZone = resolveTimeZone(context.workspace.timezone);
  const [today, usedToday] = Object.entries(quotaUsage)[0] || [
    "",
    { invites: 0, messages: 0 },
  ];
  const { dailyInviteLimit, dailyMessageLimit } = context.workspace.settings;

  return {
    workspace: {
      id: context.workspace.id,
      name: context.workspace.name,
      billingStatus: context.workspace.billing?.status ?? null,
      // Every timestamp this API returns is a UTC ISO instant; the workspace
      // renders and counts all of them in this zone, so report times in it.
      timeZone,
      settings: context.workspace.settings,
    },
    // What the scheduler will actually allow today, so progress can be
    // explained without guessing why a queue is not moving.
    sending: {
      timeZone,
      today,
      invites: {
        used: usedToday.invites,
        limit: dailyInviteLimit,
        remaining: Math.max(0, dailyInviteLimit - usedToday.invites),
      },
      messages: {
        used: usedToday.messages,
        limit: dailyMessageLimit,
        remaining: Math.max(0, dailyMessageLimit - usedToday.messages),
      },
      // Invites, follow-ups and replies share one line per LinkedIn account.
      spacingMinutes: SPACING_MINUTES,
      guidance:
        "Caps reset at local midnight in timeZone. Each lead finder's send window (always, business, extended) decides the hours its outreach may go out, measured in each lead's own time zone (resolved from their profile location; timeZone is the fallback when it cannot be). Use omentir_list_scheduled_actions for the exact planned send times.",
    },
    setup: {
      hasProductProfile: Boolean(profile?.description?.trim()),
      linkedInConnected: linkedInAccounts.length > 0,
      linkedInDisplayName: linkedInAccounts[0]?.displayName ?? null,
      // Full list so a caller can pick a specific `linkedInAccountId` when the
      // workspace has more than one connected account.
      linkedInAccounts: linkedInAccounts.map((account) => ({
        id: account.id,
        accountId: account.accountId,
        displayName: account.displayName,
        status: account.status,
      })),
    },
    productProfile: profile
      ? {
          companyName: profile.companyName,
          websiteUrl: profile.websiteUrl,
          description: profile.description,
          targetBuyers: profile.targetBuyers,
          buyerTitles: profile.buyerTitles,
          industries: profile.industries,
          preferredLocations: profile.preferredLocations,
          painPoints: profile.painPoints,
          keywords: profile.keywords,
          averageTicketSize: profile.averageTicketSize ?? null,
        }
      : null,
    counts: {
      agents: agents.length,
      groups: groups.length,
      leads: leads.length,
    },
    resources: {
      mcp: "/api/agent/v1/mcp",
      productProfile: "/api/agent/v1/product-profile",
      linkedinAccounts: "/api/agent/v1/linkedin-accounts",
      agents: "/api/agent/v1/agents",
      groups: "/api/agent/v1/groups",
      leads: "/api/agent/v1/leads",
      activity: "/api/agent/v1/activity",
      scheduledActions: "/api/agent/v1/scheduled-actions",
      conversations: "/api/agent/v1/conversations",
      stats: "/api/agent/v1/stats",
      settings: "/api/agent/v1/settings",
      openapi: "/api/agent/v1/openapi.json",
      guide: "/agents.md",
    },
  };
}

// Headline numbers shown on the Omentir dashboard, computed with the exact
// same rules as dashboard-view.tsx so the API and the UI never disagree.
// Unlike the dashboard, these are all-time totals (the API has no range picker).
export async function getWorkspaceStatsResource(context: AgentApiContext) {
  const workspaceId = context.workspace.id;
  const [profile, leads, enrollments, agents, groups] = await Promise.all([
    getProductProfile(workspaceId),
    listLeads(workspaceId),
    listCampaignEnrollments(workspaceId),
    listAgents(workspaceId),
    listGroups(workspaceId),
  ]);

  const totalLeads = leads.length;
  const hotOpportunities = sumAgentLeadTotals(agents, groups, leads);
  const invitationsSent = enrollments.filter((enrollment) =>
    ["connection_sent", "connected", "message_sent", "reply_received", "replied"].includes(
      enrollment.status,
    ),
  ).length;
  const messagesSent = enrollments.filter((enrollment) =>
    ["message_sent", "reply_received", "replied"].includes(enrollment.status),
  ).length;
  const repliesReceived = enrollments.filter((enrollment) =>
    ["reply_received", "replied"].includes(enrollment.status),
  ).length;
  const averageTicketSize = profile?.averageTicketSize;
  const pipelineGenerated =
    averageTicketSize !== undefined ? hotOpportunities * averageTicketSize : null;

  return {
    stats: {
      totalLeads,
      hotOpportunities,
      invitationsSent,
      messagesSent,
      repliesReceived,
      averageTicketSize: averageTicketSize ?? null,
      pipelineGenerated,
      activeAgents: agents.filter(
        (agent) => agent.status === "active" || agent.status === "running",
      ).length,
      pausedAgents: agents.filter((agent) => agent.status === "paused").length,
    },
  };
}

// The send window is stored on the campaigns built on an agent's lead group, so
// an agent's effective window has to be read back from them. An agent with no
// campaign discovers leads but never sends: campaigns are created in the
// Omentir app, not over this API, and that distinction is the difference
// between "no leads contacted yet" and "outreach was never set up".
function agentOutreachSummary(agent: Agent, campaigns: Campaign[]) {
  const own = campaigns.filter((campaign) => campaign.groupId === agent.targetGroupId);
  const active = own.filter((campaign) => campaign.status === "active");
  return {
    // Unset on a campaign means the historical round-the-clock behaviour.
    sendWindow: (active[0] || own[0])?.sendWindow || (own.length ? "always" : null),
    outreach: {
      configured: own.length > 0,
      activeSequences: active.length,
      replyHandling: (active[0] || own[0])?.replyHandling || null,
    },
  };
}

export async function listAgentResources(context: AgentApiContext) {
  const [agents, campaigns] = await Promise.all([
    listAgents(context.workspace.id),
    listCampaigns(context.workspace.id),
  ]);

  return {
    timeZone: resolveTimeZone(context.workspace.timezone),
    agents: agents.map((agent) => ({
      ...agent,
      ...agentOutreachSummary(agent, campaigns),
    })),
  };
}

export async function getProductProfileResource(context: AgentApiContext) {
  return { productProfile: await getProductProfile(context.workspace.id) };
}

export async function updateProductProfileResource(context: AgentApiContext, payload: unknown) {
  const parsed = updateProductProfilePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid product profile payload.", 400, parsed.error.flatten());
  }

  const current = await getProductProfile(context.workspace.id);
  const timestampSafeProfile = {
    websiteUrl: current?.websiteUrl || "",
    description: current?.description || "",
    companyName: current?.companyName || "",
    industry: current?.industry || "",
    companySize: current?.companySize || "",
    painPointsText: current?.painPointsText || "",
    keyFeatures: current?.keyFeatures || [],
    socialProof: current?.socialProof || [],
    linkedInCompanyPage: current?.linkedInCompanyPage || "",
    useCases: current?.useCases || [],
    targetBuyers: current?.targetBuyers || [],
    buyerTitles: current?.buyerTitles || [],
    roleVocabulary: current?.roleVocabulary || [],
    industries: current?.industries || [],
    companySizes: current?.companySizes || [],
    painPoints: current?.painPoints || [],
    keywords: current?.keywords || [],
    preferredLocations: current?.preferredLocations || [],
    averageTicketSize: current?.averageTicketSize,
  };

  const profile = await upsertProductProfile(context.workspace.id, {
    ...timestampSafeProfile,
    ...parsed.data,
  });

  return { productProfile: profile };
}

export async function createAgentResource(context: AgentApiContext, payload: unknown) {
  const parsed = createAgentPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid agent payload.", 400, parsed.error.flatten());
  }

  const input = parsed.data;
  // Same requirement as the UI: an agent needs a connected LinkedIn account
  // to run discovery. Falls back to the workspace's first account when the
  // payload doesn't pick one.
  const account = await getLinkedInAccountForWorkspace(
    context.workspace.id,
    input.linkedInAccountId,
  );
  if (!account) {
    throw new AgentApiOperationError(
      input.linkedInAccountId
        ? "LinkedIn account not found or not connected."
        : "Connect LinkedIn in Omentir before creating an agent.",
      409,
    );
  }

  const agent = await createAgent(context.workspace.id, {
    name: input.name || input.groupName,
    mode: input.mode,
    prompt: input.prompt,
    filters: input.filters,
    signalSources: input.signalSources,
    linkedInAccountId: account.id,
    targetGroupName: input.groupName,
  });

  return {
    agent,
    leadGroup: { id: agent.targetGroupId, name: agent.targetGroupName },
    discovery: {
      status: "scheduled",
      // The first run is due immediately - discovery is not scheduled for some
      // later hour - and repeats daily at this instant's local wall-clock time.
      nextRunAt: agent.nextRunAt,
      repeats: "daily at the time the agent was created",
      timeZone: resolveTimeZone(context.workspace.timezone),
      guidance: "Use omentir_list_leads with this lead group id to inspect results.",
    },
    // A new lead finder only discovers and scores people. Outreach sequences
    // are built in the Omentir app, so say so rather than implying messages
    // will start going out on their own.
    outreach: {
      configured: false,
      guidance:
        "This lead finder discovers and scores leads only. Set up its outreach sequence in Omentir under Agents; after that omentir_list_scheduled_actions shows the planned sends.",
    },
  };
}

export async function updateAgentResource(context: AgentApiContext, payload: unknown) {
  const parsed = updateAgentPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid agent update payload.", 400, parsed.error.flatten());
  }

  const input = parsed.data;
  const agent = await getAgent(context.workspace.id, input.agentId);
  if (!agent) throw new AgentApiOperationError("Agent not found.", 404);

  // Switching the discovery account must point at a connected account in this
  // workspace, same as the UI account picker.
  let linkedInAccountId = agent.linkedInAccountId;
  if (input.linkedInAccountId) {
    const account = await getLinkedInAccountForWorkspace(
      context.workspace.id,
      input.linkedInAccountId,
    );
    if (!account) {
      throw new AgentApiOperationError("LinkedIn account not found or not connected.", 409);
    }
    linkedInAccountId = account.id;
  }

  const changesAgentConfiguration = [
    input.name,
    input.mode,
    input.prompt,
    input.filters,
    input.signalSources,
    input.linkedInAccountId,
    input.groupName,
  ].some((value) => value !== undefined);
  let updated = agent;
  if (changesAgentConfiguration) {
    updated = await updateAgent(context.workspace.id, agent.id, {
      name: input.name ?? agent.name,
      mode: input.mode ?? agent.mode,
      prompt: input.prompt ?? agent.prompt,
      filters: input.filters ?? agent.filters,
      signalSources: input.signalSources ?? agent.signalSources,
      ...(linkedInAccountId ? { linkedInAccountId } : {}),
      targetGroupName: input.groupName ?? agent.targetGroupName,
    });
  }
  if (input.status === "paused") {
    await pauseAgent(context.workspace.id, agent.id);
    updated = { ...updated, status: "paused" };
  } else if (input.status === "active") {
    await resumeAgent(context.workspace.id, agent.id);
    updated = { ...updated, status: "active" };
  }

  // Applied to every sequence built on this agent's lead group, like the window
  // picker on the agent edit form.
  const sequencesRewindowed =
    input.sendWindow === undefined
      ? 0
      : await setSendWindowForGroup(context.workspace.id, updated.targetGroupId, input.sendWindow);

  return {
    agent: updated,
    ...(input.sendWindow === undefined
      ? {}
      : { sendWindow: input.sendWindow, sequencesRewindowed }),
  };
}

export async function updateWorkspaceSettingsResource(context: AgentApiContext, payload: unknown) {
  const parsed = updateSettingsPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid settings payload.", 400, parsed.error.flatten());
  }

  const { timeZone, ...settingsInput } = parsed.data;
  // Drop keys sent explicitly as undefined/null-ish: updateWorkspaceSettings
  // merges over current settings, and Firestore rejects undefined values.
  const patch = Object.fromEntries(
    Object.entries(settingsInput).filter(([, value]) => value !== undefined),
  );
  if (!Object.keys(patch).length && !timeZone) {
    throw new AgentApiOperationError("Provide at least one setting to update.", 400);
  }
  // Rejected rather than stored: a bad zone would silently reinterpret every
  // send window and daily cap reset in the workspace.
  if (timeZone && !isValidTimeZone(timeZone)) {
    throw new AgentApiOperationError(
      'Unknown time zone. Use an IANA name such as "America/New_York".',
      400,
    );
  }

  const [settings] = await Promise.all([
    Object.keys(patch).length
      ? updateWorkspaceSettings(context.workspace.id, patch)
      : Promise.resolve(context.workspace.settings),
    timeZone ? updateWorkspaceTimezone(context.workspace.id, timeZone) : Promise.resolve(),
  ]);

  return {
    settings,
    timeZone: resolveTimeZone(timeZone || context.workspace.timezone),
  };
}

export async function listLeadResources(context: AgentApiContext, payload: unknown) {
  const parsed = listLeadsPayloadSchema.safeParse(payload || {});
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid leads payload.", 400, parsed.error.flatten());
  }

  const { groupId, query, minFitScore, outreachStatus, sortBy, limit } = parsed.data;
  let leads = await listLeads(context.workspace.id, groupId, 500);
  const normalizedQuery = query?.toLocaleLowerCase();

  if (normalizedQuery) {
    leads = leads.filter((lead) =>
      [lead.name, lead.title, lead.company, lead.location, lead.summary]
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }
  if (minFitScore !== undefined) leads = leads.filter((lead) => lead.fitScore >= minFitScore);
  if (outreachStatus) leads = leads.filter((lead) => lead.outreachStatus === outreachStatus);

  leads.sort((a, b) => {
    if (sortBy === "fit_score_asc") return a.fitScore - b.fitScore;
    if (sortBy === "newest") return b.createdAt.localeCompare(a.createdAt);
    if (sortBy === "oldest") return a.createdAt.localeCompare(b.createdAt);
    return b.fitScore - a.fitScore;
  });

  return { leads: leads.slice(0, limit), totalMatched: leads.length, returned: Math.min(leads.length, limit) };
}

export async function getLeadResource(context: AgentApiContext, payload: unknown) {
  const parsed = getLeadPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid lead payload.", 400, parsed.error.flatten());
  }
  const lead = await findLeadForWorkspace({
    workspaceId: context.workspace.id,
    leadId: parsed.data.leadId,
  });
  if (!lead) throw new AgentApiOperationError("Lead not found.", 404);
  return { lead };
}

export async function listConversationResources(context: AgentApiContext, payload: unknown) {
  const parsed = listConversationsPayloadSchema.safeParse(payload || {});
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid conversations payload.", 400, parsed.error.flatten());
  }

  return {
    conversations: await listConversations(context.workspace.id, parsed.data.limit),
  };
}

const agentIdPayloadSchema = z.object({ agentId: z.string().trim().min(1) });

export const replyToLeadPayloadSchema = z.object({
  leadId: z.string().trim().min(1),
  message: z.string().trim().min(1).max(4000),
});

async function requireOwnedAgent(context: AgentApiContext, payload: unknown): Promise<Agent> {
  const parsed = agentIdPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid agent payload.", 400, parsed.error.flatten());
  }
  const agent = await getAgent(context.workspace.id, parsed.data.agentId);
  if (!agent) throw new AgentApiOperationError("Agent not found.", 404);
  return agent;
}

export async function pauseAgentResource(context: AgentApiContext, payload: unknown) {
  const agent = await requireOwnedAgent(context, payload);
  await pauseAgent(context.workspace.id, agent.id);
  return { ok: true, agentId: agent.id, status: "paused" };
}

export async function resumeAgentResource(context: AgentApiContext, payload: unknown) {
  const agent = await requireOwnedAgent(context, payload);
  await resumeAgent(context.workspace.id, agent.id);
  return { ok: true, agentId: agent.id, status: "active" };
}

export async function deleteAgentResource(context: AgentApiContext, payload: unknown) {
  const agent = await requireOwnedAgent(context, payload);
  await deleteAgent(context.workspace.id, agent.id);
  return { ok: true, agentId: agent.id, deleted: true };
}

export async function listGroupResources(context: AgentApiContext) {
  return { groups: await listGroups(context.workspace.id) };
}

export async function listLinkedInAccountResources(context: AgentApiContext) {
  const accounts = await listLinkedInAccounts(context.workspace.id);
  return {
    linkedInAccounts: accounts.map((account) => ({
      id: account.id,
      accountId: account.accountId,
      displayName: account.displayName,
      status: account.status,
      createdAt: account.createdAt,
    })),
  };
}

export async function listActivityResources(context: AgentApiContext, payload: unknown) {
  const parsed = listActivityPayloadSchema.safeParse(payload || {});
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid activity payload.", 400, parsed.error.flatten());
  }

  return { activity: await listAutomationRuns(context.workspace.id, parsed.data.limit) };
}

// The Actions page feed: every outreach action already assigned a real send
// time by the planner, in send order. These are committed slots rather than
// "now + delay" estimates, so they can be reported to a user as exact times.
export async function listScheduledActionResources(
  context: AgentApiContext,
  payload: unknown,
) {
  const parsed = listScheduledActionsPayloadSchema.safeParse(payload || {});
  if (!parsed.success) {
    throw new AgentApiOperationError(
      "Invalid scheduled actions payload.",
      400,
      parsed.error.flatten(),
    );
  }

  const { agentId, limit } = parsed.data;
  if (agentId && !(await getAgent(context.workspace.id, agentId))) {
    throw new AgentApiOperationError("Agent not found.", 404);
  }

  const actions = await listScheduledActions(context.workspace.id, { agentId });

  return {
    // Each `at` is a UTC instant the workspace reads in this zone.
    timeZone: resolveTimeZone(context.workspace.timezone),
    scheduledActions: actions.slice(0, limit),
    totalScheduled: actions.length,
    returned: Math.min(actions.length, limit),
  };
}

export async function replyToLeadResource(context: AgentApiContext, payload: unknown) {
  const parsed = replyToLeadPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AgentApiOperationError("Invalid reply payload.", 400, parsed.error.flatten());
  }

  const lead = await findLeadForWorkspace({
    workspaceId: context.workspace.id,
    leadId: parsed.data.leadId,
  });
  if (!lead) throw new AgentApiOperationError("Lead not found.", 404);

  // Agents may only continue conversations that already exist in Omentir.
  const conversation = await getConversation(context.workspace.id, lead.id);
  if (!conversation?.messages?.length) {
    throw new AgentApiOperationError(
      "No existing conversation with this lead.",
      409,
    );
  }

  const campaign = conversation.campaignId
    ? await getCampaign(context.workspace.id, conversation.campaignId)
    : null;
  const account = await getLinkedInAccountForWorkspace(
    context.workspace.id,
    campaign?.linkedInAccountId,
  );
  if (!account) {
    throw new AgentApiOperationError("No connected LinkedIn account.", 409);
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

  const sendResult = await sendLinkedInMessage({
    accountId: account.accountId,
    providerProfileId: lead.providerProfileId,
    linkedInUrl: lead.linkedInUrl,
    body: parsed.data.message,
  });
  // Count only after Unipile accepts so rejected sends don't burn the budget.
  await consumeDailyQuota(
    context.workspace.id,
    "messages",
    context.workspace.settings.dailyMessageLimit,
    context.workspace.timezone,
  );
  await createConversationMessage({
    workspaceId: context.workspace.id,
    leadId: lead.id,
    campaignId: conversation.campaignId,
    userId: context.workspace.id,
    senderName: "You",
    body: parsed.data.message,
    direction: "outbound",
    providerMessageId: sendResult.id,
  });
  await updateLead(context.workspace.id, lead.id, { outreachStatus: "replied" });

  return { ok: true, leadId: lead.id, sent: true };
}

export async function callAgentTool(
  context: AgentApiContext,
  name: string,
  args: unknown,
) {
  if (name === "omentir_get_context") return getAgentWorkspaceContext(context);
  if (name === "omentir_get_stats") return getWorkspaceStatsResource(context);
  if (name === "omentir_list_agents") return listAgentResources(context);
  if (name === "omentir_get_product_profile") return getProductProfileResource(context);
  if (name === "omentir_update_product_profile") return updateProductProfileResource(context, args);
  if (name === "omentir_create_agent") return createAgentResource(context, args);
  if (name === "omentir_update_agent") return updateAgentResource(context, args);
  if (name === "omentir_update_settings") return updateWorkspaceSettingsResource(context, args);
  if (name === "omentir_list_leads") return listLeadResources(context, args);
  if (name === "omentir_get_lead") return getLeadResource(context, args);
  if (name === "omentir_list_conversations") return listConversationResources(context, args);
  if (name === "omentir_list_groups") return listGroupResources(context);
  if (name === "omentir_list_linkedin_accounts") return listLinkedInAccountResources(context);
  if (name === "omentir_list_activity") return listActivityResources(context, args);
  if (name === "omentir_list_scheduled_actions")
    return listScheduledActionResources(context, args);
  if (name === "omentir_pause_agent") return pauseAgentResource(context, args);
  if (name === "omentir_resume_agent") return resumeAgentResource(context, args);
  if (name === "omentir_delete_agent") return deleteAgentResource(context, args);
  if (name === "omentir_reply_to_lead") return replyToLeadResource(context, args);
  throw new AgentApiOperationError(`Unknown tool: ${name}`, 404);
}
