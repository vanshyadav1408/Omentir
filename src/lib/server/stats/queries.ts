import "server-only";

import type { StatsPropertyFilter } from "./posthog-query";

import { STATS_TIMEZONE, type StatsInterval } from "@/lib/stats-periods";

// HogQL for stats.omentir.com. Dashboard filters use the expressions below;
// PostHog supplies the project internal/test-user exclusions.
// Signups are credited to the person's pageviews (90-day lookback) because
// server events carry no attribution and a server geo-IP. Money is not read
// from PostHog at all: see whop-payments.ts (PostHog payment events were
// incomplete and one was invented, and single events cannot be deleted).

const F = "{filters.dateRange.from}";
const T = "{filters.dateRange.to}";
// Start of the previous period of equal length (only valid inside a comparison).
const PREV = `${F} - toIntervalSecond(dateDiff('second', ${F}, ${T}))`;
const LOOKBACK = "INTERVAL 90 DAY";
// Dev servers, the tunnel and Sanity also send pageviews; only the live site counts.
export const LIVE_SITE = "properties.$host IN ('omentir.com', 'www.omentir.com')";

export const CHANNEL = `coalesce(
    nullIf(toString(properties.channel_name), ''),
    multiIf(
      session.$channel_type = 'Organic Social', 'Social',
      session.$channel_type = 'Organic Search', 'Organic Search',
      session.$channel_type = 'Organic Video', 'Organic Video',
      nullIf(toString(session.$channel_type), '')
    ),
    '(unknown)'
  )`;
export const REFERRER = `coalesce(
    nullIf(nullIf(toString(properties.referring_domain), ''), '$direct'),
    nullIf(nullIf(toString(properties.$referring_domain), ''), '$direct'),
    '(direct)'
  )`;

const WEB_BINDINGS: [expr: string, key: string][] = [
  [CHANNEL, "channel_name"],
  [REFERRER, "referring_domain"],
  ["properties.utm_campaign", "utm_campaign"],
  ["properties.$host", "$host"],
  ["properties.$pathname", "$pathname"],
  ["session.$entry_pathname", "$entry_pathname"],
  ["properties.$geoip_country_name", "$geoip_country_name"],
  ["properties.$geoip_subdivision_1_name", "$geoip_subdivision_1_name"],
  ["properties.$geoip_city_name", "$geoip_city_name"],
  ["properties.$browser", "$browser"],
  ["properties.$os", "$os"],
  ["properties.$device_type", "$device_type"],
];
const AI_KEYS = ["ai_name", "ai_kind"];

/** Keys the page may filter on. Anything else is dropped before querying. */
export const STATS_FILTER_KEYS = new Set([...WEB_BINDINGS.map(([, key]) => key), ...AI_KEYS]);

const quote = (value: string) => "'" + value.replaceAll("\\", "\\\\").replaceAll("'", "\\'") + "'";

// PostHog applies its project test-account rules through the unbound placeholder.
// Dashboard filters use the expressions above, including computed channels.
function propertyFilters(filters: StatsPropertyFilter[], bindings: [string, string][]) {
  return ["{filters}", ...filters.flatMap(({ key, value }) => {
    const expr = bindings.find(([, name]) => name === key)?.[0];
    return expr ? [`${expr} = ${quote(value)}`] : [];
  })].join(" AND ");
}

function webFilters(filters: StatsPropertyFilter[]) {
  return propertyFilters(filters, WEB_BINDINGS);
}

/** Bucket key in dashboard time, matching bucketKey() in stats-periods.ts. */
export function bucketExpr(interval: StatsInterval, timestamp = "timestamp") {
  const column = `toTimeZone(${timestamp}, '${STATS_TIMEZONE}')`;
  switch (interval) {
    case "hour":
      return `formatDateTime(toStartOfHour(${column}), '%Y-%m-%d %H:00')`;
    case "week":
      return `toString(toStartOfWeek(${column}, 1))`;
    case "month":
      return `toString(toStartOfMonth(${column}))`;
    default:
      return `toString(toDate(${column}))`;
  }
}

function pageviews(start: string, columns = "person_id, timestamp", filters: StatsPropertyFilter[] = []) {
  return `SELECT ${columns}
  FROM events
  WHERE event = '$pageview'
    AND ${LIVE_SITE}
    AND timestamp >= ${start} - ${LOOKBACK}
    AND timestamp < ${T}
    AND ${webFilters(filters)}`;
}

// ------------------------------------------------------------------ overview

