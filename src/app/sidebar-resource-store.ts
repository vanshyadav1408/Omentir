/**
 * Keeps the last /api/app/sidebar-data response for each page in IndexedDB so
 * a reload or a return visit can paint the previous data at once while the
 * fresh request is still in flight. The in-memory cache in use-sidebar-resource
 * only lives for one tab session; this is the layer under it.
 *
 * Records are keyed by `${userId}:${workspaceId}|${resource}`. On mount the app
 * layout deletes every record that belongs to a different user, and sign-out
 * clears the store, so one person's leads never paint for another.
 *
 * Every call swallows errors: private windows, blocked storage or a missing
 * indexedDB (tests, SSR) just mean no persisted paint.
 */

const DB_NAME = "omentir-sidebar-cache";
const STORE = "resources";
// Older than this and the numbers are more misleading than a skeleton.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type StoredResource = {
  scope: string;
  savedAt: number;
  data: Record<string, unknown>;
};

let dbPromise: Promise<IDBDatabase | null> | undefined;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  dbPromise ??= new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb();
  if (!db) return undefined;
  return new Promise<T | undefined>((resolve) => {
    try {
      const transaction = db.transaction(STORE, mode);
      const request = run(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request ? request.result : undefined);
      transaction.onerror = () => resolve(undefined);
      transaction.onabort = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

function recordKey(scope: string, resource: string) {
  return `${scope}|${resource}`;
}

export async function readStoredResource(
  scope: string,
  resource: string,
): Promise<Record<string, unknown> | undefined> {
  const record = await withStore<StoredResource | undefined>("readonly", (store) =>
    store.get(recordKey(scope, resource)),
  );
  if (!record || record.scope !== scope) return undefined;
  if (Date.now() - record.savedAt > MAX_AGE_MS) return undefined;
  return record.data;
}

// Structured-cloning a large workspace (thousands of leads) into IndexedDB
// blocks the main thread for tens of milliseconds, so wait for idle time.
export function storeResource(scope: string, resource: string, data: Record<string, unknown>) {
  if (typeof indexedDB === "undefined") return;
  const write = () => {
    const record: StoredResource = { scope, savedAt: Date.now(), data };
    void withStore("readwrite", (store) => {
      store.put(record, recordKey(scope, resource));
    });
  };
  if (typeof requestIdleCallback === "function") requestIdleCallback(write, { timeout: 5000 });
  else setTimeout(write, 0);
}

/** Drop every record that does not belong to this user. */
export async function pruneOtherUsers(userId: string) {
  const prefix = `${userId}:`;
  await withStore("readwrite", (store) => {
    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      if (!String(cursor.key).startsWith(prefix)) cursor.delete();
      cursor.continue();
    };
  });
}

export async function clearStoredResources() {
  await withStore("readwrite", (store) => {
    store.clear();
  });
}
