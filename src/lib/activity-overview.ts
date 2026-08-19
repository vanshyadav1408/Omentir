/**
 * Activity Overview chart data: pure builders and merge helpers.
 *
 * Historical totals must outlive agent/group deletion. Live leads/enrollments
 * rebuild "what still exists"; durable activityDays hold "what already happened".
 * Merging with max() per day never shrinks the graph when rows are deleted.
 */

export type ActivityDayTotals = {
  dateKey: string;
  found: number;
  contacted: number;
  replies: number;
  meetingsBooked: number;
};

export type ActivityChartPoint = ActivityDayTotals & {
  date: string;
};

import { conversationHasMeetingBooked } from "@/lib/conversation-category";

type LeadLike = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  outreachStatus?: string | null;
};

type EnrollmentLike = {
  leadId: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  connectionSentAt?: string;
};

type ConversationLike = {
  messages?: Array<{ direction?: string; createdAt?: string }>;
  replyIntent?: string;
  replyIntentAt?: string;
  replyIntentConfidence?: number;
  meetingBookedAt?: string;
};

const CONTACTED_ENROLLMENT_STATUSES = new Set([
  "connection_sent",
  "connected",
  "message_sent",
  "reply_received",
  "replied",
]);

const CONTACTED_LEAD_STATUSES = new Set([
  "invited",
  "connected",
  "messaged",
  "replied",
]);

/** Stable calendar day key (UTC) so server snapshots and the client chart agree. */
export function toActivityDayKey(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function keyFromUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDaysUtc(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function formatDateLabel(key: string) {
  return dateFromKey(key).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function addCount(counts: Map<string, number>, key: string | null) {
  if (!key) return;
  counts.set(key, (counts.get(key) || 0) + 1);
}

function addLeadToDay(map: Map<string, Set<string>>, key: string | null, leadId: string) {
  if (!key || !leadId) return;
  const leads = map.get(key) || new Set<string>();
  leads.add(leadId);
  map.set(key, leads);
}

/** Aggregate live CRM rows into per-day activity totals. */
export function buildActivityTotalsFromLive(input: {
  leads: LeadLike[];
  enrollments: EnrollmentLike[];
  conversations: ConversationLike[];
}): ActivityDayTotals[] {
  const foundCounts = new Map<string, number>();
  const contactedByDay = new Map<string, Set<string>>();
  const repliesCounts = new Map<string, number>();
  const meetingsBookedCounts = new Map<string, number>();
  const contactedFromEnrollments = new Set<string>();

  for (const lead of input.leads) {
    addCount(foundCounts, toActivityDayKey(lead.createdAt));
  }

  for (const enrollment of input.enrollments) {
    const sentAt = enrollment.connectionSentAt;
    const wasContacted =
      CONTACTED_ENROLLMENT_STATUSES.has(enrollment.status) || Boolean(sentAt);
    if (!wasContacted) continue;
    contactedFromEnrollments.add(enrollment.leadId);
    addLeadToDay(
      contactedByDay,
      toActivityDayKey(sentAt || enrollment.createdAt),
      enrollment.leadId,
    );
  }

  for (const lead of input.leads) {
    if (contactedFromEnrollments.has(lead.id)) continue;
    if (!CONTACTED_LEAD_STATUSES.has(lead.outreachStatus || "")) continue;
    addLeadToDay(
      contactedByDay,
      toActivityDayKey(lead.updatedAt || lead.createdAt),
      lead.id,
    );
  }

  for (const conversation of input.conversations) {
    for (const message of conversation.messages || []) {
      if (message.direction !== "inbound") continue;
      addCount(repliesCounts, toActivityDayKey(message.createdAt));
    }
    const meetingBookedAt = conversationHasMeetingBooked(conversation)
      ? conversation.meetingBookedAt || conversation.replyIntentAt
      : undefined;
    addCount(meetingsBookedCounts, toActivityDayKey(meetingBookedAt));
  }

  const activityKeys = new Set<string>([
    ...foundCounts.keys(),
    ...contactedByDay.keys(),
    ...repliesCounts.keys(),
    ...meetingsBookedCounts.keys(),
  ]);

  return [...activityKeys]
    .sort()
    .map((dateKey) => ({
      dateKey,
      found: foundCounts.get(dateKey) || 0,
      contacted: contactedByDay.get(dateKey)?.size || 0,
      replies: repliesCounts.get(dateKey) || 0,
      meetingsBooked: meetingsBookedCounts.get(dateKey) || 0,
    }));
}

/** Per-metric max so durable history never shrinks when live rows are deleted. */
export function mergeActivityTotals(
  ...series: ActivityDayTotals[][]
): ActivityDayTotals[] {
  const byDay = new Map<string, ActivityDayTotals>();

  for (const points of series) {
    for (const point of points) {
      if (!point.dateKey) continue;
      const existing = byDay.get(point.dateKey);
      if (!existing) {
        byDay.set(point.dateKey, {
          dateKey: point.dateKey,
          found: Math.max(0, point.found || 0),
          contacted: Math.max(0, point.contacted || 0),
          replies: Math.max(0, point.replies || 0),
          meetingsBooked: Math.max(0, point.meetingsBooked || 0),
        });
        continue;
      }
      byDay.set(point.dateKey, {
        dateKey: point.dateKey,
        found: Math.max(existing.found, point.found || 0),
        contacted: Math.max(existing.contacted, point.contacted || 0),
        replies: Math.max(existing.replies, point.replies || 0),
        meetingsBooked: Math.max(existing.meetingsBooked, point.meetingsBooked || 0),
      });
    }
  }

  return [...byDay.values()].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

/** Fill missing calendar days between the earliest and latest activity (up to 11 days span for the chart). */
export function toActivityChartPoints(
  totals: ActivityDayTotals[],
  options?: {
    maxDays?: number;
    startDateKey?: string;
    endDateKey?: string;
  },
): ActivityChartPoint[] {
  if (!totals.length) return [];

  const maxDays = Math.max(1, options?.maxDays ?? 11);
  const sorted = [...totals].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const startBoundary = options?.startDateKey
    ? dateFromKey(options.startDateKey)
    : undefined;
  const endBoundary = options?.endDateKey ? dateFromKey(options.endDateKey) : undefined;
  const bounded = sorted.filter((point) => {
    if (options?.startDateKey && point.dateKey < options.startDateKey) return false;
    if (options?.endDateKey && point.dateKey > options.endDateKey) return false;
    return true;
  });
  if (!bounded.length) return [];

  const byDay = new Map(bounded.map((point) => [point.dateKey, point]));
  const earliestActivity = dateFromKey(bounded[0].dateKey);
  const latestActivity = dateFromKey(bounded[bounded.length - 1].dateKey);
  const latest = endBoundary &&
      endBoundary.getTime() > latestActivity.getTime()
    ? endBoundary
    : latestActivity;
  const start = new Date(
    Math.max(
      startBoundary?.getTime() ?? earliestActivity.getTime(),
      addDaysUtc(latest, -(maxDays - 1)).getTime(),
    ),
  );
  const points: ActivityChartPoint[] = [];

  for (let cursor = start; cursor <= latest; cursor = addDaysUtc(cursor, 1)) {
    const dateKey = keyFromUtcDate(cursor);
    const totalsForDay = byDay.get(dateKey);
    points.push({
      dateKey,
      date: formatDateLabel(dateKey),
      found: totalsForDay?.found || 0,
      contacted: totalsForDay?.contacted || 0,
      replies: totalsForDay?.replies || 0,
      meetingsBooked: totalsForDay?.meetingsBooked || 0,
    });
  }

  return points;
}
