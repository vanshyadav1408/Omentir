import { NextRequest, NextResponse } from "next/server";
import { createLocalSession, localCookieOptions, LOCAL_SESSION_COOKIE, passwordsMatch } from "@/lib/local-session";
import { isLocalMode, isLocalPasswordRequired } from "@/lib/runtime-mode";
import { getAppBaseUrl } from "@/lib/server/runtime-config";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/request-body";

const attempts = new Map<string, { count: number; blockedUntil: number }>();

export async function POST(request: NextRequest) {
  if (!isLocalMode()) return new NextResponse(null, { status: 404 });
  if (request.headers.get("origin") !== getAppBaseUrl()) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  let body: { password?: string } | null;
  try {
    body = await readJsonBody<{ password?: string }>(request, 8 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    throw error;
  }
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (isLocalPasswordRequired()) {
    const state = attempts.get(key);
    if (state && state.blockedUntil > Date.now()) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    if (!passwordsMatch(body?.password || "", process.env.LOCAL_APP_PASSWORD || "")) {
      const count = (state?.count || 0) + 1;
      attempts.set(key, { count, blockedUntil: count >= 5 ? Date.now() + 60_000 : 0 });
      return NextResponse.json({ error: "Wrong password." }, { status: 401 });
    }
  }
  attempts.delete(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    LOCAL_SESSION_COOKIE,
    await createLocalSession(process.env.LOCAL_SESSION_SECRET || ""),
    localCookieOptions(),
  );
  return response;
}
