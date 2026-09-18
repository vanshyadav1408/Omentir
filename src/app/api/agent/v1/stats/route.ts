import { NextRequest, NextResponse } from "next/server";
import { requireAgentApiContext } from "@/lib/server/agent-api";
import { agentApiCaught } from "@/lib/server/agent-api-http";
import { getWorkspaceStatsResource } from "@/lib/server/agent-api-operations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json(
      await getWorkspaceStatsResource(auth.context, {
        range: request.nextUrl.searchParams.get("range") || undefined,
      }),
    );
  } catch (error) {
    return agentApiCaught(error);
  }
}
