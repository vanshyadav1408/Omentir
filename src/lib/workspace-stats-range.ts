import { zonedMonthStart } from "@/lib/time-zone";

export const WORKSPACE_STATS_RANGES = ["all", "7d", "30d", "3m", "month"] as const;

export type WorkspaceStatsRange = (typeof WORKSPACE_STATS_RANGES)[number];

// Same windows as Overview. "all" is the API default so existing callers that
// never sent a range keep getting lifetime totals.
export function statsRangeStartMs(
  range: WorkspaceStatsRange,
  timeZone: string,
  now = Date.now(),
) {
  if (range === "all") return 0;
  if (range === "month") return zonedMonthStart(now, timeZone);
  const days = range === "7d" ? 7 : range === "3m" ? 90 : 30;
  return now - days * 24 * 60 * 60 * 1000;
}

export function isInStatsRange(stamp: string | undefined, rangeStart: number) {
  if (rangeStart <= 0) return true;
  return Boolean(stamp) && new Date(stamp as string).getTime() >= rangeStart;
}
