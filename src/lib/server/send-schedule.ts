// The outreach slot planner. Every send time in the product comes from here so
// the Actions page can promise an exact timestamp instead of the optimistic
// "now + delay" guesses that used to churn hourly and never match reality.
//
// Three constraints stack, in this order of bindingness:
//   1. The campaign's send window (business hours, extended, or 24/7) in the
//      workspace's timezone.
//   2. The per-LinkedIn-account drip: at most one action per SPACING_MINUTES,
//      shared by invites, follow-ups and replies alike.
//   3. The workspace's daily invite / message caps, counted over LOCAL days.
//
// With a 9-6 window there are 54 slots a day against caps of 10 + 20, so the
// caps bind long before the spacing does - which is why a queue of 75 leads
// resolves to "day four, 09:20" rather than "6.5 hours from now".

import type { SendWindow } from "./types";

// One action per account per 10 minutes, invites and messages alike. Was
// invite-only (data.ts claimInviteSendSlot); replies and follow-ups now share
// the same line, which is what makes collisions possible and this planner
// necessary.
export const SPACING_MINUTES = 10;

// Reply > follow-up > invite. A reply has a human waiting and is rare, so it
// takes the next free slot and pushes a cold invite aside; an invite has no
// deadline and always yields. Cascading bumps terminate because invites never
// bump back.
export const ACTION_PRIORITY = { reply: 0, message: 1, invite: 2 } as const;

export type SendActionKind = keyof typeof ACTION_PRIORITY;

type WindowBounds = {
  // Local weekdays the window is open on, 0 = Sunday.
  days: number[];
  startHour: number;
  endHour: number;
};

const WINDOW_BOUNDS: Record<SendWindow, WindowBounds> = {
  always: { days: [0, 1, 2, 3, 4, 5, 6], startHour: 0, endHour: 24 },
  business: { days: [1, 2, 3, 4, 5], startHour: 9, endHour: 18 },
  extended: { days: [0, 1, 2, 3, 4, 5, 6], startHour: 7, endHour: 22 },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
  // Local calendar day as YYYY-MM-DD, the key daily caps are counted on.
  dayKey: string;
};

function safeTimeZone(timezone: string | undefined) {
  const candidate = timezone || "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(0);
    return candidate;
  } catch {
    // A bad stored timezone degrades to UTC ("wrong hour") rather than
    // throwing inside the tick and stopping outreach entirely.
    return "UTC";
  }
}

export function zonedParts(timezone: string | undefined, ms: number): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const get = (type: Intl.DateTimeFormatPart["type"]) =>
    parts.find((part) => part.type === type)?.value || "";

  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    year,
    month,
    day,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: WEEKDAYS.indexOf(get("weekday")),
    dayKey: `${year}-${pad(month)}-${pad(day)}`,
  };
}

// Wall-clock time in a timezone -> UTC ms. The offset is re-derived at the
// candidate instant so a DST boundary between now and the target is respected
// (same two-pass technique as nextLocalMondayAt).
export function zonedTimeToUtc(
  timezone: string | undefined,
  local: { year: number; month: number; day: number; hour?: number; minute?: number },
) {
  const targetLocalMs = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour || 0,
    local.minute || 0,
  );

  const resolve = (guess: number) => {
    const parts = zonedParts(timezone, guess);
    const offset =
      Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) -
      guess;
    return targetLocalMs - offset;
  };

  return resolve(resolve(targetLocalMs));
}

export function isWithinSendWindow(
  window: SendWindow,
  timezone: string | undefined,
  ms: number,
) {
  const bounds = WINDOW_BOUNDS[window] || WINDOW_BOUNDS.always;
  const parts = zonedParts(timezone, ms);
  return (
    bounds.days.includes(parts.weekday) &&
    parts.hour >= bounds.startHour &&
    parts.hour < bounds.endHour
  );
}

// The first instant at or after `ms` when the window is open. Walks forward a
// day at a time from the candidate's own local date, so it is correct across
// DST shifts and weekend gaps without any arithmetic on UTC offsets.
export function nextSendWindowOpen(
  window: SendWindow,
  timezone: string | undefined,
  ms: number,
): number {
  const bounds = WINDOW_BOUNDS[window] || WINDOW_BOUNDS.always;
  if (window === "always") return ms;
  if (isWithinSendWindow(window, timezone, ms)) return ms;

  const parts = zonedParts(timezone, ms);
  // Today's opening still ahead of us, and today is an open weekday.
  if (bounds.days.includes(parts.weekday) && parts.hour < bounds.startHour) {
    return zonedTimeToUtc(timezone, {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: bounds.startHour,
    });
  }

  // Otherwise the next open day's opening bell. Bounded at 8 iterations: any
  // window with at least one open weekday resolves within a week.
  for (let ahead = 1; ahead <= 8; ahead += 1) {
    const candidate = zonedTimeToUtc(timezone, {
      year: parts.year,
      month: parts.month,
      day: parts.day + ahead,
      hour: bounds.startHour,
    });
    if (bounds.days.includes(zonedParts(timezone, candidate).weekday)) return candidate;
  }

  return ms;
}

