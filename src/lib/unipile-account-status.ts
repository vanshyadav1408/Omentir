// Unipile v1 uses OK / CREDENTIALS. v2 uses running / disconnected / errored.
// A listed account is not enough: CREDENTIALS still appears in the account
// list, and treating that as connected hid the reconnect screen from people
// whose LinkedIn session had already died.

const USABLE = new Set(["ok", "running", "degraded", "partial"]);
const NEEDS_RECONNECT = new Set([
  "credentials",
  "disconnected",
  "error",
  "errored",
  "stopped",
  "paused",
]);

export function isUnipileAccountUsable(status?: string | null) {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return true;
  if (USABLE.has(normalized)) return true;
  if (NEEDS_RECONNECT.has(normalized)) return false;
  return true;
}
