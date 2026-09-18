import { describe, expect, test } from "bun:test";
import {
  nextInviteLimitRetryAt,
  nextLocalMondayAt,
} from "./scheduling";

describe("nextInviteLimitRetryAt", () => {
  test("first account-wide block waits 6 hours so a note-quota false alarm is not parked until Monday", () => {
    const nowMs = Date.parse("2026-09-18T16:00:00.000Z");
    expect(nextInviteLimitRetryAt({ nowMs, timezone: "UTC" })).toEqual({
      until: "2026-09-18T22:00:00.000Z",
      stage: 1,
    });
  });

  test("a failed 6-hour retry waits until next Monday when that is sooner than 3 days", () => {
    // Saturday morning: Monday 9am beats Tuesday at the same clock time.
    const nowMs = Date.parse("2026-09-19T10:00:00.000Z");
    expect(nextInviteLimitRetryAt({ previousStage: 1, nowMs, timezone: "UTC" })).toEqual({
      until: "2026-09-21T09:00:00.000Z",
      stage: 2,
    });
  });

  test("a failed 6-hour retry waits 3 days when next Monday is farther away", () => {
    // Tuesday: Friday is sooner than the following Monday.
    const nowMs = Date.parse("2026-09-22T10:00:00.000Z");
    expect(nextInviteLimitRetryAt({ previousStage: 1, nowMs, timezone: "UTC" })).toEqual({
      until: "2026-09-25T10:00:00.000Z",
      stage: 2,
    });
  });
});

describe("nextLocalMondayAt", () => {
  test("uses this Monday 9am when that instant is still ahead so a Sunday-night pause is not deferred a week", () => {
    expect(nextLocalMondayAt("UTC", Date.parse("2026-09-21T08:00:00.000Z"))).toBe(
      "2026-09-21T09:00:00.000Z",
    );
  });

  test("skips to next week after Monday 9am because this week's LinkedIn reset has already passed", () => {
    expect(nextLocalMondayAt("UTC", Date.parse("2026-09-21T10:00:00.000Z"))).toBe(
      "2026-09-28T09:00:00.000Z",
    );
  });
});
