"use client";

import { useMemo, useState } from "react";
import type { StatsInterval } from "@/lib/stats-periods";
import type { McpListsData, McpOverviewData, StatsFilter } from "@/lib/stats-types";
import { ProductListCard } from "./product-view";
import { changeRatio, formatMs, formatNumber, formatPercent } from "./stats-format";
import { StatsLineChart } from "./stats-line-chart";

// The MCP analytics view of stats.omentir.com: what AI clients do through the
// Omentir MCP server. Same cards, chart and filters as the other views, fed by
// /api/stats?section=mcp*.

type Section<T> = { data?: T; loading: boolean; error?: string };

type Props = {
  overview: Section<McpOverviewData>;
  lists: Section<McpListsData>;
  buckets: string[];
  interval: StatsInterval;
  onFilter: (filter: StatsFilter) => void;
};

type ChartKey = "users" | "sessions" | "calls" | "errorRate" | "medianMs";
type Point = { users: number; sessions: number; calls: number; errors: number; medianMs: number };

const errorRate = (p: { errors: number; calls: number }) => (p.calls ? p.errors / p.calls : 0);

const METRICS: {
  key: ChartKey;
  label: string;
  color: string;
  /** Going up is bad. */
  invert?: boolean;
  value: (p: Point) => number;
  /** KPI text. */
  show: (n: number) => string;
  /** Chart values are plotted as-is, so rates are in percent there. */
  chart?: (p: Point) => number;
  format?: (n: number) => string;
}[] = [
  { key: "users", label: "Users", color: "var(--st-visitors)", value: (p) => p.users, show: formatNumber },
  { key: "sessions", label: "Sessions", color: "#86d0a0", value: (p) => p.sessions, show: formatNumber },
  { key: "calls", label: "Tool calls", color: "#c6a4ff", value: (p) => p.calls, show: formatNumber },
  {
    key: "errorRate",
    label: "Error rate",
    color: "#f29b82",
    invert: true,
    value: errorRate,
    show: formatPercent,
    chart: (p) => errorRate(p) * 100,
    format: (n) => formatPercent(n / 100),
  },
  { key: "medianMs", label: "Median time", color: "#f3c56c", invert: true, value: (p) => p.medianMs, show: formatMs, format: formatMs },
];

export function McpView({ overview, lists, buckets, interval, onFilter }: Props) {
  return (
    <>
      <McpMainCard overview={overview} buckets={buckets} interval={interval} />
      <div className="stats-grid">
        <ProductListCard title="Tools" tabs={lists.data?.tools} loading={lists.loading} error={lists.error} onFilter={onFilter} />
        <ProductListCard title="Clients" tabs={lists.data?.clients} loading={lists.loading} error={lists.error} onFilter={onFilter} />
        <ProductListCard title="Users" tabs={lists.data?.users} loading={lists.loading} error={lists.error} onFilter={onFilter} />
        <ProductListCard title="Requests" tabs={lists.data?.requests} loading={lists.loading} error={lists.error} />
      </div>
    </>
  );
}

function McpMainCard({ overview, buckets, interval }: Omit<Props, "lists" | "onFilter">) {
  const [metric, setMetric] = useState<ChartKey>("calls");
  const selected = METRICS.find((m) => m.key === metric)!;
  const kpis = overview.data?.kpis;
  const period = (side: "current" | "previous"): Point | undefined =>
    kpis && {
      users: kpis.users[side],
      sessions: kpis.sessions[side],
      calls: kpis.calls[side],
      errors: kpis.errors[side],
      medianMs: kpis.medianMs[side],
    };
  const current = period("current");
  const previous = period("previous");

  const values = useMemo(() => {
    const byBucket = new Map((overview.data?.series ?? []).map((row) => [row.bucket, row]));
    const plot = selected.chart ?? selected.value;
    return buckets.map((bucket) => {
      const row = byBucket.get(bucket);
      return row ? plot(row) : 0;
    });
  }, [overview.data, buckets, selected]);

  return (
    <section className={`stats-card${overview.loading ? " is-loading" : ""}`} aria-label="MCP overview">
      <div className="stats-card-body">
        <div className="stats-kpis">
          {METRICS.map((m) => {
            const change = current && previous ? changeRatio(m.value(current), m.value(previous)) : null;
            const good = change == null || change === 0 ? null : (change > 0) !== !!m.invert;
            return (
              <button
                key={m.key}
                type="button"
                className={`stats-kpi is-toggle${metric === m.key ? "" : " is-off"}`}
                aria-pressed={metric === m.key}
                title={`Show ${m.label.toLowerCase()} on the chart`}
                onClick={() => setMetric(m.key)}
              >
                <div className="stats-kpi-label">{m.label}</div>
                <div className="stats-kpi-value">{current ? m.show(m.value(current)) : "·"}</div>
                <div className={`stats-kpi-change${good == null ? "" : good ? " is-good" : " is-bad"}`}>
                  {change == null ? "" : `${Math.round(Math.abs(change) * 100)}% ${change >= 0 ? "↑" : "↓"}`}
                </div>
              </button>
            );
          })}
        </div>

        <div className="stats-chart">
          {overview.error ? (
            <div className="stats-empty stats-error" style={{ minHeight: 300 }}>{overview.error}</div>
          ) : overview.data ? (
            <StatsLineChart
              buckets={buckets}
              interval={interval}
              height={300}
              format={selected.format}
              series={[{ key: metric, label: selected.label, color: selected.color, values }]}
            />
          ) : (
            <div className="stats-empty" style={{ minHeight: 300 }} />
          )}
        </div>
      </div>
    </section>
  );
}
