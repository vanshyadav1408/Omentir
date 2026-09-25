import "server-only";

import { payerKey, revenueByBucket, sumPayments, type LinkedPayment, type StatsPayment } from "@/lib/stats-money";
import { bucketKey, type StatsInterval } from "@/lib/stats-periods";
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
  payerFirstTouchQuery,
  payersMatchingFiltersQuery,
  personMapQuery,
  type BreakdownCard,
} from "./queries";
import { loadWhopPayments } from "./whop-payments";

type Range = { from: Date; to: Date };

const num = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};
const str = (value: unknown) => (value == null ? "" : String(value));
// Person ids come back from PostHog and are pasted into the next query.
const PERSON_ID = /^[0-9a-f-]{36}$/i;

let linkCache: { payments: StatsPayment[]; linked: Promise<LinkedPayment[]> } | null = null;

/** Every Whop payment with its payer's PostHog person, looked up once per Whop listing. */
function linkedPayments(range: Range): Promise<LinkedPayment[]> {
  return loadWhopPayments().then((payments) => {
    if (linkCache?.payments === payments) return linkCache.linked;
    const linked = linkPayments(payments, range);
    linkCache = { payments, linked };
    linked.catch(() => {
      if (linkCache?.linked === linked) linkCache = null;
    });
    return linked;
  });
}

async function linkPayments(payments: StatsPayment[], range: Range): Promise<LinkedPayment[]> {
  const ids = [...new Set(payments.flatMap((p) => p.distinctIds))];
  const people = new Map<string, string>();
  if (ids.length) {
    // personMapQuery looks back 400 days from now and ignores the range.
    const map = await runHogQL(personMapQuery(ids), range);
    for (const row of map.results) {
      const person = str(row[1]);
      if (PERSON_ID.test(person)) people.set(str(row[0]), person);
    }
  }
  return payments.map((payment) => ({
    payment,
    personId: payment.distinctIds.map((id) => people.get(id)).find(Boolean) ?? null,
  }));
}

/**
 * Whop payments paid in [fromMs, range.to), each linked to the payer's PostHog
 * person. With filters active, only payers whose visits match count.
 */
async function paymentsInScope(range: Range, fromMs: number, filters: StatsPropertyFilter[]): Promise<LinkedPayment[]> {
  const linked = (await linkedPayments(range)).filter((l) => l.payment.at >= fromMs && l.payment.at < range.to.getTime());
  if (!filters.length) return linked;
  const persons = [...new Set(linked.map((l) => l.personId).filter((p): p is string => !!p))];
  if (!persons.length) return [];
  const matching = await runHogQL(payersMatchingFiltersQuery(persons), range, filters);
  const allowed = new Set(matching.results.map((row) => str(row[0])));
  return linked.filter((l) => l.personId && allowed.has(l.personId));
}

export async function loadOverview(range: Range, interval: StatsInterval, filters: StatsPropertyFilter[]): Promise<StatsOverviewData> {
  const fromMs = range.from.getTime();
  const previousFrom = fromMs - (range.to.getTime() - fromMs);
  const [kpi, chart, online, money] = await Promise.all([
    runHogQL(kpiQuery(), range, filters),
    runHogQL(chartQuery(interval), range, filters),
    runHogQL(onlineQuery(), range, filters),
    paymentsInScope(range, previousFrom, filters),
  ]);
  const [vc, vp, bc, bp, dc, dp] = (kpi.results[0] ?? []).map(num);
  const current = money.filter((l) => l.payment.at >= fromMs);
  const previous = money.filter((l) => l.payment.at < fromMs);
  const now = sumPayments(current);
  const before = sumPayments(previous);
  const revenue = revenueByBucket(current, interval);
  const visitors = new Map(chart.results.map((row) => [str(row[0]), num(row[1])]));
  const buckets = [...new Set([...visitors.keys(), ...revenue.keys()])].sort();
  return {
    kpis: {
      visitors: { current: vc ?? 0, previous: vp ?? 0 },
      revenue: { current: now.usd, previous: before.usd },
      customers: { current: now.customers, previous: before.customers },
      bounceRate: { current: bc ?? 0, previous: bp ?? 0 },
      sessionSeconds: { current: dc ?? 0, previous: dp ?? 0 },
    },
    online: num(online.results[0]?.[0]),
    series: buckets.map((bucket) => ({
      bucket,
      visitors: visitors.get(bucket) ?? 0,
      newRevenue: revenue.get(bucket)?.newRevenue ?? 0,
      renewalRevenue: revenue.get(bucket)?.renewalRevenue ?? 0,
      customers: revenue.get(bucket)?.payers.size ?? 0,
    })),
  };
}

