// Shared, client-safe time formatting. Every timestamp the app stores is an
// ISO/UTC instant; every timestamp the app *shows* is rendered in the
// workspace's IANA timezone so the UI agrees with the scheduler (which already
// counts quotas and send windows in that zone - see lib/server/send-schedule.ts).
// Formatting through the browser's own zone would show a different day and hour
// to a user travelling or working away from their workspace's zone.

export const DEFAULT_TIME_ZONE = "UTC";

export function isValidTimeZone(timeZone: string | undefined): timeZone is string {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

/** A stored zone that is empty or no longer a real IANA name degrades to UTC. */
export function resolveTimeZone(timeZone: string | undefined) {
  return isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
}

/** The zone the browser is actually in; "" when unavailable (or on the server). */
export function detectTimeZone() {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimeZone(detected) ? detected : "";
  } catch {
    return "";
  }
}

type DateInput = string | number | Date | undefined | null;

function toDate(value: DateInput) {
  if (value === undefined || value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatZonedDate(
  value: DateInput,
  timeZone: string | undefined,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
  fallback = "",
) {
  const date = toDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en-US", { timeZone: resolveTimeZone(timeZone), ...options }).format(
    date,
  );
}

export function formatZonedTime(value: DateInput, timeZone: string | undefined, fallback = "") {
  return formatZonedDate(value, timeZone, { hour: "numeric", minute: "2-digit" }, fallback);
}

export function formatZonedDateTime(value: DateInput, timeZone: string | undefined, fallback = "") {
  const date = formatZonedDate(value, timeZone, { month: "short", day: "numeric", year: "numeric" });
  if (!date) return fallback;
  return `${date} · ${formatZonedTime(value, timeZone)}`;
}

/**
 * Calendar day (YYYY-MM-DD) in the given zone. Day grouping - message
 * separators, CSV date columns - has to key on this rather than on
 * Date#toDateString (browser zone) or toISOString (UTC), or a message sent at
 * 11pm local lands under the wrong heading.
 */
export function zonedDayKey(value: DateInput, timeZone: string | undefined) {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** "GMT+5:30" - appended where a bare clock time would otherwise be ambiguous. */
export function timeZoneOffsetLabel(timeZone: string | undefined, at: DateInput = new Date()) {
  const date = toDate(at) || new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolveTimeZone(timeZone),
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  return parts.find((part) => part.type === "timeZoneName")?.value || "GMT";
}

/** "Kolkata" out of "Asia/Kolkata"; "UTC" stays "UTC". */
export function timeZoneCityLabel(timeZone: string | undefined) {
  const zone = resolveTimeZone(timeZone);
  return zone.split("/").at(-1)?.replaceAll("_", " ") || zone;
}
