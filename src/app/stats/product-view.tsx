"use client";

import { useMemo, useState } from "react";
import type { StatsInterval } from "@/lib/stats-periods";
import type { ProductAppData, ProductListRow, ProductListTab, ProductOverviewData, StatsComparison } from "@/lib/stats-types";
import { changeRatio, formatCompact, formatNumber } from "./stats-format";
import { Glyph } from "./stats-icons";
import { StatsLineChart } from "./stats-line-chart";

// The Product analytics view of stats.omentir.com: what customers do inside
// Omentir. Same cards and chart as the Web view, fed by /api/stats?section=product*.

type Section<T> = { data?: T; loading: boolean; error?: string };

type Props = {
  overview: Section<ProductOverviewData>;
  app: Section<ProductAppData>;
  buckets: string[];
  interval: StatsInterval;
};

type MetricKey = "activeUsers" | "newUsers" | "agentsCreated" | "leadsFound" | "leadsContacted" | "replies";

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: "activeUsers", label: "Active users", color: "var(--st-visitors)" },
  { key: "newUsers", label: "New users", color: "#86d0a0" },
  { key: "agentsCreated", label: "Agents created", color: "#c6a4ff" },
  { key: "leadsFound", label: "Leads found", color: "#f3c56c" },
  { key: "leadsContacted", label: "Leads contacted", color: "#f29b82" },
  { key: "replies", label: "Replies", color: "#6ed2d2" },
];

export function ProductView({ overview, app, buckets, interval }: Props) {
  const merge = (a: ProductListTab[] | undefined, extra: ProductListTab[]) => (a ? [...a, ...extra] : undefined);
  const appTab = (label: string, unit: string, rows?: ProductListRow[]) => (rows ? [{ label, unit, rows }] : []);
  const both = { loading: overview.loading || app.loading, error: overview.error ?? app.error };

  return (
    <>
      <ProductMainCard overview={overview} app={app} buckets={buckets} interval={interval} />
      <div className="stats-grid">
        <ProductListCard title="Most active users" tabs={merge(overview.data?.users, appTab("App visits", "Views", app.data?.users))} {...both} />
        <ProductListCard title="Agents" tabs={overview.data?.agents} loading={overview.loading} error={overview.error} />
        <ProductListCard title="Outreach" tabs={overview.data?.outreach} loading={overview.loading} error={overview.error} />
        <ProductListCard title="New users" tabs={overview.data?.customers} loading={overview.loading} error={overview.error} />
        <ProductListCard
          title="App usage"
          tabs={app.data ? [...appTab("Pages", "Users", app.data.pages), ...appTab("Events", "Times", app.data.events)] : undefined}
          loading={app.loading}
          error={app.error}
        />
        <ProductListCard title="LinkedIn" tabs={overview.data?.linkedin} loading={overview.loading} error={overview.error} />
      </div>
    </>
  );
}

function ProductMainCard({ overview, app, buckets, interval }: Props) {
  const [metric, setMetric] = useState<MetricKey>("activeUsers");
  const kpi = (key: MetricKey): StatsComparison | undefined =>
    key === "activeUsers" ? app.data?.activeUsers : overview.data?.kpis[key];

  const values = useMemo(() => {
    const byBucket = new Map<string, number>();
    if (metric === "activeUsers") for (const row of app.data?.series ?? []) byBucket.set(row.bucket, row.activeUsers);
    else for (const row of overview.data?.series ?? []) byBucket.set(row.bucket, row[metric]);
    return buckets.map((bucket) => byBucket.get(bucket) ?? 0);
  }, [metric, app.data, overview.data, buckets]);

  const source = metric === "activeUsers" ? app : overview;
  const selected = METRICS.find((m) => m.key === metric)!;

  return (
    <section className={`stats-card${overview.loading || app.loading ? " is-loading" : ""}`} aria-label="Product overview">
      <div className="stats-card-body">
        <div className="stats-kpis">
          {METRICS.map((m) => {
            const value = kpi(m.key);
            const change = value ? changeRatio(value.current, value.previous) : null;
            const good = change == null || change === 0 ? null : change > 0;
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
                <div className="stats-kpi-value">{value ? formatNumber(value.current) : "·"}</div>
                <div className={`stats-kpi-change${good == null ? "" : good ? " is-good" : " is-bad"}`}>
                  {change == null ? "" : `${Math.round(Math.abs(change) * 100)}% ${change >= 0 ? "↑" : "↓"}`}
                </div>
              </button>
            );
          })}
          <div className="stats-kpi">
            <div className="stats-kpi-label">
              In the app now
              <span className="stats-live-dot" aria-hidden />
            </div>
            <div className="stats-kpi-value">{app.data ? formatNumber(app.data.activeNow) : "·"}</div>
            <div className="stats-kpi-change" />
          </div>
        </div>

        <div className="stats-chart">
          {source.error ? (
            <div className="stats-empty stats-error" style={{ minHeight: 300 }}>{source.error}</div>
          ) : source.data ? (
            <StatsLineChart buckets={buckets} interval={interval} height={300} series={[{ key: metric, label: selected.label, color: selected.color, values }]} />
          ) : (
            <div className="stats-empty" style={{ minHeight: 300 }} />
          )}
        </div>
      </div>
    </section>
  );
}

