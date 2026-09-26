// Date ranges and chart buckets for stats.omentir.com. Shared by the API route
// and the client so both agree on bucket keys. Days, weeks and months follow
// UTC, matching the PostHog project timezone, and the SQL buckets
// use the same zone (see STATS_TIMEZONE in queries.ts).

export const STATS_TIMEZONE = "UTC";
export const STATS_TIMEZONE_LABEL = "UTC";
const ZONE_OFFSET_MS = 0;

export const STATS_PERIODS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "24h", label: "Last 24 hours" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "12m", label: "Last 12 months" },
  { key: "wtd", label: "Week to date" },
  { key: "mtd", label: "Month to date" },
  { key: "ytd", label: "Year to date" },
  { key: "all", label: "All time" },
] as const;

export type StatsPeriod = (typeof STATS_PERIODS)[number]["key"];
export type StatsInterval = "hour" | "day" | "week" | "month";

export type StatsQuery = {
  period: StatsPeriod;
  offset: number;
  interval: StatsInterval;
  filters: { key: string; value: string; label: string }[];
};

export const STATS_INTERVALS: { key: StatsInterval; label: string }[] = [
  { key: "hour", label: "Hourly" },
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

// PostHog product events start in 2026; nothing older exists.
const ALL_TIME_START = Date.UTC(2026, 0, 1) - ZONE_OFFSET_MS;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function isStatsPeriod(value: string | null | undefined): value is StatsPeriod {
  return STATS_PERIODS.some((period) => period.key === value);
}

export function isStatsInterval(value: string | null | undefined): value is StatsInterval {
  return STATS_INTERVALS.some((interval) => interval.key === value);
}

// Calendar math runs on "zone time": the instant shifted by the IST offset and
// read with UTC getters, then shifted back.
const toZone = (ms: number) => ms + ZONE_OFFSET_MS;
const fromZone = (ms: number) => ms - ZONE_OFFSET_MS;

function startOfDay(ms: number) {
  const d = new Date(toZone(ms));
  return fromZone(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfWeek(ms: number) {
  const day = startOfDay(ms);
  const weekday = (new Date(toZone(day)).getUTCDay() + 6) % 7; // Monday = 0
  return day - weekday * DAY;
}

function addMonths(ms: number, months: number) {
  const d = new Date(toZone(ms));
  return fromZone(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()));
}

function startOfMonth(ms: number) {
  const d = new Date(toZone(ms));
  return fromZone(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/**
 * Range for a period, `offset` periods back (0 = the current one). Past
 * periods are complete windows; the current one ends now.
 */
export function resolveStatsRange(period: StatsPeriod, offset = 0, nowMs = Date.now()) {
  const back = Math.max(0, Math.floor(offset));
  const today = startOfDay(nowMs);
  let from: number;
  let to: number;
  switch (period) {
    case "today":
      from = today - back * DAY;
      to = back ? from + DAY : nowMs;
      break;
    case "yesterday":
      from = today - (back + 1) * DAY;
      to = from + DAY;
      break;
    case "24h":
      to = nowMs - back * DAY;
      from = to - DAY;
      break;
    case "7d":
    case "30d": {
      const days = period === "7d" ? 7 : 30;
      from = today - (days - 1) * DAY - back * days * DAY;
      to = back ? from + days * DAY : nowMs;
      break;
    }
    case "12m":
      from = addMonths(startOfMonth(nowMs), -11 - back * 12);
      to = back ? addMonths(from, 12) : nowMs;
      break;
    case "wtd":
      from = startOfWeek(nowMs) - back * 7 * DAY;
      to = back ? from + 7 * DAY : nowMs;
      break;
    case "mtd":
      from = addMonths(startOfMonth(nowMs), -back);
      to = back ? addMonths(from, 1) : nowMs;
      break;
    case "ytd": {
      const year = new Date(toZone(nowMs)).getUTCFullYear() - back;
      from = fromZone(Date.UTC(year, 0, 1));
      to = back ? fromZone(Date.UTC(year + 1, 0, 1)) : nowMs;
      break;
    }
    case "all":
    default:
      from = ALL_TIME_START;
      to = nowMs;
  }
  return { from: new Date(from), to: new Date(to) };
}

export function defaultInterval(period: StatsPeriod): StatsInterval {
  if (period === "today" || period === "yesterday" || period === "24h") return "hour";
  if (period === "12m") return "month";
  if (period === "ytd" || period === "all") return "week";
  return "day";
}

/** Intervals that make sense for a range: hourly only up to a week, monthly from two months. */
export function allowedIntervals(from: Date, to: Date): StatsInterval[] {
  const span = to.getTime() - from.getTime();
  return STATS_INTERVALS.map((i) => i.key).filter((key) => {
    if (key === "hour") return span <= 7 * DAY + HOUR;
    if (key === "month") return span >= 58 * DAY;
    if (key === "week") return span >= 13 * DAY;
    return span >= 2 * DAY || key === "day";
  });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Bucket key in the same format the SQL emits (see bucketExpr in queries.ts). */
export function bucketKey(ms: number, interval: StatsInterval) {
  const d = new Date(toZone(ms));
  const ymd = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  if (interval === "hour") return `${ymd} ${pad(d.getUTCHours())}:00`;
  return ymd;
}

function bucketStart(ms: number, interval: StatsInterval) {
  // Floor hours in the same timezone as the SQL buckets.
  if (interval === "hour") return fromZone(Math.floor(toZone(ms) / HOUR) * HOUR);
  if (interval === "week") return startOfWeek(ms);
  if (interval === "month") return startOfMonth(ms);
  return startOfDay(ms);
}

function nextBucket(ms: number, interval: StatsInterval) {
  if (interval === "hour") return ms + HOUR;
  if (interval === "week") return ms + 7 * DAY;
  if (interval === "month") return addMonths(ms, 1);
  return ms + DAY;
}

/** Key of the bucket that contains `ms` (a week's Monday, a month's 1st). */
export function bucketFor(ms: number, interval: StatsInterval) {
  return bucketKey(bucketStart(ms, interval), interval);
}

/** Every bucket key from `from` to `to`, so charts show zero days instead of skipping them. */
export function bucketsBetween(from: Date, to: Date, interval: StatsInterval) {
  const keys: string[] = [];
  const end = to.getTime();
  for (let ms = bucketStart(from.getTime(), interval); ms < end && keys.length < 2000; ms = nextBucket(ms, interval)) {
    keys.push(bucketKey(ms, interval));
  }
  return keys;
}

/** Page state from the URL (?period=&offset=&interval=&filters=). */
export function parseStatsQuery(get: (name: string) => string | null | undefined): StatsQuery {
  const periodParam = get("period");
  const period: StatsPeriod = isStatsPeriod(periodParam) ? periodParam : "30d";
  const intervalParam = get("interval");
  const interval: StatsInterval = isStatsInterval(intervalParam) ? intervalParam : defaultInterval(period);
  let filters: StatsQuery["filters"] = [];
  try {
    const parsed: unknown = JSON.parse(get("filters") || "[]");
    if (Array.isArray(parsed)) {
      filters = parsed
        .filter((f) => f && typeof f.key === "string" && typeof f.value === "string")
        .map((f) => ({ key: f.key, value: f.value, label: typeof f.label === "string" ? f.label : `${f.key} is ${f.value}` }));
    }
  } catch {
    filters = [];
  }
  return { period, offset: Math.max(0, Number(get("offset")) || 0), interval, filters };
}
