import { createHash } from "node:crypto";

type Bucket = { count: number; resetAt: number };
type RateLimitOptions = {
  perSource: number;
  global: number;
  windowMs: number;
  sourceKey?: string;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 4096;
const SHARED_BUCKET_RETENTION_MS = 24 * 60 * 60 * 1000;

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) prune(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

export function requestSource(request: Request) {
  const headers = request.headers;
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function rateLimitRequest(
  request: Request,
  scope: string,
  options: RateLimitOptions,
) {
  const source = options.sourceKey || requestSource(request);
  // The global bucket prevents spoofed forwarding headers from bypassing the
  // overall cost ceiling. The bounded source buckets preserve fair use within it.
  return (
    rateLimit(`${scope}:global`, options.global, options.windowMs) &&
    rateLimit(`${scope}:source:${source}`, options.perSource, options.windowMs)
  );
}

function rateLimitDocId(key: string) {
  return createHash("sha256").update(key).digest("hex").slice(0, 40);
}

/**
 * Process-local soft deny, then a Firestore-backed shared counter so multiple
 * app processes cannot multiply the effective limit.
 */
export async function rateLimitRequestShared(
  request: Request,
  scope: string,
  options: RateLimitOptions,
): Promise<boolean> {
  if (!rateLimitRequest(request, scope, options)) return false;

  try {
    const { getDb } = await import("@/lib/server/firebase");
    const db = getDb();
    const now = Date.now();
    const entries = [
      { key: `${scope}:global`, limit: options.global },
      ...(options.sourceKey
        ? [{ key: `${scope}:source:${options.sourceKey}`, limit: options.perSource }]
        : []),
    ];
    const refs = entries.map(({ key }) =>
      db.collection("rateLimits").doc(rateLimitDocId(key)),
    );

    return db.runTransaction(async (transaction) => {
      const snapshots = [];
      for (const ref of refs) snapshots.push(await transaction.get(ref));

      const states = snapshots.map((snapshot, index) => {
        const data = snapshot.data() as { count?: number; resetAt?: number } | undefined;
        const active = typeof data?.resetAt === "number" && data.resetAt > now;
        const count = active && typeof data?.count === "number" ? data.count : 0;
        return {
          count,
          resetAt: active ? data.resetAt as number : now + options.windowMs,
          limit: entries[index].limit,
        };
      });

      if (states.some((state) => state.count >= state.limit)) return false;

      for (let index = 0; index < refs.length; index += 1) {
        const state = states[index];
        transaction.set(refs[index], {
          count: state.count + 1,
          resetAt: state.resetAt,
          updatedAt: new Date(now),
          expiresAt: new Date(state.resetAt + SHARED_BUCKET_RETENTION_MS),
        });
      }
      return true;
    });
  } catch (error) {
    // Fail closed on shared limiter errors for public cost endpoints would
    // block the product when Firestore is briefly unavailable. Local memory
    // already enforced a per-process ceiling above; allow the request.
    console.error(
      "[rate-limit] shared limiter unavailable:",
      error instanceof Error ? error.message : error,
    );
    return true;
  }
}
