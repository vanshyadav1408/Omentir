import "server-only";
import { createHash } from "node:crypto";

// Firestore key for an old Unipile account id that was replaced by an own
// client account, so the replaced id is never saved as a live account again.
export function retiredAccountKey(accountId: string) {
  return createHash("sha256").update(accountId).digest("hex").slice(0, 16);
}
