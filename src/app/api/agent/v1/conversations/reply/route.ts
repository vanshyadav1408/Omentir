import { NextRequest, NextResponse } from "next/server";
import { requireAgentApiContext } from "@/lib/server/agent-api";
import {
  AgentApiOperationError,
  replyToLeadResource,
} from "@/lib/server/agent-api-operations";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json(
      await replyToLeadResource(auth.context, await request.json().catch(() => ({}))),
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
