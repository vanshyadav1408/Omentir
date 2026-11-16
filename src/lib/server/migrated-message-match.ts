import { isOwnLinkedInId } from "./linkedin-own/ids";
import type { ConversationMessage } from "./types";

// An outbound message: LinkedIn's send time and our stored time differ by seconds.
export const MIGRATED_SEND_WINDOW = { beforeMs: 5 * 60_000, afterMs: 5 * 60_000 };
// A reply was stored when it was processed, up to a day after LinkedIn's time
// when the old sync caught it late.
export const MIGRATED_REPLY_WINDOW = { beforeMs: 5 * 60_000, afterMs: 24 * 60 * 60_000 };

function sameText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

// After an old Unipile account is replaced, LinkedIn lists every earlier
// message again under a new own-client id. The ids can never match, so a
// message stored under an old id is recognised by direction, text and time.
// `window` bounds the stored time around LinkedIn's time for the message.
export function findMigratedMessage(
  stored: ConversationMessage[],
  message: { id?: string; direction: ConversationMessage["direction"]; body: string; createdAt?: string },
  window: { beforeMs: number; afterMs: number },
) {
  if (!message.id || !isOwnLinkedInId(message.id)) return undefined;
  const text = sameText(message.body);
  const at = Date.parse(message.createdAt || "");
  if (!text || !Number.isFinite(at)) return undefined;
  return stored.find((candidate) => {
    if (candidate.direction !== message.direction || isOwnLinkedInId(candidate.id)) return false;
    const storedAt = Date.parse(candidate.createdAt);
    return (
      sameText(candidate.body) === text &&
      Number.isFinite(storedAt) &&
      storedAt >= at - window.beforeMs &&
      storedAt <= at + window.afterMs
    );
  });
}
