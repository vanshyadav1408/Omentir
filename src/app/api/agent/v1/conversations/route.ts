import { NextRequest, NextResponse } from "next/server";
import { requireAgentApiContext } from "@/lib/server/agent-api";
import {
  AgentApiOperationError,
  listConversationResources,
} from "@/lib/server/agent-api-operations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || "50");

  try {
    return NextResponse.json(
      await listConversationResources(auth.context, {
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
