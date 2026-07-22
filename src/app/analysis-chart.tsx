"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CampaignEnrollmentPreview, Conversation, LeadPreview } from "@/lib/server/types";

type ChartPoint = {
  dateKey: string;
  date: string;
  found: number;
  contacted: number;
  replies: number;
};

type AnalysisChartProps = {
  leads: LeadPreview[];
  conversations: Conversation[];
  enrollments: CampaignEnrollmentPreview[];
};

/** Categorical scale: distinct series with solid contrast on light/dark surfaces. */
const series = [
  { key: "found", label: "Leads found", color: "#0d9488" },
  { key: "contacted", label: "People contacted", color: "#7c3aed" },
  { key: "replies", label: "Replies received", color: "#ba3871" },
] as const;

const chart = {
  left: 40,
  right: 700,
  top: 16,
  bottom: 200,
  height: 232,
  width: 720,
};

const contactedEnrollmentStatuses = new Set<CampaignEnrollmentPreview["status"]>([
  "connection_sent",
  "connected",
  "message_sent",
  "reply_received",
  "replied",
]);

const contactedLeadStatuses = new Set<LeadPreview["outreachStatus"]>([
  "invited",
  "connected",
  "messaged",
  "replied",
]);

function toDayKey(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function keyFromDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/** Horizontal axis: month abbreviation + day (Google-style, never rotated). */
function formatDateLabel(key: string) {
  return dateFromKey(key).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function addCount(counts: Map<string, number>, key: string | null) {
  if (!key) return;
  counts.set(key, (counts.get(key) || 0) + 1);
}

function addLeadToDay(map: Map<string, Set<string>>, key: string | null, leadId: string) {
  if (!key || !leadId) return;
  const leads = map.get(key) || new Set<string>();
  leads.add(leadId);
  map.set(key, leads);
}

function buildChartData({
  leads,
  conversations,
  enrollments,
}: AnalysisChartProps): ChartPoint[] {
  const foundCounts = new Map<string, number>();
  const contactedByDay = new Map<string, Set<string>>();
  const repliesCounts = new Map<string, number>();
  const contactedFromEnrollments = new Set<string>();

  for (const lead of leads) {
    addCount(foundCounts, toDayKey(lead.createdAt));
  }

  for (const enrollment of enrollments) {
    if (!contactedEnrollmentStatuses.has(enrollment.status)) continue;
    contactedFromEnrollments.add(enrollment.leadId);
    addLeadToDay(
      contactedByDay,
      toDayKey(enrollment.updatedAt || enrollment.createdAt),
      enrollment.leadId,
    );
  }

  for (const lead of leads) {
    if (contactedFromEnrollments.has(lead.id)) continue;
    if (!contactedLeadStatuses.has(lead.outreachStatus)) continue;
    addLeadToDay(contactedByDay, toDayKey(lead.updatedAt || lead.createdAt), lead.id);
  }

  for (const conversation of conversations) {
    for (const message of conversation.messages) {
      if (message.direction !== "inbound") continue;
      addCount(repliesCounts, toDayKey(message.createdAt));
    }
  }

  const activityKeys = new Set<string>([
    ...foundCounts.keys(),
    ...contactedByDay.keys(),
    ...repliesCounts.keys(),
  ]);
  if (!activityKeys.size) return [];

  const sortedKeys = [...activityKeys].sort();
  const earliest = dateFromKey(sortedKeys[0]);
  const latest = dateFromKey(sortedKeys[sortedKeys.length - 1]);
  const start = new Date(Math.max(earliest.getTime(), addDays(latest, -10).getTime()));
  const points: ChartPoint[] = [];

  for (let cursor = start; cursor <= latest; cursor = addDays(cursor, 1)) {
    const dateKey = keyFromDate(cursor);
    points.push({
      dateKey,
      date: formatDateLabel(dateKey),
      found: foundCounts.get(dateKey) || 0,
      contacted: contactedByDay.get(dateKey)?.size || 0,
      replies: repliesCounts.get(dateKey) || 0,
    });
  }

  return points;
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
  const gradientId = useId().replace(/:/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const maxObserved = Math.max(
    0,
    ...chartData.flatMap((item) => [item.found, item.contacted, item.replies]),
  );
  const scaleMax = getScaleMax(maxObserved);
  const hoverPoint =
    hoverIndex != null ? chartData[Math.min(hoverIndex, chartData.length - 1)] : null;

  useEffect(() => {
    if (!chartData.length) setHoverIndex(null);
  }, [chartData.length]);

  function getX(index: number) {
    if (chartData.length <= 1) return (chart.left + chart.right) / 2;
    return chart.left + (index * (chart.right - chart.left)) / (chartData.length - 1);
  }

  function getY(value: number) {
    return chart.bottom - (value / scaleMax) * (chart.bottom - chart.top);
  }

  function buildLinePath(key: (typeof series)[number]["key"]) {
    return chartData
      .map((item, index) => `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(item[key])}`)
      .join(" ");
  }

  function buildAreaPath() {
    const line = buildLinePath("found");
    return `${line} L ${getX(chartData.length - 1)} ${chart.bottom} L ${getX(0)} ${chart.bottom} Z`;
  }

  const linePaths = {
    found: buildLinePath("found"),
    contacted: buildLinePath("contacted"),
    replies: buildLinePath("replies"),
  };
  /* Hard zero baseline + 4 interval grid (horizontal only). */
  const gridValues = [0, scaleMax / 4, scaleMax / 2, (scaleMax * 3) / 4, scaleMax];

  function updateHover(index: number, clientX: number, clientY: number) {
    setHoverIndex(index);
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  }

  return (
    <div className="analysis-chart rounded-xl bg-[var(--md-sys-color-surface-container-low)] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {series.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-2 text-[12px] font-normal text-[var(--md-sys-color-text-medium)]"
            style={{ fontFamily: "var(--font-roboto), var(--font-google-sans), sans-serif" }}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            {item.label}
          </div>
        ))}
      </div>

      {chartData.length ? (
        <div ref={wrapRef} className="relative min-w-0">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            role="img"
            aria-label="Leads found, people contacted, and replies received over time"
            className="h-56 w-full sm:h-64"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal gridlines only — faint, zero baseline included */}
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

            {chartData.length > 1 ? (
              <path
                d={buildAreaPath()}
                fill={`url(#${gradientId})`}
                className="analysis-chart__area"
                style={{
                  opacity: hoverIndex != null ? 0.4 : 1,
                  transition: "opacity 150ms cubic-bezier(0.2, 0, 0, 1)",
                }}
              />
            ) : null}

            {series.map((item) => (
              <path
                key={item.key}
                d={linePaths[item.key]}
                fill="none"
                stroke={item.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                style={{
                  opacity: hoverIndex != null ? 0.4 : 1,
                  transition: "opacity 150ms cubic-bezier(0.2, 0, 0, 1)",
                }}
              />
            ))}

            {/* Hover focus column + points (focused series stay full opacity) */}
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
              const active = index === hoverIndex;
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
                  {series.map((seriesItem) => (
                    <circle
                      key={seriesItem.key}
                      cx={x}
                      cy={getY(item[seriesItem.key])}
                      r={active ? 5.5 : 3.5}
                      className="analysis-chart__point-fill"
                      stroke={seriesItem.color}
                      strokeWidth={active ? 2.5 : 2}
                      style={{
                        opacity: hoverIndex != null && !active ? 0.4 : 1,
                        transition:
                          "r 150ms cubic-bezier(0.2, 0, 0, 1), opacity 150ms cubic-bezier(0.2, 0, 0, 1)",
                        pointerEvents: "none",
                      }}
                    />
                  ))}
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
                left: Math.min(
                  Math.max(8, tooltipPos.x + 12),
                  (wrapRef.current?.clientWidth ?? 320) - 160,
                ),
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
                        className="h-2 w-2 shrink-0 rounded-full"
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
        <div className="flex flex-col items-center justify-center rounded-xl bg-[var(--md-sys-color-surface-container)] px-6 py-10 text-center">
          <span className="material-symbols-outlined text-3xl text-[var(--md-sys-color-text-medium)]">monitoring</span>
          <p className="mt-3 text-sm font-semibold text-[var(--md-sys-color-text-high)]">
            No activity yet
          </p>
          <p className="mt-1 max-w-sm text-xs font-normal leading-5 text-[var(--md-sys-color-text-medium)]">
            Real leads found, people contacted, and replies received will appear here
            after Omentir starts working.
          </p>
        </div>
      )}
    </div>
  );
}
