import { auth } from "@/lib/server/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/server/runtime-config";

export const dynamic = "force-dynamic";

function redirectOriginFor(request: NextRequest | undefined, appUrl: string) {
  if (!request || process.env.NODE_ENV !== "development") return appUrl;
  const allowedDevHosts = new Set([
    "localhost",
    "127.0.0.1",
    "[::1]",
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((item) => item.trim()).filter(Boolean) ?? []),
  ]);
  return allowedDevHosts.has(request.nextUrl.hostname) ? request.nextUrl.origin : appUrl;
}

// Settings, overview and onboarding link here. LinkedIn connects through
// Omentir's own sign-in form.
export async function GET(request?: NextRequest) {
  const { userId } = await auth();
  const redirectBase = redirectOriginFor(request, getAppBaseUrl());
  if (!userId) {
    return NextResponse.redirect(new URL("/login", redirectBase));
  }
  return NextResponse.redirect(new URL("/connect/linkedin", redirectBase));
}
