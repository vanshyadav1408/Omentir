import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/server/runtime-config";

export const dynamic = "force-dynamic";

const agentFilters = {
  type: "object",
  required: ["titles", "industries", "locations", "keywords"],
  properties: {
    titles: { type: "array", items: { type: "string" }, minItems: 1 },
    industries: { type: "array", items: { type: "string" }, minItems: 1 },
    locations: { type: "array", items: { type: "string" }, minItems: 1 },
    keywords: { type: "array", items: { type: "string" }, minItems: 1 },
  },
} as const;

const signalSources = {
  type: "object",
  properties: {
    competitorUrls: { type: "array", items: { type: "string" } },
    founderUrls: { type: "array", items: { type: "string" } },
    keywords: { type: "array", items: { type: "string" } },
  },
} as const;

const sendWindow = {
  enum: ["always", "business", "extended"],
  description:
    "When the agent's outreach may send: always (24/7), business (Mon-Fri 09:00-18:00), extended (daily 07:00-22:00). The hours are measured in each lead's own time zone, resolved from their profile location, falling back to the workspace zone when it cannot be placed. Applies to every sequence built on the agent's lead group.",
} as const;

export async function GET() {
  const siteUrl = getAppBaseUrl();
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "Omentir Agent API",
      version: "1.3.0",
      description:
        "Workspace-scoped API for AI assistants that configure lead finders, inspect ICP-fit leads, monitor discovery and the outreach send schedule, and work with existing LinkedIn conversations. Every timestamp is a UTC ISO instant; the workspace reads and counts them in its own time zone, returned as `timeZone` by /context.",
    },
    servers: [{ url: siteUrl }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
      },
      schemas: {
        AgentCreate: {
          type: "object",
          required: ["groupName", "prompt", "filters"],
          properties: {
            name: { type: "string", maxLength: 120 },
            groupName: { type: "string", maxLength: 120 },
            linkedInAccountId: { type: "string" },
            mode: { enum: ["signals", "filters", "prompt"], default: "signals" },
            prompt: { type: "string", maxLength: 4000 },
            filters: agentFilters,
            signalSources,
          },
        },
        AgentUpdate: {
          type: "object",
          required: ["agentId"],
          properties: {
            agentId: { type: "string" },
            name: { type: "string", maxLength: 120 },
            groupName: { type: "string", maxLength: 120 },
            linkedInAccountId: { type: "string" },
            mode: { enum: ["signals", "filters", "prompt"] },
            prompt: { type: "string", maxLength: 4000 },
            filters: agentFilters,
            signalSources,
            sendWindow,
            status: { enum: ["active", "paused"] },
          },
        },
        AgentDelete: {
          type: "object",
          required: ["agentId"],
          properties: { agentId: { type: "string" } },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: {},
          },
        },
      },
    },
    paths: {
      "/api/agent/v1/context": {
        get: {
          operationId: "getWorkspaceContext",
          summary:
            "Read workspace readiness, product context, lead counts, settings, the workspace time zone, today's remaining invite and message allowance, and API entrypoints.",
          responses: { "200": { description: "Workspace context" } },
        },
      },
      "/api/agent/v1/stats": {
        get: {
          operationId: "getWorkspaceStats",
          summary: "Read lead, discovery-agent, and existing outreach metrics.",
          responses: { "200": { description: "Workspace stats" } },
        },
      },
      "/api/agent/v1/linkedin-accounts": {
        get: {
          operationId: "listLinkedInAccounts",
          summary: "List connected LinkedIn accounts available to lead-finding agents.",
          responses: { "200": { description: "LinkedIn account list" } },
        },
      },
      "/api/agent/v1/activity": {
        get: {
          operationId: "listDiscoveryActivity",
          summary: "List recent discovery and automation activity.",
          parameters: [
            { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 200, default: 100 } },
          ],
          responses: { "200": { description: "Activity list" } },
        },
      },
      "/api/agent/v1/scheduled-actions": {
        get: {
          operationId: "listScheduledActions",
          summary:
            "List upcoming outreach in send order with each action's exact planned send time, the message or connection note that will go out, and any blocking reason.",
          parameters: [
            {
              name: "agentId",
              in: "query",
              required: false,
              description: "Only actions for leads sourced by this lead finder.",
              schema: { type: "string" },
            },
            { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
          ],
          responses: {
            "200": { description: "Planned send schedule" },
            "404": { description: "Agent not found" },
          },
        },
      },
      "/api/agent/v1/mcp": {
        get: {
          operationId: "inspectMcpServer",
          summary: "Inspect public MCP metadata and tool names.",
          security: [],
          responses: { "200": { description: "MCP endpoint metadata" } },
        },
        post: {
          operationId: "callMcpServer",
          summary: "Use JSON-RPC methods initialize, notifications/initialized, ping, tools/list, and tools/call.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["jsonrpc", "method"],
                  properties: {
                    jsonrpc: { const: "2.0" },
                    id: { oneOf: [{ type: "string" }, { type: "number" }, { type: "null" }] },
                    method: {
                      enum: [
                        "initialize",
                        "notifications/initialized",
                        "ping",
                        "tools/list",
                        "tools/call",
                      ],
                    },
                    params: { type: "object" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "JSON-RPC response" } },
        },
      },
      "/api/agent/v1/agents": {
        get: {
          operationId: "listLeadFinders",
          summary:
            "List lead-finding agents in the workspace with each one's next discovery run, send window, and whether an outreach sequence is set up for it.",
          responses: { "200": { description: "Agent list" } },
        },
        post: {
          operationId: "createLeadFinder",
          summary: "Create a lead finder. Its first discovery run starts immediately and repeats daily at that time.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AgentCreate" } } },
          },
          responses: { "201": { description: "Created lead finder and lead group" }, "400": { description: "Invalid targeting configuration" } },
        },
        patch: {
          operationId: "updateLeadFinder",
          summary:
            "Update, pause, or resume a lead finder, including the send window its outreach uses. Its daily discovery time is fixed at creation. Only supplied fields change.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AgentUpdate" } } },
          },
          responses: { "200": { description: "Updated lead finder" }, "404": { description: "Agent not found" } },
        },
        delete: {
          operationId: "deleteLeadFinder",
          summary: "Delete a lead finder while retaining its lead group and discovered leads.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AgentDelete" } } },
          },
          responses: { "200": { description: "Deleted lead finder" }, "404": { description: "Agent not found" } },
        },
      },
      "/api/agent/v1/product-profile": {
        get: {
          operationId: "getProductProfile",
          summary: "Read the product and ICP profile used to qualify leads.",
          responses: { "200": { description: "Product profile" } },
        },
        put: {
          operationId: "updateProductProfile",
          summary: "Update the product and ICP profile. Only supplied fields change.",
          responses: { "200": { description: "Updated product profile" } },
        },
      },
      "/api/agent/v1/groups": {
        get: {
          operationId: "listLeadGroups",
          summary: "List lead groups created by lead-finding agents.",
          responses: { "200": { description: "Lead group list" } },
        },
      },
      "/api/agent/v1/leads": {
        get: {
          operationId: "listLeads",
          summary: "Search, filter, sort, and list discovered leads.",
          parameters: [
            { name: "groupId", in: "query", required: false, schema: { type: "string" } },
            { name: "query", in: "query", required: false, schema: { type: "string", maxLength: 200 } },
            { name: "minFitScore", in: "query", required: false, schema: { type: "number", minimum: 0, maximum: 100 } },
            { name: "outreachStatus", in: "query", required: false, schema: { type: "string", enum: ["new", "invited", "connected", "messaged", "replied", "declined", "stopped"] } },
            { name: "sortBy", in: "query", required: false, schema: { type: "string", enum: ["fit_score_desc", "fit_score_asc", "newest", "oldest"], default: "fit_score_desc" } },
            { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 200, default: 100 } },
          ],
          responses: { "200": { description: "Lead list" } },
        },
      },
      "/api/agent/v1/leads/{leadId}": {
        get: {
          operationId: "getLead",
          summary: "Get one workspace-owned lead by id.",
          parameters: [
            { name: "leadId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Lead record" },
            "404": { description: "Lead not found" },
          },
        },
      },
      "/api/agent/v1/conversations": {
        get: {
          operationId: "listConversations",
          summary: "List existing LinkedIn conversations captured by Omentir.",
          parameters: [
            { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
          ],
          responses: { "200": { description: "Conversation list" } },
        },
      },
      "/api/agent/v1/conversations/reply": {
        post: {
          operationId: "replyToExistingConversation",
          summary: "Reply to a lead in an existing conversation; this cannot start a new conversation.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["leadId", "message"],
                  properties: { leadId: { type: "string" }, message: { type: "string", maxLength: 4000 } },
                },
              },
            },
          },
          responses: { "200": { description: "Reply sent" }, "409": { description: "No existing conversation" }, "429": { description: "Daily message limit reached" } },
        },
      },
      "/api/agent/v1/settings": {
        put: {
          operationId: "updateWorkspaceSettings",
          summary:
            "Update workspace outreach safety settings and the time zone they are measured in. Only supplied fields change.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    dailyInviteLimit: { type: "integer", minimum: 1, maximum: 100 },
                    dailyMessageLimit: { type: "integer", minimum: 1, maximum: 200 },
                    firstMessageDelayMinutes: { type: "integer", minimum: 5, maximum: 10080 },
                    aiFollowUpDelayMinutes: { type: "integer", minimum: 0, maximum: 10080 },
                    aiFollowUpEnabled: { type: "boolean" },
                    timeZone: {
                      type: "string",
                      description:
                        'IANA time zone name (for example "America/New_York") the workspace schedules in. Daily limits reset at its local midnight, and it is the fallback send-window zone for leads whose location cannot be placed (send windows are otherwise measured in each lead\'s own zone).',
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Updated settings" },
            "400": { description: "Nothing to update, or an unknown time zone" },
          },
        },
      },
    },
  });
}
