import { STATS_TIMEZONE_LABEL, type StatsInterval } from "@/lib/stats-periods";

export function formatCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (abs >= 10_000) return `${Math.round(n / 1000)}k`;
  if (abs >= 1_000) return `${trim(n / 1000)}k`;
  return Math.round(n).toLocaleString("en-US");
}

function trim(n: number) {
  return n.toFixed(1).replace(/\.0$/, "");
}

export function formatNumber(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

export function formatMoney(n: number) {
  if (Math.abs(n) >= 100 || Number.isInteger(n)) return `$${Math.round(n).toLocaleString("en-US")}`;
  return `$${n.toFixed(2)}`;
}

export function formatMoneyCompact(n: number) {
  if (Math.abs(n) >= 1000) return `$${formatCompact(n)}`;
  return formatMoney(n);
}

export function formatPercent(ratio: number) {
  const v = ratio * 100;
  if (v === 0) return "0%";
  if (v < 1) return `${v.toFixed(2)}%`;
  if (v < 10) return `${trim(v)}%`;
  return `${Math.round(v)}%`;
}

export function formatDuration(seconds: number) {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

/** Relative change, or null when there is nothing to compare against. */
export function changeRatio(current: number, previous: number) {
  if (!previous) return null;
  return (current - previous) / previous;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseBucket(bucket: string) {
  const [date, time] = bucket.split(" ");
  const [y, m, d] = date.split("-").map(Number);
  const hour = time ? Number(time.split(":")[0]) : 0;
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, hour));
}

export function axisLabel(bucket: string, interval: StatsInterval) {
  const d = parseBucket(bucket);
  if (interval === "hour") return `${String(d.getUTCHours()).padStart(2, "0")}:00`;
  if (interval === "month") return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]}`;
}

export function tooltipLabel(bucket: string, interval: StatsInterval) {
  const d = parseBucket(bucket);
  const day = `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  if (interval === "hour") return `${day}, ${String(d.getUTCHours()).padStart(2, "0")}:00 ${STATS_TIMEZONE_LABEL}`;
  if (interval === "week") return `Week of ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  if (interval === "month") return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return day;
}

/** Round a max up to a friendly axis ceiling and return evenly spaced ticks. */
export function niceTicks(max: number, count = 4) {
  if (!(max > 0)) return [0, 1, 2, 3, 4].slice(0, count + 1);
  const rough = max / count;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? 10 * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Number(v.toFixed(6)));
  if (ticks[ticks.length - 1] < max) ticks.push(Number((ticks[ticks.length - 1] + step).toFixed(6)));
  return ticks;
}

/** Monotone cubic path through points (no overshoot), like DataFast's smooth line. */
export function smoothPath(points: [number, number][]) {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${points[0][0]},${points[0][1]}`;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1][0] - points[i][0]);
    slope.push((points[i + 1][1] - points[i][1]) / (dx[i] || 1));
  }
  const tangent: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    tangent.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
  }
  tangent.push(slope[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      tangent[i] = t * a * slope[i];
      tangent[i + 1] = t * b * slope[i];
    }
  }
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    d += ` C${x0 + h},${y0 + tangent[i] * h} ${x1 - h},${y1 - tangent[i + 1] * h} ${x1},${y1}`;
  }
  return d;
}
