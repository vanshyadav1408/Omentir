"use client";

import { useState } from "react";
import type { StatsInterval } from "@/lib/stats-periods";
import { axisLabel, formatCompact, formatNumber, niceTicks, smoothPath, tooltipLabel } from "./stats-format";
import { useElementWidth } from "./use-element-width";

export type LineSeries = { key: string; label: string; color: string; values: number[] };

const PAD = { top: 12, right: 12, bottom: 24, left: 40 };

export function StatsLineChart({
  buckets,
  interval,
  series,
  highlight,
  height = 260,
}: {
  buckets: string[];
  interval: StatsInterval;
  series: LineSeries[];
  highlight?: string | null;
  height?: number;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = buckets.length;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const step = n > 1 ? plotW / (n - 1) : 0;
  const x = (i: number) => PAD.left + (n > 1 ? i * step : plotW / 2);
  const ticks = niceTicks(Math.max(4, ...series.flatMap((s) => s.values)));
  const max = ticks[ticks.length - 1] || 1;
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 78))));

  const rows =
    hover == null
      ? []
      : series
          .map((s) => ({ ...s, value: s.values[hover] ?? 0 }))
          .filter((s) => s.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);

  return (
    <div className="stats-chart-inner" ref={ref} style={{ minHeight: height }}>
      {width > 0 && n > 0 && (
        <svg
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ display: "block", width: "100%", overflow: "visible" }}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const i = n > 1 ? Math.round((event.clientX - box.left - PAD.left) / (step || 1)) : 0;
            setHover(i >= 0 && i < n ? i : null);
          }}
        >
          <g className="stats-axis">
            {ticks.map((t) => (
              <g key={t}>
                <line className="stats-gridline" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
                <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end">{formatCompact(t)}</text>
              </g>
            ))}
            {buckets.map((bucket, i) =>
              i % labelEvery === 0 ? (
                <text key={bucket} x={x(i)} y={height - 5} textAnchor="middle">{axisLabel(bucket, interval)}</text>
              ) : null,
            )}
          </g>
          {series.map((s) => {
            const dim = highlight != null && highlight !== s.key;
            return (
              <path
                key={s.key}
                d={smoothPath(s.values.map((v, i) => [x(i), y(v)]))}
                fill="none"
                stroke={s.color}
                strokeWidth={highlight === s.key ? 2.6 : 1.8}
                opacity={dim ? 0.18 : 1}
              />
            );
          })}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="#555" strokeDasharray="3 3" />}
        </svg>
      )}
      {hover != null && rows.length > 0 && (
        <div
          className="stats-tooltip"
          style={{
            top: 8,
            left: x(hover) + 14 + 210 > width ? undefined : x(hover) + 14,
            right: x(hover) + 14 + 210 > width ? width - x(hover) + 14 : undefined,
          }}
        >
          <div className="stats-tooltip-title">{tooltipLabel(buckets[hover], interval)}</div>
          {rows.map((row) => (
            <div key={row.key} className="stats-tooltip-row">
              <span className="stats-tooltip-key"><i style={{ background: row.color }} />{row.label}</span>
              <b>{formatNumber(row.value)}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const LINE_COLORS = ["#8ab8f0", "#f29b82", "#86d0a0", "#c6a4ff", "#f3c56c", "#6ed2d2", "#ff9fca", "#b6c1d1", "#e7a56a", "#9aa6ff"];
