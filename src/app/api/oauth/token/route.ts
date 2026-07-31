import { NextRequest, NextResponse } from "next/server";
import { consumeOAuthAuthorizationCode, createAgentApiKey, getOAuthClient } from "@/lib/server/data";
import { OAUTH_SCOPE, oauthErrorResponse, verifyPkceS256 } from "@/lib/server/oauth";
import { preflightResponse, withCors } from "@/lib/server/cors";
import { readTextBody, RequestBodyTooLargeError } from "@/lib/server/request-body";
import { rateLimit, requestSource } from "@/lib/request-rate-limit";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fail = (error: string, description: string, status: number) =>
    withCors(oauthErrorResponse(error, description, status), origin);

  if (!rateLimit(`oauth-token:${requestSource(request)}`, 60, 60_000)) {
    return fail("temporarily_unavailable", "Too many token requests.", 429);
  }

  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await readTextBody(request, 16 * 1024));
  } catch (error) {
    const message = error instanceof RequestBodyTooLargeError ? error.message : "Unreadable request body.";
    return fail("invalid_request", message, 400);
  }

  if (form.get("grant_type") !== "authorization_code") {
    return fail("unsupported_grant_type", "Only the authorization_code grant is supported.", 400);
  }

  const code = form.get("code") || "";
  const clientId = form.get("client_id") || "";
  const redirectUri = form.get("redirect_uri") || "";
  const codeVerifier = form.get("code_verifier") || "";
  if (!code || !clientId || !codeVerifier) {
    return fail("invalid_request", "code, client_id, and code_verifier are required.", 400);
  }

  const record = await consumeOAuthAuthorizationCode(code);
  if (!record) {
    return fail("invalid_grant", "The authorization code is invalid, expired, or already used.", 400);
  }
  // The code is spent either way now - a mismatch below must not be retryable.
  if (record.clientId !== clientId) {
    return fail("invalid_grant", "The authorization code was issued to a different client.", 400);
  }
  if (redirectUri && redirectUri !== record.redirectUri) {
    return fail("invalid_grant", "redirect_uri does not match the authorization request.", 400);
  }
  if (!verifyPkceS256(codeVerifier, record.codeChallenge)) {
    return fail("invalid_grant", "The PKCE code verifier does not match.", 400);
  }

  const client = await getOAuthClient(record.clientId);

  let token: string;
  try {
    // The access token is a normal agent token, so it authenticates, rate
    // limits, and revokes through exactly the same path as a hand-made key.
    ({ token } = await createAgentApiKey(record.workspaceId, client?.clientName || "AI app"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not issue an access token.";
    return fail("access_denied", message, 403);
  }

  return withCors(
    NextResponse.json(
      {
        access_token: token,
        token_type: "Bearer",
        scope: OAUTH_SCOPE,
      },
      { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } },
    ),
    origin,
  );
}
