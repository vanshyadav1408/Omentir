import { NextRequest, NextResponse } from "next/server";
import { requireAgentApiContext } from "@/lib/server/agent-api";
import {
  AgentApiOperationError,
  listScheduledActionResources,
} from "@/lib/server/agent-api-operations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  const agentId = request.nextUrl.searchParams.get("agentId") || undefined;
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || "50");

  try {
    return NextResponse.json(
      await listScheduledActionResources(auth.context, {
        agentId,
        limit: Number.isFinite(rawLimit) ? rawLimit : 50,
      }),
    );
  } catch (error) {
    if (error instanceof AgentApiOperationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }
    throw error;
  }
}
