import type { LeadPreview } from "@/lib/server/types";
import { zonedDayKey } from "@/lib/time-zone";

export const LEAD_OUTREACH_STATUS_LABELS: Record<LeadPreview["outreachStatus"], string> = {
  new: "New",
  invited: "Invited",
  connected: "Connected",
  messaged: "Messaged",
  replied: "Replied",
  declined: "Declined",
  stopped: "Stopped",
};

function csvCell(value: string) {
  // Prefix cells that Excel/Sheets would evaluate as formulas.
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export function buildLeadsCsv(rows: LeadPreview[], timeZone: string) {
  const header = [
    "Name",
    "Title",
    "Company",
    "Location",
    "LinkedIn URL",
    "AI Fit Score",
    "Why They're a Great Fit",
    "Summary",
    "Signal",
    "Signal URL",
    "Outreach Status",
    "Added",
  ];
  const lines = rows.map((lead) =>
    [
      lead.name,
      lead.title,
      lead.company,
      lead.location,
      lead.linkedInUrl,
      String(lead.fitScore || 0),
      (lead.scoreReasons || []).join("; "),
      lead.summary,
      lead.signalText || "",
      lead.signalUrl || "",
      LEAD_OUTREACH_STATUS_LABELS[lead.outreachStatus] || lead.outreachStatus,
      // The workspace's calendar day, not UTC's - a lead added at 11pm local
      // otherwise exports under tomorrow's date.
      zonedDayKey(lead.createdAt, timeZone),
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.map(csvCell).join(","), ...lines].join("\r\n");
}
