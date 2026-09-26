import { afterEach, beforeEach, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
const { runHogQL } = await import("./posthog-query");
const originalFetch = globalThis.fetch;
const originalKey = process.env.POSTHOG_PERSONAL_API_KEY;
beforeEach(() => { process.env.POSTHOG_PERSONAL_API_KEY = "test-key"; });
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.POSTHOG_PERSONAL_API_KEY;
  else process.env.POSTHOG_PERSONAL_API_KEY = originalKey;
});
const range = { from: new Date("2026-09-26T00:00:00Z"), to: new Date("2026-09-26T10:00:00Z") };

test("cards requesting the same data share a request and inherit PostHog test-user rules", async () => {
  const requests: Record<string, unknown>[] = [];
  globalThis.fetch = mock(async (_url: unknown, options: RequestInit | undefined) => {
    requests.push(JSON.parse(String(options?.body)));
    return Response.json({ columns: ["visitors"], results: [[11]] });
  }) as unknown as typeof fetch;
  const sql = "SELECT count() FROM events WHERE timestamp >= {filters.dateRange.from} AND {filters}";
  const results = await Promise.all([runHogQL(sql, range), runHogQL(sql, range)]);
  expect(requests).toHaveLength(1);
  expect(results.map((r) => r.results)).toEqual([[[11]], [[11]]]);
  const query = requests[0].query as { filters: unknown; query: string };
  expect(query.filters).toEqual({ filterTestAccounts: true });
  expect(query.query).toContain("2026-09-26T00:00:00.000Z");
});

test("unfinished PostHog queries must not turn into a dashboard full of zeroes", async () => {
  globalThis.fetch = mock(async () => Response.json({ query_status: { complete: false } })) as unknown as typeof fetch;
  await expect(runHogQL("SELECT count() FROM events", range)).rejects.toThrow("has not completed");
});
