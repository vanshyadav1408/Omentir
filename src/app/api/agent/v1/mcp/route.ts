import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/server/runtime-config";
import { preflightResponse, withCors } from "@/lib/server/cors";
import { readAgentApiJsonBody, requireAgentApiContext } from "@/lib/server/agent-api";
import {
  AgentApiOperationError,
  agentMcpTools,
  callAgentTool,
} from "@/lib/server/agent-api-operations";
import {
  advertisedMcpTools,
  attachMcpSessionHeader,
  flushPostHogMcp,
  getMoreToolsResult,
  getPostHogMcp,
  mcpCaptureContext,
  mcpSessionFromRequest,
  mintMcpSession,
  parseMcpClientInfo,
  prepareIncomingToolCall,
} from "@/lib/posthog-mcp";

export const dynamic = "force-dynamic";

const CURRENT_PROTOCOL_VERSION = "2025-11-25";
const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  CURRENT_PROTOCOL_VERSION,
  "2025-06-18",
  "2025-03-26",
]);

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
};

function rpcResult(id: JsonRpcId | undefined, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function rpcError(
  id: JsonRpcId | undefined,
  code: number,
  message: string,
  data?: unknown,
  status = 200,
) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code, message, data },
    },
    { status },
  );
}

function toolCallParams(params: unknown) {
  if (!params || typeof params !== "object") return null;
  const value = params as { name?: unknown; arguments?: unknown };
  return typeof value.name === "string"
    ? { name: value.name, arguments: value.arguments ?? {} }
    : null;
}

function requestedProtocolVersion(params: unknown) {
  if (!params || typeof params !== "object") return null;
  const version = (params as { protocolVersion?: unknown }).protocolVersion;
  return typeof version === "string" ? version : null;
}

/**
 * Any origin may call this endpoint unless MCP_ALLOWED_ORIGINS narrows it.
 *
 * The origin check in the MCP spec exists to stop a web page from reaching a
 * server bound to localhost, where merely being on the machine is treated as
 * proof of identity. Nothing here works that way: every call needs a bearer
 * token and no route reads cookies, so a hostile page has nothing to replay. A
 * fixed allowlist only broke real clients - Grok was rejected outright for not
 * being on it, and every new AI app would be too.
 */
