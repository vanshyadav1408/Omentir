"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ActivityDay } from "@/lib/server/types";
import {
  mergeActivityTotals,
  toActivityChartPoints,
  type ActivityChartPoint,
  type ActivityDayTotals,
} from "@/lib/activity-overview";

type ChartPoint = ActivityChartPoint;

type AnalysisChartProps = {
  /** Day totals built on the server from the live leads, enrollments and conversations. */
  liveTotals: ActivityDayTotals[];
  /** Durable day totals that survive agent/lead deletion. */
  activityDays?: ActivityDay[];
  maxDays?: number;
  startDateKey?: string;
  endDateKey?: string;
  /** Card title block; the metric picker sits on its right. */
  heading?: ReactNode;
};

/* One metric at a time (Calendly analytics style): the four counts live on
   very different scales (hundreds of leads, a handful of replies), so one
   stacked bar hid replies and meetings as slivers. Each metric gets its own
   scale; the bars wear one accent (--analysis-chart-accent, validated for
   the light and dark panels). */
const metrics = [
  { key: "found", label: "Leads found", short: "Leads", unit: "leads found" },
  { key: "contacted", label: "People contacted", short: "Contacted", unit: "people contacted" },
  { key: "replies", label: "Replies received", short: "Replies", unit: "replies received" },
  { key: "meetingsBooked", label: "Meetings booked", short: "Meetings", unit: "meetings booked" },
] as const;

type MetricKey = (typeof metrics)[number]["key"];

/** Pixel layout; the SVG is drawn at its real width so text never scales. */
const chart = {
  height: 240,
  left: 36,
  right: 8,
  top: 12,
  bottom: 28,
  maxBar: 28,
  /* Bars fill 60% of their day slot; the rest is air between days. */
  barRatio: 0.6,
  radius: 3,
  minBar: 2,
};

function buildChartData({
  liveTotals,
  activityDays = [],
  maxDays = 11,
  startDateKey,
  endDateKey,
}: AnalysisChartProps): ChartPoint[] {
  const durable = activityDays
    .filter((day) => day.day)
    .map((day) => ({
      dateKey: day.day,
      found: Number(day.found || 0),
      contacted: Number(day.contacted || 0),
      replies: Number(day.replies || 0),
      meetingsBooked: Number(day.meetingsBooked || 0),
    }));

  // max() merge: durable history keeps deleted-agent work; live fills current days.
  return toActivityChartPoints(mergeActivityTotals(liveTotals, durable), {
    maxDays,
    startDateKey,
    endDateKey,
  });
}

/** Zero-baseline scale split into 4 whole-number steps of 1, 2, or 5 x 10^n. */
function getScaleMax(maxValue: number) {
  const raw = Math.max(1, maxValue / 4);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((m) => m >= raw) ?? raw;
  return step * 4;
}

/** Bar with a rounded data-end and a square base. */
function roundedTopBar(x: number, y: number, width: number, height: number) {
  const r = Math.min(chart.radius, width / 2, height);
  return `M${x},${y + height}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}H${x + width - r}A${r},${r} 0 0 1 ${x + width},${y + r}V${y + height}Z`;
}

