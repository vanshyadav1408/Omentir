import { afterEach, beforeEach, describe, expect, mock, setSystemTime, test } from "bun:test";

type Deferred = { resolve: (value: unknown) => void; promise: Promise<unknown> };
let scans: Deferred[] = [];

function deferred(): Deferred {
  let resolve!: (value: unknown) => void;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { resolve, promise };
}

mock.module("server-only", () => ({}));
mock.module("./data", () => ({
  // Each scan stays pending until the test resolves it, so ordering is explicit.
  listLeadPreviews: () => {
    const scan = deferred();
    scans.push(scan);
    return scan.promise;
  },
  listCampaignEnrollmentPreviews: async () => [],
}));

const cache = await import("./workspace-list-cache");
const { invalidateWorkspaceLists } = cache;
// The mocked scans resolve to plain strings; the cache never looks inside.
const cachedLeadPreviews = (workspaceId: string) =>
  cache.cachedLeadPreviews(workspaceId) as Promise<unknown>;

let clock = Date.parse("2026-11-16T12:00:00.000Z");
const advance = (ms: number) => {
  clock += ms;
  setSystemTime(new Date(clock));
};
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  scans = [];
  // A fresh workspace id per test keeps entries from leaking between tests.
  clock += 60 * 60_000;
  setSystemTime(new Date(clock));
});

afterEach(() => {
  setSystemTime();
});

describe("workspace list cache", () => {
  test("pages loading at the same moment share one Firestore scan", async () => {
    const first = cachedLeadPreviews("w-share");
    const second = cachedLeadPreviews("w-share");
    expect(scans).toHaveLength(1);
    scans[0].resolve(["a"]);
    expect(await first).toEqual(["a"]);
    expect(await second).toEqual(["a"]);
  });

  test("paging within 20 seconds reuses the list instead of scanning again", async () => {
    const load = cachedLeadPreviews("w-fresh");
    scans[0].resolve(["a"]);
    await load;
    advance(19_000);
    expect(await cachedLeadPreviews("w-fresh")).toEqual(["a"]);
    expect(scans).toHaveLength(1);
  });

  test("a list up to 2 minutes old answers at once and refreshes behind the response", async () => {
    const load = cachedLeadPreviews("w-swr");
    scans[0].resolve(["old"]);
    await load;
    advance(60_000);
    expect(await cachedLeadPreviews("w-swr")).toEqual(["old"]);
    expect(scans).toHaveLength(2);
    scans[1].resolve(["new"]);
    await flush();
    expect(await cachedLeadPreviews("w-swr")).toEqual(["new"]);
  });

  test("a list older than 2 minutes is never shown; the reader waits for a fresh scan", async () => {
    const load = cachedLeadPreviews("w-stale");
    scans[0].resolve(["old"]);
    await load;
    advance(121_000);
    const next = cachedLeadPreviews("w-stale");
    expect(scans).toHaveLength(2);
    scans[1].resolve(["new"]);
    expect(await next).toEqual(["new"]);
  });

  test("after the user deletes something, a scan that started before it cannot put the old list back", async () => {
    const load = cachedLeadPreviews("w-invalidate");
    scans[0].resolve(["before"]);
    await load;
    advance(60_000);
    // Background refresh starts, then the user's delete invalidates.
    await cachedLeadPreviews("w-invalidate");
    invalidateWorkspaceLists("w-invalidate");
    const afterDelete = cachedLeadPreviews("w-invalidate");
    expect(scans).toHaveLength(3);
    scans[1].resolve(["before-delete-scan"]);
    scans[2].resolve(["after"]);
    expect(await afterDelete).toEqual(["after"]);
    await flush();
    expect(await cachedLeadPreviews("w-invalidate")).toEqual(["after"]);
  });

  test("a failed scan reaches the reader and the next read tries again", async () => {
    const load = cachedLeadPreviews("w-error");
    const failing = scans[0];
    // Reject through the deferred by resolving with a rejected promise.
    failing.resolve(Promise.reject(new Error("firestore down")));
    await expect(load).rejects.toThrow("firestore down");
    const retry = cachedLeadPreviews("w-error");
    expect(scans).toHaveLength(2);
    scans[1].resolve(["ok"]);
    expect(await retry).toEqual(["ok"]);
  });
});
