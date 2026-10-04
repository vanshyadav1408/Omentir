import "server-only";

import { createHash } from "crypto";
import { getDb } from "./firebase";

const pending = new Map<string, Promise<unknown>>();

// Store JSON rather than nested objects so optional fields cannot make
// Firestore reject an otherwise valid provider result.
export async function cachedApiResult<T>(input: {
  workspaceId: string;
  provider: string;
  request: unknown;
  ttlMs: number;
  generate: () => Promise<T>;
  cacheable: (result: T) => boolean;
}): Promise<T> {
  const key = createHash("sha256")
    .update(JSON.stringify([input.workspaceId, input.provider, input.request]))
    .digest("hex");
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;

  const operation = (async () => {
    try {
      const cached = (await getDb().collection("apiResultCache").doc(key).get()).data();
      if (cached && cached.expiresAt > Date.now() && typeof cached.result === "string") {
        const result = JSON.parse(cached.result) as T;
        if (input.cacheable(result)) return result;
      }
    } catch (error) {
      console.error("[api-cache] read failed:", error instanceof Error ? error.message : error);
    }

    const result = await input.generate();
    if (input.cacheable(result)) {
      try {
        await getDb().collection("apiResultCache").doc(key).set({
          workspaceId: input.workspaceId,
          provider: input.provider,
          result: JSON.stringify(result),
          expiresAt: Date.now() + input.ttlMs,
        });
      } catch (error) {
        console.error("[api-cache] write failed:", error instanceof Error ? error.message : error);
      }
    }
    return result;
  })();
  pending.set(key, operation);
  try {
    return await operation;
  } finally {
    pending.delete(key);
  }
}