function originIsAllowed(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const configured = (process.env.MCP_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (configured.length === 0) return true;

  try {
    return new Set([new URL(getAppBaseUrl()).origin, ...configured]).has(new URL(origin).origin);
  } catch {
    return false;
  }
}

function protocolHeaderIsSupported(request: NextRequest) {
  const version = request.headers.get("mcp-protocol-version");
  return !version || SUPPORTED_PROTOCOL_VERSIONS.has(version);
}

function toolExecutionError(id: JsonRpcId | undefined, error: AgentApiOperationError) {
  const details = {
    message: error.message,
    status: error.status,
    details: error.details,
  };
  return rpcResult(id, {
    content: [{ type: "text", text: JSON.stringify(details, null, 2) }],
    structuredContent: { error: details },
    isError: true,
  });
}

async function handleGet(request: NextRequest) {
  if (request.headers.get("accept")?.includes("text/event-stream")) {
    return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
  }

  return NextResponse.json({
    name: "omentir-agent-mcp",
    title: "Omentir Lead Discovery",
    description:
      "Workspace-scoped Streamable HTTP MCP endpoint for configuring Omentir lead finders, inspecting discovered leads, and reading the planned outreach schedule.",
    endpoint: "/api/agent/v1/mcp",
    transport: "streamable-http",
    protocolVersion: CURRENT_PROTOCOL_VERSION,
    supportedProtocolVersions: [...SUPPORTED_PROTOCOL_VERSIONS],
    auth: "Authorization: Bearer <omentir_agent_token>",
    methods: [
      "initialize",
      "notifications/initialized",
      "ping",
      "tools/list",
      "tools/call",
    ],
    tools: agentMcpTools.map((tool) => tool.name),
  });
}

async function handlePost(request: NextRequest) {
  if (!originIsAllowed(request)) {
    return rpcError(undefined, -32000, "Origin is not allowed.", undefined, 403);
  }
  if (!protocolHeaderIsSupported(request)) {
    return rpcError(
      undefined,
      -32600,
      "Unsupported MCP-Protocol-Version header.",
      { supported: [...SUPPORTED_PROTOCOL_VERSIONS] },
      400,
    );
  }

  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  const parsed = await readAgentApiJsonBody<JsonRpcRequest>(request);
  if (!parsed.ok) return parsed.response;
  const rpc = parsed.body;
  if (!rpc || rpc.jsonrpc !== "2.0" || typeof rpc.method !== "string") {
    return rpcError(undefined, -32600, "Invalid JSON-RPC request.");
  }

  const posthog = getPostHogMcp();
  const replayedSession = mcpSessionFromRequest(request);
  const capture = mcpCaptureContext(auth.context.workspace, request, replayedSession);

  if (rpc.method === "initialize") {
    const startedAt = Date.now();
    const requested = requestedProtocolVersion(rpc.params);
    const protocolVersion =
      requested && SUPPORTED_PROTOCOL_VERSIONS.has(requested)
        ? requested
        : CURRENT_PROTOCOL_VERSION;
    const clientInfo = parseMcpClientInfo(rpc.params);
    const result = {
      protocolVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo: {
        name: "omentir-agent-mcp",
        title: "Omentir Agent MCP",
        version: "1.4.0",
        description:
          "Configure classic lead finders and Steal Customers agents, monitor discovery and outreach, inspect leads (including post+comment engagementContext), and work with existing Omentir conversations.",
        websiteUrl: `${getAppBaseUrl()}/integrations/mcp`,
      },
      instructions:
        "Call omentir_get_context first (time zone + remaining send allowance). Call omentir_get_product_profile and ensure My Product is set before Steal Customers. List agents before create. Classic lead finders need mode signals/filters/prompt plus prompt and filters. Steal Customers: mode steal_customers, groupName, signalSources.competitorUrls and/or founderUrls (company pages and optional founder/employee profiles); no ICP; AI outreach attaches automatically; discovery finds competitor employees, scans their posts and company posts, and promotes commenters who look like buyers. Lead discovery is asynchronous: use list_activity before treating empty leads as final. Use list_leads/get_lead for engagementContext. Use list_scheduled_actions for exact outreach send times.",
    };
    const minted = posthog
      ? mintMcpSession({ ...clientInfo, protocolVersion })
      : null;
    posthog?.captureInitialize({
      ...capture,
      ...clientInfo,
      sessionId: minted?.session.sessionId,
      protocolVersion,
      parameters: rpc.params,
      response: result,
      durationMs: Date.now() - startedAt,
    });
    const response = rpcResult(rpc.id, result);
    return minted ? attachMcpSessionHeader(response, minted.token) : response;
  }

  if (rpc.id === undefined && rpc.method.startsWith("notifications/")) {
    return new NextResponse(null, { status: 202 });
  }

  if (rpc.method === "ping") {
    return rpcResult(rpc.id, {});
  }

  if (rpc.method === "tools/list") {
    const startedAt = Date.now();
    const tools = advertisedMcpTools(agentMcpTools);
    posthog?.captureToolsList({
      ...capture,
      toolNames: tools.map((tool) => tool.name),
      parameters: rpc.params,
      response: { tools },
      durationMs: Date.now() - startedAt,
    });
    return rpcResult(rpc.id, { tools });
  }

  if (rpc.method === "tools/call") {
    const params = toolCallParams(rpc.params);
    if (!params) {
      return rpcError(rpc.id, -32602, "tools/call requires params.name.");
    }
    const prepared = prepareIncomingToolCall(params.name, params.arguments);
    if (prepared.isMissingCapability) {
      posthog?.captureMissingCapability({
        ...capture,
        context: prepared.intent,
        parameters: params.arguments,
      });
      return rpcResult(rpc.id, getMoreToolsResult());
    }
    if (!agentMcpTools.some((tool) => tool.name === params.name)) {
      return rpcError(rpc.id, -32602, `Unknown tool: ${params.name}`);
    }

    const startedAt = Date.now();
    const toolDescription = agentMcpTools.find((tool) => tool.name === params.name)?.description;
    try {
      const result = await callAgentTool(auth.context, params.name, prepared.dispatchArgs);
      posthog?.captureToolCall({
        ...capture,
        toolName: params.name,
        toolDescription,
        intent: prepared.intent,
        intentSource: prepared.intentSource,
        parameters: prepared.dispatchArgs,
        response: result,
        durationMs: Date.now() - startedAt,
        isError: false,
      });
      return rpcResult(rpc.id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
        isError: false,
      });
    } catch (error) {
      posthog?.captureToolCall({
        ...capture,
        toolName: params.name,
        toolDescription,
        intent: prepared.intent,
        intentSource: prepared.intentSource,
        parameters: prepared.dispatchArgs,
        durationMs: Date.now() - startedAt,
        isError: true,
        error,
        errorType: error instanceof AgentApiOperationError ? "operation" : "internal",
      });
      if (error instanceof AgentApiOperationError) {
        return toolExecutionError(rpc.id, error);
      }
      console.error("[agent-mcp] tool call failed:", error);
      return rpcError(rpc.id, -32603, "Internal MCP tool error.");
    }
  }

  return rpcError(rpc.id, -32601, `Unknown method: ${rpc.method}`);
}

// Hosted AI apps call this endpoint from the browser. Without a preflight
// answer and matching response headers the request never leaves the page, which
// looks identical to a server that is down.
export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  return withCors(await handleGet(request), request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  try {
    return withCors(await handlePost(request), request.headers.get("origin"));
  } finally {
    await flushPostHogMcp();
  }
}
