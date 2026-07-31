import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getAppBaseUrl } from "./runtime-config";

/**
 * OAuth 2.1 authorization server for the MCP endpoint.
 *
 * Hosted AI apps (Claude, ChatGPT, Grok) only let a user paste a server URL -
 * there is no field for an API key. They authenticate by discovering this
 * metadata, registering themselves, and walking the user through consent. The
 * access token handed back is an ordinary Omentir agent token, so everything
 * downstream (authentication, plan gating, revocation from /api-keys) is
 * unchanged and there is no second credential system to keep in sync.
 */

export const OAUTH_SCOPE = "omentir";

/** Codes are exchanged within seconds of the redirect; a short life limits replay. */
export const AUTHORIZATION_CODE_TTL_SECONDS = 300;

export const MCP_RESOURCE_PATH = "/api/agent/v1/mcp";

export function newOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function protectedResourceMetadata() {
  const base = getAppBaseUrl();
  return {
    resource: `${base}${MCP_RESOURCE_PATH}`,
    authorization_servers: [base],
    scopes_supported: [OAUTH_SCOPE],
    bearer_methods_supported: ["header"],
    resource_documentation: `${base}/mcp-server`,
  };
}

export function authorizationServerMetadata() {
  const base = getAppBaseUrl();
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    registration_endpoint: `${base}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    // PKCE is mandatory: every client here is public (no secret can be kept in
    // a browser-based AI app), so the code verifier is the only thing binding
    // an authorization code to the client that requested it.
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [OAUTH_SCOPE],
    service_documentation: `${base}/mcp-server`,
  };
}

/** The `WWW-Authenticate` challenge that points a client at the metadata above. */
export function bearerChallenge() {
  const base = getAppBaseUrl();
  return `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource", scope="${OAUTH_SCOPE}"`;
}

/**
 * Redirect targets we are willing to send an authorization code to. Hosted apps
 * use https callbacks; desktop clients (Claude Desktop, Cursor, VS Code) use a
 * loopback address or a private URL scheme. Plain http on a public host is
 * refused because the code would travel in cleartext.
 */
export function isAllowedRedirectUri(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.hash) return false;
  if (url.protocol === "https:") return true;
  if (url.protocol === "http:") {
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  }
  // A private scheme such as cursor:// or vscode:// - no host to verify, but the
  // OS routes it to a locally installed application rather than the network.
  return /^[a-z][a-z0-9+.-]*:$/.test(url.protocol) && url.protocol !== "javascript:" && url.protocol !== "data:";
}

export function verifyPkceS256(verifier: string, challenge: string) {
  if (!verifier || !challenge) return false;
  // RFC 7636 bounds the verifier; anything outside it is malformed, not merely wrong.
  if (verifier.length < 43 || verifier.length > 128) return false;
  const computed = createHash("sha256").update(verifier).digest("base64url");
  const expected = Buffer.from(challenge);
  const actual = Buffer.from(computed);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function oauthErrorResponse(error: string, description: string, status: number) {
  return NextResponse.json(
    { error, error_description: description },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Appends an error to the client's redirect URI. Used only after the redirect
 * URI is confirmed to belong to a registered client - otherwise an attacker
 * could aim error redirects anywhere.
 */
export function redirectWithError(redirectUri: string, error: string, description: string, state?: string) {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state) url.searchParams.set("state", state);
  return url.toString();
}
