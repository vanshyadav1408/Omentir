import { NextRequest, NextResponse } from "next/server";
import { requireAgentApiContext } from "@/lib/server/agent-api";
import { getAgentWorkspaceContext } from "@/lib/server/agent-api-operations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json(await getAgentWorkspaceContext(auth.context));
}