/** One row: current and previous-period traffic values for the KPI strip. */
export function kpiQuery(filters: StatsPropertyFilter[] = []) {
  return `WITH
pv AS (
  SELECT person_id, \`$session_id\` AS sid, timestamp, toFloat(session.$is_bounce) AS bounce, toFloat(session.$session_duration) AS dur
  FROM events
  WHERE event = '$pageview'
    AND ${LIVE_SITE}
    AND timestamp >= ${PREV}
    AND timestamp < ${T}
    AND ${webFilters(filters)}
),
v AS (
  SELECT
    uniqIf(person_id, timestamp >= ${F}) AS c,
    uniqIf(person_id, timestamp >= ${PREV} AND timestamp < ${F}) AS p
  FROM pv
),
s AS (
  SELECT
    avgIf(bounce, st >= ${F}) AS bc, avgIf(bounce, st < ${F}) AS bp,
    avgIf(dur, st >= ${F}) AS dc, avgIf(dur, st < ${F}) AS dp
  FROM (
    SELECT sid, min(timestamp) AS st, any(bounce) AS bounce, any(dur) AS dur
    FROM pv
    WHERE sid IS NOT NULL AND sid != ''
    GROUP BY sid
  )
)
SELECT v.c, v.p, s.bc, s.bp, s.dc, s.dp
FROM v CROSS JOIN s`;
}

/** Visitors per bucket. Revenue per bucket comes from Whop. */
export function chartQuery(interval: StatsInterval, filters: StatsPropertyFilter[] = []) {
  return `SELECT ${bucketExpr(interval)} AS bucket, uniq(person_id) AS visitors
FROM events
WHERE event = '$pageview'
  AND ${LIVE_SITE}
  AND timestamp >= ${F}
  AND timestamp < ${T}
  AND ${webFilters(filters)}
GROUP BY bucket
ORDER BY bucket
LIMIT 5000`;
}

export function onlineQuery(filters: StatsPropertyFilter[] = []) {
  return `SELECT uniq(person_id)
FROM events
WHERE event = '$pageview' AND ${LIVE_SITE} AND timestamp > now() - INTERVAL 5 MINUTE AND ${webFilters(filters)}`;
}

/** Traffic KPIs, chart and online count share one PostHog round trip. */
export function overviewQuery(interval: StatsInterval, filters: StatsPropertyFilter[] = []) {
  return `SELECT 'kpi' AS kind, '' AS bucket, c, p, bc, bp, dc, dp FROM (${kpiQuery(filters)})
UNION ALL
SELECT 'chart', bucket, visitors, 0, 0, 0, 0, 0 FROM (${chartQuery(interval, filters)})
UNION ALL
SELECT 'online', '', *, 0, 0, 0, 0, 0 FROM (${onlineQuery(filters)})
LIMIT 5002`;
}

// ------------------------------------------------------------------ breakdowns

type Dimension = { value: string; label?: string };

export const BREAKDOWNS = {
  sources: [
    { value: CHANNEL },
    { value: REFERRER },
    { value: "nullIf(toString(properties.utm_campaign), '')" },
  ],
  pages: [
    { value: "properties.$host" },
    { value: "properties.$pathname" },
    { value: "session.$entry_pathname" },
  ],
  location: [
    { value: "properties.$geoip_country_name", label: "properties.$geoip_country_code" },
    { value: "properties.$geoip_subdivision_1_name", label: "properties.$geoip_country_code" },
    { value: "properties.$geoip_city_name", label: "properties.$geoip_country_code" },
  ],
  tech: [
    { value: "properties.$browser" },
    { value: "properties.$os" },
    { value: "properties.$device_type" },
  ],
} satisfies Record<string, Dimension[]>;

export type BreakdownCard = keyof typeof BREAKDOWNS;

/**
 * Rows: tab index, value, label (country code for locations), visitors,
 * signups. One scan of pageviews covers all tabs of a card. Paid and revenue
 * per row are added from Whop (see payerFirstTouchQuery).
 */
export function breakdownQuery(card: BreakdownCard, top = 50, filters: StatsPropertyFilter[] = []) {
  return dimensionQuery(BREAKDOWNS[card], top, filters);
}

export function allBreakdownsQuery(filters: StatsPropertyFilter[] = []) {
  return dimensionQuery(Object.values(BREAKDOWNS).flat(), 50, filters);
}

