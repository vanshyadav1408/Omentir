import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { authenticateAgentApiToken } from "./data";
import { hasActiveSubscription } from "./subscription";
import type { Workspace } from "./types";
import { isLocalMode } from "@/lib/runtime-mode";
import { LOCAL_USER_ID } from "@/lib/local-session";
import { planHasApiAccess } from "@/lib/plan-limits";
import {
  rateLimit,
  rateLimitRequestShared,
  requestSource,
} from "@/lib/request-rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "./request-body";
import { bearerChallenge } from "./oauth";

export type AgentApiContext = {
  workspace: Workspace;
  tokenId: string;
};

const AGENT_API_JSON_MAX_BYTES = 256 * 1024;

export function agentApiError(message: string, status: number) {
  // A bare 401 tells an AI app nothing about how to authenticate, so hosted
  // connectors (Claude, ChatGPT, Grok) give up silently and show no tools. The
  // challenge points them at the OAuth metadata that starts the sign-in flow.
  const headers = status === 401 ? { "WWW-Authenticate": bearerChallenge() } : undefined;
  return NextResponse.json({ error: message }, { status, headers });
}

export async function requireAgentApiContext(request: NextRequest): Promise<
  | { ok: true; context: AgentApiContext }
  | { ok: false; response: NextResponse }
> {
  if (!rateLimit(`agent-api-auth:${requestSource(request)}`, 600, 60_000)) {
    return { ok: false, response: agentApiError("Too many agent API requests.", 429) };
  }

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

  if (
    !(await rateLimitRequestShared(request, "agent-api", {
      sourceKey: `${authenticated.workspace.id}:${authenticated.key.id}`,
      perSource: 120,
      global: 2000,
      windowMs: 60_000,
    }))
  ) {
    return { ok: false, response: agentApiError("Too many agent API requests.", 429) };
  }

  if (!hasActiveSubscription(authenticated.workspace)) {
    return { ok: false, response: agentApiError("Active subscription required.", 402) };
  }

  if (!planHasApiAccess(authenticated.workspace.billing?.plan)) {
    return {
      ok: false,
      response: agentApiError("API access is available on every paid Omentir plan.", 403),
    };
  }

  return {
    ok: true,
    context: {
      workspace: authenticated.workspace,
      tokenId: authenticated.key.id,
    },
  };
}

/** Bounded JSON body for agent API mutations (replaces unbounded request.json()). */
export async function readAgentApiJsonBody<T>(
  request: NextRequest,
  maxBytes = AGENT_API_JSON_MAX_BYTES,
): Promise<{ ok: true; body: T } | { ok: false; response: NextResponse }> {
  try {
    const body = await readJsonBody<T>(request, maxBytes);
    return { ok: true, body: (body ?? {}) as T };
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return { ok: false, response: agentApiError(error.message, 413) };
    }
    throw error;
  }
}
