import { NextRequest, NextResponse } from "next/server";
import { requireAgentApiContext } from "@/lib/server/agent-api";
import {
  AgentApiOperationError,
  getLeadResource,
} from "@/lib/server/agent-api-operations";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  try {
    const { leadId } = await params;
    return NextResponse.json(await getLeadResource(auth.context, { leadId }));
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
