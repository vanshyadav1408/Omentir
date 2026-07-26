import assert from "node:assert/strict";
import test from "node:test";

import {
  SPACING_MINUTES,
  planSendSchedule,
} from "../src/lib/server/send-schedule.ts";

test("one LinkedIn account schedules only one action per 10-minute period", () => {
  const now = Date.parse("2026-07-27T09:00:00.000Z");
  const plan = planSendSchedule({
    nowMs: now,
    timezone: "UTC",
    window: "always",
    dailyInviteLimit: 10,
    dailyMessageLimit: 20,
    actions: [
      { id: "invite", kind: "invite", earliestAt: now },
      { id: "message", kind: "message", earliestAt: now },
      { id: "reply", kind: "reply", earliestAt: now },
    ],
  });
  const scheduled = [...plan.values()].sort((a, b) => a - b);
  const minimumGap = SPACING_MINUTES * 60 * 1000;

  assert.equal(scheduled.length, 3);
  assert.ok(scheduled[1] - scheduled[0] >= minimumGap);
  assert.ok(scheduled[2] - scheduled[1] >= minimumGap);
});
