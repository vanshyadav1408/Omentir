"use client";

import { useMemo, useRef, useState } from "react";
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

/** Muted gem tones so stacked areas read on a near-black canvas. */
const series = [
  { key: "found", label: "Leads found", color: "#3f8f6b" },
  { key: "contacted", label: "People contacted", color: "#5b7cbf" },
  { key: "replies", label: "Replies received", color: "#8b6bb5" },
  { key: "meetingsBooked", label: "Meetings booked", color: "#c4a35a" },
] as const;

const chart = {
  left: 40,
  right: 1080,
  top: 16,
  bottom: 200,
  height: 232,
  width: 1120,
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

/** Zero-baseline scale; nice steps so labels stay sparse. */
function getScaleMax(maxValue: number) {
  if (maxValue <= 0) return 4;
  if (maxValue <= 4) return 4;
  if (maxValue <= 8) return 8;
  if (maxValue <= 20) return 20;
  if (maxValue <= 40) return 40;
  if (maxValue <= 80) return 80;
  if (maxValue <= 120) return 120;
  return Math.ceil(maxValue / 50) * 50;
}

/** Skip x-axis labels so they stay horizontal and uncluttered. */
function shouldShowXLabel(index: number, total: number) {
  if (total <= 6) return true;
  if (total <= 11) return index % 2 === 0 || index === total - 1;
  const step = Math.ceil(total / 5);
  return index % step === 0 || index === total - 1;
}

export default function AnalysisChart(props: AnalysisChartProps) {
  const chartData = useMemo(() => buildChartData(props), [props]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const stacked = useMemo(() => {
    return chartData.map((item) => {
      let y = 0;
      const layers: Record<(typeof series)[number]["key"], { y0: number; y1: number }> = {
        found: { y0: 0, y1: 0 },
        contacted: { y0: 0, y1: 0 },
        replies: { y0: 0, y1: 0 },
        meetingsBooked: { y0: 0, y1: 0 },
      };
      for (const itemSeries of series) {
        const y0 = y;
        y += item[itemSeries.key];
        layers[itemSeries.key] = { y0, y1: y };
      }
      return layers;
    });
  }, [chartData]);

  const maxObserved = Math.max(0, ...stacked.map((item) => item.meetingsBooked.y1));
  const scaleMax = getScaleMax(maxObserved);
  const hoverPoint =
    hoverIndex != null ? chartData[Math.min(hoverIndex, chartData.length - 1)] : null;

  function getX(index: number) {
    if (chartData.length <= 1) return (chart.left + chart.right) / 2;
    return chart.left + (index * (chart.right - chart.left)) / (chartData.length - 1);
  }

  function getY(value: number) {
    return chart.bottom - (value / scaleMax) * (chart.bottom - chart.top);
  }

  function buildBand(key: (typeof series)[number]["key"]) {
    if (chartData.length === 0) return "";
    const top = chartData
      .map((_, index) => `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(stacked[index][key].y1)}`)
      .join(" ");
    const bottom = chartData
      .map((_, index) => chartData.length - 1 - index)
      .map((index) => `L ${getX(index)} ${getY(stacked[index][key].y0)}`)
      .join(" ");
    return `${top} ${bottom} Z`;
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
        <div ref={wrapRef} className="relative min-w-0">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            role="img"
            aria-label="Leads found, people contacted, replies received, and meetings booked over time"
            className="h-56 w-full sm:h-64"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {gridValues.map((value) => {
              const y = getY(value);
              return (
                <g key={value}>
                  <line
                    x1={chart.left}
                    x2={chart.right}
                    y1={y}
                    y2={y}
                    className="analysis-chart__grid"
                    strokeWidth="1"
                  />
                  <text
                    x={8}
                    y={y + 4}
                    className="analysis-chart__label"
                    fontSize="11"
                    fontWeight="400"
                    style={{ fontFamily: "var(--font-roboto), sans-serif" }}
                  >
                    {Math.round(value)}
                  </text>
                </g>
              );
            })}

            {series.map((item) => (
              <path
                key={item.key}
                d={buildBand(item.key)}
                fill={item.color}
                fillOpacity={0.82}
                stroke="none"
              />
            ))}

            {hoverIndex != null && hoverPoint ? (
              <line
                x1={getX(hoverIndex)}
                x2={getX(hoverIndex)}
                y1={chart.top}
                y2={chart.bottom}
                className="analysis-chart__hover-rule"
                strokeWidth="1"
              />
            ) : null}

            {chartData.map((item, index) => {
              const x = getX(index);
              const showLabel = shouldShowXLabel(index, chartData.length);

              return (
                <g key={item.dateKey}>
                  <rect
                    x={x - 20}
                    y={chart.top}
                    width="40"
                    height={chart.bottom - chart.top}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={(e) => updateHover(index, e.clientX, e.clientY)}
                    onMouseMove={(e) => updateHover(index, e.clientX, e.clientY)}
                  />
                  {showLabel ? (
                    <text
                      x={x}
                      y={chart.height - 8}
                      className="analysis-chart__label"
                      fontSize="11"
                      fontWeight="400"
                      textAnchor="middle"
                      style={{ fontFamily: "var(--font-roboto), sans-serif" }}
                    >
                      {item.date}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>

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
