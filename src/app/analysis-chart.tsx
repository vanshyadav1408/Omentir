"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ActivityDay,
  CampaignEnrollmentPreview,
  Conversation,
  LeadDashboardPreview,
} from "@/lib/server/types";
import {
  buildActivityTotalsFromLive,
  mergeActivityTotals,
  toActivityChartPoints,
  type ActivityChartPoint,
} from "@/lib/activity-overview";

type ChartPoint = ActivityChartPoint;

type AnalysisChartProps = {
  // Only the timeline fields are read, so the dashboard's slim projection is
  // enough here; a full LeadPreview still satisfies it.
  leads: LeadDashboardPreview[];
  conversations: Conversation[];
  enrollments: CampaignEnrollmentPreview[];
  /** Durable day totals that survive agent/lead deletion. */
  activityDays?: ActivityDay[];
  maxDays?: number;
  startDateKey?: string;
  endDateKey?: string;
};

/** Categorical slots 1-4, validated for the dark chart well (CVD + normal-vision separation). */
const series = [
  { key: "found", label: "Leads found", color: "#3987e5" },
  { key: "contacted", label: "People contacted", color: "#d95926" },
  { key: "replies", label: "Replies received", color: "#199e70" },
  { key: "meetingsBooked", label: "Meetings booked", color: "#c98500" },
] as const;

/** Pixel layout; the SVG is drawn at its real width so text never scales. */
const chart = {
  height: 240,
  left: 36,
  right: 8,
  top: 12,
  bottom: 28,
  maxBar: 24,
  gap: 2,
  radius: 4,
  minSegment: 2,
};

function buildChartData({
  leads,
  conversations,
  enrollments,
  activityDays = [],
  maxDays = 11,
  startDateKey,
  endDateKey,
}: AnalysisChartProps): ChartPoint[] {
  const live = buildActivityTotalsFromLive({ leads, enrollments, conversations });
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
  return toActivityChartPoints(mergeActivityTotals(live, durable), {
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

  const maxObserved = Math.max(
    0,
    ...chartData.map((item) => series.reduce((sum, s) => sum + item[s.key], 0)),
  );
  const scaleMax = getScaleMax(maxObserved);
  const hoverPoint =
    hoverIndex != null ? chartData[Math.min(hoverIndex, chartData.length - 1)] : null;

  const baseline = chart.height - chart.bottom;
  const plotWidth = Math.max(0, width - chart.left - chart.right);
  const slot = chartData.length ? plotWidth / chartData.length : 0;
  const barWidth = Math.max(1, Math.min(chart.maxBar, slot - chart.gap));
  const pxPerUnit = (baseline - chart.top) / scaleMax;
  /* Label every Nth day so labels keep ~72px apart; the latest day always shows. */
  const labelEvery = Math.max(1, Math.ceil(72 / Math.max(slot, 1)));

  function getY(value: number) {
    return baseline - value * pxPerUnit;
  }

  /* Stack from the baseline with a 2px surface gap between segments; tiny
     non-zero counts keep a 2px sliver so a single reply is still visible. */
  function buildSegments(item: ChartPoint) {
    const segments: Array<{ key: string; color: string; y: number; height: number }> = [];
    let cursor = baseline;
    for (const s of series) {
      const value = item[s.key];
      if (value <= 0) continue;
      if (segments.length) cursor -= chart.gap;
      const height = Math.max(chart.minSegment, value * pxPerUnit);
      const y = Math.max(chart.top, cursor - height);
      segments.push({ key: s.key, color: s.color, y, height: cursor - y });
      cursor = y;
    }
    return segments;
  }

  /* Hard zero baseline + 4 interval grid (horizontal only). */
  const gridValues = [0, scaleMax / 4, scaleMax / 2, (scaleMax * 3) / 4, scaleMax];

  function updateHover(index: number, clientX: number, clientY: number) {
    setHoverIndex(index);
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({
      x: Math.min(Math.max(8, clientX - rect.left + 12), rect.width - 160),
      y: clientY - rect.top,
    });
  }

  const legend = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {series.map((item) => (
        <div
          key={item.key}
          className="flex items-center gap-1.5 text-[11px] font-normal text-[var(--md-sys-color-text-medium)]"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          {item.label}
        </div>
      ))}
    </div>
  );

  return (
    <div className="analysis-chart">
      {chartData.length ? (
        <div ref={wrapRef} className="relative min-w-0" style={{ height: chart.height }}>
          {width > 0 ? (
          <svg
            width={width}
            height={chart.height}
            viewBox={`0 0 ${width} ${chart.height}`}
            role="img"
            aria-label="Leads found, people contacted, replies received, and meetings booked per day"
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
                    x={chart.left - 8}
                    y={y + 4}
                    className="analysis-chart__label"
                    fontSize="11"
                    fontWeight="400"
                    textAnchor="end"
                    style={{ fontFamily: "var(--font-roboto), sans-serif" }}
                  >
                    {Math.round(value)}
                  </text>
                </g>
              );
            })}

            {chartData.map((item, index) => {
              const slotX = chart.left + index * slot;
              const center = slotX + slot / 2;
              const barX = center - barWidth / 2;
              const segments = buildSegments(item);
              const fromEnd = chartData.length - 1 - index;
              const showLabel = fromEnd % labelEvery === 0;
              const anchor =
                center - chart.left < 28 ? "start" : width - chart.right - center < 28 ? "end" : "middle";

              return (
                <g key={item.dateKey}>
                  {hoverIndex === index ? (
                    <rect
                      x={slotX}
                      y={chart.top}
                      width={slot}
                      height={baseline - chart.top}
                      className="analysis-chart__hover-band"
                    />
                  ) : null}
                  {segments.map((segment, segmentIndex) =>
                    segmentIndex === segments.length - 1 ? (
                      <path
                        key={segment.key}
                        d={roundedTopBar(barX, segment.y, barWidth, segment.height)}
                        fill={segment.color}
                      />
                    ) : (
                      <rect
                        key={segment.key}
                        x={barX}
                        y={segment.y}
                        width={barWidth}
                        height={segment.height}
                        fill={segment.color}
                      />
                    ),
                  )}
                  {showLabel ? (
                    <text
                      x={anchor === "start" ? slotX : anchor === "end" ? slotX + slot : center}
                      y={chart.height - 8}
                      className="analysis-chart__label"
                      fontSize="11"
                      fontWeight="400"
                      textAnchor={anchor}
                      style={{ fontFamily: "var(--font-roboto), sans-serif" }}
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
          </svg>
          ) : null}

          {hoverPoint && hoverIndex != null ? (
            <div
              className="analysis-chart__tooltip pointer-events-none absolute z-10 min-w-[148px] rounded-lg px-3 py-2.5"
              style={{
                left: tooltipPos.x,
                top: Math.max(8, tooltipPos.y - 12),
                transform: "translateY(-100%)",
              }}
              role="status"
            >
              <div className="text-[12px] font-bold tracking-tight text-[var(--md-sys-color-text-high)]">
                {hoverPoint.date}
              </div>
              <div className="mt-2 grid gap-1.5">
                {series.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4 text-[12px] font-normal"
                  >
                    <span className="flex items-center gap-1.5 text-[var(--md-sys-color-text-medium)]">
                      <span
                        className="h-2 w-2 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: item.color }}
                        aria-hidden
                      />
                      {item.label}
                    </span>
                    <span className="font-medium tabular-nums text-[var(--md-sys-color-text-high)]">
                      {hoverPoint[item.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
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
      )}
      <div className="mt-4">{legend}</div>
    </div>
  );
}
