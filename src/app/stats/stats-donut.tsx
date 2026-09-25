"use client";

import { useState } from "react";
import type { StatsBreakdownRow } from "@/lib/stats-types";
import { formatMoney, formatNumber, formatPercent } from "./stats-format";
import { useElementWidth } from "./use-element-width";

// DataFast's Channel view: a thick donut of visitors per channel with
// callout labels. Click a slice to filter.

const SHADES = ["#3d587f", "#56739c", "#6c8bb6", "#86a3c9", "#a3bcdb", "#bfd1e8", "#d6e2f1"];
const HEIGHT = 300;

function arc(cx: number, cy: number, r: number, r0: number, a0: number, a1: number) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (radius: number, a: number) => `${cx + radius * Math.sin(a)},${cy - radius * Math.cos(a)}`;
  return `M${p(r, a0)} A${r},${r} 0 ${large} 1 ${p(r, a1)} L${p(r0, a1)} A${r0},${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
}

export function StatsDonut({
  rows,
  display,
  onSelect,
}: {
  rows: StatsBreakdownRow[];
  display: (row: StatsBreakdownRow) => string;
  onSelect: (row: StatsBreakdownRow) => void;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const total = rows.reduce((sum, row) => sum + row.visitors, 0);
  const cx = width / 2;
  const cy = HEIGHT / 2;
  const r = Math.min(112, width / 2 - 90);
  const r0 = r * 0.6;
  // Hairline gap between slices, like DataFast.
  const gap = rows.length > 1 ? 0.012 : 0;

  const shares = rows.map((row) => (total ? row.visitors / total : 0));
  const slices = rows.map((row, i) => {
    const a0 = shares.slice(0, i).reduce((sum, share) => sum + share, 0) * Math.PI * 2;
    return { row, i, share: shares[i], a0, a1: a0 + shares[i] * Math.PI * 2, color: SHADES[Math.min(i, SHADES.length - 1)] };
  });

  const hovered = hover != null ? slices[hover] : null;

  return (
    <div ref={ref} className="stats-chart-inner" style={{ height: HEIGHT, margin: "4px 0 6px" }} onMouseLeave={() => setHover(null)}>
      {width > 0 && r > 20 && total > 0 && (
        <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} style={{ display: "block" }}>
          {slices.map((s) =>
            s.share > 0 ? (
              <path
                key={s.row.value}
                d={s.share >= 0.999 ? arc(cx, cy, r, r0, 0, Math.PI * 2 - 0.0001) : arc(cx, cy, r, r0, s.a0 + gap / 2, s.a1 - gap / 2)}
                fill={s.color}
                opacity={hover == null || hover === s.i ? 1 : 0.55}
                style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                onMouseEnter={() => setHover(s.i)}
                onClick={() => onSelect(s.row)}
              />
            ) : null,
          )}
          {slices.map((s) => {
            if (s.share < 0.012) return null;
            const mid = (s.a0 + s.a1) / 2;
            const sin = Math.sin(mid);
            const cos = Math.cos(mid);
            const x1 = cx + (r + 4) * sin;
            const y1 = cy - (r + 4) * cos;
            const x2 = cx + (r + 18) * sin;
            const y2 = cy - (r + 18) * cos;
            const right = sin >= 0;
            const x3 = x2 + (right ? 14 : -14);
            return (
              <g key={`label-${s.row.value}`} style={{ pointerEvents: "none" }}>
                <polyline points={`${x1},${y1} ${x2},${y2} ${x3},${y2}`} fill="none" stroke="#8a8a8a" strokeWidth={1} />
                <text x={x3 + (right ? 5 : -5)} y={y2 + 4} textAnchor={right ? "start" : "end"} fill="var(--st-text)" fontSize={12}>
                  {display(s.row)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {hovered && (
        <div className="stats-tooltip" style={{ top: 12, left: 12 }}>
          <div className="stats-tooltip-title">{display(hovered.row)}</div>
          <div className="stats-tooltip-row">Visitors<b>{formatNumber(hovered.row.visitors)} ({formatPercent(hovered.share)})</b></div>
          <div className="stats-tooltip-row">Revenue<b>{formatMoney(hovered.row.revenue)}</b></div>
          <div className="stats-tooltip-row">Signups<b>{formatNumber(hovered.row.signups)}</b></div>
          <div className="stats-tooltip-row">Paid<b>{formatNumber(hovered.row.paid)}</b></div>
        </div>
      )}
    </div>
  );
}
