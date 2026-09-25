import "server-only";

import type { StatsInterval } from "@/lib/stats-periods";
import type {
  StatsAiData,
  StatsBreakdownData,
  StatsBreakdownRow,
  StatsGoalsData,
  StatsOverviewData,
} from "@/lib/stats-types";
import { runHogQL, type StatsPropertyFilter } from "./posthog-query";
import {
  aiQuery,
  breakdownQuery,
  chartQuery,
  exitLinksQuery,
  goalSeriesQuery,
  goalTotalsQuery,
  kpiQuery,
  onlineQuery,
  type BreakdownCard,
} from "./queries";

type Range = { from: Date; to: Date };

const num = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};
const str = (value: unknown) => (value == null ? "" : String(value));

export async function loadOverview(range: Range, interval: StatsInterval, filters: StatsPropertyFilter[]): Promise<StatsOverviewData> {
  const [kpi, chart, online] = await Promise.all([
    runHogQL(kpiQuery(), range, filters),
    runHogQL(chartQuery(interval), range, filters),
    runHogQL(onlineQuery(), range, filters),
  ]);
  const [vc, vp, rc, rp, pc, pp, bc, bp, dc, dp] = (kpi.results[0] ?? []).map(num);
  return {
    kpis: {
      visitors: { current: vc ?? 0, previous: vp ?? 0 },
      revenue: { current: rc ?? 0, previous: rp ?? 0 },
      customers: { current: pc ?? 0, previous: pp ?? 0 },
      bounceRate: { current: bc ?? 0, previous: bp ?? 0 },
      sessionSeconds: { current: dc ?? 0, previous: dp ?? 0 },
    },
    online: num(online.results[0]?.[0]),
    series: chart.results.map((row) => ({
      bucket: str(row[0]),
      visitors: num(row[1]),
      newRevenue: num(row[2]),
      renewalRevenue: num(row[3]),
      customers: num(row[4]),
    })),
  };
}

export async function loadBreakdown(
  card: BreakdownCard,
  range: Range,
  filters: StatsPropertyFilter[],
): Promise<StatsBreakdownData> {
  const [rows, exits] = await Promise.all([
    runHogQL(breakdownQuery(card), range, filters),
    card === "pages" ? runHogQL(exitLinksQuery(), range, filters) : Promise.resolve(null),
  ]);
  const tabs: StatsBreakdownRow[][] = [[], [], []];
  for (const row of rows.results) {
    const tab = num(row[0]);
    tabs[tab]?.push({
      value: str(row[1]),
      label: str(row[2]),
      visitors: num(row[3]),
      signups: num(row[4]),
      paid: num(row[5]),
      revenue: num(row[6]),
    });
  }
  if (exits) {
    tabs.push(
      exits.results.map((row) => ({
        value: str(row[0]),
        label: str(row[0]),
        visitors: num(row[1]),
        signups: 0,
        paid: 0,
        revenue: 0,
        clicks: num(row[2]),
      })),
    );
  }
  return { tabs };
}

export async function loadGoals(range: Range, interval: StatsInterval, filters: StatsPropertyFilter[]): Promise<StatsGoalsData> {
  const [totals, series] = await Promise.all([
    runHogQL(goalTotalsQuery(), range, filters),
    runHogQL(goalSeriesQuery(interval), range, filters),
  ]);
  return {
    totals: totals.results.map((row) => ({ event: str(row[0]), people: num(row[1]), completions: num(row[2]) })),
    series: series.results.map((row) => ({ event: str(row[0]), bucket: str(row[1]), people: num(row[2]) })),
  };
}

export async function loadAi(range: Range, interval: StatsInterval, filters: StatsPropertyFilter[]): Promise<StatsAiData> {
  const result = await runHogQL(aiQuery(interval), range, filters);
  return {
    rows: result.results.map((row) => ({
      bucket: str(row[0]),
      ai: str(row[1]),
      kind: str(row[2]),
      fetches: num(row[3]),
    })),
  };
}
