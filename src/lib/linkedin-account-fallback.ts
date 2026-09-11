// After a Unipile reconnect the agent/campaign still stores the old
// linkedInAccountId, which is now disconnected. LinkedIn actions must use the
// workspace's current connected account instead of stalling.

export function resolveUsableLinkedInAccount<T extends { status: string }>(
  requested: T | null | undefined,
  fallback: T | null,
): T | null {
  if (requested?.status === "connected") return requested;
  return fallback;
}
