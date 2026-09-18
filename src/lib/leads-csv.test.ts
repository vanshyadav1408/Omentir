import { describe, expect, test } from "bun:test";
import { buildLeadsCsv } from "./leads-csv";
import type { LeadPreview } from "./server/types";

function lead(overrides: Partial<LeadPreview> = {}): LeadPreview {
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

  test("uses the workspace calendar day so a late-evening lead is not dated tomorrow in UTC", () => {
    const csv = buildLeadsCsv([lead()], "America/New_York");
    expect(csv).toContain("2026-09-17");
    expect(csv).not.toContain("2026-09-18");
  });
});
