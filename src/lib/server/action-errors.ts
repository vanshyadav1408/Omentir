import "server-only";

import { unstable_rethrow } from "next/navigation";
import type { ActionFailure } from "@/lib/action-result";
import { WebsiteUnreachableError } from "./website";

const MAX_MESSAGE_LENGTH = 240;

// Only messages written for people pass through: plain Errors thrown by our
// own code and the typed errors below. AgentApiOperationError is matched by
// name so actions.ts keeps loading agent-api-operations lazily. Provider and
// database errors (Unipile response bodies, Firestore/gRPC errors with a
// `code`) stay generic, since their text can carry request details.
function userFacingMessage(error: unknown) {
  if (!(error instanceof Error)) return "";
  const readable =
    error.name === "AgentApiOperationError" ||
    error instanceof WebsiteUnreachableError ||
    (error.constructor === Error && !("code" in error));
  if (!readable) return "";
  const message = error.message.replace(/\s+/g, " ").trim();
  if (!message) return "";
  return message.length > MAX_MESSAGE_LENGTH
    ? `${message.slice(0, MAX_MESSAGE_LENGTH - 3)}...`
    : message;
}

export async function withActionErrors<T>(run: () => Promise<T>): Promise<T | ActionFailure> {
  try {
    return await run();
  } catch (error) {
    // redirect()/notFound() work by throwing; let Next handle them.
    unstable_rethrow(error);
    const message = userFacingMessage(error);
    if (!message) throw error;
    console.error("[action] failed:", message);
    return { actionError: message };
  }
}
