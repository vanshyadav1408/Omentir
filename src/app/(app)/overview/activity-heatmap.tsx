"use client";

import { useMemo, type CSSProperties } from "react";
import type { ActivityDay } from "@/lib/server/types";
import { zonedDayKey } from "@/lib/time-zone";

const LEVELS = ["#1c1c1c", "#0e4429", "#006d32", "#26a641", "#39d353"] as const;
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
}: {
  days: ActivityDay[];
  timeZone?: string;
}) {
  const model = useMemo(() => {
    const todayKey = zonedDayKey(Date.now(), timeZone) || new Date().toISOString().slice(0, 10);
    let startKey = addDays(todayKey, -52 * 7);
    while (weekday(startKey) !== 0) startKey = addDays(startKey, -1);

    const byDay = new Map<string, number>();
    for (const day of days) {
      if (!day.day) continue;
      byDay.set(day.day, (byDay.get(day.day) || 0) + countOf(day));
    }

    const cells: Array<{ key: string; count: number }> = [];
    for (let key = startKey; key <= todayKey; key = addDays(key, 1)) {
      cells.push({ key, count: byDay.get(key) || 0 });
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
      weeks,
      max,
      total,
      monthLabels,
      mostActiveMonth: MONTH_NAMES[mostActiveMonth],
      mostActiveDay: WEEKDAYS[mostActiveWeekday],
      longest,
      current,
    };
  }, [days, timeZone]);

  return (
    <div>
      <div
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
          >
            {model.weeks.map((column, weekIndex) => (
              <div key={weekIndex} className="heatmap-week">
                {column.map((cell, dayIndex) =>
                  cell ? (
                    <span
                      key={cell.key}
                      className="heatmap-cell"
                      title={`${cell.key}: ${cell.count}`}
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

      <div className="mt-5 grid gap-4 sm:grid-cols-4">
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

      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
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