function dimensionQuery(dims: Dimension[], top: number, filters: StatsPropertyFilter[]) {
  const columns = dims
    .flatMap((dim, i) => [`toString(${dim.value}) AS v${i}`, `toString(${dim.label ?? dim.value}) AS l${i}`])
    .join(", ");
  const seen = `[${dims.map((_, i) => `(${i}, v${i}, l${i})`).join(", ")}]`;
  const first = `tuple(${dims.map((_, i) => `v${i}, l${i}`).join(", ")})`;
  const credited = `[${dims.map((_, i) => `('c', ${i}, per.first.${2 * i + 1}, per.first.${2 * i + 2})`).join(", ")}]`;
  return `WITH
cv AS (
  SELECT DISTINCT person_id
  FROM events
  WHERE event = 'signed_up' AND {filters} AND timestamp >= ${F} AND timestamp < ${T}
),
pv AS (
  ${pageviews(F, `person_id, timestamp, ${columns}`, filters)}
    AND (timestamp >= ${F} OR person_id IN (SELECT person_id FROM cv))
),
per AS (
  SELECT
    person_id,
    argMin(${first}, timestamp) AS first,
    arrayDistinct(arrayFlatten(groupArrayIf(${seen}, timestamp >= ${F}))) AS seen
  FROM pv
  GROUP BY person_id
),
grouped AS (
  SELECT
    g.2 AS tab, g.3 AS val, g.4 AS lbl,
    countIf(g.1 = 'v') AS visitors,
    countIf(g.1 = 'c') AS signups
  FROM (
    SELECT
      arrayJoin(arrayConcat(
        arrayMap(x -> ('v', x.1, x.2, x.3), per.seen),
        if(per.person_id IN (SELECT person_id FROM cv), ${credited}, [])
      )) AS g
    FROM per
  )
  WHERE val IS NOT NULL AND val != ''
  GROUP BY tab, val, lbl
)
SELECT tab, val, lbl, visitors, signups
FROM (
  SELECT *, row_number() OVER (PARTITION BY tab ORDER BY visitors DESC, signups DESC, val) AS rn
  FROM grouped
)
WHERE rn <= ${top}
ORDER BY tab, visitors DESC, signups DESC, val
LIMIT 1000`;
}

/** Outbound link clicks (DataFast's "Exit link" tab). Not filterable by itself. */
export function exitLinksQuery(filters: StatsPropertyFilter[] = []) {
  return `SELECT
  cutQueryStringAndFragment(toString(properties.$external_click_url)) AS url,
  uniq(person_id) AS visitors,
  count() AS clicks
FROM events
WHERE event = '$autocapture'
  AND ${LIVE_SITE}
  AND properties.$external_click_url IS NOT NULL
  AND timestamp >= ${F}
  AND timestamp < ${T}
  AND ${webFilters(filters)}
GROUP BY url
ORDER BY visitors DESC, clicks DESC
LIMIT 50`;
}

// ------------------------------------------------------------------ goals

// "Paid" is added from Whop, so PostHog's payment events are left out here.
const GOAL_EVENTS = `event NOT LIKE '$%'
    AND event NOT IN ('platform_daily', 'platform_stats', 'posthog_setup_check', 'survey shown', 'survey dismissed', 'payment_succeeded')`;

/**
 * Goal events in range. With no filters every completion counts (a signup with
 * no tracked visit still happened); with filters only people whose visits
 * match can be credited.
 */
function goalBase(filtered: boolean, filters: StatsPropertyFilter[]) {
  return `pv AS (
  ${pageviews(F, "person_id, timestamp", filters)}
),
g AS (
  SELECT person_id, event, timestamp
  FROM events
  WHERE ${GOAL_EVENTS} AND {filters}
    AND timestamp >= ${F}
    AND timestamp < ${T}
    ${filtered ? "AND person_id IN (SELECT person_id FROM pv)" : ""}
)`;
}

/** Rows: event, people, completions. */
export function goalTotalsQuery(filtered: boolean, filters: StatsPropertyFilter[] = []) {
  return `WITH
${goalBase(filtered, filters)}
SELECT event, uniq(person_id) AS people, count() AS completions
FROM g
GROUP BY event
ORDER BY people DESC
LIMIT 100`;
}

/** Rows: event, bucket, people. */
export function goalSeriesQuery(interval: StatsInterval, filtered: boolean, filters: StatsPropertyFilter[] = []) {
  return `WITH
${goalBase(filtered, filters)}
SELECT event, ${bucketExpr(interval)} AS bucket, uniq(person_id) AS people
FROM g
GROUP BY event, bucket
ORDER BY bucket
LIMIT 10000`;
}

// ------------------------------------------------------------------ AI bots

const HTTP_LOG_PATHS = `properties.$pathname NOT IN ('/robots.txt', '/sitemap.xml', '/fetch', '/proxy', '/indexnow-key.txt', '/8f3c1a9e6b24d0c75e18a4f2b9d63c07.txt', '/agent.json', '/admin', '/private-key', '/wp-admin', '/phpmyadmin')
    AND properties.$pathname NOT LIKE '%.xml'
    AND properties.$pathname NOT LIKE '/.%'
    AND properties.$pathname NOT LIKE '%~'
    AND (
      properties.$pathname NOT LIKE '%.%'
      OR properties.$pathname IN ('/llms.txt', '/llms-full.txt')
      OR properties.$pathname LIKE '%.md'
    )`;
