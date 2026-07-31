import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { createOAuthAuthorizationCode, getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { planHasApiAccess } from "@/lib/plan-limits";
import { resolveAuthorizationRequest } from "@/lib/server/oauth-authorize";
import {
  AUTHORIZATION_CODE_TTL_SECONDS,
  newOpaqueToken,
  redirectWithError,
} from "@/lib/server/oauth";
import { getAppBaseUrl } from "@/lib/server/runtime-config";
import { readTextBody, RequestBodyTooLargeError } from "@/lib/server/request-body";

export const dynamic = "force-dynamic";

/**
 * A 303 with a raw Location header rather than NextResponse.redirect: desktop
 * MCP clients register private schemes (cursor://, vscode://) that the URL
 * helpers reject, and the browser hands those to the OS just fine.
 */
function seeOther(location: string) {
  return new NextResponse(null, { status: 303, headers: { Location: location, "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  // This endpoint acts on the signed-in user's cookie session, so a cross-site
  // form post could otherwise mint a code without the user ever seeing consent.
  if (request.headers.get("origin") !== new URL(getAppBaseUrl()).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await readTextBody(request, 16 * 1024));
  } catch (error) {
    const message = error instanceof RequestBodyTooLargeError ? error.message : "Unreadable request body.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const resolved = await resolveAuthorizationRequest(form);
  if (!resolved.ok) {
    if (resolved.fatal) return NextResponse.json({ error: resolved.message }, { status: 400 });
    return seeOther(
      redirectWithError(resolved.redirectUri, resolved.error, resolved.message, resolved.state),
    );
  }

  const { client, redirectUri, codeChallenge, state } = resolved.request;

  if (form.get("decision") !== "approve") {
    return seeOther(redirectWithError(redirectUri, "access_denied", "You declined the request.", state));
  }

  const { userId } = await auth();
  if (!userId) {
    return seeOther(
      redirectWithError(redirectUri, "access_denied", "Your Omentir session expired.", state),
    );
  }

  const workspace = await getWorkspace(userId);
  if (!hasActiveSubscription(workspace) || !planHasApiAccess(workspace.billing?.plan)) {
    return seeOther(
      redirectWithError(
        redirectUri,
        "access_denied",
        "This Omentir plan does not include app connections.",
        state,
      ),
    );
  }

  const code = newOpaqueToken();
  await createOAuthAuthorizationCode({
    code,
    clientId: client.id,
    workspaceId: workspace.id,
    redirectUri,
    codeChallenge,
    ttlSeconds: AUTHORIZATION_CODE_TTL_SECONDS,
  });

  const target = new URL(redirectUri);
  target.searchParams.set("code", code);
  if (state) target.searchParams.set("state", state);
  return seeOther(target.toString());
}
