import "server-only";

import { NextResponse } from "next/server";

/**
 * Cross-origin access for the MCP endpoint and its OAuth metadata.
 *
 * Hosted AI apps call these from the browser, so without CORS the preflight
 * fails and the connector never reaches the server at all. Allowing any origin
 * is safe here: every protected route requires a bearer token, no route trusts
 * cookies or any other ambient credential, so a hostile page gains nothing by
 * issuing a request its user's browser would attach nothing useful to.
 */
const ALLOWED_HEADERS = [
  "Authorization",
  "Content-Type",
  "Mcp-Session-Id",
  "MCP-Protocol-Version",
  "Last-Event-ID",
];

export function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
    // Clients read the session id to resume a stream and the challenge to learn
    // where to authenticate; both are invisible to scripts unless exposed.
    "Access-Control-Expose-Headers": "Mcp-Session-Id, WWW-Authenticate",
    "Access-Control-Max-Age": "86400",
  };
}

export function withCors<T extends NextResponse>(response: T, origin: string | null) {
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    response.headers.set(key, value);
  }
  return response;
}

export function preflightResponse(origin: string | null) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
