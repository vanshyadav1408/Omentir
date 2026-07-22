import type { Agent } from "./types";

export const STUCK_AGENT_RUN_MS = 30 * 60 * 1000;

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
// timezone - drives local-time features like the 9am daily digest. An unset
// or invalid timezone falls back to UTC so a bad value degrades to "wrong
// hour" rather than "never sends".
export function localDayAndHour(timezone: string | undefined, nowMs = Date.now()) {
  const format = (timeZone: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(nowMs));

  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = format(timezone || "UTC");
  } catch {
    parts = format("UTC");
  }

  const get = (type: Intl.DateTimeFormatPart["type"]) =>
    parts.find((part) => part.type === type)?.value || "";
  return {
    day: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
}

// LinkedIn's weekly invitation limit is retried at the start of the next
// workweek, rather than repeatedly probing the restricted account. Monday at
// 9am is interpreted in the workspace timezone, including DST transitions.
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
  const daysUntilMonday = (8 - weekday) % 7 || 7;
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
