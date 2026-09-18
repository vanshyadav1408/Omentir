import { describe, expect, test } from "bun:test";
import { isInStatsRange, statsRangeStartMs } from "./workspace-stats-range";

describe("workspace stats range", () => {
  test("a 7-day window drops an invite from last month so Overview and MCP do not disagree on 'invites sent'", () => {
    const now = Date.parse("2026-09-18T12:00:00.000Z");
    const start = statsRangeStartMs("7d", "UTC", now);
    expect(isInStatsRange("2026-09-16T00:00:00.000Z", start)).toBe(true);
    expect(isInStatsRange("2026-08-01T00:00:00.000Z", start)).toBe(false);
  });

  test("all keeps lifetime totals so existing API callers that omit range still see every invite", () => {
    expect(isInStatsRange("2019-01-01T00:00:00.000Z", statsRangeStartMs("all", "UTC"))).toBe(true);
  });
});
