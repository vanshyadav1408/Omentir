import { NextRequest, NextResponse } from "next/server";
import { readAgentApiJsonBody, requireAgentApiContext } from "@/lib/server/agent-api";
import {
  AgentApiOperationError,
  updateWorkspaceSettingsResource,
} from "@/lib/server/agent-api-operations";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  const body = await readAgentApiJsonBody(request);
  if (!body.ok) return body.response;

  try {
    return NextResponse.json(await updateWorkspaceSettingsResource(auth.context, body.body));
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
