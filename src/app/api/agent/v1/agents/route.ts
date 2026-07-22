import { NextRequest, NextResponse } from "next/server";
import { requireAgentApiContext } from "@/lib/server/agent-api";
import {
  AgentApiOperationError,
  createAgentResource,
  deleteAgentResource,
  listAgentResources,
  updateAgentResource,
} from "@/lib/server/agent-api-operations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json(await listAgentResources(auth.context));
}

export async function POST(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json(
      await createAgentResource(auth.context, await request.json().catch(() => ({}))),
      { status: 201 },
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

export async function PATCH(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json(
      await updateAgentResource(auth.context, await request.json().catch(() => ({}))),
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

export async function DELETE(request: NextRequest) {
  const auth = await requireAgentApiContext(request);
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json(
      await deleteAgentResource(auth.context, await request.json().catch(() => ({}))),
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
