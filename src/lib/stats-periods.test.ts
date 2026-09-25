import { describe, expect, test } from "bun:test";
import { allowedIntervals, bucketsBetween, parseStatsQuery, resolveStatsRange } from "./stats-periods";

// 2026-09-25 14:30 UTC = 20:00 IST, a Friday. Periods follow India time.
const NOW = Date.UTC(2026, 8, 25, 14, 30);
const DAY = 86_400_000;

describe("resolveStatsRange", () => {
  test("Last 7 days includes today, so the KPI strip covers the same days the chart shows", () => {
    const { from, to } = resolveStatsRange("7d", 0, NOW);
    // Sep 19 00:00 IST
    expect(from.toISOString()).toBe("2026-09-18T18:30:00.000Z");
    expect(to.getTime()).toBe(NOW);
  });

  test("stepping back gives the adjacent full window, so period-over-period changes compare like with like", () => {
    const current = resolveStatsRange("30d", 0, NOW);
    const previous = resolveStatsRange("30d", 1, NOW);
    expect(previous.to.getTime()).toBe(current.from.getTime());
    expect(previous.to.getTime() - previous.from.getTime()).toBe(30 * DAY);
  });

  test("yesterday is one closed India-time day, never the partial current day", () => {
    const { from, to } = resolveStatsRange("yesterday", 0, NOW);
    // Sep 24 00:00 IST
    expect(from.toISOString()).toBe("2026-09-23T18:30:00.000Z");
    expect(to.getTime() - from.getTime()).toBe(DAY);
  });

  test("week to date starts on Monday in India time, matching toStartOfWeek(ts, 1) in the SQL", () => {
    expect(resolveStatsRange("wtd", 0, NOW).from.toISOString()).toBe("2026-09-20T18:30:00.000Z");
  });

  test("today starts at midnight IST, not 05:30 IST (UTC midnight)", () => {
    expect(resolveStatsRange("today", 0, NOW).from.toISOString()).toBe("2026-09-24T18:30:00.000Z");
  });
});

describe("bucketsBetween", () => {
  // Chart points are matched to SQL rows by key; a format drift would silently draw zeros.
  test("hour keys are India-time hours in the SQL formatDateTime shape, with no gaps", () => {
    const today = resolveStatsRange("today", 0, NOW);
    const keys = bucketsBetween(today.from, today.to, "hour");
    expect(keys[0]).toBe("2026-09-25 00:00");
    expect(keys.at(-1)).toBe("2026-09-25 19:00");
    expect(keys).toHaveLength(20);
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
