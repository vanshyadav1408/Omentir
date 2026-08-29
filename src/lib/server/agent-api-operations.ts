import "server-only";

import { z } from "zod";
export { agentMcpTools, agentToolInputSchemas } from "@/lib/agent-tools";
import {
  claimActionSlot,
  consumeDailyQuota,
  hasDailyQuotaRemaining,
  createAgent,
  createCampaign,
  enrollGroupInCampaign,
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
  setOutreachPolicyForGroup,
  setSendWindowForGroup,
  updateAgent,
  updateLead,
  updateWorkspaceSettings,
  updateWorkspaceTimezone,
  upsertProductProfile,
} from "./data";
import { sumAgentLeadTotals } from "@/lib/agent-lead-totals";
import { buildDefaultAiOutreachSteps } from "./campaign-sequence";
import { listScheduledActions } from "./scheduled-actions";
import { SPACING_MINUTES } from "./send-schedule";
import { normalizeSchedulingLink, resolveBookingLink } from "@/lib/scheduling-link";
import { sendLinkedInMessage } from "./unipile";
import { isValidTimeZone, resolveTimeZone } from "@/lib/time-zone";
import { effectiveSendLimits } from "@/lib/linkedin-warmup";
import type { AgentApiContext } from "./agent-api";
import type { Agent, Campaign, CampaignReplyHandling, SendWindow } from "./types";
import {
  productProfileIsReadyForSteal,
  targetingFromProductProfile,
} from "@/lib/steal-customers-targeting";
import {
  STAGE_CONTACTED,
  STAGE_MESSAGED,
  STAGE_REPLIED,
  countAcceptedConnections,
  combinedOutreachStage,
} from "@/lib/outreach-stage";

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

// Matches the three "When a lead replies" choices on the agent setup form.
const replyHandlingSchema = z.enum(["handoff", "ai_until_interest", "ai_until_booked"]);

const bookingLinkSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => !value || normalizeSchedulingLink(value) !== null,
    "Use a valid https://cal.com or https://calendly.com demo booking link.",
  );

// Shared outreach fields: creating or updating a lead finder can set the same
// reply mode, calendar link, and handoff-email preference the GUI controls.
const agentOutreachFields = {
  // When true (or when replyHandling is set on create), attach the default AI
  // connection + 3-message sequence used by the app launch form.
  setupOutreach: z.boolean().optional(),
  replyHandling: replyHandlingSchema.optional(),
  // Per-agent override for ai_until_booked. Empty falls back to My Product.
  bookingLink: bookingLinkSchema.optional(),
  // Only used when replyHandling is handoff (stop after first reply / manual).
  // Default true so the user is emailed when the first reply lands.
  notifyOnReply: z.boolean().optional(),
  sendWindow: sendWindowSchema.optional(),
} as const;

export const createAgentPayloadSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    groupName: z.string().trim().min(1).max(120),
    linkedInAccountId: z.string().trim().min(1).optional(),
    mode: z
      .enum(["prompt", "filters", "signals", "steal_customers"])
      .default("signals"),
    // Optional for steal_customers: My Product fills prompt/filters server-side.
    prompt: z.string().trim().max(4000).optional(),
    filters: agentFiltersSchema.optional(),
    signalSources: agentSignalSourcesSchema.default({
      competitorUrls: [],
      founderUrls: [],
      keywords: [],
    }),
    ...agentOutreachFields,
  })
  .superRefine((value, ctx) => {
    if (value.mode === "steal_customers") {
      const competitorUrls = value.signalSources?.competitorUrls || [];
      const founderUrls = value.signalSources?.founderUrls || [];
      if (!competitorUrls.length && !founderUrls.length) {
        ctx.addIssue({
          code: "custom",
          path: ["signalSources"],
          message:
            "Steal Customers requires at least one competitorUrls or founderUrls LinkedIn URL (company, founder, or employee profile).",
        });
      }
      return;
    }
    if (!value.prompt?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["prompt"],
        message: "prompt is required",
      });
    }
    if (!value.filters) {
      ctx.addIssue({
        code: "custom",
        path: ["filters"],
        message: "filters are required",
      });
    }
  });

