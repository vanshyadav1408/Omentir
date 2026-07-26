// The outreach slot planner. Every send time in the product comes from here so
// the Actions page can promise an exact timestamp instead of the optimistic
// "now + delay" guesses that used to churn hourly and never match reality.
//
// Three constraints stack, in this order of bindingness:
//   1. The campaign's send window (business hours, extended, or 24/7) in the
//      RECIPIENT's timezone - the window protects the lead's evening, so it is
//      read on their clock, not the sender's (see lead-time-zone.ts). Leads we
//      cannot place fall back to the workspace's zone.
//   2. The per-LinkedIn-account drip: at most one action per SPACING_MINUTES,
//      shared by invites, follow-ups and replies alike.
//   3. The workspace's daily invite / message caps, counted over LOCAL days.
//      These stay on the WORKSPACE clock: they protect the sending LinkedIn
//      account, so "10 invites a day" has to mean one sender's day, not a
//      different day boundary per recipient.
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

// Ceiling on the constraint passes one action may take. Each pass advances the
// candidate by at least one calendar move, so a satisfiable plan settles in far
// fewer than this - a queue deep enough to need 512 local days has bigger
// problems than its schedule.
const MAX_PLAN_PASSES = 512;

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

// Constructing an Intl.DateTimeFormat is far more expensive than using one, and
// the planner calls zonedParts several times per constraint pass. Cached per
// timezone, which is a bounded set (one per workspace) and never invalidated,
// since a zone's formatter is a pure function of its name.
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function zonedFormatter(timezone: string | undefined) {
  // Keyed on the raw input so the validation probe in safeTimeZone - itself a
  // formatter construction - is also paid only once per distinct zone.
  const key = timezone || "";
  const cached = formatterCache.get(key);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  formatterCache.set(key, formatter);
  return formatter;
}

export function zonedParts(timezone: string | undefined, ms: number): ZonedParts {
  const parts = zonedFormatter(timezone).formatToParts(new Date(ms));
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
// found leads are queued and ready when sending starts. Only agents created
// before discovery was anchored to their creation time still use this: they
// kept the hour their owner picked, and nothing may move it.
export const DEFAULT_AGENT_RUN_HOUR = 8;

// Tomorrow's occurrence of the wall-clock time an agent was created at, in the
// workspace's timezone. Agents no longer ask for an hour: an agent created at
// 4:16pm discovers immediately and then every day at 4:16pm local, which
// survives DST because the minute-of-day is re-resolved against the zone each
// time rather than by adding 24h to the last run.
export function nextAnchoredAgentRunAt(
  anchorAt: string,
  timezone: string | undefined,
  nowMs = Date.now(),
) {
  const anchorMs = Date.parse(anchorAt);
  if (!Number.isFinite(anchorMs)) {
    return new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
  }

  const anchor = zonedParts(timezone, anchorMs);
  const local = zonedParts(timezone, nowMs);

  for (let ahead = 0; ahead <= 2; ahead += 1) {
    const candidate = zonedTimeToUtc(timezone, {
      year: local.year,
      month: local.month,
      day: local.day + ahead,
      hour: anchor.hour,
      minute: anchor.minute,
    });
    if (candidate > nowMs) return new Date(candidate).toISOString();
  }

  return new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
}

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
  // The recipient's zone, which the send window is measured in. Omitted when
  // the lead's location doesn't resolve to one, in which case the window falls
  // back to the workspace zone below - the behaviour every action had before
  // send windows became recipient-local.
  timezone?: string;
};

export type SchedulePlanInput = {
  nowMs: number;
  // The workspace's zone: daily caps are counted on its calendar days, and it
  // is the fallback window zone for actions with no recipient zone of their own.
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

// The first time at or after `from` that clears every reserved slot by a full
// spacing interval. `taken` is sorted, so one forward scan resolves an entire
// contiguous ladder: stepping past reserved slots one per constraint pass made
// planning quadratic and, past the pass cap below, made it give up mid-ladder
// and return a colliding time.
function clearOfReservedSlots(taken: number[], from: number, spacingMs: number) {
  // Skip the reservations entirely behind the interval. `taken` grows to one
  // entry per planned action, and without this every pass rescans the whole
  // history to reach the handful of slots near the candidate.
  let low = 0;
  let high = taken.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (taken[mid] + spacingMs <= from) low = mid + 1;
    else high = mid;
  }

  let slot = from;
  for (let index = low; index < taken.length; index += 1) {
    // Sorted ascending and `slot` only moves forward, so the first reservation
    // that clears the interval guarantees every later one does too.
    if (taken[index] - slot >= spacingMs) break;
    if (taken[index] + spacingMs > slot) slot = taken[index] + spacingMs;
  }
  return slot;
}

// Keeps `taken` sorted without re-sorting the whole array per action.
function insertSorted(taken: number[], value: number) {
  let low = 0;
  let high = taken.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (taken[mid] < value) low = mid + 1;
    else high = mid;
  }
  taken.splice(low, 0, value);
}

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
    // The window is the recipient's; the quota day below stays the workspace's.
    const windowZone = action.timezone || input.timezone;

    let candidate = Math.max(action.earliestAt, input.nowMs);

    // Each pass fixes one constraint and re-checks the others, since snapping
    // into a window can push past a day boundary and vice versa. Each pass now
    // resolves a whole class of conflict rather than one slot, so a pass is a
    // calendar move (next opening bell, next day) and the bound is only ever
    // reached by a config that cannot be satisfied at all.
    let settled = false;
    for (let pass = 0; pass < MAX_PLAN_PASSES; pass += 1) {
      const inWindow = nextSendWindowOpen(input.window, windowZone, candidate);
      if (inWindow !== candidate) {
        candidate = inWindow;
        continue;
      }

      // Push clear of every reserved slot within one spacing interval.
      const cleared = clearOfReservedSlots(taken, candidate, spacingMs);
      if (cleared !== candidate) {
        candidate = cleared;
        continue;
      }

      const dayKey = zonedParts(input.timezone, candidate).dayKey;
      const dayUsed = used.get(dayKey) || { invites: 0, messages: 0 };
      if (dayUsed[quotaKind] >= limit) {
        candidate = nextLocalDayStart(input.timezone, candidate);
        continue;
      }

      used.set(dayKey, { ...dayUsed, [quotaKind]: dayUsed[quotaKind] + 1 });
      settled = true;
      break;
    }

    // Exhausting the passes means the returned time violates at least one
    // constraint. claimActionSlot still stops it becoming a real double-send,
    // but silence here is what turned a planning failure into the invisible
    // re-plan churn this planner exists to remove.
    if (!settled) {
      console.warn(
        `[send-schedule] gave up planning ${action.kind} ${action.id} after ${MAX_PLAN_PASSES} passes; ` +
          `slot ${new Date(candidate).toISOString()} may violate spacing or daily caps`,
      );
    }

    result.set(action.id, candidate);
    insertSorted(taken, candidate);
  }

  return result;
}
