import { describe, expect, test } from "bun:test";
import {
  REPLY_DELAY_MAX_MINUTES,
  REPLY_DELAY_MIN_MINUTES,
  SPACING_MINUTES,
  aiReplyIsDue,
  nextAiReplyAt,
  planSendSchedule,
  randomReplyDelayMs,
} from "../src/lib/server/send-schedule";

const MIN_DELAY_MS = REPLY_DELAY_MIN_MINUTES * 60 * 1000;
const MAX_DELAY_MS = REPLY_DELAY_MAX_MINUTES * 60 * 1000;

describe("randomReplyDelayMs", () => {
  test("picks a different wait each time so consecutive replies are not a fixed timer", () => {
    const samples = Array.from({ length: 40 }, () => randomReplyDelayMs());
    for (const delay of samples) {
      expect(delay).toBeGreaterThanOrEqual(MIN_DELAY_MS);
      expect(delay).toBeLessThanOrEqual(MAX_DELAY_MS);
    }
    expect(new Set(samples).size).toBeGreaterThan(1);
  });
});

describe("aiReplyIsDue", () => {
  test("a fresh 2-15 minute pause is not due yet, because sending immediately looks automated", () => {
    const now = Date.parse("2026-08-18T12:00:00.000Z");
    expect(aiReplyIsDue(nextAiReplyAt(now, MIN_DELAY_MS), now)).toBe(false);
    expect(aiReplyIsDue(nextAiReplyAt(now, MAX_DELAY_MS), now)).toBe(false);
  });

  test("a slot that already passed is due", () => {
    const now = Date.parse("2026-08-18T12:00:00.000Z");
    expect(aiReplyIsDue(new Date(now - 1000).toISOString(), now)).toBe(true);
  });

  test("a slot parked past 15 minutes is due so a waiting prospect is not left until morning", () => {
    const now = Date.parse("2026-08-18T12:00:00.000Z");
    const parked = new Date(now + (REPLY_DELAY_MAX_MINUTES + 1) * 60 * 1000).toISOString();
    expect(aiReplyIsDue(parked, now)).toBe(true);
  });
});

describe("planSendSchedule replies", () => {
  const fiveMin = SPACING_MINUTES * 60 * 1000;
  // Friday 8pm Eastern: a business-hours window is closed until Monday 9am.
  const fridayEveningEt = Date.parse("2026-08-15T00:00:00.000Z");
  const earliestAt = fridayEveningEt + 8 * 60 * 1000;

  test("does not park a reply until Monday when the campaign is business hours", () => {
    const plan = planSendSchedule({
      nowMs: fridayEveningEt,
      timezone: "America/New_York",
      window: "business",
      dailyInviteLimit: 10,
      dailyMessageLimit: 20,
      actions: [{ id: "reply-1", kind: "reply", earliestAt, timezone: "America/New_York" }],
    });
    expect(plan.get("reply-1")).toBe(earliestAt);
    expect((plan.get("reply-1") as number) - fridayEveningEt).toBeLessThanOrEqual(MAX_DELAY_MS);
  });

  test("does not put a reply behind a packed invite drip that would take hours", () => {
    const reservedSlots = Array.from({ length: 24 }, (_, index) => fridayEveningEt + (index + 1) * fiveMin);
    const plan = planSendSchedule({
      nowMs: fridayEveningEt,
      timezone: "America/New_York",
      window: "always",
      dailyInviteLimit: 10,
      dailyMessageLimit: 20,
      reservedSlots,
      actions: [{ id: "reply-1", kind: "reply", earliestAt, timezone: "America/New_York" }],
    });
    expect(plan.get("reply-1")).toBe(earliestAt);
  });

  test("still makes a same-batch invite yield so two sends do not land on the same minute", () => {
    const plan = planSendSchedule({
      nowMs: fridayEveningEt,
      timezone: "America/New_York",
      window: "always",
      dailyInviteLimit: 10,
      dailyMessageLimit: 20,
      actions: [
        { id: "reply-1", kind: "reply", earliestAt, timezone: "America/New_York" },
        { id: "invite-1", kind: "invite", earliestAt, timezone: "America/New_York" },
      ],
    });
    expect(plan.get("reply-1")).toBe(earliestAt);
    expect(plan.get("invite-1")).toBeGreaterThanOrEqual(earliestAt + fiveMin);
  });
});
