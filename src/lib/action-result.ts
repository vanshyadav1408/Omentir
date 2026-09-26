// Server actions cannot throw a readable error: production Next.js replaces
// every thrown message with a generic "Server Components render" string. So
// actions return this marker for expected failures instead, and client callers
// pass the result through unwrapAction to get a normal Error with the message.
export type ActionFailure = { actionError: string };

export function isActionFailure(value: unknown): value is ActionFailure {
  return (
    typeof value === "object" &&
    value !== null &&
    "actionError" in value &&
    typeof (value as ActionFailure).actionError === "string"
  );
}

export function unwrapAction<T>(result: T | ActionFailure): T {
  if (isActionFailure(result)) throw new Error(result.actionError);
  return result;
}
