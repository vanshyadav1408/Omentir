import "server-only";

import { formatMs } from "@/app/stats/stats-format";
import type { StatsInterval } from "@/lib/stats-periods";
import type { McpListsData, McpMetric, McpOverviewData, ProductListRow, ProductListTab } from "@/lib/stats-types";
import { runHogQL, type StatsPropertyFilter } from "./posthog-query";
import { bucketExpr } from "./queries";

// MCP analytics on stats.omentir.com: what AI clients do through the Omentir
// MCP server (/api/agent/v1/mcp). The $mcp_* events come from @posthog/mcp
// (src/lib/posthog-mcp.ts); person = the workspace that owns the API token.

type Range = { from: Date; to: Date };

const F = "{filters.dateRange.from}";
const T = "{filters.dateRange.to}";
const PREV = `${F} - toIntervalSecond(dateDiff('second', ${F}, ${T}))`;
const MCP_EVENTS = "event IN ('$mcp_initialize', '$mcp_tools_list', '$mcp_tool_call', '$mcp_missing_capability')";

// Each list tab and its click-to-filter key share one expression.
const DIMENSIONS: [key: string, expr: string][] = [
  ["mcp_tool", "coalesce(toString(properties.$mcp_tool_name), '')"],
  ["mcp_client", "coalesce(toString(properties.$mcp_client_name), '')"],
  [
    "mcp_client_version",
    "if(properties.$mcp_client_version IS NULL, '', concat(toString(properties.$mcp_client_name), ' ', toString(properties.$mcp_client_version)))",
  ],
  ["mcp_vendor", "coalesce(toString(properties.$mcp_vendor_client), '')"],
  // PostHog typed this property as a date, so toString adds a time; versions are YYYY-MM-DD.
  ["mcp_protocol", "left(coalesce(toString(properties.$mcp_protocol_version), ''), 10)"],
  ["mcp_user", "coalesce(nullIf(toString(person.properties.email), ''), toString(person_id))"],
];

/** Keys the MCP view may filter on. Anything else is dropped before querying. */
export const MCP_FILTER_KEYS = new Set(DIMENSIONS.map(([key]) => key));

const quote = (value: string) => "'" + value.replaceAll("\\", "\\\\").replaceAll("'", "\\'") + "'";

// PostHog applies its project test-account rules through the unbound placeholder.
function mcpFilters(filters: StatsPropertyFilter[]) {
  return ["{filters}", ...filters.flatMap(({ key, value }) => {
    const expr = DIMENSIONS.find(([name]) => name === key)?.[1];
    return expr ? [`${expr} = ${quote(value)}`] : [];
  })].join(" AND ");
}

/** Per MCP event: who, which session, and for tool calls whether it failed and how long it took. */
function mcpEvents(start: string, filters: StatsPropertyFilter[], columns = "") {
  return `SELECT person_id, timestamp,
    toString(properties.$session_id) AS sid,
    event = '$mcp_tool_call' AS call,
    call AND properties.$mcp_is_error = true AS err,
    toFloat(properties.$mcp_duration_ms) AS ms${columns}
  FROM events
  WHERE ${MCP_EVENTS}
    AND timestamp >= ${start}
    AND timestamp < ${T}
    AND ${mcpFilters(filters)}`;
}

const METRIC_COLUMNS = "uniq(person_id), uniqIf(sid, sid != ''), countIf(call), countIf(err), quantileIf(0.5)(ms, call)";

/** Rows: kind ('kpi' or 'chart'), bucket ('current'/'previous' for kpi), users, sessions, calls, errors, median ms. */
export function mcpOverviewQuery(interval: StatsInterval, filters: StatsPropertyFilter[] = []) {
  return `SELECT 'kpi' AS kind, if(timestamp >= ${F}, 'current', 'previous') AS bucket, ${METRIC_COLUMNS}
FROM (${mcpEvents(PREV, filters)})
GROUP BY bucket
UNION ALL
SELECT 'chart', ${bucketExpr(interval)} AS bucket, ${METRIC_COLUMNS}
FROM (${mcpEvents(F, filters)})
GROUP BY bucket
ORDER BY bucket
LIMIT 5002`;
}

/** Rows: dimension key, value, calls, sessions, users, errors, median ms. One scan covers every tab. */
export function mcpBreakdownQuery(filters: StatsPropertyFilter[] = []) {
  const dims = `arrayJoin([${DIMENSIONS.map(([key, expr]) => `('${key}', ${expr})`).join(", ")}]) AS d`;
  return `SELECT d.1 AS dim, d.2 AS val, countIf(call) AS calls, uniqIf(sid, sid != '') AS sessions, uniq(person_id) AS users, countIf(err) AS errors, quantileIf(0.5)(ms, call) AS p50
FROM (${mcpEvents(F, filters, `, ${dims}`)})
WHERE val != ''
GROUP BY dim, val
ORDER BY dim, calls DESC, sessions DESC, val
LIMIT 1000`;
}

