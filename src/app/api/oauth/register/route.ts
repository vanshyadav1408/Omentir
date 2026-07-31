import { NextRequest, NextResponse } from "next/server";
import { registerOAuthClient } from "@/lib/server/data";
import { isAllowedRedirectUri, oauthErrorResponse } from "@/lib/server/oauth";
import { preflightResponse, withCors } from "@/lib/server/cors";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/request-body";
import { rateLimit, requestSource } from "@/lib/request-rate-limit";

export const dynamic = "force-dynamic";

type RegistrationRequest = {
  client_name?: unknown;
  redirect_uris?: unknown;
};

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Registration is unauthenticated by design (RFC 7591 open registration), so
  // it is the one write anyone can reach. Cap it per source to keep a scripted
  // client from filling the collection.
  if (!rateLimit(`oauth-register:${requestSource(request)}`, 20, 60_000)) {
    return withCors(
      oauthErrorResponse("temporarily_unavailable", "Too many registration attempts.", 429),
      origin,
    );
  }

  let body: RegistrationRequest | null;
  try {
    body = await readJsonBody<RegistrationRequest>(request, 16 * 1024);
  } catch (error) {
    const message =
      error instanceof RequestBodyTooLargeError ? error.message : "Registration body must be JSON.";
    return withCors(oauthErrorResponse("invalid_client_metadata", message, 400), origin);
  }

  const redirectUris = Array.isArray(body?.redirect_uris)
    ? body.redirect_uris.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];

  if (redirectUris.length === 0) {
    return withCors(
      oauthErrorResponse("invalid_redirect_uri", "redirect_uris is required.", 400),
      origin,
    );
  }
  if (redirectUris.length > 10) {
    return withCors(
      oauthErrorResponse("invalid_redirect_uri", "Register at most 10 redirect URIs.", 400),
      origin,
    );
  }
  const rejected = redirectUris.find((uri) => !isAllowedRedirectUri(uri));
  if (rejected) {
    return withCors(
      oauthErrorResponse(
        "invalid_redirect_uri",
        `Redirect URI is not allowed: ${rejected}. Use https, a loopback address, or a private application scheme.`,
        400,
      ),
      origin,
    );
  }

  const clientName = typeof body?.client_name === "string" ? body.client_name : "AI app";
  const client = await registerOAuthClient(clientName, redirectUris);

  return withCors(
    NextResponse.json(
      {
        client_id: client.id,
        client_name: client.clientName,
        redirect_uris: client.redirectUris,
        // Public client: an AI app cannot keep a secret, so PKCE does the binding.
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code"],
        response_types: ["code"],
        client_id_issued_at: Math.floor(Date.parse(client.createdAt) / 1000),
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    ),
    origin,
  );
}
