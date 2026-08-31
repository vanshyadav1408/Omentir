export const GSC_AI_OVERVIEW_EVENT = "google_ai_overview_report";

export type GscAiOverviewRow = {
  date: string;
  page: string;
  appearance: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  rowKey: string;
};

const HEADER_ALIASES: Record<keyof Omit<GscAiOverviewRow, "rowKey">, string[]> = {
  date: ["date", "day"],
  page: ["page", "landing page", "landing_page", "url", "top pages"],
  appearance: ["search appearance", "appearance", "search type", "type", "ai feature"],
  impressions: ["impressions"],
  clicks: ["clicks"],
  ctr: ["ctr", "click through rate", "click-through rate"],
  position: ["position", "average position", "avg. position", "avg position"],
};

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function parseNumber(value: string): number {
  const trimmed = value.trim().replace(/%/g, "").replace(/,/g, "");
  if (!trimmed) return 0;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : 0;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function columnIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

export function parseGscAiOverviewCsv(csv: string): GscAiOverviewRow[] {
  const lines = csv.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]!).map(normalizeHeader);
  const dateIdx = columnIndex(headers, HEADER_ALIASES.date);
  const pageIdx = columnIndex(headers, HEADER_ALIASES.page);
  const appearanceIdx = columnIndex(headers, HEADER_ALIASES.appearance);
  const impressionsIdx = columnIndex(headers, HEADER_ALIASES.impressions);
  const clicksIdx = columnIndex(headers, HEADER_ALIASES.clicks);
  const ctrIdx = columnIndex(headers, HEADER_ALIASES.ctr);
  const positionIdx = columnIndex(headers, HEADER_ALIASES.position);

  if (impressionsIdx === -1 && clicksIdx === -1) {
    throw new Error("CSV is missing Impressions and Clicks. Export Search generative AI from Search Console.");
  }

  const rows: GscAiOverviewRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const date = dateIdx >= 0 ? cells[dateIdx]?.trim() || "" : "";
    const page = pageIdx >= 0 ? cells[pageIdx]?.trim() || "" : "";
    const appearance = appearanceIdx >= 0 ? cells[appearanceIdx]?.trim() || "AI Overviews" : "AI Overviews";
    const impressions = impressionsIdx >= 0 ? parseNumber(cells[impressionsIdx] || "0") : 0;
    const clicks = clicksIdx >= 0 ? parseNumber(cells[clicksIdx] || "0") : 0;
    const ctr = ctrIdx >= 0 ? parseNumber(cells[ctrIdx] || "0") : 0;
    const position = positionIdx >= 0 ? parseNumber(cells[positionIdx] || "0") : 0;
    if (!date && !page && impressions === 0 && clicks === 0) continue;
    const rowKey = [date, page, appearance, String(impressions), String(clicks)].join("|");
    rows.push({ date, page, appearance, impressions, clicks, ctr, position, rowKey });
  }
  return rows;
}

export function gscAiOverviewEvent(row: GscAiOverviewRow): {
  event: string;
  distinctId: string;
  timestamp: string;
  insertId: string;
  properties: Record<string, unknown>;
} {
  const timestamp = row.date ? `${row.date}T12:00:00Z` : new Date().toISOString();
  return {
    event: GSC_AI_OVERVIEW_EVENT,
    distinctId: "gsc:omentir.com",
    timestamp,
    insertId: row.rowKey,
    properties: {
      $process_person_profile: false,
      $lib: "omentir-gsc-import",
      gsc_date: row.date,
      gsc_page: row.page,
      gsc_appearance: row.appearance,
      gsc_impressions: row.impressions,
      gsc_clicks: row.clicks,
      gsc_ctr: row.ctr,
      gsc_position: row.position,
    },
  };
}
