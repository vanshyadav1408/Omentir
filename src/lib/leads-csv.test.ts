import { describe, expect, test } from "bun:test";
import { buildLeadsCsv, type LeadCsvRow } from "./leads-csv";

function lead(overrides: Partial<LeadCsvRow> = {}): LeadCsvRow {
  return {
    id: "lead-1",
    groupIds: ["g1"],
    linkedInUrl: "https://www.linkedin.com/in/jane",
    name: "Jane Doe",
    title: "CEO",
    company: "Acme",
    location: "New York",
    summary: "Founder",
    fitScore: 90,
    scoreReasons: ["Matches ICP"],
    sourceAgentId: "a1",
    outreachStatus: "new",
    createdAt: "2026-09-17T23:30:00.000Z",
    updatedAt: "2026-09-17T23:30:00.000Z",
    ...overrides,
  };
}

describe("buildLeadsCsv", () => {
  test("prefixes a formula-looking name so a spreadsheet does not execute exported lead data", () => {
    const csv = buildLeadsCsv([lead({ name: "=HYPERLINK(A1)" })], "UTC");
    expect(csv).toContain("'=HYPERLINK(A1)");
    expect(csv.startsWith("=HYPERLINK")).toBe(false);
  });

  // The Leads page list stopped loading these two fields to cut its payload,
  // so the export reads full leads. Losing them here would silently empty two
  // columns customers rely on.
  test("keeps the fit reasons and summary that the Leads list no longer loads", () => {
    const csv = buildLeadsCsv(
      [lead({ scoreReasons: ["Matches ICP", "Hiring SDRs"], summary: "Runs a 12-person sales team" })],
      "UTC",
    );
    const [, row] = csv.split("\r\n");
    expect(row).toContain("Matches ICP; Hiring SDRs");
    expect(row).toContain("Runs a 12-person sales team");
  });

  test("uses the workspace calendar day so a late-evening lead is not dated tomorrow in UTC", () => {
    const csv = buildLeadsCsv([lead()], "America/New_York");
    expect(csv).toContain("2026-09-17");
    expect(csv).not.toContain("2026-09-18");
  });
});
