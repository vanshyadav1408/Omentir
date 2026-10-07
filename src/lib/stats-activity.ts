// Pure outreach-activity math for the Product view on stats.omentir.com. The
// Firestore reads live in src/lib/server/stats/product.ts.
//
// activityDays holds one total per workspace per UTC day. It survives agent
// and lead deletes, but it is only rewritten when the customer opens their
// dashboard, so recent days can be missing or low. Timed hits (activityEvents
// rows and enrollment invite times) carry the exact moment and are always
// current. A day that sits wholly inside a window counts as the larger of the
// two, like listActivityDays in data.ts does for the customer dashboard. A day
// cut by a window edge (Last hour, Last 12 hours, the start of Last 24 hours)
// counts only the timed hits inside the window, because a day total cannot be
// split into hours.

export type ActivityMetric = "leadsFound" | "leadsContacted" | "replies" | "meetings";

export const ACTIVITY_METRICS: ActivityMetric[] = ["leadsFound", "leadsContacted", "replies", "meetings"];

export type ActivityDayTotal = {
  workspaceId: string;
  /** UTC calendar day, YYYY-MM-DD. */
  day: string;
  counts: Partial<Record<ActivityMetric, number>>;
};

export type ActivityHit = {
  workspaceId: string;
  metric: ActivityMetric;
  /** Epoch ms of the event. */
  at: number;
  /** When set, the same lead counts once per day for this metric, like contactedByDay in activity-overview.ts. */
  leadId?: string;
};

export type ActivityContribution = {
  workspaceId: string;
  metric: ActivityMetric;
  /** Epoch ms the count belongs to: the hit time, or the day start for a stored total's untimed remainder. */
  at: number;
  count: number;
};

const DAY = 86_400_000;
const dayOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Counts to add, given half-open [from, to) windows (the current period and the one before it). */
export function mergeActivity(
  totals: ActivityDayTotal[],
  hits: ActivityHit[],
  windows: Array<[number, number]>,
): ActivityContribution[] {
  const days = new Map<string, { workspaceId: string; day: string; total: ActivityDayTotal["counts"]; hits: ActivityHit[] }>();
  const entry = (workspaceId: string, day: string) => {
    const key = `${workspaceId}|${day}`;
    let value = days.get(key);
    if (!value) {
      value = { workspaceId, day, total: {}, hits: [] };
      days.set(key, value);
    }
    return value;
  };

  for (const t of totals) {
    const e = entry(t.workspaceId, t.day);
    for (const metric of ACTIVITY_METRICS) e.total[metric] = (e.total[metric] ?? 0) + (t.counts[metric] ?? 0);
  }
  const seenLeads = new Set<string>();
  for (const hit of hits) {
    if (!Number.isFinite(hit.at)) continue;
    const day = dayOf(hit.at);
    if (hit.leadId) {
      const key = `${hit.workspaceId}|${day}|${hit.metric}|${hit.leadId}`;
      if (seenLeads.has(key)) continue;
      seenLeads.add(key);
    }
    entry(hit.workspaceId, day).hits.push(hit);
  }

  const out: ActivityContribution[] = [];
  for (const { workspaceId, day, total, hits: dayHits } of days.values()) {
    const start = Date.parse(`${day}T00:00:00Z`);
    if (!Number.isFinite(start)) continue;
    // Every hit keeps its own time so the hourly chart is right.
    for (const h of dayHits) out.push({ workspaceId, metric: h.metric, at: h.at, count: 1 });
    const whole = windows.some(([from, to]) => start >= from && start + DAY <= to);
    if (!whole) continue;
    // Whatever the stored total has beyond the hits (deleted leads, days before
    // activityEvents existed) has no known time, so it sits at the day start.
    for (const metric of ACTIVITY_METRICS) {
      const extra = (total[metric] ?? 0) - dayHits.filter((h) => h.metric === metric).length;
      if (extra > 0) out.push({ workspaceId, metric, at: start, count: extra });
    }
  }
  return out;
}
