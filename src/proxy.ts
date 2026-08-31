import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LOCAL_SESSION_COOKIE, verifyLocalSession } from "./lib/local-session";
import { isLocalMode } from "./lib/runtime-mode";
import { isClerkSessionKeyMismatch } from "./lib/clerk-errors";
import { captureAiPageFetch } from "./lib/ai-page-fetch";
import { isPublicMarketingPath, markdownRewritePath } from "./lib/public-marketing-path";
import {
  SANITY_STUDIO_HOST,
  hostnameFromHostHeader,
  isSanityStudioHost,
  isSanityStudioRequest,
  isStudioAppPath,
  studioPathFromPublicPath,
} from "./sanity/studio-host";

function requestHostname(request: NextRequest) {
  if (isSanityStudioRequest(request.headers, request.nextUrl.hostname)) {
    return SANITY_STUDIO_HOST;
  }
  const forwarded = hostnameFromHostHeader(request.headers.get("x-forwarded-host"));
  const host = hostnameFromHostHeader(request.headers.get("host"));
  return forwarded || host;
}

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)", "/overview(.*)", "/actions(.*)", "/activity(.*)", "/agents(.*)",
  "/api-keys(.*)", "/campaigns(.*)", "/messages(.*)",
  "/leads(.*)", "/my-product(.*)", "/new-user-experience(.*)",
  "/onboarding(.*)", "/setup(.*)", "/settings(.*)",
]);

const CLERK_COOKIE_PREFIXES = ["__clerk", "clerk_", "__client"];
const CLERK_COOKIE_NAMES = new Set(["__session"]);

function clearClerkCookies(response: NextResponse, req: NextRequest) {
  for (const cookie of req.cookies.getAll()) {
    if (CLERK_COOKIE_NAMES.has(cookie.name) || CLERK_COOKIE_PREFIXES.some((prefix) => cookie.name.startsWith(prefix))) {
      response.cookies.delete(cookie.name);
    }
  }
  return response;
}

const hostedMiddleware = clerkMiddleware(async (auth, req) => {
  try {
    if (req.nextUrl.pathname === "/agents.md") return NextResponse.next();
    if (req.method === "POST" && (req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup"))) {
      return NextResponse.redirect(req.nextUrl.clone(), { status: 303 });
    }
    if (isProtectedRoute(req)) {
      await auth.protect({ unauthenticatedUrl: new URL("/login", req.url).toString() });
    }
  } catch (error) {
    if (isClerkSessionKeyMismatch(error)) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("session", "reset");
      return clearClerkCookies(NextResponse.redirect(loginUrl), req);
    }
    throw error;
  }
});

const RETIRED_PUBLIC_REDIRECTS: Record<string, string> = {
  "/for-agents": "/features/agent-api-and-mcp",
  "/mcp-server": "/integrations/mcp",
  "/for-agents.md": "/features/agent-api-and-mcp.md",
  "/mcp-server.md": "/integrations/mcp.md",
  "/find-leads": "/tools/find-leads",
  "/find-leads.md": "/tools/find-leads.md",
  "/improve-linkedin-profile": "/tools/improve-linkedin-profile",
  "/improve-linkedin-profile.md": "/tools/improve-linkedin-profile.md",
  "/tools/linkedin-profile-improver": "/tools/improve-linkedin-profile",
  "/tools/linkedin-profile-improver.md": "/tools/improve-linkedin-profile.md",
};

const localPublicPaths = new Set(["/login", "/logout", "/api/health", "/api/local-auth/login"]);
const localServicePrefixes = [
  "/api/agent/v1/",
  // OAuth discovery and the token/registration exchange are called by the AI
  // app itself, with no Omentir session to present.
  "/.well-known/",
  "/api/oauth/metadata/",
  "/api/oauth/register",
  "/api/oauth/token",
  "/api/connect/callback",
  "/api/jobs/automation-tick",
  "/api/jobs/gemini-diagnostics",
  "/api/webhooks/unipile",
  "/api/webhooks/clerk",
  "/api/webhooks/whop",
  "/api/webhooks/sanity",
  "/api/jobs/mailing-list-backfill",
  "/api/mailing-list/unsubscribe",
  "/api/billing/",
];

async function localMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/") return NextResponse.redirect(new URL("/overview", request.url));
  if (localPublicPaths.has(path) || localServicePrefixes.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.next();
  }

  const localConnectRoute = path === "/connect" || path.startsWith("/connect/") ||
    path === "/reconnect" || path.startsWith("/reconnect/");
  // The consent screen and its decision handler need a signed-in user, so they
  // fall through to the session check below rather than being served publicly.
  const appRequest =
    isProtectedRoute(request) || localConnectRoute || path.startsWith("/api/") || path.startsWith("/oauth/");
  if (!appRequest) return new NextResponse(null, { status: 404 });

  const signedIn = await verifyLocalSession(
    request.cookies.get(LOCAL_SESSION_COOKIE)?.value,
    process.env.LOCAL_SESSION_SECRET || "",
  );
  if (!signedIn) {
    if (path.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const configured = process.env.APP_BASE_URL?.replace(/\/$/, "");
    if (!configured || request.headers.get("origin") !== configured) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (isLocalMode()) return localMiddleware(request);

  event.waitUntil(captureAiPageFetch(request));

  const hostname = requestHostname(request);

  if (isSanityStudioHost(hostname)) {
    const path = request.nextUrl.pathname;
    if (path.startsWith("/_next") || path.startsWith("/api")) return NextResponse.next();
    if (isStudioAppPath(path)) return NextResponse.next();
    // Redirect, do not rewrite. `/` is a statically prerendered marketing page;
    // a rewrite keeps the browser URL at `/` and the client hydrates the
    // landing page over Studio. /studio is the real Next.js route and the
    // Sanity basePath.
    const destination = request.nextUrl.clone();
    destination.pathname = studioPathFromPublicPath(path);
    return NextResponse.redirect(destination);
  }

  const retiredDestination = RETIRED_PUBLIC_REDIRECTS[request.nextUrl.pathname];
  if (retiredDestination) {
    const destination = request.nextUrl.clone();
    destination.pathname = retiredDestination;
    return NextResponse.redirect(destination, 308);
  }

  // Public marketing pages are static and do not need server-side session
  // state. Keeping them outside Clerk middleware lets the CDN cache crawlable
  // HTML instead of marking every anonymous response private and no-cache.
  // `{path}.md` is the markdown twin used by AI agents; rewrite it to the
  // baked renderer without sending `/overview.md` through auth.
  const markdownDestination = markdownRewritePath(request.nextUrl.pathname);
  if (markdownDestination) {
    const destination = request.nextUrl.clone();
    destination.pathname = markdownDestination;
    return NextResponse.rewrite(destination);
  }
  // `/overview.md` would otherwise match Clerk's `/overview(.*)` matcher.
  // Private markdown twins do not exist; return 404 instead of a login wall.
  if (
    request.nextUrl.pathname.endsWith(".md") &&
    request.nextUrl.pathname !== "/agents.md"
  ) {
    return new NextResponse("Not found\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  if (isPublicMarketingPath(request.nextUrl.pathname)) return NextResponse.next();

  return hostedMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
