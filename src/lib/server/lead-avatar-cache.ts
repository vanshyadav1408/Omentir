import "server-only";

import { getDb, nowIso } from "./firebase";
import { httpsAvatarUrl, leadAvatarUrlCanBePersisted } from "../lead-avatar";
import { fetchLeadAvatarBytes } from "./lead-avatar-fetch";

const COLLECTION = "leadAvatars";
const persistInflight = new Map<string, Promise<boolean>>();

export type LeadAvatarCache = {
  leadId: string;
  workspaceId: string;
  contentType: string;
  body: unknown;
  sourceUrl?: string;
  updatedAt: string;
};

function cacheRef(leadId: string) {
  return getDb().collection(COLLECTION).doc(leadId);
}

function asBuffer(value: unknown): Buffer | null {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (Array.isArray(value) && value.every((byte) => typeof byte === "number")) {
    return Buffer.from(value);
  }
  if (typeof value !== "object") return null;

  const blob = value as {
    toUint8Array?: unknown;
    toBuffer?: unknown;
    data?: unknown;
  };
  if (typeof blob.toUint8Array === "function") {
    return Buffer.from((blob.toUint8Array as () => Uint8Array)());
  }
  if (typeof blob.toBuffer === "function") {
    const body = (blob.toBuffer as () => Buffer)();
    return Buffer.isBuffer(body) ? body : Buffer.from(body);
  }
  if (Array.isArray(blob.data) && blob.data.every((byte) => typeof byte === "number")) {
    return Buffer.from(blob.data);
  }
  return null;
}

export async function getLeadAvatarCache(leadId: string) {
  const snap = await cacheRef(leadId).get();
  if (!snap.exists) return null;
  return snap.data() as LeadAvatarCache;
}

export function leadAvatarCacheBytes(cache: LeadAvatarCache | null) {
  if (!cache) return null;
  const body = asBuffer(cache.body);
  if (!body?.byteLength || !cache.contentType) return null;
  return { body, contentType: cache.contentType };
}

export async function saveLeadAvatarCache(input: {
  leadId: string;
  workspaceId: string;
  body: Buffer;
  contentType: string;
  sourceUrl?: string;
}) {
  await cacheRef(input.leadId).set({
    leadId: input.leadId,
    workspaceId: input.workspaceId,
    contentType: input.contentType,
    body: Uint8Array.from(input.body),
    ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
    updatedAt: nowIso(),
  });
}

export async function persistLeadAvatarFromUrl(
  leadId: string,
  workspaceId: string,
  rawUrl: string | undefined,
) {
  const url = httpsAvatarUrl(rawUrl);
  if (!url || !leadAvatarUrlCanBePersisted(url)) return false;

  const existing = persistInflight.get(leadId);
  if (existing) return existing;

  const work = (async () => {
    const cached = leadAvatarCacheBytes(await getLeadAvatarCache(leadId));
    if (cached) return true;
    const fetched = await fetchLeadAvatarBytes(url);
    if (!fetched) return false;
    await saveLeadAvatarCache({
      leadId,
      workspaceId,
      body: fetched.body,
      contentType: fetched.contentType,
      sourceUrl: url,
    });
    return true;
  })().finally(() => {
    persistInflight.delete(leadId);
  });

  persistInflight.set(leadId, work);
  return work;
}

export function queueLeadAvatarPersist(
  leadId: string,
  workspaceId: string,
  rawUrl: string | undefined,
) {
  void persistLeadAvatarFromUrl(leadId, workspaceId, rawUrl).catch((error) => {
    console.error(
      `[lead-avatar] failed to persist photo for ${leadId}:`,
      error instanceof Error ? error.message : error,
    );
  });
}
