import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ACTION_PRIORITY,
  SPACING_MINUTES,
  isWithinSendWindow,
  nextLocalAgentRunAt,
  nextSendWindowOpen,
  planSendSchedule,
  zonedParts,
  zonedTimeToUtc,
} from "../src/lib/server/send-schedule.ts";

const IST = "Asia/Kolkata";
const NY = "America/New_York";

// Monday 2026-07-27, 09:00 local in each zone.
const mondayAt = (timezone, hour, minute = 0) =>
  zonedTimeToUtc(timezone, { year: 2026, month: 7, day: 27, hour, minute });

const localOf = (timezone, ms) => {
  const parts = zonedParts(timezone, ms);
  return `${parts.dayKey} ${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
};

test("zoned conversion round-trips through half-hour and DST zones", () => {
  const ist = mondayAt(IST, 9, 30);
  assert.equal(localOf(IST, ist), "2026-07-27 09:30");

  // New York is on DST in July and off it in January; both must resolve.
  assert.equal(localOf(NY, mondayAt(NY, 9)), "2026-07-27 09:00");
  const january = zonedTimeToUtc(NY, { year: 2026, month: 1, day: 5, hour: 9 });
  assert.equal(localOf(NY, january), "2026-01-05 09:00");
});

test("business window is Mon-Fri 09:00-18:00 in the workspace timezone", () => {
  assert.equal(isWithinSendWindow("business", IST, mondayAt(IST, 8, 59)), false);
  assert.equal(isWithinSendWindow("business", IST, mondayAt(IST, 9)), true);
  assert.equal(isWithinSendWindow("business", IST, mondayAt(IST, 17, 59)), true);
  assert.equal(isWithinSendWindow("business", IST, mondayAt(IST, 18)), false);

  // Saturday 2026-08-01 midday is outside business hours but inside extended.
  const saturday = zonedTimeToUtc(IST, { year: 2026, month: 8, day: 1, hour: 12 });
  assert.equal(isWithinSendWindow("business", IST, saturday), false);
  assert.equal(isWithinSendWindow("extended", IST, saturday), true);
  assert.equal(isWithinSendWindow("always", IST, saturday), true);
});

test("the 3am problem: an off-hours action moves to the next opening bell", () => {
  const threeAm = mondayAt(IST, 3, 4);

  // This is the exact case from the audit: a connection accepted at 03:04
  // used to fire its first message at 03:19.
  assert.equal(localOf(IST, nextSendWindowOpen("business", IST, threeAm)), "2026-07-27 09:00");
  assert.equal(localOf(IST, nextSendWindowOpen("extended", IST, threeAm)), "2026-07-27 07:00");
  assert.equal(nextSendWindowOpen("always", IST, threeAm), threeAm);
});

test("business window jumps the weekend", () => {
  // Friday 2026-07-31 at 19:00 local -> Monday 2026-08-03 at 09:00.
  const fridayEvening = zonedTimeToUtc(IST, { year: 2026, month: 7, day: 31, hour: 19 });
  assert.equal(
    localOf(IST, nextSendWindowOpen("business", IST, fridayEvening)),
    "2026-08-03 09:00",
  );
});

test("consecutive actions are spaced one drip interval apart", () => {
  const now = mondayAt(IST, 9);
  const plan = planSendSchedule({
    nowMs: now,
    timezone: IST,
    window: "business",
    dailyInviteLimit: 10,
    dailyMessageLimit: 20,
    actions: [
      { id: "a", kind: "invite", earliestAt: now },
      { id: "b", kind: "invite", earliestAt: now },
      { id: "c", kind: "invite", earliestAt: now },
    ],
  });

  assert.equal(localOf(IST, plan.get("a")), "2026-07-27 09:00");
  assert.equal(localOf(IST, plan.get("b")), "2026-07-27 09:10");
  assert.equal(localOf(IST, plan.get("c")), "2026-07-27 09:20");
  assert.equal(plan.get("b") - plan.get("a"), SPACING_MINUTES * 60 * 1000);
});

test("lead 40 of 75 lands on day four, not 6.5 hours out", () => {
  const now = mondayAt(IST, 9);
  const actions = Array.from({ length: 75 }, (_, index) => ({
    id: `lead-${String(index + 1).padStart(3, "0")}`,
    kind: "invite",
    earliestAt: now,
  }));

  const plan = planSendSchedule({
    nowMs: now,
    timezone: IST,
    window: "business",
    dailyInviteLimit: 10,
    dailyMessageLimit: 20,
    actions,
  });

  // 10 invites a day: 1-10 Monday, 11-20 Tuesday, 21-30 Wednesday, 31-40 Thursday.
  assert.equal(localOf(IST, plan.get("lead-001")), "2026-07-27 09:00");
  assert.equal(localOf(IST, plan.get("lead-010")), "2026-07-27 10:30");
  assert.equal(localOf(IST, plan.get("lead-011")), "2026-07-28 09:00");
  assert.equal(localOf(IST, plan.get("lead-040")), "2026-07-30 10:30");

  // 75 leads at 10/day spills across the weekend into the following week:
  // 41-50 Friday, then Mon/Tue/Wed 51-60, 61-70, 71-75. The last day holds
  // only five, so the final invite is 09:40 rather than a full 10:30 run.
  assert.equal(localOf(IST, plan.get("lead-050")), "2026-07-31 10:30");
  assert.equal(localOf(IST, plan.get("lead-051")), "2026-08-03 09:00");
  assert.equal(localOf(IST, plan.get("lead-075")), "2026-08-05 09:40");

  // Every assignment respects the window and the daily cap.
  const perDay = new Map();
  for (const [, at] of plan) {
    assert.equal(isWithinSendWindow("business", IST, at), true);
    const key = zonedParts(IST, at).dayKey;
    perDay.set(key, (perDay.get(key) || 0) + 1);
  }
  for (const [, count] of perDay) assert.ok(count <= 10, "daily invite cap held");
});

test("a reply outranks a queued invite for the earliest slot", () => {
  const now = mondayAt(IST, 10);
  const plan = planSendSchedule({
    nowMs: now,
    timezone: IST,
    window: "business",
    dailyInviteLimit: 10,
    dailyMessageLimit: 20,
    actions: [
      { id: "invite", kind: "invite", earliestAt: now },
      { id: "reply", kind: "reply", earliestAt: now },
      { id: "followup", kind: "message", earliestAt: now },
    ],
  });

  assert.ok(ACTION_PRIORITY.reply < ACTION_PRIORITY.message);
  assert.ok(ACTION_PRIORITY.message < ACTION_PRIORITY.invite);

  // The reply takes 10:00; the follow-up 10:10; the cold invite yields to both.
  assert.equal(localOf(IST, plan.get("reply")), "2026-07-27 10:00");
  assert.equal(localOf(IST, plan.get("followup")), "2026-07-27 10:10");
  assert.equal(localOf(IST, plan.get("invite")), "2026-07-27 10:20");
});

test("a follow-up never fires before its wait step, only after", () => {
  const now = mondayAt(IST, 9);
  const dueAt = mondayAt(IST, 14, 33);
  const plan = planSendSchedule({
    nowMs: now,
    timezone: IST,
    window: "business",
    dailyInviteLimit: 10,
    dailyMessageLimit: 20,
    // 14:30 is already reserved, so the 14:33 follow-up must slide, not collide.
    reservedSlots: [mondayAt(IST, 14, 30)],
    actions: [{ id: "followup", kind: "message", earliestAt: dueAt }],
  });

  const at = plan.get("followup");
  assert.ok(at >= dueAt, "never earlier than the wait step allows");
  assert.equal(localOf(IST, at), "2026-07-27 14:40");
});

test("daily caps are counted on local days, not UTC days", () => {
  // 23:30 IST on Monday is already Monday 18:00 UTC. Under the old UTC-day
  // accounting this action counted against a different day than the user's.
  const lateIst = mondayAt(IST, 23, 30);
  assert.equal(zonedParts(IST, lateIst).dayKey, "2026-07-27");
  assert.equal(zonedParts("UTC", lateIst).dayKey, "2026-07-27");

  // New York at 21:00 Monday is already Tuesday in UTC - the case that used to
  // bunch a US workspace's whole allowance into its evening.
  const lateNy = mondayAt(NY, 21);
  assert.equal(zonedParts(NY, lateNy).dayKey, "2026-07-27");
  assert.equal(zonedParts("UTC", lateNy).dayKey, "2026-07-28");
});

test("already-used quota carries into the plan", () => {
  const now = mondayAt(IST, 9);
  const plan = planSendSchedule({
    nowMs: now,
    timezone: IST,
    window: "business",
    dailyInviteLimit: 10,
    dailyMessageLimit: 20,
    // Nine invites already went out today, so only one slot is left.
    usedByDay: { "2026-07-27": { invites: 9 } },
    actions: [
      { id: "a", kind: "invite", earliestAt: now },
      { id: "b", kind: "invite", earliestAt: now },
    ],
  });

  assert.equal(localOf(IST, plan.get("a")), "2026-07-27 09:00");
  assert.equal(localOf(IST, plan.get("b")), "2026-07-28 09:00");
});

test("the always window still sends round the clock", () => {
  const threeAm = mondayAt(IST, 3);
  const plan = planSendSchedule({
    nowMs: threeAm,
    timezone: IST,
    window: "always",
    dailyInviteLimit: 10,
    dailyMessageLimit: 20,
    actions: [{ id: "a", kind: "invite", earliestAt: threeAm }],
  });

  assert.equal(localOf(IST, plan.get("a")), "2026-07-27 03:00");
});

test("an invalid timezone degrades to UTC instead of throwing", () => {
  const ms = Date.UTC(2026, 6, 27, 9, 0);
  assert.equal(zonedParts("Not/AZone", ms).dayKey, "2026-07-27");
  assert.equal(zonedParts("Not/AZone", ms).hour, 9);
});

test("agent discovery anchors to the chosen local hour, not the click time", () => {
  // Agent "created" at 23:47 local. The old behaviour locked discovery to
  // 23:47 forever; the chosen hour must win instead.
  const createdAt = mondayAt(IST, 23, 47);
  const next = nextLocalAgentRunAt(8, IST, createdAt);
  assert.equal(localOf(IST, Date.parse(next)), "2026-07-28 08:00");

  // Still ahead of us today -> today, not tomorrow.
  const earlyMorning = mondayAt(IST, 6);
  assert.equal(
    localOf(IST, Date.parse(nextLocalAgentRunAt(8, IST, earlyMorning))),
    "2026-07-27 08:00",
  );

  // Exactly at the hour must roll forward, never return "now".
  const atEight = mondayAt(IST, 8);
  assert.ok(Date.parse(nextLocalAgentRunAt(8, IST, atEight)) > atEight);
});

test("agent run hour survives DST instead of drifting an hour", () => {
  // US DST begins 2026-03-08. A 08:00 local anchor stays 08:00 local either
  // side of the transition, which a fixed +24h in UTC would not.
  const beforeDst = zonedTimeToUtc(NY, { year: 2026, month: 3, day: 6, hour: 9 });
  const first = Date.parse(nextLocalAgentRunAt(8, NY, beforeDst));
  assert.equal(localOf(NY, first), "2026-03-07 08:00");
  const acrossDst = Date.parse(nextLocalAgentRunAt(8, NY, first));
  assert.equal(localOf(NY, acrossDst), "2026-03-08 08:00");
});

test("out-of-range run hours are clamped rather than throwing", () => {
  const now = mondayAt(IST, 12);
  assert.equal(localOf(IST, Date.parse(nextLocalAgentRunAt(-5, IST, now))), "2026-07-28 00:00");
  assert.equal(localOf(IST, Date.parse(nextLocalAgentRunAt(99, IST, now))), "2026-07-27 23:00");
});

// A deep queue is the case the planner exists for, so it has to hold up at
// depth. Both of these were real failures: stepping past reserved slots one per
// constraint pass made planning quadratic AND made it give up mid-ladder,
// returning a time that collided with a slot it had already handed out.
const spacingMs = SPACING_MINUTES * 60 * 1000;

const collisionsIn = (times) =>
  [...times]
    .sort((a, b) => a - b)
    .filter((slot, index, sorted) => index > 0 && slot - sorted[index - 1] < spacingMs).length;

test("a deep reserved ladder never plans onto an occupied slot", () => {
  const now = mondayAt(NY, 9);
  // 700 back-to-back reservations - past the pass ceiling, where the planner
  // used to silently return a slot 0 minutes from an existing one.
  const reservedSlots = Array.from({ length: 700 }, (_, index) => now + index * spacingMs);

  const plan = planSendSchedule({
    nowMs: now,
    timezone: NY,
    window: "always",
    dailyInviteLimit: 100,
    dailyMessageLimit: 100,
    reservedSlots,
    actions: [{ id: "late", kind: "invite", earliestAt: now }],
  });

  const slot = plan.get("late");
  const nearest = Math.min(...reservedSlots.map((reserved) => Math.abs(reserved - slot)));
  assert.ok(
    nearest >= spacingMs,
    `planned ${nearest / 60000}min from a reserved slot, needs ${SPACING_MINUTES}min`,
  );
});

test("planning a large batch stays spaced and stays fast", () => {
  const now = mondayAt(NY, 9);
  const started = Date.now();
  const plan = planSendSchedule({
    nowMs: now,
    timezone: NY,
    window: "business",
    dailyInviteLimit: 10,
    dailyMessageLimit: 20,
    actions: Array.from({ length: 600 }, (_, index) => ({
      id: `lead-${index}`,
      kind: "invite",
      earliestAt: now,
    })),
  });
  const elapsed = Date.now() - started;

  assert.equal(plan.size, 600);
  assert.equal(collisionsIn(plan.values()), 0);
  for (const slot of plan.values()) {
    assert.ok(isWithinSendWindow("business", NY, slot), `${localOf(NY, slot)} is outside the window`);
  }
  // Runs synchronously inside the tick, once per campaign. The pre-fix planner
  // took ~35s for this; the ceiling is loose enough not to be flaky on CI but
  // tight enough to catch a return to quadratic behaviour.
  assert.ok(elapsed < 3000, `planning 600 actions took ${elapsed}ms`);
});

// The scheduling controls live on the agent form but are read by two different
// server paths (the agent doc for the run hour, the campaign doc for the send
// window). Both were rendered on the edit form while the update path ignored
// them, so changing either after launch silently did nothing.
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the agent edit form's scheduling controls reach the server", () => {
  const actions = read("src/app/actions.ts");
  const updateForm = actions.slice(
    actions.indexOf("async function updateAgentFromForm"),
    actions.indexOf("export async function updateAgentForSetupAction"),
  );
  assert.match(
    updateForm,
    /runAtHour: parseRunAtHour\(formData\.get\("runAtHour"\)\)/,
    "editing an agent must persist the discovery hour, not just create",
  );

  // The edit path never calls createCampaignAction, so the window has to be
  // applied to the agent's existing campaigns explicitly.
  const updateAction = actions.slice(
    actions.indexOf("export async function updateAgentAction"),
    actions.indexOf("export async function draftAgentSetupAction"),
  );
  assert.match(updateAction, /setSendWindowForGroup\(/);
  assert.match(updateAction, /parseSendWindow\(formData\.get\("sendWindow"\)\)/);
});

test("the edit form opens on the window its campaign actually sends in", () => {
  // Now that saving writes the window back, an edit form that always opened on
  // a default would reset every campaign that disagreed with it.
  assert.match(
    read("src/app/(app)/agents/new/page.tsx"),
    /initialSendWindow=\{existingSendWindow\}/,
  );
  assert.match(
    read("src/app/(app)/agents/new/agent-setup.tsx"),
    /useState<SendWindow>\(\s*initialSendWindow \?\? \(initialAgent \? "always" : "business"\)/,
  );
});
