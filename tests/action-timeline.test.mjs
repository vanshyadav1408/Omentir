import assert from "node:assert/strict";
import test from "node:test";

import { buildActionTimeline } from "../src/lib/server/action-timeline.ts";

// connect -> wait 1d -> message -> wait 2d -> message
const steps = [
  { id: "connect", type: "connect", includeNote: false, noteTemplate: "" },
  { id: "wait-1", type: "wait", delayMinutes: 24 * 60 },
  { id: "first-message", type: "message", messageTemplate: "" },
  { id: "wait-2", type: "wait", delayMinutes: 48 * 60 },
  { id: "second-message", type: "message", messageTemplate: "" },
];

test("the schedule shows when each finished step actually went out", () => {
  // Both the invite and the first message are done; only the follow-up is left.
  const timeline = buildActionTimeline({
    steps,
    stepIndex: 4,
    scheduledAt: "2026-07-30T10:00:00.000Z",
    connectionSentAt: "2026-07-25T09:00:00.000Z",
    sentMessageAts: ["2026-07-28T09:30:00.000Z"],
    connectionAccepted: true,
  });

  assert.deepEqual(
    timeline.map((item) => [item.status, item.at]),
    [
      ["completed", "2026-07-25T09:00:00.000Z"],
      ["completed", "2026-07-28T09:30:00.000Z"],
      ["scheduled", "2026-07-30T10:00:00.000Z"],
    ],
  );
});

// The point of the whole view: a user seeing "message on Aug 8" for a lead who
// never accepted the invite would think outreach is progressing. It is not -
// the automation parks the enrollment on its give-up date and only the
// acceptance webhook wakes it, so no date may be shown for those steps.
test("messages gated on an unaccepted invite show no time at all", () => {
  const timeline = buildActionTimeline({
    steps,
    stepIndex: 2,
    // What the automation really stores after an invite goes out: the give-up
    // date, weeks away and unrelated to when the message would send.
    scheduledAt: "2026-08-08T09:00:00.000Z",
    connectionSentAt: "2026-07-25T09:00:00.000Z",
    connectionAccepted: false,
  });

  assert.equal(timeline[0].status, "completed");
  assert.equal(timeline[1].status, "waiting");
  assert.equal(timeline[1].at, undefined);
  assert.match(timeline[1].note, /accept/i);
  assert.equal(timeline[2].status, "upcoming");
  assert.equal(timeline[2].at, undefined);
});

test("later steps are projected from the campaign's own wait delays", () => {
  const timeline = buildActionTimeline({
    steps,
    stepIndex: 2,
    scheduledAt: "2026-07-28T09:00:00.000Z",
    connectionSentAt: "2026-07-25T09:00:00.000Z",
    connectionAccepted: true,
  });

  const followUp = timeline[2];
  assert.equal(followUp.status, "upcoming");
  assert.equal(followUp.estimated, true);
  // The wait step between the two messages is 48h, so the follow-up lands then.
  assert.equal(followUp.at, "2026-07-30T09:00:00.000Z");
});
