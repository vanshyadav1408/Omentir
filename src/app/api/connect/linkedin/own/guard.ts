import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { getAppBaseUrl } from "@/lib/server/runtime-config";
import { rateLimitRequestShared } from "@/lib/request-rate-limit";
import { RequestBodyTooLargeError } from "@/lib/server/request-body";
import { LinkedInConnectError } from "@/lib/server/linkedin-own/connect";
import { LinkedInLoginError, type LoginOutcome } from "@/lib/server/linkedin-own/login";
import { LinkedInResponseError } from "@/lib/server/linkedin-errors";

const NO_STORE = { "cache-control": "no-store" };

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function isAllowedOwnConnectOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }
  if (parsedOrigin.origin === new URL(getAppBaseUrl()).origin) return true;
  if (process.env.NODE_ENV !== "development") return false;
  const host = request.headers.get("host");
  if (!host || parsedOrigin.host !== host) return false;
  const allowedDevHosts = new Set([
    "localhost",
    "127.0.0.1",
    "[::1]",
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((item) => item.trim()).filter(Boolean) ?? []),
  ]);
  return allowedDevHosts.has(parsedOrigin.hostname);
}

// Shared by the password and code steps: the call must come from Omentir's
// own page, and the person must be signed in.
export async function guardOwnConnect(request: NextRequest, scope: string, perSource: number) {
  if (!isAllowedOwnConnectOrigin(request)) {
    return json({ error: "Invalid request origin." }, 403);
  }
  const { userId } = await auth();
  if (!userId) return json({ error: "Unauthorized" }, 401);
  if (!(await rateLimitRequestShared(request, scope, { perSource, global: 100, windowMs: 60_000, sourceKey: userId }))) {
    return json({ error: "Too many attempts. Try again in a minute." }, 429);
  }
  return { userId };
}

export function connectedResponse(account: { displayName: string }) {
  return json({ ok: true, displayName: account.displayName });
}

export function verificationResponse(loginId: string, outcome: Pick<Extract<LoginOutcome, { kind: "challenge" }>, "method" | "hint" | "retryError">, status = 200) {
  return json({
    needsVerification: true,
    loginId,
    method: outcome.method,
    ...(outcome.hint ? { hint: outcome.hint } : {}),
    ...(outcome.retryError ? { error: outcome.retryError } : {}),
  }, status);
}

const SECRET_HINT = /li_at|jsessionid|ajax:|password|cookie/i;

export function connectFailureResponse(error: unknown, extra: Record<string, unknown> = {}) {
  if (error instanceof RequestBodyTooLargeError) return json({ error: "That input is too large.", ...extra }, 413);
  if (error instanceof LinkedInLoginError) {
    return json({
      error: error.message,
      ...(error.reason === "unsupported_check" || error.reason === "refused" ? { fallback: true } : {}),
      ...extra,
    }, error.reason === "blocked" ? 429 : 400);
  }
  if (error instanceof LinkedInConnectError) return json({ error: error.message, ...extra }, 400);
  if (error instanceof LinkedInResponseError) {
    const unconfigured = error.errorType === "errors/provider_unconfigured";
    return json({
      error: unconfigured
        ? "LinkedIn connection is not configured. Contact your instance administrator."
        : "LinkedIn signed you in, but the session could not be verified. Try again in a minute.",
      ...extra,
    }, unconfigured ? 503 : 400);
  }
  // Provider and storage errors can echo credentials: log only what is safe.
  const message = error instanceof Error ? error.message : String(error);
  console.error("[linkedin-own] connect failed", error instanceof Error ? error.name : typeof error, SECRET_HINT.test(message) ? "(message withheld)" : message.slice(0, 200));
  return json({ error: "Could not connect LinkedIn. Please try again.", ...extra }, 503);
}
