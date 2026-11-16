// After a reconnect the agent/campaign can still store an old
// linkedInAccountId, which is now disconnected. LinkedIn actions must use the
// workspace's current connected account instead of stalling, but only when
// that account is the same LinkedIn person. In a workspace with several
// seats, any other connected account belongs to a teammate: falling back to
// it sent one person's campaign from another person's profile.

import { isOwnLinkedInId } from "./server/linkedin-own/ids";

type AccountLike = { status: string; accountId?: string; displayName?: string };

function sameName(value: string | undefined) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

// The same LinkedIn member on another row, or an old Unipile row whose person
// connected again through the own client, which always adds a new row (old
// rows carry no member id, so the name is what is left to match).
function sameLinkedInPerson(stored: AccountLike, candidate: AccountLike) {
  if (stored.accountId && stored.accountId === candidate.accountId) return true;
  if (!stored.accountId || isOwnLinkedInId(stored.accountId)) return false;
  const name = sameName(stored.displayName);
  return Boolean(name) && name === sameName(candidate.displayName);
}

export function resolveUsableLinkedInAccount<T extends AccountLike>(
  requested: T | null | undefined,
  connected: T[],
): T | null {
  if (requested?.status === "connected") return requested;
  if (!requested) return connected[0] ?? null;
  return connected.find((candidate) => sameLinkedInPerson(requested, candidate)) ?? null;
}
