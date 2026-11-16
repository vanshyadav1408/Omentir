"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ActivityDay } from "@/lib/server/types";
import { zonedDayKey } from "@/lib/time-zone";

// Per-theme ramps live in globals.css (.heatmap-cell): light runs white to
// dark green, dark runs from the card's navy to bright green.
const LEVELS = [
  "var(--heatmap-level-0)",
  "var(--heatmap-level-1)",
  "var(--heatmap-level-2)",
  "var(--heatmap-level-3)",
  "var(--heatmap-level-4)",
] as const;
const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function addDays(key: string, n: number) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + n));
  return date.toISOString().slice(0, 10);
}

function weekday(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function countOf(day: ActivityDay) {
  return (
    Number(day.found || 0) +
    Number(day.contacted || 0) +
    Number(day.replies || 0) +
    Number(day.meetingsBooked || 0)
  );
}

type DayTotals = {
  found: number;
  contacted: number;
  replies: number;
  meetingsBooked: number;
  total: number;
};

type Tip = { key: string; left: number; top: number; below: boolean; pinned: boolean };

const EMPTY_DAY: DayTotals = { found: 0, contacted: 0, replies: 0, meetingsBooked: 0, total: 0 };
const TIP_HALF_WIDTH = 92;

function formatDay(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function levelFor(value: number, max: number) {
  if (value <= 0) return 0;
  if (max <= 1) return 4;
  const t = value / max;
  if (t < 0.25) return 1;
  if (t < 0.5) return 2;
  if (t < 0.75) return 3;
  return 4;
}

export default function ActivityHeatmap({
  days,
  timeZone,
  todayKey: fixedTodayKey,
}: {
  days: ActivityDay[];
  timeZone?: string;
  // Last day on the board. Defaults to today; the homepage demo pins it to the
  // build day so its prerendered HTML matches what the browser renders.
  todayKey?: string;
}) {
  const model = useMemo(() => {
    const todayKey =
      fixedTodayKey ||
      zonedDayKey(Date.now(), timeZone) ||
      new Date().toISOString().slice(0, 10);
    let startKey = addDays(todayKey, -52 * 7);
    while (weekday(startKey) !== 0) startKey = addDays(startKey, -1);

    const byDay = new Map<string, DayTotals>();
    for (const day of days) {
      if (!day.day) continue;
      const totals = byDay.get(day.day) || { ...EMPTY_DAY };
      totals.found += Number(day.found || 0);
      totals.contacted += Number(day.contacted || 0);
      totals.replies += Number(day.replies || 0);
      totals.meetingsBooked += Number(day.meetingsBooked || 0);
      totals.total += countOf(day);
      byDay.set(day.day, totals);
    }

    const cells: Array<{ key: string; count: number }> = [];
    for (let key = startKey; key <= todayKey; key = addDays(key, 1)) {
      cells.push({ key, count: byDay.get(key)?.total || 0 });
    }

    const weeks: Array<Array<{ key: string; count: number } | null>> = [];
    let week: Array<{ key: string; count: number } | null> = [];
    for (const cell of cells) {
      if (week.length === 0) {
        const pad = weekday(cell.key);
        for (let i = 0; i < pad; i += 1) week.push(null);
      }
      week.push(cell);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    const max = Math.max(0, ...cells.map((cell) => cell.count));
    const total = cells.reduce((sum, cell) => sum + cell.count, 0);

    const monthTotals = new Map<number, number>();
    const weekdayTotals = new Array(7).fill(0);
    for (const cell of cells) {
      const month = Number(cell.key.slice(5, 7)) - 1;
      monthTotals.set(month, (monthTotals.get(month) || 0) + cell.count);
      weekdayTotals[weekday(cell.key)] += cell.count;
    }
    let mostActiveMonth = 0;
    let monthMax = -1;
    for (const [month, value] of monthTotals) {
      if (value > monthMax) {
        monthMax = value;
        mostActiveMonth = month;
      }
    }
    let mostActiveWeekday = 0;
    let weekdayMax = -1;
    weekdayTotals.forEach((value, index) => {
      if (value > weekdayMax) {
        weekdayMax = value;
        mostActiveWeekday = index;
      }
    });

    let longest = 0;
    let current = 0;
    let run = 0;
    for (const cell of cells) {
      if (cell.count > 0) {
        run += 1;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
    }
    for (let i = cells.length - 1; i >= 0; i -= 1) {
      if (cells[i].count > 0) current += 1;
      else break;
    }

    const monthLabels = weeks.map((column) => {
      const first = column.find((cell) => cell && cell.key.endsWith("-01"));
      return first ? MONTH_LETTERS[Number(first.key.slice(5, 7)) - 1] : "";
    });

    return {
      byDay,
      weeks,
      max,
      total,
      monthLabels,
      mostActiveMonth: MONTH_NAMES[mostActiveMonth],
      mostActiveDay: WEEKDAYS[mostActiveWeekday],
      longest,
      current,
    };
  }, [days, timeZone, fixedTodayKey]);

  /* On narrow screens the board scrolls; open on the latest weeks, not a year ago. */
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollLeft = node.scrollWidth;
  }, [model.weeks.length]);

  /* Hovering a day shows its numbers; clicking (or tapping) pins them until
     the next click, Escape, or a scroll moves the board under the tooltip. */
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  function dayCell(target: EventTarget | null) {
    const el = target instanceof Element ? target.closest<HTMLElement>("[data-day]") : null;
    return el && wrapRef.current?.contains(el) ? el : null;
  }

  function showTip(el: HTMLElement, pinned: boolean) {
    const wrap = wrapRef.current;
    const key = el.dataset.day;
    if (!wrap || !key) return;
    const cell = el.getBoundingClientRect();
    const box = wrap.getBoundingClientRect();
    const center = cell.left - box.left + cell.width / 2;
    const top = cell.top - box.top;
    // Cards clip overflow, so days near the top open their tooltip downward.
    const below = top < 60;
    setTip({
      key,
      left: Math.min(Math.max(center, TIP_HALF_WIDTH), Math.max(TIP_HALF_WIDTH, box.width - TIP_HALF_WIDTH)),
      top: below ? top + cell.height : top,
      below,
      pinned,
    });
  }

  const pinned = Boolean(tip?.pinned);
  useEffect(() => {
    if (!pinned) return;
    const close = () => setTip(null);
    const onPointerDown = (event: PointerEvent) => {
      if (!dayCell(event.target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const scroller = scrollRef.current;
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    scroller?.addEventListener("scroll", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      scroller?.removeEventListener("scroll", close);
    };
  }, [pinned]);

  const tipDay = tip ? model.byDay.get(tip.key) || EMPTY_DAY : null;

  return (
    <div ref={wrapRef} className="heatmap relative">
      <div
        ref={scrollRef}
        className="heatmap-scroll"
        style={{ "--heatmap-weeks": model.weeks.length } as CSSProperties}
      >
        <div className="heatmap-board">
          <span />
          <div
            className="heatmap-months"
            style={{
              gridTemplateColumns: `repeat(${model.weeks.length}, minmax(0, 1fr))`,
            }}
          >
            {model.monthLabels.map((label, index) => (
              <span key={`${label}-${index}`} className="heatmap-month">
                {label}
              </span>
            ))}
          </div>
          <div className="heatmap-weekdays" aria-hidden="true">
            <span />
            <span>M</span>
            <span />
            <span>W</span>
            <span />
            <span>F</span>
            <span />
          </div>
          <div
            className="heatmap-weeks"
            style={{
              gridTemplateColumns: `repeat(${model.weeks.length}, minmax(0, 1fr))`,
            }}
            onPointerOver={(event) => {
              if (event.pointerType !== "mouse" || tip?.pinned) return;
              const el = dayCell(event.target);
              if (el && el.dataset.day !== tip?.key) showTip(el, false);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType !== "mouse") return;
              setTip((current) => (current?.pinned ? current : null));
            }}
            onClick={(event) => {
              const el = dayCell(event.target);
              if (!el) return;
              if (tip?.pinned && tip.key === el.dataset.day) setTip(null);
              else showTip(el, true);
            }}
          >
            {model.weeks.map((column, weekIndex) => (
              <div key={weekIndex} className="heatmap-week">
                {column.map((cell, dayIndex) =>
                  cell ? (
                    <span
                      key={cell.key}
                      data-day={cell.key}
                      data-active={tip?.key === cell.key ? "" : undefined}
                      className="heatmap-cell"
                      style={{
                        backgroundColor: LEVELS[levelFor(cell.count, model.max)],
                      }}
                    />
                  ) : (
                    <span key={`empty-${weekIndex}-${dayIndex}`} className="heatmap-cell opacity-0" />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {tip && tipDay ? (
        <div
          role="tooltip"
          className="heatmap-tip"
          data-below={tip.below ? "" : undefined}
          style={{ left: tip.left, top: tip.top }}
        >
          <p className="heatmap-tip-date">{formatDay(tip.key)}</p>
          {tipDay.total ? (
            <>
              <p className="heatmap-tip-total">
                <strong>{tipDay.total.toLocaleString()}</strong>
                {tipDay.total === 1 ? "action" : "actions"}
              </p>
              <dl>
                {(
                  [
                    ["Leads found", tipDay.found],
                    ["Contacted", tipDay.contacted],
                    ["Replies", tipDay.replies],
                    ["Meetings booked", tipDay.meetingsBooked],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} data-zero={value === 0 ? "" : undefined}>
                    <dt>{label}</dt>
                    <dd>{value.toLocaleString()}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="heatmap-tip-total">No activity</p>
          )}
        </div>
      ) : null}

      <div className="heatmap-inset mt-5 grid gap-4 sm:grid-cols-4">
        <div>
          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Most active month</p>
          <p className="mt-1 text-sm font-medium text-[var(--md-sys-color-on-surface)]">
            {model.total ? model.mostActiveMonth : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Most active day</p>
          <p className="mt-1 text-sm font-medium text-[var(--md-sys-color-on-surface)]">
            {model.total ? model.mostActiveDay : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Longest streak</p>
          <p className="mt-1 text-sm font-medium text-[var(--md-sys-color-on-surface)]">
            {model.longest} {model.longest === 1 ? "day" : "days"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Current streak</p>
          <p className="mt-1 text-sm font-medium text-[var(--md-sys-color-on-surface)]">
            {model.current} {model.current === 1 ? "day" : "days"}
          </p>
        </div>
      </div>

      <div className="heatmap-inset mt-4 flex items-center gap-1.5 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
        <span>Fewer</span>
        {LEVELS.map((color) => (
          <span key={color} className="heatmap-cell" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export function heatmapTotal(days: ActivityDay[]) {
  return days.reduce((sum, day) => sum + countOf(day), 0);
}
