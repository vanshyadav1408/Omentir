"use client";

import { useMemo, useState } from "react";
import type { StatsInterval } from "@/lib/stats-periods";
import type { StatsOverviewData } from "@/lib/stats-types";
import {
  axisLabel,
  changeRatio,
  formatCompact,
  formatDuration,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
  niceTicks,
  smoothPath,
  tooltipLabel,
} from "./stats-format";
import { useElementWidth } from "./use-element-width";

type Props = {
  data?: StatsOverviewData;
  loading: boolean;
  error?: string;
  buckets: string[];
  interval: StatsInterval;
  live: boolean;
};

type Kpi = {
  label: string;
  value: string;
  change: number | null;
  /** Bounce rate: going up is bad. */
  invert?: boolean;
  toggle?: "visitors" | "revenue";
  live?: boolean;
};

const HEIGHT = 270;
const PAD = { top: 14, right: 46, bottom: 26, left: 44 };

export function StatsMainCard({ data, loading, error, buckets, interval, live }: Props) {
  const [show, setShow] = useState({ visitors: true, revenue: true });
  const [hover, setHover] = useState<number | null>(null);
  const [ref, width] = useElementWidth<HTMLDivElement>();

  const kpis: Kpi[] = useMemo(() => {
    if (!data) return [];
    const { visitors, revenue, customers, bounceRate, sessionSeconds } = data.kpis;
    const rate = (a: number, b: number) => (b > 0 ? a / b : 0);
    const convNow = rate(customers.current, visitors.current);
    const convBefore = rate(customers.previous, visitors.previous);
    const rpvNow = rate(revenue.current, visitors.current);
    const rpvBefore = rate(revenue.previous, visitors.previous);
    return [
      { label: "Visitors", value: visitors.current >= 100_000 ? formatCompact(visitors.current) : formatNumber(visitors.current), change: changeRatio(visitors.current, visitors.previous), toggle: "visitors" },
      { label: "Revenue", value: formatMoney(revenue.current), change: changeRatio(revenue.current, revenue.previous), toggle: "revenue" },
      { label: "Conversion rate", value: formatPercent(convNow), change: changeRatio(convNow, convBefore) },
      { label: "Revenue/visitor", value: formatMoney(rpvNow), change: changeRatio(rpvNow, rpvBefore) },
      { label: "Bounce rate", value: formatPercent(bounceRate.current), change: changeRatio(bounceRate.current, bounceRate.previous), invert: true },
      { label: "Session time", value: formatDuration(sessionSeconds.current), change: changeRatio(sessionSeconds.current, sessionSeconds.previous) },
      { label: "Online", value: formatNumber(data.online), change: null, live: true },
    ];
  }, [data]);

  const points = useMemo(() => {
    const byBucket = new Map((data?.series ?? []).map((row) => [row.bucket, row]));
    return buckets.map((bucket) => {
      const row = byBucket.get(bucket);
      return {
        bucket,
        visitors: row?.visitors ?? 0,
        newRevenue: row?.newRevenue ?? 0,
        renewalRevenue: row?.renewalRevenue ?? 0,
        customers: row?.customers ?? 0,
      };
    });
  }, [data, buckets]);

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const n = points.length;
  const band = n ? plotW / n : 0;
  const x = (i: number) => PAD.left + (i + 0.5) * band;

  const visitorTicks = niceTicks(Math.max(...points.map((p) => p.visitors), 4));
  const vMax = visitorTicks[visitorTicks.length - 1] || 1;
  const revenueTicks = niceTicks(Math.max(...points.map((p) => p.newRevenue + p.renewalRevenue), 10));
  const rMax = revenueTicks[revenueTicks.length - 1] || 1;
  const yV = (v: number) => PAD.top + plotH - (v / vMax) * plotH;
  const yR = (v: number) => PAD.top + plotH - (v / rMax) * plotH;

  const linePoints: [number, number][] = points.map((p, i) => [x(i), yV(p.visitors)]);
  const linePath = smoothPath(linePoints);
  const areaPath = linePoints.length
    ? `${linePath} L${linePoints[n - 1][0]},${PAD.top + plotH} L${linePoints[0][0]},${PAD.top + plotH} Z`
    : "";
  // The current bucket is still filling up, so its segment is dashed (split with clip paths
  // so the solid and dashed parts share one curve).
  const dashFrom = live && n > 1 ? linePoints[n - 2][0] : width;
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 78))));
  const barW = Math.max(2, Math.min(22, band * 0.62));

  const hovered = hover != null ? points[hover] : null;

  return (
    <section className={`stats-card${loading ? " is-loading" : ""}`} aria-label="Overview">
      <div className="stats-card-body">
        <div className="stats-kpis">
          {kpis.length === 0 &&
            ["Visitors", "Revenue", "Conversion rate", "Revenue/visitor", "Bounce rate", "Session time", "Online"].map((label) => (
              <div key={label} className="stats-kpi">
                <div className="stats-kpi-label">{label}</div>
                <div className="stats-kpi-value">·</div>
                <div className="stats-kpi-change" />
              </div>
            ))}
          {kpis.map((kpi) => {
            const good = kpi.change == null || kpi.change === 0 ? null : (kpi.change > 0) !== !!kpi.invert;
            const content = (
              <>
                <div className="stats-kpi-label">
                  {kpi.toggle && (
                    <span
                      className="stats-kpi-check"
                      style={{
                        color: kpi.toggle === "visitors" ? "var(--st-visitors)" : "var(--st-renewal)",
                        background: show[kpi.toggle] ? "currentColor" : "transparent",
                      }}
                    />
                  )}
                  {kpi.label}
                  {kpi.live && <span className="stats-live-dot" aria-hidden />}
                </div>
                <div className="stats-kpi-value">{kpi.value}</div>
                <div className={`stats-kpi-change${good == null ? "" : good ? " is-good" : " is-bad"}`}>
                  {kpi.change == null ? "" : `${Math.round(Math.abs(kpi.change) * 100)}% ${kpi.change >= 0 ? "↑" : "↓"}`}
                </div>
              </>
            );
            return kpi.toggle ? (
              <button
                key={kpi.label}
                type="button"
                className="stats-kpi is-toggle"
                aria-pressed={show[kpi.toggle]}
                onClick={() => setShow((s) => ({ ...s, [kpi.toggle as "visitors"]: !s[kpi.toggle as "visitors"] }))}
              >
                {content}
              </button>
            ) : (
              <div key={kpi.label} className="stats-kpi">
                {content}
              </div>
            );
          })}
        </div>

        <div className="stats-chart">
          <div className="stats-chart-inner" ref={ref}>
          {error ? (
            <div className="stats-empty stats-error" style={{ minHeight: HEIGHT }}>{error}</div>
          ) : data && width > 0 && n > 0 ? (
            <svg
              height={HEIGHT}
              viewBox={`0 0 ${width} ${HEIGHT}`}
              onMouseLeave={() => setHover(null)}
              onMouseMove={(event) => {
                const box = event.currentTarget.getBoundingClientRect();
                const i = Math.floor((event.clientX - box.left - PAD.left) / (band || 1));
                setHover(i >= 0 && i < n ? i : null);
              }}
            >
              <defs>
                <linearGradient id="stats-visitors-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--st-visitors)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--st-visitors)" stopOpacity="0" />
                </linearGradient>
                <clipPath id="stats-solid">
                  <rect x={0} y={0} width={dashFrom} height={HEIGHT} />
                </clipPath>
                <clipPath id="stats-dashed">
                  <rect x={dashFrom} y={0} width={Math.max(0, width - dashFrom)} height={HEIGHT} />
                </clipPath>
              </defs>
              <g className="stats-axis">
                {visitorTicks.map((t) => (
                  <g key={`v${t}`}>
                    <line className="stats-gridline" x1={PAD.left} x2={width - PAD.right} y1={yV(t)} y2={yV(t)} />
                    {show.visitors && (
                      <text x={PAD.left - 8} y={yV(t) + 4} textAnchor="end">{formatCompact(t)}</text>
                    )}
                  </g>
                ))}
                {show.revenue &&
                  revenueTicks.map((t) => (
                    <text key={`r${t}`} x={width - PAD.right + 8} y={yR(t) + 4}>{formatMoneyCompact(t)}</text>
                  ))}
                {points.map((p, i) =>
                  i % labelEvery === 0 ? (
                    <text key={p.bucket} x={x(i)} y={HEIGHT - 6} textAnchor="middle">{axisLabel(p.bucket, interval)}</text>
                  ) : null,
                )}
              </g>

              {show.revenue &&
                points.map((p, i) => {
                  const total = p.newRevenue + p.renewalRevenue;
                  if (total <= 0) return null;
                  return (
                    <g key={`bar${p.bucket}`}>
                      <rect x={x(i) - barW / 2} y={yR(total)} width={barW} height={yR(0) - yR(total)} rx={3} fill="var(--st-revenue)" />
                      {p.renewalRevenue > 0 && (
                        <rect x={x(i) - barW / 2} y={yR(total)} width={barW} height={yR(0) - yR(p.renewalRevenue)} rx={3} fill="var(--st-renewal)" />
                      )}
                    </g>
                  );
                })}

              {show.visitors && (
                <>
                  <path d={areaPath} fill="url(#stats-visitors-fill)" />
                  <path d={linePath} fill="none" stroke="var(--st-visitors)" strokeWidth={2.2} clipPath="url(#stats-solid)" />
                  <path d={linePath} fill="none" stroke="var(--st-visitors)" strokeWidth={2.2} strokeDasharray="4 4" clipPath="url(#stats-dashed)" />
                </>
              )}

              {hover != null && (
                <>
                  <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="#555" strokeDasharray="3 3" />
                  {show.visitors && (
                    <circle cx={x(hover)} cy={yV(points[hover].visitors)} r={4} fill="var(--st-visitors)" stroke="#1d1d1d" strokeWidth={2} />
                  )}
                </>
              )}
            </svg>
          ) : (
            <div className="stats-empty" style={{ minHeight: HEIGHT }}>{data || !loading ? "No data for this period" : ""}</div>
          )}

          {hovered && hover != null && (
            <div
              className="stats-tooltip"
              style={{
                top: 18,
                left: x(hover) + 16 + 200 > width ? undefined : x(hover) + 16,
                right: x(hover) + 16 + 200 > width ? width - x(hover) + 16 : undefined,
              }}
            >
              <div className="stats-tooltip-title">{tooltipLabel(hovered.bucket, interval)}</div>
              <div className="stats-tooltip-row">
                <span className="stats-tooltip-key"><i style={{ background: "var(--st-visitors)" }} />Visitors</span>
                <b>{formatNumber(hovered.visitors)}</b>
              </div>
              <div className="stats-tooltip-sep" />
              <div className="stats-tooltip-label">Revenue</div>
              <div className="stats-tooltip-row">
                <span className="stats-tooltip-key"><i style={{ background: "var(--st-revenue)" }} />New</span>
                <b>{formatMoney(hovered.newRevenue)}</b>
              </div>
              <div className="stats-tooltip-row">
                <span className="stats-tooltip-key"><i style={{ background: "var(--st-renewal)" }} />Renewal</span>
                <b>{formatMoney(hovered.renewalRevenue)}</b>
              </div>
              <div className="stats-tooltip-sep" />
              <div className="stats-tooltip-row">
                Revenue/visitor
                <b>{formatMoney(hovered.visitors ? (hovered.newRevenue + hovered.renewalRevenue) / hovered.visitors : 0)}</b>
              </div>
              <div className="stats-tooltip-row">
                Conversion rate
                <b>{formatPercent(hovered.visitors ? hovered.customers / hovered.visitors : 0)}</b>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