// Start of the local day after the one `ms` falls in - where an action lands
// once the current day's cap is spent.
function nextLocalDayStart(timezone: string | undefined, ms: number) {
  const parts = zonedParts(timezone, ms);
  return zonedTimeToUtc(timezone, {
    year: parts.year,
    month: parts.month,
    day: parts.day + 1,
    hour: 0,
  });
}

// Discovery runs an hour before a business-hours window opens, so freshly
// found leads are queued and ready when sending starts. Used when the user has
// not picked an hour themselves.
export const DEFAULT_AGENT_RUN_HOUR = 8;

// The next occurrence of `hour` in the workspace's local timezone. Anchoring on
// a local wall-clock hour (rather than adding 24h to whenever the agent was
// created) means discovery keeps happening at the hour the user chose, across
// DST shifts, instead of at whatever minute they clicked "Create" - which used
// to be the only thing deciding it.
export function nextLocalAgentRunAt(
  hour: number,
  timezone: string | undefined,
  nowMs = Date.now(),
) {
  const target = Math.min(23, Math.max(0, Math.trunc(hour)));
  const local = zonedParts(timezone, nowMs);

  for (let ahead = 0; ahead <= 2; ahead += 1) {
    const candidate = zonedTimeToUtc(timezone, {
      year: local.year,
      month: local.month,
      day: local.day + ahead,
      hour: target,
    });
    if (candidate > nowMs) return new Date(candidate).toISOString();
  }

  return new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
}

export type PlannedAction = {
  id: string;
  kind: SendActionKind;
  // Not schedulable before this: a wait step's target, an invite's ladder
  // position, or simply "now" for a reply.
  earliestAt: number;
};

export type SchedulePlanInput = {
  nowMs: number;
  timezone: string | undefined;
  window: SendWindow;
  dailyInviteLimit: number;
  dailyMessageLimit: number;
  // Actions already counted against today's caps, keyed by local day.
  usedByDay?: Record<string, { invites?: number; messages?: number }>;
  // Slots already reserved on this LinkedIn account's line.
  reservedSlots?: number[];
  actions: PlannedAction[];
  spacingMinutes?: number;
};

// Deterministic assignment of real send times. Same inputs always produce the
// same output, which is what lets the Actions page display the planner's
// answer verbatim instead of maintaining a second, drifting estimate.
export function planSendSchedule(input: SchedulePlanInput): Map<string, number> {
  const spacingMs = (input.spacingMinutes ?? SPACING_MINUTES) * 60 * 1000;
  const taken = [...(input.reservedSlots || [])].sort((a, b) => a - b);
  const used = new Map<string, { invites: number; messages: number }>();
  for (const [dayKey, counts] of Object.entries(input.usedByDay || {})) {
    used.set(dayKey, { invites: counts.invites || 0, messages: counts.messages || 0 });
  }

  // Replies first, then follow-ups, then invites; ties broken by the earliest
  // time each became eligible so the order is stable across ticks.
  const ordered = [...input.actions].sort(
    (a, b) =>
      ACTION_PRIORITY[a.kind] - ACTION_PRIORITY[b.kind] ||
      a.earliestAt - b.earliestAt ||
      a.id.localeCompare(b.id),
  );

  const result = new Map<string, number>();

  for (const action of ordered) {
    // An invite counts against the invite cap; follow-ups and replies both
    // count as messages, matching how consumeDailyQuota already tallies them.
    const quotaKind = action.kind === "invite" ? "invites" : "messages";
    const limit = quotaKind === "invites" ? input.dailyInviteLimit : input.dailyMessageLimit;

    let candidate = Math.max(action.earliestAt, input.nowMs);

    // Each pass fixes one constraint and re-checks the others, since snapping
    // into a window can push past a day boundary and vice versa. The bound is
    // generous but finite so a pathological config can never spin the tick.
    for (let pass = 0; pass < 512; pass += 1) {
      const inWindow = nextSendWindowOpen(input.window, input.timezone, candidate);
      if (inWindow !== candidate) {
        candidate = inWindow;
        continue;
      }

      // Push clear of every reserved slot within one spacing interval.
      const blocking = taken.find(
        (slot) => Math.abs(slot - candidate) < spacingMs,
      );
      if (blocking !== undefined) {
        candidate = blocking + spacingMs;
        continue;
      }

      const dayKey = zonedParts(input.timezone, candidate).dayKey;
      const dayUsed = used.get(dayKey) || { invites: 0, messages: 0 };
      if (dayUsed[quotaKind] >= limit) {
        candidate = nextLocalDayStart(input.timezone, candidate);
        continue;
      }

      used.set(dayKey, { ...dayUsed, [quotaKind]: dayUsed[quotaKind] + 1 });
      break;
    }

    result.set(action.id, candidate);
    taken.push(candidate);
    taken.sort((a, b) => a - b);
  }

  return result;
}
