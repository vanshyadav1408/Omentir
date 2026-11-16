import "server-only";
import { listCampaignEnrollmentPreviews, listLeadPreviews } from "@/lib/server/data";
import type { CampaignEnrollmentPreview, LeadPreview } from "@/lib/server/types";

/**
 * In-process cache of a workspace's whole lead and enrollment lists, so Leads,
 * Overview, Agents and Messages can page and count on the server without a
 * full Firestore scan per request. On the largest workspace (8,825 leads) one
 * lead scan is ~9 MB and seconds of Firestore time; a page of 100 rows is
 * ~100 KB.
 *
 * Freshness, as stale-while-revalidate:
 * - under FRESH_MS old: served as is;
 * - under MAX_STALE_MS: served, and a background re-read starts;
 * - older or missing: the caller waits for a fresh read.
 * The user's own changes on these pages (delete group or agent, stop outreach,
 * run now) call invalidateWorkspaceLists so the next read is fresh. Changes
 * made by the automation show up within MAX_STALE_MS, the same order as the
 * Leads list's own 2-minute refresh.
 *
 * Production runs one pm2 process, so invalidation here reaches every reader.
 */

const FRESH_MS = 20_000;
const MAX_STALE_MS = 120_000;
// Entries nobody read for this long are dropped to free the memory (the
// largest workspace's lists are tens of MB as objects).
const IDLE_EVICT_MS = 5 * 60_000;

type Entry<T> = {
  value?: T;
  loadedAt: number;
  usedAt: number;
  inflight?: Promise<T>;
};

const entries = new Map<string, Entry<unknown>>();

function evictIdle(now: number) {
  for (const [key, entry] of entries) {
    if (!entry.inflight && now - entry.usedAt > IDLE_EVICT_MS) entries.delete(key);
  }
}

function refresh<T>(key: string, entry: Entry<T>, load: () => Promise<T>) {
  const startedAt = Date.now();
  const request = load()
    .then((value) => {
      // An invalidation while this read was in flight replaced the entry; the
      // read may predate the change, so it must not land.
      if (entries.get(key) === entry) {
        entry.value = value;
        entry.loadedAt = startedAt;
      }
      return value;
    })
    .finally(() => {
      if (entry.inflight === request) entry.inflight = undefined;
    });
  entry.inflight = request;
  return request;
}

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  evictIdle(now);
  let entry = entries.get(key) as Entry<T> | undefined;
  if (!entry) {
    entry = { loadedAt: 0, usedAt: now };
    entries.set(key, entry as Entry<unknown>);
  }
  entry.usedAt = now;

  if (entry.value !== undefined) {
    const age = now - entry.loadedAt;
    if (age < FRESH_MS) return entry.value;
    if (age < MAX_STALE_MS) {
      if (!entry.inflight) {
        refresh(key, entry, load).catch((error) => {
          console.error(
            `[workspace-list-cache] background refresh of ${key} failed:`,
            error instanceof Error ? error.message : error,
          );
        });
      }
      return entry.value;
    }
  }
  return entry.inflight ?? refresh(key, entry, load);
}

export function cachedLeadPreviews(workspaceId: string): Promise<LeadPreview[]> {
  return cached(`leads:${workspaceId}`, () => listLeadPreviews(workspaceId));
}

export function cachedEnrollmentPreviews(
  workspaceId: string,
): Promise<CampaignEnrollmentPreview[]> {
  return cached(`enrollments:${workspaceId}`, () => listCampaignEnrollmentPreviews(workspaceId));
}

export function invalidateWorkspaceLists(workspaceId: string) {
  entries.delete(`leads:${workspaceId}`);
  entries.delete(`enrollments:${workspaceId}`);
}