// Partial edit: omitted fields keep the agent's current values, exactly like
// the prefilled UI edit form.
export const updateAgentPayloadSchema = z.object({
  agentId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  groupName: z.string().trim().min(1).max(120).optional(),
  linkedInAccountId: z.string().trim().min(1).optional(),
  mode: z.enum(["prompt", "filters", "signals", "steal_customers"]).optional(),
  prompt: z.string().trim().min(1).max(4000).optional(),
  filters: agentFiltersSchema.optional(),
  signalSources: agentSignalSourcesSchema.optional(),
  // The window lives on the campaigns built on this agent's lead group, so a
  // change here applies to all of them - exactly what the agent edit form does.
  status: z.enum(["active", "paused"]).optional(),
  ...agentOutreachFields,
});

const stringList = z.array(z.string().trim().min(1)).optional();

export const updateProductProfilePayloadSchema = z.object({
  websiteUrl: z.string().trim().max(500).optional(),
  description: z.string().trim().max(8000).optional(),
  companyName: z.string().trim().max(200).optional(),
  industry: z.string().trim().max(200).optional(),
  companySize: z.string().trim().max(120).optional(),
  painPointsText: z.string().trim().max(8000).optional(),
  pricingDetails: z.string().trim().max(4000).optional(),
  schedulingLink: z.string().trim().max(500).refine(
    (value) => normalizeSchedulingLink(value) !== null,
    "Use a valid https://cal.com or https://calendly.com demo booking link.",
  ).optional(),
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
  const sendLimits = effectiveSendLimits(
    context.workspace.settings,
    linkedInAccounts[0] || null,
  );
  const { dailyInviteLimit, dailyMessageLimit } = sendLimits;

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
      // Invites and follow-ups share one line per LinkedIn account. AI replies
      // skip the send window and that queue, then wait a random 2-15 minutes.
      spacingMinutes: SPACING_MINUTES,
      guidance:
        "Caps reset at local midnight in timeZone. Each lead finder's send window (always, business, extended) decides the hours connection requests and follow-ups may go out, measured in each lead's own time zone (resolved from their profile location; timeZone is the fallback when it cannot be). AI replies ignore that window and wait a random 2 to 15 minutes after the inbound message. Use omentir_list_scheduled_actions for the exact planned send times of invites and follow-ups.",
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
          // Workspace-wide Calendly/Cal.com link used by until-booked agents
          // when the campaign has no override.
          schedulingLink: profile.schedulingLink || "",
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
// same rules as overview-view.tsx so the API and the UI never disagree.
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
  const acceptedConnections = countAcceptedConnections(leads, enrollments);
  const leadStatusById = new Map(leads.map((lead) => [lead.id, lead.outreachStatus]));
  const stageOf = (enrollment: (typeof enrollments)[number]) =>
    combinedOutreachStage(enrollment.status, leadStatusById.get(enrollment.leadId));
  const invitationsSent = enrollments.filter(
    (enrollment) => stageOf(enrollment) >= STAGE_CONTACTED,
  ).length;
  const messagesSent = enrollments.filter(
    (enrollment) => stageOf(enrollment) >= STAGE_MESSAGED,
  ).length;
  const repliesReceived = enrollments.filter(
    (enrollment) => stageOf(enrollment) >= STAGE_REPLIED,
  ).length;
  const averageTicketSize = profile?.averageTicketSize;
  const pipelineGenerated =
    averageTicketSize !== undefined ? acceptedConnections * averageTicketSize : null;

  return {
    stats: {
      totalLeads,
      hotOpportunities,
      acceptedConnections,
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

// The send window and reply policy live on the campaigns built on an agent's
// lead group, so they have to be read back from those campaigns. An agent with
// no campaign discovers leads but never sends until setupOutreach / the app
// attaches a sequence.
function agentOutreachSummary(agent: Agent, campaigns: Campaign[]) {
  const own = campaigns.filter((campaign) => campaign.groupId === agent.targetGroupId);
  const active = own.filter((campaign) => campaign.status === "active");
  const primary = active[0] || own[0];
  return {
    // Unset on a campaign means the historical round-the-clock behaviour.
    sendWindow: primary?.sendWindow || (own.length ? "always" : null),
    outreach: {
      configured: own.length > 0,
      activeSequences: active.length,
      replyHandling: primary?.replyHandling || null,
      bookingLink: primary?.bookingLink || null,
      notifyOnReply: primary?.notifyOnReply ?? null,
    },
  };
}

async function resolveBookingLinkForMode(
  workspaceId: string,
  replyHandling: CampaignReplyHandling,
  bookingLink?: string,
) {
  if (replyHandling !== "ai_until_booked") return "";
  const fromPayload = bookingLink !== undefined ? normalizeSchedulingLink(bookingLink) : null;
  if (fromPayload === null && bookingLink) {
    throw new AgentApiOperationError(
      "Use a valid https://cal.com or https://calendly.com demo booking link.",
      400,
    );
  }
  if (fromPayload) return fromPayload;
  const profile = await getProductProfile(workspaceId);
  const fromProduct = resolveBookingLink(profile?.schedulingLink);
  if (fromProduct) return fromProduct;
  throw new AgentApiOperationError(
    'Continue-until-booked requires a demo booking link. Pass bookingLink, or set schedulingLink on the product profile with omentir_update_product_profile.',
    400,
  );
}

async function ensureDefaultOutreachCampaign(input: {
  workspaceId: string;
  agent: Agent;
  linkedInAccountId: string;
  replyHandling: CampaignReplyHandling;
  bookingLink: string;
  notifyOnReply: boolean;
  sendWindow: SendWindow;
}) {
  const profile = await getProductProfile(input.workspaceId);
  // AI-written messages need product context, same gate as the app launch path.
  if (!(profile?.description || profile?.painPointsText)) {
    throw new AgentApiOperationError(
      "Add a product profile (description or pain points) before setting up AI outreach.",
      409,
    );
  }

  const campaign = await createCampaign(input.workspaceId, {
    name: `${input.agent.name} outreach`,
    groupId: input.agent.targetGroupId,
    linkedInAccountId: input.linkedInAccountId,
    status: "active",
    steps: buildDefaultAiOutreachSteps(),
    replyHandling: input.replyHandling,
    ...(input.bookingLink ? { bookingLink: input.bookingLink } : {}),
    notifyOnReply: input.notifyOnReply,
    sendWindow: input.sendWindow,
  });
  await enrollGroupInCampaign(input.workspaceId, campaign);
  return campaign;
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
    pricingDetails: current?.pricingDetails || "",
    schedulingLink: current?.schedulingLink || "",
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
  const isStealCustomers = input.mode === "steal_customers";
  const competitorUrls = input.signalSources?.competitorUrls || [];
  const founderUrls = input.signalSources?.founderUrls || [];
  if (isStealCustomers && !competitorUrls.length && !founderUrls.length) {
    throw new AgentApiOperationError(
      "Steal Customers agents need at least one competitor or founder/employee LinkedIn URL in signalSources.",
      400,
    );
  }

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

  let prompt = input.prompt?.trim() || "";
  let filters = input.filters;
  if (isStealCustomers) {
    const productProfile = await getProductProfile(context.workspace.id);
    if (!productProfileIsReadyForSteal(productProfile)) {
      throw new AgentApiOperationError(
        "Set up the product profile (My Product) before creating a Steal Customers agent.",
        409,
      );
    }
    const targeting = targetingFromProductProfile(productProfile);
    prompt = targeting.prompt;
    filters = targeting.filters;
  } else if (!filters) {
    throw new AgentApiOperationError("filters are required.", 400);
  }

  const wantsOutreach =
    isStealCustomers ||
    input.setupOutreach === true ||
    input.replyHandling !== undefined ||
    input.bookingLink !== undefined ||
    input.notifyOnReply !== undefined;

  const agent = await createAgent(context.workspace.id, {
    name: input.name || input.groupName,
    mode: input.mode,
    prompt,
    filters,
    signalSources: isStealCustomers
      ? {
          competitorUrls,
          founderUrls,
          keywords: [],
        }
      : {
          competitorUrls: [],
          founderUrls: [],
          keywords: input.signalSources?.keywords || [],
        },
    linkedInAccountId: account.id,
    targetGroupName: input.groupName,
    leadsOnly: wantsOutreach ? undefined : true,
  });

  // Same launch path as the app: when the caller asks for outreach (or picks a
  // reply mode), attach the default AI sequence and reply policy immediately.
  // Steal customers always needs AI outreach (comment/post context).
  let outreachConfigured = false;
  let outreachSummary: {
    replyHandling: CampaignReplyHandling;
    bookingLink: string | null;
    notifyOnReply: boolean;
    sendWindow: SendWindow;
  } | null = null;

  if (wantsOutreach) {
    const replyHandling = input.replyHandling ?? "ai_until_interest";
    const bookingLink = await resolveBookingLinkForMode(
      context.workspace.id,
      replyHandling,
      input.bookingLink,
    );
    const notifyOnReply = input.notifyOnReply ?? true;
    const sendWindow = input.sendWindow ?? "business";
    try {
      await ensureDefaultOutreachCampaign({
        workspaceId: context.workspace.id,
        agent,
        linkedInAccountId: account.id,
        replyHandling,
        bookingLink,
        notifyOnReply,
        sendWindow,
      });
      outreachConfigured = true;
      outreachSummary = {
        replyHandling,
        bookingLink: bookingLink || null,
        notifyOnReply,
        sendWindow,
      };
    } catch (error) {
      // Roll back the agent so a failed outreach attach does not leave a
      // half-launched finder counting against the plan limit (mirrors the UI).
      try {
        await deleteAgent(context.workspace.id, agent.id);
      } catch (cleanupError) {
        console.error(
          "[agent-api] failed to clean up agent after outreach setup error:",
          cleanupError,
        );
      }
      throw error;
    }
  }

  const isSteal = agent.mode === "steal_customers";
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
      mode: agent.mode,
      guidance: isSteal
        ? "Steal Customers: scans recent competitor and founder/employee posts, keeps fresh intent-bearing comments (max ~7 days), scores likely buyers from My Product, and stores post URL + post text + comment + profile. Use omentir_list_leads / omentir_get_lead on this lead group."
        : "Use omentir_list_leads with this lead group id to inspect results.",
    },
    outreach: outreachConfigured
      ? {
          configured: true,
          ...outreachSummary,
          guidance: isSteal
            ? "AI outreach is required for Steal Customers (manual templates cannot carry post+comment context). replyHandling controls when you are emailed. omentir_list_scheduled_actions shows planned sends."
            : "Default AI outreach is active. replyHandling controls when you are emailed: handoff = first reply, ai_until_interest = qualified interest, ai_until_booked = meeting confirmed. omentir_list_scheduled_actions shows planned sends.",
        }
      : {
          configured: false,
          guidance:
            "This lead finder discovers and scores leads only. Call omentir_update_agent with setupOutreach true (and optional replyHandling / bookingLink), or set up outreach in the Omentir app.",
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

  const nextMode = input.mode ?? agent.mode;
  const nextSignalSources = input.signalSources ?? agent.signalSources;
  if (nextMode === "steal_customers") {
    const competitorUrls = nextSignalSources?.competitorUrls || [];
    const founderUrls = nextSignalSources?.founderUrls || [];
    if (!competitorUrls.length && !founderUrls.length) {
      throw new AgentApiOperationError(
        "Steal Customers agents need at least one competitor or founder/employee LinkedIn URL in signalSources.",
        400,
      );
    }
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
    // Steal customers is the only mode that stores competitor/founder URLs.
    // ICP always comes from My Product, not from client-supplied filters.
    const cleanedSignalSources =
      nextMode === "steal_customers"
        ? {
            competitorUrls: nextSignalSources?.competitorUrls || [],
            founderUrls: nextSignalSources?.founderUrls || [],
            keywords: [] as string[],
          }
        : {
            competitorUrls: [] as string[],
            founderUrls: [] as string[],
            keywords: nextSignalSources?.keywords || [],
          };

    let prompt = input.prompt ?? agent.prompt;
    let filters = input.filters ?? agent.filters;
    if (nextMode === "steal_customers") {
      const productProfile = await getProductProfile(context.workspace.id);
      if (!productProfileIsReadyForSteal(productProfile)) {
        throw new AgentApiOperationError(
          "Set up the product profile (My Product) before saving a Steal Customers agent.",
          409,
        );
      }
      const targeting = targetingFromProductProfile(productProfile);
      prompt = targeting.prompt;
      filters = targeting.filters;
    }

    updated = await updateAgent(context.workspace.id, agent.id, {
      name: input.name ?? agent.name,
      mode: nextMode,
      prompt,
      filters,
      signalSources: cleanedSignalSources,
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

  // Reply mode, calendar link, and handoff email preference. If the agent has
  // no sequence yet and the caller asks for outreach policy, create the default
  // AI sequence first so MCP can finish a full launch without the GUI.
  // Steal customers always needs AI outreach (post + comment context).
  const wantsOutreachPolicy =
    updated.mode === "steal_customers" ||
    input.setupOutreach === true ||
    input.replyHandling !== undefined ||
    input.bookingLink !== undefined ||
    input.notifyOnReply !== undefined;

  let outreach: {
    configured: boolean;
    sequencesUpdated: number;
    created: boolean;
    replyHandling?: CampaignReplyHandling | null;
    bookingLink?: string | null;
    notifyOnReply?: boolean | null;
  } | undefined;

  if (wantsOutreachPolicy) {
    const campaigns = (await listCampaigns(context.workspace.id)).filter(
      (campaign) => campaign.groupId === updated.targetGroupId,
    );
    const existing = campaigns[0];
    const replyHandling =
      input.replyHandling ??
      existing?.replyHandling ??
      ("ai_until_interest" as CampaignReplyHandling);
    // Only re-resolve the booking link when booking mode is active (or being
    // switched on). Clearing replyHandling away from booked drops the override.
    const bookingLink =
      replyHandling === "ai_until_booked"
        ? await resolveBookingLinkForMode(
            context.workspace.id,
            replyHandling,
            input.bookingLink !== undefined
              ? input.bookingLink
              : existing?.bookingLink,
          )
        : "";
    const notifyOnReply =
      input.notifyOnReply ?? existing?.notifyOnReply ?? true;
    const sendWindow =
      input.sendWindow ?? existing?.sendWindow ?? ("business" as SendWindow);

    let created = false;
    let sequencesUpdated = 0;
    if (!campaigns.length) {
      if (updated.leadsOnly) {
        throw new AgentApiOperationError(
          "This agent is leads-only and cannot run outreach. Create a normal lead finder instead.",
          409,
        );
      }
      const accountId =
        linkedInAccountId ||
        updated.linkedInAccountId ||
        (await getLinkedInAccountForWorkspace(context.workspace.id))?.id;
      if (!accountId) {
        throw new AgentApiOperationError(
          "Connect LinkedIn in Omentir before setting up outreach.",
          409,
        );
      }
      await ensureDefaultOutreachCampaign({
        workspaceId: context.workspace.id,
        agent: updated,
        linkedInAccountId: accountId,
        replyHandling,
        bookingLink,
        notifyOnReply,
        sendWindow,
      });
      created = true;
      sequencesUpdated = 1;
    } else {
      sequencesUpdated = await setOutreachPolicyForGroup(
        context.workspace.id,
        updated.targetGroupId,
        {
          replyHandling,
          bookingLink,
          notifyOnReply,
          ...(input.sendWindow !== undefined ? { sendWindow: input.sendWindow } : {}),
        },
      );
    }

    outreach = {
      configured: true,
      sequencesUpdated,
      created,
      replyHandling,
      bookingLink: bookingLink || null,
      notifyOnReply,
    };
  }

  return {
    agent: updated,
    ...(input.sendWindow === undefined
      ? {}
      : { sendWindow: input.sendWindow, sequencesRewindowed }),
    ...(outreach ? { outreach } : {}),
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

  const sendLimits = effectiveSendLimits(context.workspace.settings, account);

  if (
    !(await hasDailyQuotaRemaining(
      context.workspace.id,
      "messages",
      sendLimits.dailyMessageLimit,
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
    sendLimits.dailyMessageLimit,
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
