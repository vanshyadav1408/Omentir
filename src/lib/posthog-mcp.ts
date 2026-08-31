import {
  decodeSessionId,
  encodeSessionId,
  getMoreToolsResult,
  MCP_SESSION_HEADER,
  newSessionId,
  PostHogMCP,
  type PreparedToolCall,
  type SessionTokenPayload,
} from "@posthog/mcp";
import type { NextRequest, NextResponse } from "next/server";

export { getMoreToolsResult };

let client: PostHogMCP | null | undefined;

function posthogApiKey() {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_PROJECT_TOKEN || "";
}

function posthogHost() {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") ||
    process.env.POSTHOG_HOST?.replace(/\/$/, "") ||
    "https://us.i.posthog.com"
  );
}

export function getPostHogMcp(): PostHogMCP | null {
  if (client !== undefined) return client;
  const apiKey = posthogApiKey();
  if (!apiKey) {
    client = null;
    return null;
  }
  client = new PostHogMCP(apiKey, {
    host: posthogHost(),
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

export function mcpIdentity(workspace: {
  id: string;
  name: string;
  notificationEmail?: string;
  billing?: { plan?: string };
}) {
  return {
    distinctId: workspace.id,
    setProperties: {
      name: workspace.name,
      ...(workspace.notificationEmail ? { email: workspace.notificationEmail } : {}),
      ...(workspace.billing?.plan ? { plan: workspace.billing.plan } : {}),
    },
  };
}

export function parseMcpClientInfo(params: unknown) {
  if (!params || typeof params !== "object") {
    return { clientName: undefined as string | undefined, clientVersion: undefined as string | undefined };
  }
  const clientInfo = (params as { clientInfo?: unknown }).clientInfo;
  if (!clientInfo || typeof clientInfo !== "object") {
    return { clientName: undefined as string | undefined, clientVersion: undefined as string | undefined };
  }
  const name = (clientInfo as { name?: unknown }).name;
  const version = (clientInfo as { version?: unknown }).version;
  return {
    clientName: typeof name === "string" && name.trim() ? name.trim() : undefined,
    clientVersion: typeof version === "string" && version.trim() ? version.trim() : undefined,
  };
}

export function toolArguments(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export function mcpSessionFromRequest(request: NextRequest): SessionTokenPayload | undefined {
  const decoded = decodeSessionId(request.headers.get(MCP_SESSION_HEADER));
  return decoded ?? undefined;
}

export function mintMcpSession(payload: Omit<SessionTokenPayload, "sessionId"> & { sessionId?: string }) {
  const session: SessionTokenPayload = {
    sessionId: payload.sessionId || newSessionId(),
    clientName: payload.clientName,
    clientVersion: payload.clientVersion,
    protocolVersion: payload.protocolVersion,
  };
  return { session, token: encodeSessionId(session) };
}

export function attachMcpSessionHeader(response: NextResponse, token: string) {
  response.headers.set("Mcp-Session-Id", token);
  return response;
}

export function mcpCaptureContext(
  workspace: { id: string; name: string; notificationEmail?: string; billing?: { plan?: string } },
  request: NextRequest,
  session?: SessionTokenPayload,
) {
  const identity = mcpIdentity(workspace);
  const protocolVersion =
    session?.protocolVersion || request.headers.get("mcp-protocol-version") || undefined;
  const clientUserAgent = request.headers.get("user-agent") || undefined;
  const vendorClient = request.headers.get("x-anthropic-client") || undefined;
  return {
    ...identity,
    sessionId: session?.sessionId,
    protocolVersion,
    clientUserAgent,
    vendorClient,
    properties: {
      ...(session?.clientName ? { $mcp_client_name: session.clientName } : {}),
      ...(session?.clientVersion ? { $mcp_client_version: session.clientVersion } : {}),
    },
  };
}

export function advertisedMcpTools<T extends { name: string }>(tools: T[]): T[] {
  const posthog = getPostHogMcp();
  if (!posthog) return tools;
  return posthog.prepareToolList(tools, { reportMissing: true });
}

export function prepareIncomingToolCall(name: string, args: unknown): PreparedToolCall & { dispatchArgs: unknown } {
  const posthog = getPostHogMcp();
  const record = toolArguments(args);
  if (!posthog) {
    return { isMissingCapability: false, args: record, dispatchArgs: args };
  }
  const prepared = posthog.prepareToolCall(name, record);
  return { ...prepared, dispatchArgs: prepared.args ?? {} };
}

export async function flushPostHogMcp(timeoutMs = 2500): Promise<void> {
  if (!client) return;
  try {
    await Promise.race([
      client.flush(),
      new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } catch {
    // Analytics must never delay an MCP response.
  }
}
