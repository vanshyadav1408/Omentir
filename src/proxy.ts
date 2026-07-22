import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LOCAL_SESSION_COOKIE, verifyLocalSession } from "./lib/local-session";
import { isLocalMode } from "./lib/runtime-mode";
import { isClerkSessionKeyMismatch } from "./lib/clerk-errors";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)", "/actions(.*)", "/activity(.*)", "/agents(.*)",
  "/api-keys(.*)", "/campaigns(.*)", "/contact(.*)", "/messages(.*)",
  "/leads(.*)", "/my-product(.*)", "/new-user-experience(.*)",
  "/onboarding(.*)", "/setup(.*)", "/settings(.*)",
]);

const CLERK_COOKIE_PREFIXES = ["__clerk", "clerk_", "__client"];
const CLERK_COOKIE_NAMES = new Set(["__session"]);

function isDevelopmentOnboardingReview(req: NextRequest) {
  return process.env.NODE_ENV !== "production" && req.nextUrl.pathname === "/onboarding" && req.nextUrl.searchParams.get("review") === "1";
}

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
    if (isProtectedRoute(req) && !isDevelopmentOnboardingReview(req)) {
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

const localPublicPaths = new Set(["/login", "/api/health", "/api/local-auth/login"]);
const localServicePrefixes = [
  "/api/agent/v1/",
  "/api/connect/callback",
  "/api/jobs/automation-tick",
  "/api/webhooks/unipile",
  "/api/webhooks/clerk",
  "/api/webhooks/whop",
  "/api/jobs/mailing-list-backfill",
  "/api/mailing-list/unsubscribe",
  "/api/billing/",
];

async function localMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/") return NextResponse.redirect(new URL("/dashboard", request.url));
  if (localPublicPaths.has(path) || localServicePrefixes.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.next();
  }

  const localConnectRoute = path === "/connect" || path.startsWith("/connect/") ||
    path === "/reconnect" || path.startsWith("/reconnect/");
  const appRequest = isProtectedRoute(request) || localConnectRoute || path.startsWith("/api/");
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
  return isLocalMode() ? localMiddleware(request) : hostedMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
