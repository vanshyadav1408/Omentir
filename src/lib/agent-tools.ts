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
    description:
      "Returns every agent in the workspace, including mode steal_customers, classic lead finders, and outreach-only agents.",
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
      pricingDetails: { type: "string" },
      schedulingLink: {
        type: "string",
        description:
          "Workspace demo booking link (https://cal.com/... or https://calendly.com/...). Used by agents whose reply mode is continue-until-booked when they have no per-agent bookingLink override.",
      },
      keyFeatures: { type: "array", items: { type: "string" } },
      socialProof: { type: "array", items: { type: "string" } },
      linkedInCompanyPage: { type: "string" },
      useCases: { type: "array", items: { type: "string" } },
      targetBuyers: { type: "array", items: { type: "string" } },
      buyerTitles: { type: "array", items: { type: "string" } },
      roleVocabulary: { type: "array", items: { type: "string" } },
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
    required: ["groupName"],
    properties: {
      name: { type: "string" },
      groupName: { type: "string" },
      linkedInAccountId: {
        type: "string",
        description: "Optional connected LinkedIn account id; defaults to the workspace's first account.",
      },
      mode: {
        enum: ["signals", "filters", "prompt", "steal_customers"],
        default: "signals",
        description:
          "signals/filters/prompt: classic ICP lead discovery (needs prompt+filters). steal_customers (Steal Customers): no ICP; My Product defines buyers; requires competitorUrls and/or founderUrls; finds employees at competitor companies, scans company+employee posts, promotes commenters as leads; AI outreach attached automatically.",
      },
      prompt: {
        type: "string",
        description:
          "Prospect definition for classic lead finders. Optional for steal_customers (filled from My Product on the server).",
      },
      filters: {
        type: "object",
        description:
          "Required for classic lead finders (each list needs at least one entry). Omit for steal_customers (filled from My Product).",
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
        description:
          "Steal Customers: pass competitorUrls (company pages) and optional founderUrls (founder/employee profiles). At least one URL required. My Product drives buyer fit.",
        properties: {
          competitorUrls: {
            type: "array",
            items: { type: "string" },
            description:
              "LinkedIn company URLs of competitors. Company pages plus employees at those companies are scanned for posts.",
          },
          founderUrls: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional LinkedIn profile URLs of competitor founders or employees whose posts should also be scanned.",
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Ignored for steal_customers.",
          },
        },
      },
      setupOutreach: {
        type: "boolean",
        description:
          "When true, attaches the default AI outreach sequence. Implied by replyHandling. Always on for steal_customers (cannot be skipped).",
      },
      replyHandling: {
        enum: ["handoff", "ai_until_interest", "ai_until_booked"],
        description:
          "When a lead replies: handoff = stop after first reply and email you; ai_until_interest = AI answers until qualified interest then email you; ai_until_booked = AI continues, shares booking link after interest, emails you when a meeting is confirmed. Requires setupOutreach (or implies it).",
      },
      bookingLink: {
        type: "string",
        description:
          "Optional per-agent Calendly/Cal.com link for ai_until_booked. Falls back to the product profile schedulingLink.",
      },
      notifyOnReply: {
        type: "boolean",
        description:
          "For handoff mode only: email when the first reply arrives (default true). Ignored for ai_until_interest / ai_until_booked, which email on interest or meeting booked instead.",
      },
      sendWindow: {
        enum: ["always", "business", "extended"],
        description:
          "When this agent's outreach may send: always (24/7), business (Mon-Fri 09:00-18:00), or extended (daily 07:00-22:00). Defaults to business when outreach is set up here.",
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
      mode: {
        enum: ["signals", "filters", "prompt", "steal_customers"],
        description:
          "signals/filters/prompt: classic ICP lead finder. steal_customers (Steal Customers): competitor post commenters only; no ICP; My Product defines buyer fit; AI outreach required.",
      },
      prompt: {
        type: "string",
        description:
          "Prospect definition for classic lead finders. Ignored for steal_customers (refilled from My Product on save).",
      },
      filters: {
        type: "object",
        description:
          "Replacement targeting filters for classic lead finders (each list needs at least one entry). Ignored for steal_customers (My Product is used).",
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
        description:
          "For Steal Customers (steal_customers): competitorUrls and/or founderUrls (company pages, founders, or employees who post). Required when mode is steal_customers.",
        properties: {
          competitorUrls: {
            type: "array",
            items: { type: "string" },
            description:
              "LinkedIn company or profile URLs of competitors whose posts are scanned for commenters.",
          },
          founderUrls: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional LinkedIn profile URLs of competitor founders or employees who post about the product.",
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Ignored for steal_customers; used only by classic discovery modes.",
          },
        },
      },
      setupOutreach: {
        type: "boolean",
        description:
          "When true and the agent has no sequence yet, attach the default AI outreach sequence. Also implied when replyHandling is set without an existing campaign.",
      },
      replyHandling: {
        enum: ["handoff", "ai_until_interest", "ai_until_booked"],
        description:
          "When a lead replies: handoff = stop after first reply and email you; ai_until_interest = AI answers until qualified interest then email you; ai_until_booked = AI continues, shares booking link after interest, emails you when a meeting is confirmed. Applies to every sequence on this agent's lead group.",
      },
      bookingLink: {
        type: "string",
        description:
          "Optional per-agent Calendly/Cal.com link for ai_until_booked. Falls back to the product profile schedulingLink.",
      },
      notifyOnReply: {
        type: "boolean",
        description:
          "For handoff mode only: email when the first reply arrives (default true).",
      },
      sendWindow: {
        enum: ["always", "business", "extended"],
        description:
          "When this agent's outreach may send: always (24/7), business (Mon-Fri 09:00-18:00), or extended (daily 07:00-22:00). The hours are measured in each lead's own time zone, resolved from their profile location, falling back to the workspace zone when it cannot be placed. Applies to every sequence built on the agent's lead group.",
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
      timeZone: {
        type: "string",
        description:
          'IANA time zone name (for example "America/New_York") the workspace schedules in: daily limits reset at its local midnight, and it is the fallback send-window zone for leads whose location cannot be placed (send windows are otherwise measured in each lead\'s own zone).',
      },
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
  omentir_list_scheduled_actions: {
    type: "object",
    properties: {
      agentId: {
        type: "string",
        description: "Only actions for leads sourced by this lead finder.",
      },
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
    description:
      "Read workspace readiness, product profile, setup status, counts, API resources, the workspace time zone, and how much of today's invite and message allowance is left.",
    inputSchema: agentToolInputSchemas.omentir_get_context,
  },
  {
    name: "omentir_get_stats",
    description: "Read the Overview headline metrics: total leads, hot opportunities, accepted connections, invitations sent, messages sent, replies received, and pipeline generated.",
    inputSchema: agentToolInputSchemas.omentir_get_stats,
  },
  {
    name: "omentir_get_product_profile",
    description: "Read the workspace product profile used for ICP matching and outreach personalization.",
    inputSchema: agentToolInputSchemas.omentir_get_product_profile,
  },
  {
    name: "omentir_update_product_profile",
    description:
      "Update the workspace product profile used to qualify and rank discovered leads. Also sets the workspace demo booking link (schedulingLink: Calendly or Cal.com) used by continue-until-booked outreach.",
    inputSchema: agentToolInputSchemas.omentir_update_product_profile,
  },
  {
    name: "omentir_list_agents",
    description:
      "List Omentir agents in the token workspace (classic lead finders, outreach-only, and Steal Customers / steal_customers), including each one's mode, next discovery run, send window, replyHandling, booking link, and whether outreach is set up.",
    inputSchema: agentToolInputSchemas.omentir_list_agents,
  },
  {
    name: "omentir_create_agent",
    description:
      "Create an agent. Classic (signals/filters/prompt): prompt + titles/industries/locations/keywords; optional setupOutreach/replyHandling. Steal Customers (mode=steal_customers): groupName + signalSources.competitorUrls and/or founderUrls only (no ICP); My Product required; finds competitor employees, scans company+employee posts, scores commenters as buyers, AI outreach automatic; optional replyHandling/bookingLink/sendWindow. Returns agent + leadGroup for omentir_list_leads. Full lifecycle: list/update/pause/resume/delete also work for steal_customers.",
    inputSchema: agentToolInputSchemas.omentir_create_agent,
  },
  {
    name: "omentir_update_agent",
    description:
      "Update any agent including Steal Customers (steal_customers): rename, mode, signalSources (competitor + founder/employee URLs), LinkedIn account, lead group, send window, replyHandling, bookingLink, notifyOnReply, setupOutreach, or status active/paused. For steal_customers, prompt/filters are refilled from My Product on save; competitor/founder URLs remain required. Daily discovery time is fixed at creation. Only provided fields change.",
    inputSchema: agentToolInputSchemas.omentir_update_agent,
  },
  {
    name: "omentir_update_settings",
    description:
      "Update workspace outreach settings: daily connection-request and message limits, first-message delay, AI follow-up behaviour, and the workspace time zone that daily limit resets are measured in. Only provided fields change.",
    inputSchema: agentToolInputSchemas.omentir_update_settings,
  },
  {
    name: "omentir_list_leads",
    description:
      "Search, filter, sort, and list discovered leads, optionally within one lead group. Steal Customers leads include signalText, leadReason, and engagementContext (post text, post URL, comment text, comment URL) for outreach context.",
    inputSchema: agentToolInputSchemas.omentir_list_leads,
  },
  {
    name: "omentir_get_lead",
    description:
      "Get the complete workspace-owned lead record for an exact lead id, including engagementContext for Steal Customers leads (post text, post URL, comment text, comment URL) plus profile and fit score.",
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
    name: "omentir_list_scheduled_actions",
    description:
      "List upcoming outreach in send order with each action's exact planned send time, the message or connection note that will go out, and why anything is blocked. These are committed slots from Omentir's send planner, not estimates.",
    inputSchema: agentToolInputSchemas.omentir_list_scheduled_actions,
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
      "Delete an agent permanently: stops all outreach to the leads it sourced and deletes its lead group and the campaigns contacting that group (unless another agent uses the same group). Leads in that group are permanently deleted.",
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
  "omentir_list_scheduled_actions",
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
