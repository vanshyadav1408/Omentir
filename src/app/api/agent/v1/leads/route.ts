import { NextRequest, NextResponse } from "next/server";
import { requireAgentApiContext } from "@/lib/server/agent-api";
import {
  AgentApiOperationError,
  listLeadResources,
} from "@/lib/server/agent-api-operations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  const groupId = request.nextUrl.searchParams.get("groupId") || undefined;
  const query = request.nextUrl.searchParams.get("query") || undefined;
  const minFitScoreValue = request.nextUrl.searchParams.get("minFitScore");
  const outreachStatus = request.nextUrl.searchParams.get("outreachStatus") || undefined;
  const sortBy = request.nextUrl.searchParams.get("sortBy") || undefined;
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || "100");

  try {
    return NextResponse.json(
      await listLeadResources(auth.context, {
        groupId,
        query,
        minFitScore: minFitScoreValue === null ? undefined : Number(minFitScoreValue),
        outreachStatus,
        sortBy,
        limit: Number.isFinite(rawLimit) ? rawLimit : 100,
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