const VISIBLE = 10;

function ProductListCard({ title, tabs, loading, error }: { title: string; tabs?: ProductListTab[]; loading: boolean; error?: string }) {
  const [tab, setTab] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [details, setDetails] = useState(false);
  const active = tabs?.[Math.min(tab, tabs.length - 1)];
  const rows = active?.rows ?? [];
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <section className={`stats-card${loading ? " is-loading" : ""}`} aria-label={title}>
      <div className="stats-card-head">
        <div className="stats-tabs" role="tablist" aria-label={title}>
          {(tabs ?? [{ label: title, unit: "", rows: [] }]).map((t, i) => (
            <button key={t.label} type="button" role="tab" aria-selected={i === tab} onClick={() => { setTab(i); setHover(null); }}>
              {t.label}
            </button>
          ))}
        </div>
        {active && <span className="stats-sort" style={{ cursor: "default" }}>{active.unit}</span>}
      </div>

      <div className="stats-card-body">
        {error ? (
          <div className="stats-empty stats-error">{error}</div>
        ) : rows.length === 0 ? (
          <div className="stats-empty" style={{ minHeight: 336 }}>{loading && !tabs ? "" : "No data"}</div>
        ) : (
          <div className="stats-list" onMouseLeave={() => setHover(null)}>
            {rows.slice(0, VISIBLE).map((row, i) => (
              <div key={`${row.key}-${i}`} className="stats-row" onMouseEnter={() => setHover(i)}>
                <span className="stats-row-bar" style={{ width: `${(row.value / max) * 100}%` }} />
                <span className="stats-row-label" title={row.sub ? `${row.label} (${row.sub})` : row.label}>
                  <span>{row.label}</span>
                  {row.sub && <span className="stats-row-sub">{row.sub}</span>}
                </span>
                <span className="stats-row-value">{formatCompact(row.value)}</span>
                {hover === i && row.tip && (
                  <span className="stats-tooltip stats-row-tip" style={{ top: 32 }}>
                    <span className="stats-tooltip-title" style={{ display: "block" }}>{row.label}</span>
                    {row.tip.map(([label, value]) => (
                      <span key={label} className="stats-tooltip-row">
                        <span className="stats-tooltip-key">{label}</span>
                        <b>{formatNumber(value)}</b>
                      </span>
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {rows.length > 0 && active && (
        <div className="stats-card-foot">
          <button type="button" className="stats-details-btn" onClick={() => setDetails(true)}>
            {Glyph.expand}
            Details
          </button>
        </div>
      )}

      {details && active && <DetailsModal title={`${title}: ${active.label}`} tab={active} onClose={() => setDetails(false)} />}
    </section>
  );
}

function DetailsModal({ title, tab, onClose }: { title: string; tab: ProductListTab; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = tab.rows.filter((row) => `${row.label} ${row.sub ?? ""}`.toLowerCase().includes(needle));
  const columns = tab.rows[0]?.tip?.map(([label]) => label) ?? [tab.unit];
  return (
    <div className="stats-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="stats-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="stats-modal-head">
          <h2>{title}</h2>
          <input className="stats-search" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus />
          <button type="button" className="stats-icon-btn" onClick={onClose} aria-label="Close">{Glyph.close}</button>
        </div>
        <div className="stats-modal-body">
          <table className="stats-table">
            <thead>
              <tr>
                <th>{tab.label}</th>
                {columns.map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, i) => (
                <tr key={`${row.key}-${i}`}>
                  <td>
                    {row.label}
                    {row.sub && <span className="stats-row-sub"> {row.sub}</span>}
                  </td>
                  {(row.tip ?? [[tab.unit, row.value]]).map(([label, value]) => <td key={label}>{formatNumber(value)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
