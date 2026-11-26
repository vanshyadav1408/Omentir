import "server-only";

import { createHash } from "crypto";
import { getDb, nowIso } from "./firebase";
import {
  buildExclusionKeys,
  isLeadExcluded,
  MAX_EXCLUSIONS_PER_WORKSPACE,
  type ExclusionKeys,
  type ParsedExclusion,
} from "@/lib/exclusions";
import type { ExclusionEntry, Lead } from "./types";

function exclusions() {
  return getDb().collection("exclusions");
}

// Same person or company twice is one doc, so re-pasting a list is harmless.
function exclusionDocId(workspaceId: string, entry: Pick<ParsedExclusion, "kind" | "key">) {
  const digest = createHash("sha256").update(`${entry.kind}:${entry.key}`).digest("hex").slice(0, 24);
  return `${workspaceId}-${digest}`;
}

export async function listExclusions(workspaceId: string) {
  const snap = await exclusions().where("workspaceId", "==", workspaceId).get();
  return snap.docs
    .map((doc) => doc.data() as ExclusionEntry)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addExclusions(workspaceId: string, entries: ParsedExclusion[]) {
  if (!entries.length) return { added: 0 };
  const existing = await listExclusions(workspaceId);
  const existingIds = new Set(existing.map((entry) => entry.id));
  const fresh = entries
    .map((entry) => ({ entry, id: exclusionDocId(workspaceId, entry) }))
    .filter(({ id }) => !existingIds.has(id));
  if (existing.length + fresh.length > MAX_EXCLUSIONS_PER_WORKSPACE) {
    throw new Error(
      `You can block up to ${MAX_EXCLUSIONS_PER_WORKSPACE} people, companies and countries. Remove some before adding more.`,
    );
  }
  const timestamp = nowIso();
  for (let index = 0; index < fresh.length; index += 450) {
    const batch = getDb().batch();
    for (const { entry, id } of fresh.slice(index, index + 450)) {
      const doc: ExclusionEntry = { id, workspaceId, ...entry, createdAt: timestamp };
      batch.set(exclusions().doc(id), doc);
    }
    await batch.commit();
  }
  return { added: fresh.length };
}

export async function removeExclusion(workspaceId: string, id: string) {
  const ref = exclusions().doc(id);
  const snap = await ref.get();
  if (!snap.exists || (snap.data() as ExclusionEntry).workspaceId !== workspaceId) return false;
  await ref.delete();
  return true;
}

export async function getExclusionKeys(workspaceId: string): Promise<ExclusionKeys> {
  return buildExclusionKeys(await listExclusions(workspaceId));
}

// Countries blocked in Settings, for lead discovery. A failed read returns
// none, so the lead is still found: the enroll and send gates read the list
// again, do not tolerate a failed read, and keep outreach away from it.
export async function getBlockedCountryKeys(workspaceId: string): Promise<Pick<ExclusionKeys, "countries">> {
  try {
    return await getExclusionKeys(workspaceId);
  } catch (error) {
    console.error("[blacklist] read failed:", error instanceof Error ? error.message : error);
    return { countries: new Set() };
  }
}

// null means the blacklist could not be read: callers defer, never send.
export type ExclusionCheck = (
  lead: Pick<Lead, "workspaceId" | "linkedInUrl" | "company" | "location">,
) => Promise<boolean | null>;

// One blacklist read per workspace per automation tick.
export function newExclusionCheck(): ExclusionCheck {
  const cache = new Map<string, Promise<ExclusionKeys | null>>();
  return async (lead) => {
    let keys = cache.get(lead.workspaceId);
    if (!keys) {
      keys = getExclusionKeys(lead.workspaceId).catch((error) => {
        console.error("[blacklist] read failed:", error instanceof Error ? error.message : error);
        return null;
      });
      cache.set(lead.workspaceId, keys);
    }
    const resolved = await keys;
    return resolved ? isLeadExcluded(lead, resolved) : null;
  };
}
