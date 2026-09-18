import { NextRequest, NextResponse } from "next/server";
import { requireAgentApiContext } from "@/lib/server/agent-api";
import { listInboxResource } from "@/lib/server/agent-api-actions";
import { agentApiCaught } from "@/lib/server/agent-api-http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || "30");

  try {
    return NextResponse.json(
      await listInboxResource(auth.context, {
        accountId: request.nextUrl.searchParams.get("accountId") || undefined,
        query: request.nextUrl.searchParams.get("query") || undefined,
        limit: Number.isFinite(rawLimit) ? rawLimit : 30,
      }),
    );
  } catch (error) {
    return agentApiCaught(error);
  }
}
