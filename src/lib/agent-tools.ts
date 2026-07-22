export const agentToolInputSchemas = {
  omentir_get_context: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  omentir_get_stats: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  omentir_list_agents: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  omentir_get_product_profile: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  omentir_update_product_profile: {
    type: "object",
    properties: {
      websiteUrl: { type: "string" },
      description: { type: "string" },
      companyName: { type: "string" },
      industry: { type: "string" },
      companySize: { type: "string" },
      painPointsText: { type: "string" },
      keyFeatures: { type: "array", items: { type: "string" } },
      socialProof: { type: "array", items: { type: "string" } },
      linkedInCompanyPage: { type: "string" },
      targetBuyers: { type: "array", items: { type: "string" } },
      buyerTitles: { type: "array", items: { type: "string" } },
      industries: { type: "array", items: { type: "string" } },
      companySizes: { type: "array", items: { type: "string" } },
      painPoints: { type: "array", items: { type: "string" } },
      keywords: { type: "array", items: { type: "string" } },
      preferredLocations: { type: "array", items: { type: "string" } },
      averageTicketSize: { type: "number" },
    },
    additionalProperties: false,
  },
  omentir_create_agent: {
    type: "object",
    required: ["groupName", "prompt", "filters"],
    properties: {
      name: { type: "string" },
      groupName: { type: "string" },
      linkedInAccountId: {
        type: "string",
        description: "Optional connected LinkedIn account id; defaults to the workspace's first account.",
      },
      mode: { enum: ["signals", "filters", "prompt"], default: "signals" },
      prompt: {
        type: "string",
        description: "Required prospect definition describing who the agent should find.",
      },
      filters: {
        type: "object",
        description:
          "Required targeting filters. Every list must have at least one entry - an agent cannot start with a partial setup.",
        required: ["titles", "industries", "locations", "keywords"],
        properties: {
          titles: { type: "array", items: { type: "string" }, minItems: 1 },
          industries: { type: "array", items: { type: "string" }, minItems: 1 },
          locations: { type: "array", items: { type: "string" }, minItems: 1 },
          keywords: { type: "array", items: { type: "string" }, minItems: 1 },
        },
      },
      signalSources: {
        type: "object",
        properties: {
          competitorUrls: { type: "array", items: { type: "string" } },
          founderUrls: { type: "array", items: { type: "string" } },
          keywords: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
  omentir_update_agent: {
    type: "object",
    required: ["agentId"],
    properties: {
      agentId: { type: "string" },
      name: { type: "string" },
      groupName: {
        type: "string",
        description: "Rename the agent's target lead group.",
      },
      linkedInAccountId: {
        type: "string",
        description: "Switch the connected LinkedIn account the agent discovers from.",
      },
      mode: { enum: ["signals", "filters", "prompt"] },
      prompt: {
        type: "string",
        description: "Prospect definition describing who the agent should find.",
      },
      filters: {
        type: "object",
        description:
          "Replacement targeting filters. When provided, every list must have at least one entry.",
        required: ["titles", "industries", "locations", "keywords"],
        properties: {
          titles: { type: "array", items: { type: "string" }, minItems: 1 },
          industries: { type: "array", items: { type: "string" }, minItems: 1 },
          locations: { type: "array", items: { type: "string" }, minItems: 1 },
          keywords: { type: "array", items: { type: "string" }, minItems: 1 },
        },
      },
      signalSources: {
        type: "object",
        properties: {
          competitorUrls: { type: "array", items: { type: "string" } },
          founderUrls: { type: "array", items: { type: "string" } },
          keywords: { type: "array", items: { type: "string" } },
        },
      },
      status: {
        enum: ["active", "paused"],
        description: "Resume the lead finder immediately or pause future discovery runs.",
      },
    },
  },
  omentir_update_settings: {
    type: "object",
    properties: {
      dailyInviteLimit: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        description: "Max LinkedIn connection requests sent per day.",
      },
      dailyMessageLimit: {
        type: "integer",
        minimum: 1,
        maximum: 200,
        description: "Max LinkedIn messages sent per day.",
      },
      firstMessageDelayMinutes: {
        type: "integer",
        minimum: 5,
        maximum: 10080,
        description: "Minutes to wait after a connection is accepted before the first message.",
      },
      aiFollowUpDelayMinutes: { type: "integer", minimum: 0, maximum: 10080 },
      aiFollowUpEnabled: { type: "boolean" },
    },
    additionalProperties: false,
  },
  omentir_list_leads: {
    type: "object",
    properties: {
      groupId: { type: "string" },
      query: { type: "string", description: "Match lead name, title, company, location, or summary." },
      minFitScore: { type: "number", minimum: 0, maximum: 100 },
      outreachStatus: {
        type: "string",
        enum: ["new", "invited", "connected", "messaged", "replied", "declined", "stopped"],
      },
      sortBy: {
        type: "string",
        enum: ["fit_score_desc", "fit_score_asc", "newest", "oldest"],
      },
      limit: { type: "integer", minimum: 1, maximum: 200 },
    },
    additionalProperties: false,
  },
  omentir_get_lead: {
    type: "object",
    required: ["leadId"],
    properties: { leadId: { type: "string" } },
    additionalProperties: false,
  },
  omentir_list_conversations: {
    type: "object",
    properties: {
      limit: { type: "integer", minimum: 1, maximum: 100 },
    },
    additionalProperties: false,
  },
  omentir_list_groups: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  omentir_list_linkedin_accounts: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  omentir_list_activity: {
    type: "object",
    properties: {
      limit: { type: "integer", minimum: 1, maximum: 200 },
    },
    additionalProperties: false,
  },
  omentir_pause_agent: {
    type: "object",
    required: ["agentId"],
    properties: { agentId: { type: "string" } },
    additionalProperties: false,
  },
  omentir_resume_agent: {
    type: "object",
    required: ["agentId"],
    properties: { agentId: { type: "string" } },
    additionalProperties: false,
  },
  omentir_delete_agent: {
    type: "object",
    required: ["agentId"],
    properties: { agentId: { type: "string" } },
    additionalProperties: false,
  },
  omentir_reply_to_lead: {
    type: "object",
    required: ["leadId", "message"],
    properties: {
      leadId: { type: "string" },
      message: { type: "string" },
    },
    additionalProperties: false,
  },
} as const;

const agentMcpToolDefinitions = [
  {
    name: "omentir_get_context",
    description: "Read workspace readiness, product profile, setup status, counts, and API resources.",
    inputSchema: agentToolInputSchemas.omentir_get_context,
  },
  {
    name: "omentir_get_stats",
    description: "Read the dashboard headline metrics: total leads, hot opportunities, invitations sent, messages sent, replies received, and pipeline generated.",
    inputSchema: agentToolInputSchemas.omentir_get_stats,
  },
  {
    name: "omentir_get_product_profile",
    description: "Read the workspace product profile used for ICP matching and outreach personalization.",
    inputSchema: agentToolInputSchemas.omentir_get_product_profile,
  },
  {
    name: "omentir_update_product_profile",
    description: "Update the workspace product profile used to qualify and rank discovered leads.",
    inputSchema: agentToolInputSchemas.omentir_update_product_profile,
  },
  {
    name: "omentir_list_agents",
    description: "List Omentir discovery agents in the token workspace.",
    inputSchema: agentToolInputSchemas.omentir_list_agents,
  },
  {
    name: "omentir_create_agent",
    description:
      "Create an ICP discovery agent and target lead group. Requires a prompt plus at least one job title, industry, location, and keyword - agents cannot start with a partial setup.",
    inputSchema: agentToolInputSchemas.omentir_create_agent,
  },
  {
    name: "omentir_update_agent",
    description:
      "Update an existing discovery agent: rename it, change its prompt, mode, filters, or signal sources, switch its LinkedIn account, or rename its lead group. Only provided fields change.",
    inputSchema: agentToolInputSchemas.omentir_update_agent,
  },
  {
    name: "omentir_update_settings",
    description:
      "Update workspace outreach settings: daily connection-request and message limits, first-message delay, and AI follow-up behaviour. Only provided fields change.",
    inputSchema: agentToolInputSchemas.omentir_update_settings,
  },
  {
    name: "omentir_list_leads",
    description: "Search, filter, sort, and list discovered leads, optionally within one lead group.",
    inputSchema: agentToolInputSchemas.omentir_list_leads,
  },
  {
    name: "omentir_get_lead",
    description: "Get the complete workspace-owned lead record for an exact lead id.",
    inputSchema: agentToolInputSchemas.omentir_get_lead,
  },
  {
    name: "omentir_list_conversations",
    description: "List recent LinkedIn reply conversations captured by Omentir.",
    inputSchema: agentToolInputSchemas.omentir_list_conversations,
  },
  {
    name: "omentir_list_groups",
    description: "List lead groups in the token workspace.",
    inputSchema: agentToolInputSchemas.omentir_list_groups,
  },
  {
    name: "omentir_list_linkedin_accounts",
    description: "List connected LinkedIn accounts available to lead-finding agents.",
    inputSchema: agentToolInputSchemas.omentir_list_linkedin_accounts,
  },
  {
    name: "omentir_list_activity",
    description: "List recent automation activity runs (the workspace activity feed).",
    inputSchema: agentToolInputSchemas.omentir_list_activity,
  },
  {
    name: "omentir_pause_agent",
    description:
      "Pause an agent: stops its lead discovery and freezes all automated outreach (connection requests, follow-ups, AI replies) to the leads it sourced.",
    inputSchema: agentToolInputSchemas.omentir_pause_agent,
  },
  {
    name: "omentir_resume_agent",
    description:
      "Resume a paused agent: lead discovery runs again on the next tick and its frozen outreach is woken immediately.",
    inputSchema: agentToolInputSchemas.omentir_resume_agent,
  },
  {
    name: "omentir_delete_agent",
    description:
      "Delete an agent permanently: stops all outreach to the leads it sourced and deletes its lead group and the campaigns contacting that group (unless another agent uses the same group). Leads themselves are kept.",
    inputSchema: agentToolInputSchemas.omentir_delete_agent,
  },
  {
    name: "omentir_reply_to_lead",
    description: "Reply to a lead in an existing LinkedIn conversation. This cannot start a new conversation and counts against the daily message quota.",
    inputSchema: agentToolInputSchemas.omentir_reply_to_lead,
  },
] as const;

const readOnlyTools = new Set([
  "omentir_get_context",
  "omentir_get_stats",
  "omentir_get_product_profile",
  "omentir_list_agents",
  "omentir_list_leads",
  "omentir_get_lead",
  "omentir_list_conversations",
  "omentir_list_groups",
  "omentir_list_linkedin_accounts",
  "omentir_list_activity",
]);

const destructiveTools = new Set(["omentir_delete_agent"]);

export const agentMcpTools = agentMcpToolDefinitions.map((tool) => ({
  ...tool,
  title: tool.name
    .replace(/^omentir_/, "")
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" "),
  annotations: {
    readOnlyHint: readOnlyTools.has(tool.name),
    destructiveHint: destructiveTools.has(tool.name),
    idempotentHint:
      readOnlyTools.has(tool.name) ||
      [
        "omentir_update_product_profile",
        "omentir_update_agent",
        "omentir_update_settings",
        "omentir_pause_agent",
        "omentir_resume_agent",
        "omentir_delete_agent",
      ].includes(tool.name),
    openWorldHint: ["omentir_create_agent", "omentir_reply_to_lead"].includes(tool.name),
  },
}));
