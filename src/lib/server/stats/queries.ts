import "server-only";

import type { StatsInterval } from "@/lib/stats-periods";

// HogQL for stats.omentir.com. Every query binds every filter key the page can
// set: PostHog rejects a query when an active filter key has no binding.
// Signups and payments are credited to the person's pageviews (90-day
// lookback) because server events carry no attribution and a server geo-IP.

const F = "{filters.dateRange.from}";
const T = "{filters.dateRange.to}";
// Start of the previous period of equal length (only valid inside a comparison).
const PREV = `${F} - toIntervalSecond(dateDiff('second', ${F}, ${T}))`;
const LOOKBACK = "INTERVAL 90 DAY";
// Dev servers, the tunnel and Sanity also send pageviews; only the live site counts.
const LIVE_SITE = "properties.$host IN ('omentir.com', 'www.omentir.com')";

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

const WEB_FILTERS = `{filters(
    null AS timestamp,
    ${WEB_BINDINGS.map(([expr, key]) => `${expr} AS '${key}'`).join(",\n    ")},
    ${AI_KEYS.map((key) => `null AS '${key}'`).join(", ")}
  )}`;

function aiFilters(bindings: string) {
  const skipped = WEB_BINDINGS.map(([, key]) => key).filter((key) => key !== "$pathname");
  return `{filters(
      ${bindings},
      ${skipped.map((key) => `null AS '${key}'`).join(", ")}
    )}`;
}

