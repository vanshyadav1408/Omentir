import { NextRequest, NextResponse } from "next/server";
import { readAgentApiJsonBody, requireAgentApiContext } from "@/lib/server/agent-api";
import { analyzeWebsiteResource } from "@/lib/server/agent-api-actions";
import { agentApiCaught } from "@/lib/server/agent-api-http";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  const body = await readAgentApiJsonBody(request);
  if (!body.ok) return body.response;

  try {
    return NextResponse.json(await analyzeWebsiteResource(auth.context, body.body));
  } catch (error) {
    return agentApiCaught(error);
  }
}
