import type { Agent } from "./types";
import { zonedParts } from "./send-schedule";

export const STUCK_AGENT_RUN_MS = 30 * 60 * 1000;

// nextLocalAgentRunAt and DEFAULT_AGENT_RUN_HOUR live in send-schedule.ts,
// alongside the timezone primitives they are built from.

export function nextDailyAgentRunAt(nextRunAt: string | undefined, nowMs = Date.now()) {
  const nextRunDate = new Date(nextRunAt || nowMs);

  while (nextRunDate.getTime() <= nowMs) {
    nextRunDate.setUTCDate(nextRunDate.getUTCDate() + 1);
  }

  return nextRunDate.toISOString();
}

export function isAgentDueForRun(
  agent: Pick<Agent, "status" | "nextRunAt" | "runStartedAt" | "updatedAt">,
  nowMs = Date.now(),
) {
  const now = new Date(nowMs).toISOString();
  const stuckBefore = new Date(nowMs - STUCK_AGENT_RUN_MS).toISOString();

  return agent.status === "running"
    ? (agent.runStartedAt || agent.updatedAt) <= stuckBefore
    : agent.nextRunAt <= now;
}

export function hasIntervalElapsed(
  lastSentAt: number,
  intervalMs: number,
  nowMs = Date.now(),
) {
  return !lastSentAt || nowMs - lastSentAt >= intervalMs;
}

// Local calendar day (YYYY-MM-DD) and hour-of-day for a workspace's IANA
// timezone - drives local-time features like the daily digest send hour. An unset
// or invalid timezone falls back to UTC so a bad value degrades to "wrong
// hour" rather than "never sends". Same clock as send windows (zonedParts).
export function localDayAndHour(timezone: string | undefined, nowMs = Date.now()) {
  const parts = zonedParts(timezone, nowMs);
  // Intl can report midnight as 24 under hourCycle h23. Fold that onto 0 so a
  // midnight digest is not skipped.
  const hour = Number(parts.hour);
  return {
    day: parts.dayKey,
    hour: Number.isFinite(hour) ? ((hour % 24) + 24) % 24 : hour,
  };
}

export const INVITE_LIMIT_FIRST_RETRY_MS = 6 * 60 * 60 * 1000;
export const INVITE_LIMIT_SECOND_RETRY_MS = 3 * 24 * 60 * 60 * 1000;

// First account-wide invite pause waits 6 hours. A failed retry after that
// waits until 3 days or next local Monday 9am, whichever comes first, so a
// real weekly cap is not probed every few hours and a mid-week lift is not
// left sitting until the following Monday.
export function nextInviteLimitRetryAt(input: {
  previousStage?: number;
  timezone?: string;
  nowMs?: number;
}) {
  const nowMs = input.nowMs ?? Date.now();
  const previousStage = input.previousStage ?? 0;
  if (previousStage < 1) {
    return {
      until: new Date(nowMs + INVITE_LIMIT_FIRST_RETRY_MS).toISOString(),
      stage: 1,
    };
  }
  const inThreeDays = nowMs + INVITE_LIMIT_SECOND_RETRY_MS;
  const nextMonday = Date.parse(nextLocalMondayAt(input.timezone, nowMs));
  return {
    until: new Date(Math.min(inThreeDays, nextMonday)).toISOString(),
    stage: 2,
  };
}

// LinkedIn's weekly invitation limit is retried at the start of the next
// workweek, rather than repeatedly probing the restricted account. Monday at
// 9am is interpreted in the workspace timezone, including DST transitions.
// If it is already Monday and 9am has not arrived, that is the next Monday.
export function nextLocalMondayAt(timezone: string | undefined, nowMs = Date.now()) {
  let timeZone = timezone || "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date(nowMs));
  } catch {
    timeZone = "UTC";
  }

  const partsAt = (timestamp: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(timestamp));
    const get = (type: Intl.DateTimeFormatPart["type"]) =>
      parts.find((part) => part.type === type)?.value || "";
    return {
      year: Number(get("year")),
      month: Number(get("month")),
      day: Number(get("day")),
      weekday: get("weekday"),
      hour: Number(get("hour")),
      minute: Number(get("minute")),
      second: Number(get("second")),
    };
  };

  const localNow = partsAt(nowMs);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    localNow.weekday,
  );
  let daysUntilMonday = (8 - weekday) % 7;
  if (daysUntilMonday === 0) {
    const alreadyPastNine =
      localNow.hour > 9 || (localNow.hour === 9 && (localNow.minute > 0 || localNow.second > 0));
    daysUntilMonday = alreadyPastNine ? 7 : 0;
  }
  const targetLocalMs = Date.UTC(
    localNow.year,
    localNow.month - 1,
    localNow.day + daysUntilMonday,
    9,
  );

  // Convert the target wall-clock time to UTC. Recalculate once at the
  // candidate instant so a DST boundary between now and Monday is respected.
  const utcForLocal = (guess: number) => {
    const local = partsAt(guess);
    const offset =
      Date.UTC(
        local.year,
        local.month - 1,
        local.day,
        local.hour,
        local.minute,
        local.second,
      ) - guess;
    return targetLocalMs - offset;
  };
  const firstCandidate = utcForLocal(targetLocalMs);
  return new Date(utcForLocal(firstCandidate)).toISOString();
}