/** Rows: kind ('intent', 'error' or 'missing'), text, tools, times, last seen. */
export function mcpRequestsQuery(filters: StatsPropertyFilter[] = []) {
  const range = `timestamp >= ${F} AND timestamp < ${T} AND ${mcpFilters(filters)}`;
  return `SELECT kind, text, groupUniqArray(tool) AS tools, count() AS times, max(timestamp) AS last
FROM (
  SELECT if(event = '$mcp_missing_capability', 'missing', 'intent') AS kind, toString(properties.$mcp_intent) AS text, coalesce(toString(properties.$mcp_tool_name), '') AS tool, timestamp
  FROM events
  WHERE event IN ('$mcp_tool_call', '$mcp_missing_capability') AND properties.$mcp_intent IS NOT NULL AND ${range}
  UNION ALL
  SELECT 'error', toString(properties.$mcp_error_message), coalesce(toString(properties.$mcp_tool_name), ''), timestamp
  FROM events
  WHERE event = '$mcp_tool_call' AND properties.$mcp_is_error = true AND ${range}
)
WHERE text != ''
GROUP BY kind, text
ORDER BY kind, times DESC, last DESC
LIMIT 600`;
}

const num = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};
const str = (value: unknown) => (value == null ? "" : String(value));

const metrics = (row: unknown[] | undefined): Record<McpMetric, number> => ({
  users: num(row?.[2]),
  sessions: num(row?.[3]),
  calls: num(row?.[4]),
  errors: num(row?.[5]),
  medianMs: num(row?.[6]),
});

export async function loadMcpOverview(range: Range, interval: StatsInterval, filters: StatsPropertyFilter[]): Promise<McpOverviewData> {
  const result = await runHogQL(mcpOverviewQuery(interval, filters), range, filters);
  const kpi = (bucket: string) => metrics(result.results.find((row) => row[0] === "kpi" && row[1] === bucket));
  const current = kpi("current");
  const previous = kpi("previous");
  return {
    kpis: Object.fromEntries(
      (Object.keys(current) as McpMetric[]).map((key) => [key, { current: current[key], previous: previous[key] }]),
    ) as McpOverviewData["kpis"],
    series: result.results.filter((row) => row[0] === "chart").map((row) => ({ bucket: str(row[1]), ...metrics(row) })),
  };
}

type DimensionRow = { value: string; calls: number; sessions: number; users: number; errors: number; medianMs: number };

const callTip = (r: DimensionRow): [string, number | string][] => [
  ["Tool calls", r.calls],
  ["Sessions", r.sessions],
  ["Users", r.users],
  ["Errors", r.errors],
  ["Median time", r.calls ? formatMs(r.medianMs) : "-"],
];

export async function loadMcpLists(range: Range, filters: StatsPropertyFilter[]): Promise<McpListsData> {
  const [breakdown, requests] = await Promise.all([
    runHogQL(mcpBreakdownQuery(filters), range, filters),
    runHogQL(mcpRequestsQuery(filters), range, filters),
  ]);
  const byDim = new Map<string, DimensionRow[]>();
  for (const row of breakdown.results) {
    const list = byDim.get(str(row[0])) ?? [];
    list.push({ value: str(row[1]), calls: num(row[2]), sessions: num(row[3]), users: num(row[4]), errors: num(row[5]), medianMs: num(row[6]) });
    byDim.set(str(row[0]), list);
  }

  // Tabs ranked by tool calls; a client that only connected and listed tools still shows by its sessions.
  const tab = (filterKey: string, label: string, filterLabel: string, unit: "Calls" | "Sessions"): ProductListTab => ({
    label,
    unit,
    filterKey,
    filterLabel,
    rows: (byDim.get(filterKey) ?? [])
      .map((r) => ({ key: r.value, label: r.value, value: unit === "Calls" ? r.calls : r.sessions, tip: callTip(r) }))
      .sort((a, b) => b.value - a.value),
  });
  const tools = byDim.get("mcp_tool") ?? [];
  const toolRow = (r: DimensionRow, value: number, display?: string): ProductListRow => ({ key: r.value, label: r.value, value, display, tip: callTip(r) });

  const textTab = (kind: string, label: string, unit: string): ProductListTab => ({
    label,
    unit,
    rows: requests.results
      .filter((row) => row[0] === kind)
      .map((row) => ({ key: str(row[1]), label: str(row[1]), sub: (row[2] as unknown[]).map(str).filter(Boolean).join(", ") || undefined, value: num(row[3]) })),
  });

  return {
    tools: [
      tab("mcp_tool", "Tools", "Tool", "Calls"),
      {
        label: "Errors",
        unit: "Errors",
        filterKey: "mcp_tool",
        filterLabel: "Tool",
        rows: tools.filter((r) => r.errors > 0).map((r) => toolRow(r, r.errors)).sort((a, b) => b.value - a.value),
      },
      {
        label: "Slowest",
        unit: "Median time",
        filterKey: "mcp_tool",
        filterLabel: "Tool",
        rows: tools.map((r) => toolRow(r, r.medianMs, formatMs(r.medianMs))).sort((a, b) => b.value - a.value),
      },
    ],
    clients: [
      tab("mcp_client", "Client", "Client", "Sessions"),
      tab("mcp_vendor", "App", "App", "Sessions"),
      tab("mcp_client_version", "Version", "Version", "Sessions"),
      tab("mcp_protocol", "Protocol", "Protocol", "Sessions"),
    ],
    users: [tab("mcp_user", "Tool calls", "User", "Calls"), tab("mcp_user", "Sessions", "User", "Sessions")],
    requests: [
      textTab("intent", "Intents", "Calls"),
      textTab("error", "Error messages", "Times"),
      textTab("missing", "Missing tools", "Asks"),
    ],
  };
}
