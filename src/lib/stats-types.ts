// Payloads returned by /api/stats for stats.omentir.com.

export type StatsFilter = { key: string; value: string; label: string };

export type StatsComparison = { current: number; previous: number };

export type StatsOverviewData = {
  kpis: {
    visitors: StatsComparison;
    revenue: StatsComparison;
    /** People who paid in the period (conversion rate = customers / visitors). */
    customers: StatsComparison;
    bounceRate: StatsComparison;
    sessionSeconds: StatsComparison;
  };
  online: number;
  series: {
    bucket: string;
    visitors: number;
    newRevenue: number;
    renewalRevenue: number;
    customers: number;
  }[];
};

export type StatsBreakdownRow = {
  value: string;
  /** Display hint: the country code for location rows, otherwise the value. */
  label: string;
  visitors: number;
  signups: number;
  paid: number;
  revenue: number;
  clicks?: number;
};

export type StatsBreakdownData = { tabs: StatsBreakdownRow[][] };

export type StatsGoalsData = {
  totals: { event: string; people: number; completions: number }[];
  series: { event: string; bucket: string; people: number }[];
};

export type StatsAiData = {
  rows: { bucket: string; ai: string; kind: string; fetches: number }[];
};

export type StatsSection = "overview" | "sources" | "pages" | "location" | "tech" | "goals" | "ai";

export type StatsResponse<T> = {
  range: { from: string; to: string };
  interval: string;
  /** When PostHog was last queried for this answer. */
  updatedAt: string;
  data: T;
};

/** Stats refresh on 5-minute clock boundaries (server cache window and page timer). */
export const STATS_REFRESH_MS = 5 * 60_000;
