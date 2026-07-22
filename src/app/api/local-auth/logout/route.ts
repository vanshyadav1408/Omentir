import { NextResponse } from "next/server";
import { LOCAL_SESSION_COOKIE, localCookieOptions } from "@/lib/local-session";
import { isLocalMode } from "@/lib/runtime-mode";

export async function POST() {
  if (!isLocalMode()) return new NextResponse(null, { status: 404 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCAL_SESSION_COOKIE, "", { ...localCookieOptions(), maxAge: 0 });
  return response;
}
