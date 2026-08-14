import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { LOCAL_SESSION_COOKIE, localCookieOptions } from "@/lib/local-session";
import { isLocalMode } from "@/lib/runtime-mode";
import { authOrSignedOut } from "@/lib/server/clerk-session";
import { getAppBaseUrl } from "@/lib/server/runtime-config";

export const dynamic = "force-dynamic";

const CLERK_COOKIE_PREFIXES = ["__clerk", "clerk_", "__client"];
const CLERK_COOKIE_NAMES = new Set(["__session"]);

function isClerkCookieName(name: string) {
  return (
    CLERK_COOKIE_NAMES.has(name) ||
    CLERK_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix))
  );
}

function redirectHome(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", getAppBaseUrl()), 303);
  response.headers.set("Cache-Control", "no-store");
  if (isLocalMode()) {
    response.cookies.set(LOCAL_SESSION_COOKIE, "", { ...localCookieOptions(), maxAge: 0 });
    return response;
  }
  for (const cookie of request.cookies.getAll()) {
    if (isClerkCookieName(cookie.name)) {
      response.cookies.delete(cookie.name);
    }
  }
  return response;
}

export async function GET(request: NextRequest) {
  if (!isLocalMode()) {
    const session = await authOrSignedOut();
    const sessionId = "sessionId" in session ? session.sessionId : null;
    if (sessionId) {
      try {
        const clerk = await clerkClient();
        await clerk.sessions.revokeSession(sessionId);
      } catch {
        // Session may already be expired. Cookies are still cleared below.
      }
    }
  }

  return redirectHome(request);
}