export function bucketExpr(interval: StatsInterval, column = "timestamp") {
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

function pageviews(start: string, columns = "person_id, timestamp") {
  return `SELECT ${columns}
  FROM events
  WHERE event = '$pageview'
    AND ${LIVE_SITE}
    AND timestamp >= ${start} - ${LOOKBACK}
    AND timestamp < ${T}
    AND ${WEB_FILTERS}`;
}

// ------------------------------------------------------------------ overview

/** One row: current and previous-period values for the KPI strip. */
export function kpiQuery() {
  return `WITH
lookback AS (
  ${pageviews(PREV, "DISTINCT person_id")}
),
pv AS (
  SELECT person_id, \`$session_id\` AS sid, timestamp, toFloat(session.$is_bounce) AS bounce, toFloat(session.$session_duration) AS dur
  FROM events
  WHERE event = '$pageview'
    AND ${LIVE_SITE}
    AND timestamp >= ${PREV}
    AND timestamp < ${T}
    AND ${WEB_FILTERS}
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
),
cv AS (
  SELECT
    sumIf(toFloat(properties.revenue), timestamp >= ${F}) AS rc,
    sumIf(toFloat(properties.revenue), timestamp < ${F}) AS rp,
    uniqIf(person_id, timestamp >= ${F}) AS pc,
    uniqIf(person_id, timestamp < ${F}) AS pp
  FROM events
  WHERE event = 'payment_succeeded'
    AND timestamp >= ${PREV}
    AND timestamp < ${T}
    AND person_id IN (SELECT person_id FROM lookback)
)
SELECT v.c, v.p, cv.rc, cv.rp, cv.pc, cv.pp, s.bc, s.bp, s.dc, s.dp
FROM v CROSS JOIN s CROSS JOIN cv`;
}

/** Visitors per bucket plus revenue split into first payments and renewals. */
export function chartQuery(interval: StatsInterval) {
  return `WITH
pv AS (
  ${pageviews(F)}
),
firsts AS (
  SELECT person_id, min(timestamp) AS first_ts
  FROM events
  WHERE event = 'payment_succeeded'
  GROUP BY person_id
)
SELECT bucket, sum(visitors) AS visitors, sum(new_revenue) AS new_revenue,
  sum(renewal_revenue) AS renewal_revenue, sum(customers) AS customers
FROM (
  SELECT ${bucketExpr(interval)} AS bucket, uniq(person_id) AS visitors,
    toFloat(0) AS new_revenue, toFloat(0) AS renewal_revenue, 0 AS customers
  FROM pv
  WHERE timestamp >= ${F}
  GROUP BY bucket
  UNION ALL
  SELECT ${bucketExpr(interval, "e.timestamp")} AS bucket, 0 AS visitors,
    sumIf(toFloat(e.properties.revenue), e.timestamp <= f.first_ts) AS new_revenue,
    sumIf(toFloat(e.properties.revenue), e.timestamp > f.first_ts) AS renewal_revenue,
    uniq(e.person_id) AS customers
  FROM events e
  LEFT JOIN firsts f ON f.person_id = e.person_id
  WHERE e.event = 'payment_succeeded'
    AND e.timestamp >= ${F}
    AND e.timestamp < ${T}
    AND e.person_id IN (SELECT person_id FROM pv)
  GROUP BY bucket
)
GROUP BY bucket
ORDER BY bucket
LIMIT 5000`;
}

export function onlineQuery() {
  return `SELECT uniq(person_id)
FROM events
WHERE event = '$pageview' AND ${LIVE_SITE} AND timestamp > now() - INTERVAL 5 MINUTE AND ${WEB_FILTERS}`;
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
 * signups, paid, revenue. One scan of pageviews covers all tabs of a card.
 */
export function breakdownQuery(card: BreakdownCard, top = 50) {
  const dims = BREAKDOWNS[card] as Dimension[];
  const columns = dims
    .flatMap((dim, i) => [`toString(${dim.value}) AS v${i}`, `toString(${dim.label ?? dim.value}) AS l${i}`])
    .join(", ");
  const seen = `[${dims.map((_, i) => `(${i}, v${i}, l${i})`).join(", ")}]`;
  const first = `tuple(${dims.map((_, i) => `v${i}, l${i}`).join(", ")})`;
  const credited = `[${dims.map((_, i) => `('c', ${i}, per.first.${2 * i + 1}, per.first.${2 * i + 2})`).join(", ")}]`;
  return `WITH
pv AS (
  ${pageviews(F, `person_id, timestamp, ${columns}`)}
),
per AS (
  SELECT
    person_id,
    argMin(${first}, timestamp) AS first,
    arrayDistinct(arrayFlatten(groupArrayIf(${seen}, timestamp >= ${F}))) AS seen
  FROM pv
  GROUP BY person_id
),
cv AS (
  SELECT person_id,
    max(event = 'signed_up') AS su,
    max(event = 'payment_succeeded') AS pd,
    sumIf(toFloat(properties.revenue), event = 'payment_succeeded') AS rev
  FROM events
  WHERE event IN ('signed_up', 'payment_succeeded') AND timestamp >= ${F} AND timestamp < ${T}
  GROUP BY person_id
),
grouped AS (
  SELECT
    g.2 AS tab, g.3 AS val, g.4 AS lbl,
    countIf(g.1 = 'v') AS visitors,
    countIf(g.1 = 'c' AND su) AS signups,
    countIf(g.1 = 'c' AND pd) AS paid,
    sumIf(rev, g.1 = 'c') AS revenue
  FROM (
    SELECT
      arrayJoin(arrayConcat(
        arrayMap(x -> ('v', x.1, x.2, x.3), per.seen),
        if(cv.su OR cv.pd, ${credited}, [])
      )) AS g,
      coalesce(cv.su, 0) AS su, coalesce(cv.pd, 0) AS pd, coalesce(cv.rev, 0) AS rev
    FROM per
    LEFT JOIN cv ON cv.person_id = per.person_id
  )
  WHERE val IS NOT NULL AND val != ''
  GROUP BY tab, val, lbl
)
SELECT tab, val, lbl, visitors, signups, paid, revenue
FROM (
  SELECT *, row_number() OVER (PARTITION BY tab ORDER BY visitors DESC, revenue DESC, val) AS rn
  FROM grouped
)
WHERE rn <= ${top}
ORDER BY tab, visitors DESC, revenue DESC, val
LIMIT 1000`;
}

/** Outbound link clicks (DataFast's "Exit link" tab). Not filterable by itself. */
export function exitLinksQuery() {
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
  AND ${WEB_FILTERS}
GROUP BY url
ORDER BY visitors DESC, clicks DESC
LIMIT 50`;
}

// ------------------------------------------------------------------ goals

const GOAL_EVENTS = `event NOT LIKE '$%'
    AND event NOT IN ('platform_daily', 'platform_stats', 'posthog_setup_check', 'survey shown', 'survey dismissed')`;

function goalBase() {
  return `pv AS (
  ${pageviews(F)}
),
g AS (
  SELECT person_id, event, timestamp
  FROM events
  WHERE ${GOAL_EVENTS}
    AND timestamp >= ${F}
    AND timestamp < ${T}
    AND person_id IN (SELECT person_id FROM pv)
)`;
}

/** Rows: event, people, completions. */
export function goalTotalsQuery() {
  return `WITH
${goalBase()}
SELECT event, uniq(person_id) AS people, count() AS completions
FROM g
GROUP BY event
ORDER BY people DESC
LIMIT 100`;
}

/** Rows: event, bucket, people. */
export function goalSeriesQuery(interval: StatsInterval) {
  return `WITH
${goalBase()}
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
export function aiQuery(interval: StatsInterval) {
  return `SELECT ${bucketExpr(interval)} AS bucket, ai, coalesce(nullIf(toString(kind), ''), 'assistant') AS kind, sum(fetches) AS fetches
FROM (
  SELECT
    timestamp,
    coalesce(nullIf(toString(properties.ai_name), ''), getBotName(properties.$raw_user_agent)) AS ai,
    properties.ai_kind AS kind,
    1 AS fetches
  FROM events
  WHERE event = '$http_log'
    AND ${HTTP_LOG_PATHS}
    AND ${aiFilters("timestamp AS timestamp, properties.ai_name AS 'ai_name', properties.ai_kind AS 'ai_kind', properties.$pathname AS '$pathname'")}

  UNION ALL

  SELECT timestamp, 'Google AI' AS ai, NULL AS kind, toFloat(properties.gsc_impressions) AS fetches
  FROM events
  WHERE event = 'google_ai_overview_report'
    AND coalesce(toString(properties.gsc_page), '') = ''
    AND ${aiFilters("timestamp AS timestamp, 'Google AI' AS 'ai_name', null AS 'ai_kind', properties.gsc_page AS '$pathname'")}

  UNION ALL

  SELECT timestamp, ${GEMINI_OR_GOOGLE} AS ai, NULL AS kind, 1 AS fetches
  FROM events
  WHERE event = '$pageview'
    AND ${LIVE_SITE}
    AND (properties.referring_domain IN ${GEMINI_DOMAINS} OR properties.google_text_fragment IS NOT NULL)
    AND ${aiFilters(`timestamp AS timestamp, ${GEMINI_OR_GOOGLE} AS 'ai_name', null AS 'ai_kind', properties.$pathname AS '$pathname'`)}
)
WHERE ai IS NOT NULL AND ai != ''
GROUP BY bucket, ai, kind
ORDER BY bucket
LIMIT 20000`;
}
