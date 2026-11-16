// Thrown only when LinkedIn returned an HTTP response with a non-ok status, or
// the client refused the request before sending it. That guarantees the action
// was rejected outright, so the side effect (invite/message) did not happen -
// unlike a network drop or timeout, where it's ambiguous. Callers use this to
// retry safely instead of parking the work for manual review.
export class LinkedInResponseError extends Error {
  status: number;
  // Error identifier from the response body, e.g.
  // "errors/cannot_resend_yet" / "errors/already_invited_recently" - lets callers branch on failure type instead
  // of pattern-matching message strings.
  errorType?: string;
  detail?: string;
  retryAfterMs?: number;

  constructor(status: number, message: string, body?: string, retryAfterMs?: number) {
    super(message);
    this.name = "LinkedInResponseError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
    if (body) {
      try {
        const parsed = JSON.parse(body) as { type?: unknown; detail?: unknown };
        if (typeof parsed.type === "string") this.errorType = parsed.type;
        if (typeof parsed.detail === "string") this.detail = parsed.detail;
      } catch {
        // Non-JSON body: message already carries the raw text.
      }
    }
  }
}