export default function AnalysisChart(props: AnalysisChartProps) {
  const chartData = useMemo(() => buildChartData(props), [props]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [metricKey, setMetricKey] = useState<MetricKey>("found");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [chartData.length]);

  const totals = useMemo(() => {
    const sums = { found: 0, contacted: 0, replies: 0, meetingsBooked: 0 } as Record<MetricKey, number>;
    for (const point of chartData) for (const m of metrics) sums[m.key] += point[m.key];
    return sums;
  }, [chartData]);

  const metric = metrics.find((m) => m.key === metricKey) ?? metrics[0];
  const maxObserved = Math.max(0, ...chartData.map((item) => item[metric.key]));
  const scaleMax = getScaleMax(maxObserved);
  const hoverPoint =
    hoverIndex != null ? chartData[Math.min(hoverIndex, chartData.length - 1)] : null;

  const baseline = chart.height - chart.bottom;
  const plotWidth = Math.max(0, width - chart.left - chart.right);
  const slot = chartData.length ? plotWidth / chartData.length : 0;
  const barWidth = Math.max(1, Math.min(chart.maxBar, slot * chart.barRatio));
  const pxPerUnit = (baseline - chart.top) / scaleMax;
  /* Label every Nth day so labels keep ~72px apart; the latest day always shows. */
  const labelEvery = Math.max(1, Math.ceil(72 / Math.max(slot, 1)));

  function getY(value: number) {
    return baseline - value * pxPerUnit;
  }

  /* Hard zero baseline + 4 interval grid (horizontal only). */
  const gridValues = [0, scaleMax / 4, scaleMax / 2, (scaleMax * 3) / 4, scaleMax];

  function updateHover(index: number, clientX: number, clientY: number) {
    setHoverIndex(index);
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({
      x: Math.min(Math.max(8, clientX - rect.left + 12), rect.width - 200),
      y: clientY - rect.top,
    });
  }

  if (!chartData.length) {
    return (
      <div className="analysis-chart">
        {props.heading}
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <span className="material-symbols-outlined text-3xl text-[var(--md-sys-color-text-medium)]">monitoring</span>
          <p className="mt-3 text-sm font-semibold text-[var(--md-sys-color-text-high)]">
            No activity yet
          </p>
          <p className="mt-1 max-w-sm text-xs font-normal leading-5 text-[var(--md-sys-color-text-medium)]">
            Leads found, people contacted, replies received, and meetings booked
            show up here once outreach starts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-chart">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">{props.heading}</div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-baseline gap-2 text-[13px] text-[var(--md-sys-color-text-medium)]">
            {metric.label}
            <span className="analysis-chart__total">{totals[metric.key].toLocaleString()}</span>
          </p>
          <div className="app-seg analysis-chart__seg" role="group" aria-label="Metric">
            {metrics.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-pressed={m.key === metric.key}
                onClick={() => {
                  setMetricKey(m.key);
                  setHoverIndex(null);
                }}
              >
                {m.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={wrapRef} className="relative mt-4 min-w-0" style={{ height: chart.height }}>
        {width > 0 ? (
          <svg
            width={width}
            height={chart.height}
            viewBox={`0 0 ${width} ${chart.height}`}
            role="img"
            aria-label={`${metric.label} per day`}
            className="block"
            onPointerLeave={() => setHoverIndex(null)}
          >
            {gridValues.map((value) => {
              const y = getY(value);
              return (
                <g key={value}>
                  <line
                    x1={chart.left}
                    x2={width - chart.right}
                    y1={y}
                    y2={y}
                    className="analysis-chart__grid"
                    strokeWidth="1"
                  />
                  <text
                    x={0}
                    y={y + 4}
                    className="analysis-chart__label"
                    fontSize="11"
                    fontWeight="400"
                    textAnchor="start"
                  >
                    {Math.round(value)}
                  </text>
                </g>
              );
            })}

            <g key={metric.key}>
            {chartData.map((item, index) => {
              const slotX = chart.left + index * slot;
              const center = slotX + slot / 2;
              const barX = center - barWidth / 2;
              const value = item[metric.key];
              /* Tiny non-zero counts keep a 2px bar so one reply still shows. */
              const barHeight = value > 0 ? Math.max(chart.minBar, value * pxPerUnit) : 0;
              const fromEnd = chartData.length - 1 - index;
              const dimmed = hoverIndex != null && hoverIndex !== index;
              const showLabel = fromEnd % labelEvery === 0;
              const anchor =
                center - chart.left < 28 ? "start" : width - chart.right - center < 28 ? "end" : "middle";

              return (
                <g key={item.dateKey}>
                  {barHeight > 0 ? (
                    <path
                      d={roundedTopBar(barX, baseline - barHeight, barWidth, barHeight)}
                      className="analysis-chart__bar"
                      data-dimmed={dimmed || undefined}
                      style={{ animationDelay: `${Math.round((index / chartData.length) * 400)}ms` }}
                    />
                  ) : null}
                  {showLabel ? (
                    <text
                      x={anchor === "start" ? slotX : anchor === "end" ? slotX + slot : center}
                      y={chart.height - 8}
                      className="analysis-chart__label"
                      fontSize="11"
                      fontWeight="400"
                      textAnchor={anchor}
                    >
                      {item.date}
                    </text>
                  ) : null}
                  <rect
                    x={slotX}
                    y={chart.top}
                    width={slot}
                    height={baseline - chart.top}
                    fill="transparent"
                    className="cursor-crosshair"
                    onPointerEnter={(e) => updateHover(index, e.clientX, e.clientY)}
                    onPointerMove={(e) => updateHover(index, e.clientX, e.clientY)}
                  />
                </g>
              );
            })}
            </g>
          </svg>
        ) : null}

        {totals[metric.key] === 0 ? (
          <p className="pointer-events-none absolute inset-x-0 top-[40%] text-center text-sm text-[var(--md-sys-color-text-medium)]">
            No {metric.unit} in this range
          </p>
        ) : null}

        {hoverPoint && hoverIndex != null ? (
          <div
            className="analysis-chart__tooltip pointer-events-none absolute z-10 min-w-[190px] rounded-lg px-3 py-2.5"
            style={{
              left: tooltipPos.x,
              top: Math.max(8, tooltipPos.y - 12),
              transform: "translateY(-100%)",
            }}
            role="status"
          >
            <div className="text-[12px] text-[var(--md-sys-color-text-medium)]">
              {hoverPoint.date}
              {hoverPoint.dateKey === props.endDateKey ? ", so far" : ""}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[13px] text-[var(--md-sys-color-text-high)]">
              <span className="analysis-chart__swatch" aria-hidden="true" />
              <span className="text-[var(--md-sys-color-text-medium)]">{metric.label}</span>
              <span className="ml-auto pl-3 font-semibold tabular-nums">
                {hoverPoint[metric.key].toLocaleString()}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Table view of the same numbers for screen readers. */}
      <table className="sr-only">
        <caption>Activity per day</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            {metrics.map((m) => (
              <th key={m.key} scope="col">
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chartData.map((item) => (
            <tr key={item.dateKey}>
              <th scope="row">{item.date}</th>
              {metrics.map((m) => (
                <td key={m.key}>{item[m.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
