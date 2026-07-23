import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/server/runtime-config";
import { readAgentApiJsonBody, requireAgentApiContext } from "@/lib/server/agent-api";
import {
  AgentApiOperationError,
  agentMcpTools,
  callAgentTool,
} from "@/lib/server/agent-api-operations";

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

function allowedOrigins() {
  const configured = (process.env.MCP_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([
    new URL(getAppBaseUrl()).origin,
    "https://chatgpt.com",
    "https://chat.openai.com",
    "https://claude.ai",
    ...configured,
  ]);
}

function originIsAllowed(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return allowedOrigins().has(new URL(origin).origin);
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

export async function GET(request: NextRequest) {
  if (request.headers.get("accept")?.includes("text/event-stream")) {
    return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
  }

  return NextResponse.json({
    name: "omentir-agent-mcp",
    title: "Omentir Lead Discovery",
    description:
      "Workspace-scoped Streamable HTTP MCP endpoint for configuring Omentir lead finders and inspecting discovered leads.",
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

export async function POST(request: NextRequest) {
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

  if (rpc.method === "initialize") {
    const requested = requestedProtocolVersion(rpc.params);
    const protocolVersion =
      requested && SUPPORTED_PROTOCOL_VERSIONS.has(requested)
        ? requested
        : CURRENT_PROTOCOL_VERSION;
    return rpcResult(rpc.id, {
      protocolVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo: {
        name: "omentir-agent-mcp",
        title: "Omentir Lead Discovery",
        version: "1.2.0",
        description:
          "Configure lead finders, monitor discovery, inspect ICP-fit leads, and work with existing Omentir conversations.",
        websiteUrl: `${getAppBaseUrl()}/mcp-server`,
      },
      instructions:
        "Call omentir_get_context first. List existing agents before creating one. Lead discovery is asynchronous, so inspect activity before treating an empty lead list as final.",
    });
  }

  if (rpc.id === undefined && rpc.method.startsWith("notifications/")) {
    return new NextResponse(null, { status: 202 });
  }

  if (rpc.method === "ping") {
    return rpcResult(rpc.id, {});
  }

  if (rpc.method === "tools/list") {
    return rpcResult(rpc.id, { tools: agentMcpTools });
  }

  if (rpc.method === "tools/call") {
    const params = toolCallParams(rpc.params);
    if (!params) {
      return rpcError(rpc.id, -32602, "tools/call requires params.name.");
    }
    if (!agentMcpTools.some((tool) => tool.name === params.name)) {
      return rpcError(rpc.id, -32602, `Unknown tool: ${params.name}`);
    }

    try {
      const result = await callAgentTool(auth.context, params.name, params.arguments);
      return rpcResult(rpc.id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
        isError: false,
      });
    } catch (error) {
      if (error instanceof AgentApiOperationError) {
        return toolExecutionError(rpc.id, error);
      }
      console.error("[agent-mcp] tool call failed:", error);
      return rpcError(rpc.id, -32603, "Internal MCP tool error.");
    }
  }

  return rpcError(rpc.id, -32601, `Unknown method: ${rpc.method}`);
}