const GEMINI_DOMAINS = "('gemini.google.com', 'bard.google.com', 'aistudio.google.com')";
const GEMINI_OR_GOOGLE = `if(properties.referring_domain IN ${GEMINI_DOMAINS}, 'Gemini', 'Google AI')`;

/**
 * Rows: bucket, ai, kind, fetches. Bot fetches from the $http_log stream,
 * Google AI Overview impressions, and visits sent by Gemini / Google AI.
 * The last two have no kind; they count as AI answers.
 */
export function aiQuery(interval: StatsInterval, filters: StatsPropertyFilter[] = []) {
  return `SELECT ${bucketExpr(interval)} AS bucket, ai, coalesce(nullIf(toString(kind), ''), 'assistant') AS kind, sum(fetches) AS fetches
FROM (
  SELECT
    timestamp,
    coalesce(nullIf(toString(properties.ai_name), ''), getBotName(properties.$raw_user_agent)) AS ai,
    properties.ai_kind AS kind,
    1 AS fetches
  FROM events
  WHERE event = '$http_log'
    AND timestamp >= ${F} AND timestamp < ${T}
    AND ${HTTP_LOG_PATHS}
    AND ${propertyFilters(filters, [["properties.ai_name", "ai_name"], ["properties.ai_kind", "ai_kind"], ["properties.$pathname", "$pathname"]])}

  UNION ALL

  SELECT timestamp, 'Google AI' AS ai, NULL AS kind, toFloat(properties.gsc_impressions) AS fetches
  FROM events
  WHERE event = 'google_ai_overview_report'
    AND timestamp >= ${F} AND timestamp < ${T}
    AND coalesce(toString(properties.gsc_page), '') = ''
    AND ${propertyFilters(filters, [["'Google AI'", "ai_name"], ["NULL", "ai_kind"], ["properties.gsc_page", "$pathname"]])}

  UNION ALL

  SELECT timestamp, ${GEMINI_OR_GOOGLE} AS ai, NULL AS kind, 1 AS fetches
  FROM events
  WHERE event = '$pageview'
    AND ${LIVE_SITE}
    AND timestamp >= ${F} AND timestamp < ${T}
    AND (properties.referring_domain IN ${GEMINI_DOMAINS} OR properties.google_text_fragment IS NOT NULL)
    AND ${propertyFilters(filters, [[GEMINI_OR_GOOGLE, "ai_name"], ["NULL", "ai_kind"], ["properties.$pathname", "$pathname"]])}
)
WHERE timestamp >= ${F} AND timestamp < ${T}
  AND ai IS NOT NULL AND ai != ''
GROUP BY bucket, ai, kind
ORDER BY bucket
LIMIT 20000`;
}

// ------------------------------------------------------------------ Whop payers

const quoted = (ids: string[]) => ids.map((id) => `'${id}'`).join(", ");

/**
 * Rows: distinct_id, person_id. Server events use the workspace id as the
 * distinct id, which PostHog merges with that person's browser visits.
 * Ids must already be validated as [A-Za-z0-9_-] (whop-payments.ts).
 */
export function personMapQuery(distinctIds: string[]) {
  return `SELECT distinct_id, toString(argMax(person_id, timestamp))
FROM events
WHERE distinct_id IN (${quoted(distinctIds)}) AND timestamp > now() - INTERVAL 400 DAY
GROUP BY distinct_id`;
}

/** Rows: person_id of payers whose visits match the active filters (previous period included). */
export function payersMatchingFiltersQuery(personIds: string[], filters: StatsPropertyFilter[] = []) {
  return `SELECT DISTINCT toString(person_id)
FROM events
WHERE event = '$pageview'
  AND ${LIVE_SITE}
  AND timestamp >= ${PREV} - ${LOOKBACK}
  AND timestamp < ${T}
  AND ${webFilters(filters)}
  AND toString(person_id) IN (${quoted(personIds)})`;
}

/** Rows: person_id, first-touch tuple (v0, l0, v1, l1, ...) for a card's tabs, filter-aware. */
export function payerFirstTouchQuery(card: BreakdownCard, personIds: string[], filters: StatsPropertyFilter[] = []) {
  const dims = BREAKDOWNS[card] as Dimension[];
  const columns = dims
    .flatMap((dim, i) => [`toString(${dim.value}) AS v${i}`, `toString(${dim.label ?? dim.value}) AS l${i}`])
    .join(", ");
  const first = `tuple(${dims.map((_, i) => `v${i}, l${i}`).join(", ")})`;
  return `SELECT toString(person_id), argMin(${first}, timestamp)
FROM (
  ${pageviews(F, `person_id, timestamp, ${columns}`, filters)}
)
WHERE toString(person_id) IN (${quoted(personIds)})
GROUP BY person_id`;
}
