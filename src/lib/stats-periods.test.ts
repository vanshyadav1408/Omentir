import { describe, expect, test } from "bun:test";
import { allowedIntervals, bucketsBetween, parseStatsQuery, resolveStatsRange } from "./stats-periods";

// 2026-09-25 14:30 UTC, a Friday.
const NOW = Date.UTC(2026, 8, 25, 14, 30);
const DAY = 86_400_000;

describe("resolveStatsRange", () => {
  test("Last 7 days includes today, so the KPI strip covers the same days the chart shows", () => {
    const { from, to } = resolveStatsRange("7d", 0, NOW);
    expect(from.toISOString()).toBe("2026-09-19T00:00:00.000Z");
    expect(to.getTime()).toBe(NOW);
  });

  test("stepping back gives the adjacent full window, so period-over-period changes compare like with like", () => {
    const current = resolveStatsRange("30d", 0, NOW);
    const previous = resolveStatsRange("30d", 1, NOW);
    expect(previous.to.getTime()).toBe(current.from.getTime());
    expect(previous.to.getTime() - previous.from.getTime()).toBe(30 * DAY);
  });

  test("yesterday is one closed UTC day, never the partial current day", () => {
    const { from, to } = resolveStatsRange("yesterday", 0, NOW);
    expect(from.toISOString()).toBe("2026-09-24T00:00:00.000Z");
    expect(to.getTime() - from.getTime()).toBe(DAY);
  });

  test("week to date starts on Monday, matching toStartOfWeek(ts, 1) in the SQL", () => {
    expect(resolveStatsRange("wtd", 0, NOW).from.toISOString()).toBe("2026-09-21T00:00:00.000Z");
  });
});

describe("bucketsBetween", () => {
  // Chart points are matched to SQL rows by key; a format drift would silently draw zeros.
  test("hour keys use the SQL formatDateTime shape and cover every hour so empty hours draw as zero", () => {
    const keys = bucketsBetween(new Date(Date.UTC(2026, 8, 25)), new Date(NOW), "hour");
    expect(keys[0]).toBe("2026-09-25 00:00");
    expect(keys.at(-1)).toBe("2026-09-25 14:00");
    expect(keys).toHaveLength(15);
  });

  test("week keys are Mondays and month keys are the 1st, like toStartOfWeek/toStartOfMonth", () => {
    const range = resolveStatsRange("30d", 0, NOW);
    expect(bucketsBetween(range.from, range.to, "week")[0]).toBe("2026-08-24");
    expect(bucketsBetween(new Date(Date.UTC(2026, 6, 15)), new Date(NOW), "month")).toEqual([
      "2026-07-01",
      "2026-08-01",
      "2026-09-01",
    ]);
  });
});

test("hourly is not offered past a week, where it would draw hundreds of unreadable points", () => {
  const month = resolveStatsRange("30d", 0, NOW);
  expect(allowedIntervals(month.from, month.to)).not.toContain("hour");
  const today = resolveStatsRange("today", 0, NOW);
  expect(allowedIntervals(today.from, today.to)).toContain("hour");
});

test("a hand-edited URL falls back to defaults instead of breaking the page", () => {
  const params = new URLSearchParams({ period: "forever", offset: "-3", filters: "{not json" });
  const query = parseStatsQuery((name) => params.get(name));
  expect(query).toEqual({ period: "30d", offset: 0, interval: "day", filters: [] });
});
