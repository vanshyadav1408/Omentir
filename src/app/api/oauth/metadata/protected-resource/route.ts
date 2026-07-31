import { NextRequest, NextResponse } from "next/server";
import { protectedResourceMetadata } from "@/lib/server/oauth";
import { preflightResponse, withCors } from "@/lib/server/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  return withCors(NextResponse.json(protectedResourceMetadata()), request.headers.get("origin"));
}
