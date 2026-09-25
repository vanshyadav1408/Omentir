"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { StatsBreakdownData, StatsBreakdownRow, StatsFilter } from "@/lib/stats-types";
import { formatCompact, formatMoney, formatMoneyCompact, formatNumber, formatPercent } from "./stats-format";
import { Glyph } from "./stats-icons";

export type BreakdownTab = {
  label: string;
  /** Filter key set when a row is clicked; null for rows that only link out. */
  filterKey: string | null;
  filterLabel: string;
  icon?: (row: StatsBreakdownRow) => ReactNode;
  display?: (row: StatsBreakdownRow) => string;
  /** Rows open this URL instead of filtering (exit links). */
  href?: (row: StatsBreakdownRow) => string;
};

type Props = {
  title: string;
  tabs: BreakdownTab[];
  data?: StatsBreakdownData;
  loading: boolean;
  error?: string;
  onFilter: (filter: StatsFilter) => void;
};

const VISIBLE = 10;

export function StatsBreakdownCard({ title, tabs, data, loading, error, onFilter }: Props) {
  const [tab, setTab] = useState(0);
  const [metric, setMetric] = useState<"visitors" | "revenue">("visitors");
  const [hover, setHover] = useState<number | null>(null);
  const [details, setDetails] = useState(false);
  const active = tabs[tab];

  const rows = useMemo(() => {
    const list = [...(data?.tabs[tab] ?? [])];
    list.sort((a, b) => (metric === "revenue" ? b.revenue - a.revenue || b.visitors - a.visitors : b.visitors - a.visitors));
    return list;
  }, [data, tab, metric]);

  const maxVisitors = Math.max(1, ...rows.map((r) => r.visitors));
  const maxRevenue = Math.max(0, ...rows.map((r) => r.revenue));
  const isExit = !!active.href;

  const activate = (row: StatsBreakdownRow) => {
    if (active.href) {
      window.open(active.href(row), "_blank", "noopener,noreferrer");
      return;
    }
    if (!active.filterKey) return;
    onFilter({ key: active.filterKey, value: row.value, label: `${active.filterLabel} is ${active.display?.(row) ?? row.value}` });
  };

  return (
    <section className={`stats-card${loading ? " is-loading" : ""}`} aria-label={title}>
      <div className="stats-card-head">
        <div className="stats-tabs" role="tablist" aria-label={title}>
          {tabs.map((t, i) => (
            <button key={t.label} type="button" role="tab" aria-selected={i === tab} onClick={() => { setTab(i); setHover(null); }}>
              {t.label}
            </button>
          ))}
        </div>
        {!isExit && (
          <button
            type="button"
            className="stats-sort"
            onClick={() => setMetric((m) => (m === "visitors" ? "revenue" : "visitors"))}
            title="Sort by visitors or revenue"
          >
            {metric === "visitors" ? "Visitors" : "Revenue"}
            {Glyph.sort}
          </button>
        )}
        {isExit && <span className="stats-sort" style={{ cursor: "default" }}>Visitors</span>}
      </div>

      <div className="stats-card-body">
        {error ? (
          <div className="stats-empty stats-error">{error}</div>
        ) : rows.length === 0 ? (
          <div className="stats-empty" style={{ minHeight: 336 }}>{loading ? "" : "No data"}</div>
        ) : (
          <div className="stats-list" onMouseLeave={() => setHover(null)}>
            {rows.slice(0, VISIBLE).map((row, i) => (
              <button
                key={`${row.value}-${i}`}
                type="button"
                className="stats-row"
                onMouseEnter={() => setHover(i)}
                onClick={() => activate(row)}
                title={isExit ? row.value : undefined}
              >
                <span className="stats-row-bar" style={{ width: `${(row.visitors / maxVisitors) * 100}%` }} />
                {maxRevenue > 0 && row.revenue > 0 && (
                  <span className="stats-row-rev" style={{ width: `${Math.max(1.5, (row.revenue / maxRevenue) * 100)}%` }} />
                )}
                <span className="stats-row-label">
                  {active.icon?.(row)}
                  <span>{active.display?.(row) ?? row.value}</span>
                  {!isExit && active.filterKey && <span className="stats-row-filter">{Glyph.filter}</span>}
                </span>
                <span className="stats-row-value">
                  {metric === "revenue" && !isExit ? formatMoneyCompact(row.revenue) : formatCompact(row.visitors)}
                </span>
                {hover === i && (
                  <span className="stats-tooltip stats-row-tip" style={{ top: 32 }}>
                    <span className="stats-tooltip-title" style={{ display: "block" }}>{active.display?.(row) ?? row.value}</span>
                    <TipRow label="Visitors" value={formatNumber(row.visitors)} color="#9a9a9a" />
                    {isExit ? (
                      <TipRow label="Clicks" value={formatNumber(row.clicks ?? 0)} />
                    ) : (
                      <>
                        <TipRow label="Revenue" value={formatMoney(row.revenue)} color="var(--st-bar-revenue)" />
                        <TipRow label="Signups" value={formatNumber(row.signups)} />
                        <TipRow label="Paid" value={formatNumber(row.paid)} />
                        <TipRow label="Conversion rate" value={formatPercent(row.visitors ? row.paid / row.visitors : 0)} />
                      </>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="stats-card-foot">
          <button type="button" className="stats-details-btn" onClick={() => setDetails(true)}>
            {Glyph.expand}
            Details
          </button>
        </div>
      )}

      {details && (
        <DetailsModal title={`${title}: ${active.label}`} rows={rows} tab={active} onClose={() => setDetails(false)} onActivate={(row) => { setDetails(false); activate(row); }} />
      )}
    </section>
  );
}

function TipRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span className="stats-tooltip-row">
      <span className="stats-tooltip-key">
        {color && <i style={{ background: color }} />}
        {label}
      </span>
      <b>{value}</b>
    </span>
  );
}

function DetailsModal({
  title,
  rows,
  tab,
  onClose,
  onActivate,
}: {
  title: string;
  rows: StatsBreakdownRow[];
  tab: BreakdownTab;
  onClose: () => void;
  onActivate: (row: StatsBreakdownRow) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = rows.filter((row) => (tab.display?.(row) ?? row.value).toLowerCase().includes(query.trim().toLowerCase()));
  const exit = !!tab.href;
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
                <th>Visitors</th>
                {exit ? <th>Clicks</th> : (<><th>Signups</th><th>Paid</th><th>Revenue</th><th>Conv. rate</th></>)}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, i) => (
                <tr key={`${row.value}-${i}`} className="is-clickable" onClick={() => onActivate(row)}>
                  <td>
                    <span className="stats-row-label" style={{ display: "inline-flex" }}>
                      {tab.icon?.(row)}
                      <span>{tab.display?.(row) ?? row.value}</span>
                    </span>
                  </td>
                  <td>{formatNumber(row.visitors)}</td>
                  {exit ? (
                    <td>{formatNumber(row.clicks ?? 0)}</td>
                  ) : (
                    <>
                      <td>{formatNumber(row.signups)}</td>
                      <td>{formatNumber(row.paid)}</td>
                      <td>{formatMoney(row.revenue)}</td>
                      <td>{formatPercent(row.visitors ? row.paid / row.visitors : 0)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
