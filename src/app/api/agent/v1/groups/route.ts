import { NextRequest, NextResponse } from "next/server";
import { readAgentApiJsonBody, requireAgentApiContext } from "@/lib/server/agent-api";
import { deleteGroupResource } from "@/lib/server/agent-api-actions";
import { agentApiCaught } from "@/lib/server/agent-api-http";
import { listGroupResources } from "@/lib/server/agent-api-operations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json(await listGroupResources(auth.context));
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  const body = await readAgentApiJsonBody(request);
  if (!body.ok) return body.response;

  try {
    return NextResponse.json(await deleteGroupResource(auth.context, body.body));
  } catch (error) {
    return agentApiCaught(error);
  }
}
