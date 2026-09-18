import { NextRequest, NextResponse } from "next/server";
import { requireAgentApiContext } from "@/lib/server/agent-api";
import { exportLeadsResource } from "@/lib/server/agent-api-actions";
import { agentApiCaught } from "@/lib/server/agent-api-http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json(
      await exportLeadsResource(auth.context, {
        groupId: request.nextUrl.searchParams.get("groupId") || undefined,
      }),
    );
  } catch (error) {
    return agentApiCaught(error);
  }
}
