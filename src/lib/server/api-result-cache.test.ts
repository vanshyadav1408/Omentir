import { beforeEach, describe, expect, mock, test } from "bun:test";

const documents = new Map<string, Record<string, unknown>>();
let unavailable = false;
mock.module("server-only", () => ({}));
mock.module("./firebase", () => ({
  getDb: () => {
    if (unavailable) throw new Error("Cache unavailable");
    return {
      collection: () => ({
        doc: (key: string) => ({
          get: async () => ({ data: () => documents.get(key) }),
          set: async (value: Record<string, unknown>) => { documents.set(key, value); },
        }),
      }),
    };
  },
}));

const { cachedApiResult } = await import("./api-result-cache");

beforeEach(() => {
  documents.clear();
  unavailable = false;
});

function request(generate: () => Promise<number>) {
  return {
    workspaceId: "workspace-a",
    provider: "gemini-test",
    request: { title: "Engineer", rubric: "v1" },
    ttlMs: 60_000,
    generate,
    cacheable: (result: number) => result > 0,
  };
}

describe("cachedApiResult", () => {
  test("identical discovery requests spend one provider call, including concurrent agents", async () => {
    const generate = mock(async () => 75);
    const input = request(generate);
    expect(await Promise.all([cachedApiResult(input), cachedApiResult(input)])).toEqual([75, 75]);
    expect(await cachedApiResult(input)).toBe(75);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  test("changed evidence, rubric, model, or workspace must be judged independently", async () => {
    const generate = mock(async () => 75);
    const input = request(generate);
    await cachedApiResult(input);
    await cachedApiResult({ ...input, request: { title: "Founder", rubric: "v1" } });
    await cachedApiResult({ ...input, request: { title: "Engineer", rubric: "v2" } });
    await cachedApiResult({ ...input, provider: "other-model" });
    await cachedApiResult({ ...input, workspaceId: "workspace-b" });
    expect(generate).toHaveBeenCalledTimes(5);
  });

  test("expiry refreshes evidence instead of keeping a stale verdict forever", async () => {
    const generate = mock(async () => 75);
    const input = request(generate);
    await cachedApiResult(input);
    for (const value of documents.values()) value.expiresAt = Date.now() - 1;
    await cachedApiResult(input);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  test("empty discovery results are retried so a temporary lack of results cannot stall discovery", async () => {
    const generate = mock(async () => 0);
    const input = request(generate);
    await cachedApiResult(input);
    await cachedApiResult(input);
    expect(documents.size).toBe(0);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  test("provider failures and quota stops are propagated and never saved as verdicts", async () => {
    const generate = mock(async () => { throw new Error("Quota reached"); });
    const input = request(generate);
    await expect(cachedApiResult(input)).rejects.toThrow("Quota reached");
    await expect(cachedApiResult(input)).rejects.toThrow("Quota reached");
    expect(documents.size).toBe(0);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  test("cache outages still let discovery and qualification use the provider", async () => {
    unavailable = true;
    const generate = mock(async () => 75);
    expect(await cachedApiResult(request(generate))).toBe(75);
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