export async function loadBreakdown(
  card: BreakdownCard,
  range: Range,
  filters: StatsPropertyFilter[],
): Promise<StatsBreakdownData> {
  const [rows, exits, money] = await Promise.all([
    runHogQL(breakdownQuery(card), range, filters),
    card === "pages" ? runHogQL(exitLinksQuery(), range, filters) : Promise.resolve(null),
    paymentsInScope(range, range.from.getTime(), filters),
  ]);
  const tabs: StatsBreakdownRow[][] = [[], [], []];
  for (const row of rows.results) {
    tabs[num(row[0])]?.push({
      value: str(row[1]),
      label: str(row[2]),
      visitors: num(row[3]),
      signups: num(row[4]),
      paid: 0,
      revenue: 0,
    });
  }

  // Credit each payment to where the payer first came from (90-day lookback).
  const persons = [...new Set(money.map((l) => l.personId).filter((p): p is string => !!p))];
  if (persons.length) {
    const firstTouch = await runHogQL(payerFirstTouchQuery(card, persons), range, filters);
    const touch = new Map(firstTouch.results.map((row) => [str(row[0]), (row[1] as unknown[]).map(str)]));
    tabs.forEach((tab, i) => {
      const credit = new Map<string, { label: string; usd: number; payers: Set<string> }>();
      for (const { payment, personId } of money) {
        const dims = personId ? touch.get(personId) : undefined;
        const value = dims?.[2 * i];
        if (!value) continue;
        const entry = credit.get(value) ?? { label: dims[2 * i + 1] ?? value, usd: 0, payers: new Set<string>() };
        entry.usd += payment.usd;
        entry.payers.add(payerKey(payment, personId));
        credit.set(value, entry);
      }
      for (const [value, entry] of credit) {
        const row = tab.find((r) => r.value === value);
        const usd = Math.round(entry.usd * 100) / 100;
        if (row) {
          row.revenue = usd;
          row.paid = entry.payers.size;
        } else {
          tab.push({ value, label: entry.label, visitors: 0, signups: 0, paid: entry.payers.size, revenue: usd });
        }
      }
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
  const filtered = filters.length > 0;
  const [totals, series, money] = await Promise.all([
    runHogQL(goalTotalsQuery(filtered), range, filters),
    runHogQL(goalSeriesQuery(interval, filtered), range, filters),
    paymentsInScope(range, range.from.getTime(), filters),
  ]);
  const goals: StatsGoalsData = {
    totals: totals.results.map((row) => ({ event: str(row[0]), people: num(row[1]), completions: num(row[2]) })),
    series: series.results.map((row) => ({ event: str(row[0]), bucket: str(row[1]), people: num(row[2]) })),
  };
  // "Paid" comes from Whop, the same payments as the revenue numbers.
  if (money.length) {
    const paid = sumPayments(money);
    goals.totals.push({ event: "payment_succeeded", people: paid.customers, completions: paid.count });
    const perBucket = new Map<string, Set<string>>();
    for (const { payment, personId } of money) {
      const key = bucketKey(payment.at, interval);
      perBucket.set(key, (perBucket.get(key) ?? new Set()).add(payerKey(payment, personId)));
    }
    for (const [bucket, payers] of perBucket) goals.series.push({ event: "payment_succeeded", bucket, people: payers.size });
    goals.totals.sort((a, b) => b.people - a.people);
  }
  return goals;
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
