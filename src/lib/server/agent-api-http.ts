import { NextResponse } from "next/server";
import { AgentApiOperationError } from "./agent-api-operations";

export function agentApiCaught(error: unknown) {
  if (error instanceof AgentApiOperationError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status },
    );
  }
  throw error;
}
