import "server-only";

import { getOAuthClient } from "./data";
import { isAllowedRedirectUri } from "./oauth";
import type { OAuthClient } from "./types";

export type AuthorizationRequest = {
  client: OAuthClient;
  redirectUri: string;
  codeChallenge: string;
  state: string;
};

/**
 * Validates an /oauth/authorize request. Both the consent page and the decision
 * handler run this, so what the user is shown and what actually gets approved
 * are checked by identical rules - the hidden form fields are re-verified
 * rather than trusted.
 *
 * A "fatal" result must never be redirected back to the caller: if the client
 * or the redirect URI cannot be verified, sending an error to that URI would
 * make this an open redirector. Anything else is reported to the client the
 * normal way, through its own registered redirect URI.
 */
export async function resolveAuthorizationRequest(params: URLSearchParams): Promise<
  | { ok: true; request: AuthorizationRequest }
  | { ok: false; fatal: true; message: string }
  | { ok: false; fatal: false; redirectUri: string; error: string; message: string; state: string }
> {
  const clientId = params.get("client_id") || "";
  const redirectUri = params.get("redirect_uri") || "";
  const state = params.get("state") || "";

  if (!clientId) return { ok: false, fatal: true, message: "The request is missing client_id." };

  const client = await getOAuthClient(clientId);
  if (!client) {
    return {
      ok: false,
      fatal: true,
      message: "This app is not registered with Omentir. Remove the connector and add it again.",
    };
  }

  // Exact match against what the client registered - no prefix or wildcard
  // matching, which is the usual way authorization codes get redirected away.
  if (!redirectUri || !client.redirectUris.includes(redirectUri) || !isAllowedRedirectUri(redirectUri)) {
    return {
      ok: false,
      fatal: true,
      message: "The app asked Omentir to send its response to an address it never registered.",
    };
  }

  const invalid = (error: string, message: string) =>
    ({ ok: false as const, fatal: false as const, redirectUri, error, message, state });

  if ((params.get("response_type") || "") !== "code") {
    return invalid("unsupported_response_type", "Only the authorization code flow is supported.");
  }
  if ((params.get("code_challenge_method") || "") !== "S256") {
    return invalid("invalid_request", "PKCE with S256 is required.");
  }

  const codeChallenge = params.get("code_challenge") || "";
  if (!codeChallenge || codeChallenge.length < 43 || codeChallenge.length > 128) {
    return invalid("invalid_request", "A valid S256 code_challenge is required.");
  }

  return { ok: true, request: { client, redirectUri, codeChallenge, state } };
}
