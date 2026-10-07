import { afterEach, beforeEach, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
const { loadMcpOverview, mcpOverviewQuery, mcpRequestsQuery } = await import("./mcp");
const originalFetch = globalThis.fetch;
const originalKey = process.env.POSTHOG_PERSONAL_API_KEY;
beforeEach(() => { process.env.POSTHOG_PERSONAL_API_KEY = "test-key"; });
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.POSTHOG_PERSONAL_API_KEY;
  else process.env.POSTHOG_PERSONAL_API_KEY = originalKey;
});

test("a web filter left in the URL never narrows the MCP numbers", () => {
  expect(mcpOverviewQuery("day", [{ key: "$pathname", value: "/pricing" }])).toBe(mcpOverviewQuery("day"));
});

test("a clicked value with a quote stays inside its HogQL string", () => {
  const sql = mcpRequestsQuery([{ key: "mcp_user", value: "o'brien@example.com' OR 1=1 --" }]);
  expect(sql).toContain("= 'o\\'brien@example.com\\' OR 1=1 --'");
  // PostHog's test-account rules still apply next to the click filter.
  expect(sql).toContain("{filters} AND");
});

test("the KPI change compares against the previous period, not the chart buckets", async () => {
  globalThis.fetch = mock(async () =>
    Response.json({
      columns: [],
      results: [
        ["kpi", "previous", 2, 10, 40, 4, 900],
        ["kpi", "current", 3, 12, 50, 1, 300],
        ["chart", "2026-10-06", 3, 12, 50, 1, 300],
      ],
    }),
  ) as unknown as typeof fetch;
  const data = await loadMcpOverview({ from: new Date("2026-10-06T00:00:00Z"), to: new Date("2026-10-07T00:00:00Z") }, "day", []);
  expect(data.kpis.calls).toEqual({ current: 50, previous: 40 });
  expect(data.kpis.errors).toEqual({ current: 1, previous: 4 });
  expect(data.kpis.medianMs).toEqual({ current: 300, previous: 900 });
  expect(data.series).toEqual([{ bucket: "2026-10-06", users: 3, sessions: 12, calls: 50, errors: 1, medianMs: 300 }]);
});
