import "server-only";

import { createHash, randomUUID } from "crypto";
import { getDb, normalizeLinkedInProfileUrl } from "./firebase";
import type { Lead } from "./types";

function historyRefs(workspaceId: string, lead: Partial<Lead>) {
  const url = normalizeLinkedInProfileUrl(lead.linkedInUrl);
  const identities = [
    url ? `url:${url}` : "",
    lead.providerProfileId ? `provider:${lead.providerProfileId.toLowerCase()}` : "",
  ].filter(Boolean);
  return identities.map((identity) => getDb().collection("workspaceLeadHistory").doc(
    createHash("sha256").update(JSON.stringify([workspaceId, identity])).digest("hex"),
  ));
}

export async function wasWorkspaceLeadProcessed(workspaceId: string, lead: Partial<Lead>) {
  const snapshots = await Promise.all(historyRefs(workspaceId, lead).map((ref) => ref.get()));
  return snapshots.some((snapshot) => snapshot.data()?.processed === true);
}

// Reserve all known aliases together so parallel agents cannot both pay for
// the same person. Successful judgments never expire, even after target edits.
export async function claimWorkspaceLead(workspaceId: string, lead: Partial<Lead>) {
  const refs = historyRefs(workspaceId, lead);
  const token = randomUUID();
  const claimed = await getDb().runTransaction(async (transaction) => {
    const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
    if (snapshots.some((snapshot) => {
      const entry = snapshot.data();
      return entry?.processed === true || (entry?.lockedUntil || 0) > Date.now();
    })) return false;
    for (const ref of refs) {
      transaction.set(ref, { workspaceId, token, lockedUntil: Date.now() + 120_000 });
    }
    return true;
  });
  if (!claimed) return null;

  return async (processed: boolean) => {
    await getDb().runTransaction(async (transaction) => {
      const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
      for (const [index, snapshot] of snapshots.entries()) {
        if (snapshot.data()?.token !== token) continue;
        if (processed) transaction.set(refs[index], { workspaceId, processed: true });
        else transaction.delete(refs[index]);
      }
    });
  };
}
