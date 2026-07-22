import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { authenticateAgentApiToken } from "./data";
import { hasActiveSubscription } from "./subscription";
import type { Workspace } from "./types";
import { isLocalMode } from "@/lib/runtime-mode";
import { LOCAL_USER_ID } from "@/lib/local-session";

export type AgentApiContext = {
  workspace: Workspace;
  tokenId: string;
};

export function agentApiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAgentApiContext(request: NextRequest): Promise<
  | { ok: true; context: AgentApiContext }
  | { ok: false; response: NextResponse }
> {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1] || "";
  if (!token) {
    return { ok: false, response: agentApiError("Bearer token required.", 401) };
  }

  const authenticated = await authenticateAgentApiToken(token);
  if (!authenticated) {
    return { ok: false, response: agentApiError("Invalid or revoked agent token.", 401) };
  }

  if (isLocalMode() && authenticated.workspace.id !== LOCAL_USER_ID) {
    return { ok: false, response: agentApiError("Agent token is not scoped to this local workspace.", 403) };
  }

  if (!hasActiveSubscription(authenticated.workspace)) {
    return { ok: false, response: agentApiError("Active subscription required.", 402) };
  }

  return {
    ok: true,
    context: {
      workspace: authenticated.workspace,
      tokenId: authenticated.key.id,
    },
  };
}
