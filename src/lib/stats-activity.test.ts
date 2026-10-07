import { expect, test } from "bun:test";
import { mergeActivity, type ActivityContribution } from "./stats-activity";

const at = (iso: string) => Date.parse(iso);
const sum = (rows: ActivityContribution[], metric: string, from: number, to: number) =>
  rows.filter((r) => r.metric === metric && r.at >= from && r.at < to).reduce((n, r) => n + r.count, 0);

test("a 12-hour window counts the timed hits inside it, not 0 and not the whole day's total", () => {
  // Owner saw Leads found 0 on Last 12 hours while an agent had found 29 leads in that window.
  const from = at("2026-10-07T00:00:00Z") - 4 * 3_600_000; // Oct 6 20:00
  const to = from + 12 * 3_600_000; // Oct 7 08:00
  const rows = mergeActivity(
    [{ workspaceId: "w", day: "2026-10-07", counts: { leadsFound: 50 } }],
    [
      { workspaceId: "w", metric: "leadsFound", at: at("2026-10-07T07:00:00Z") },
      { workspaceId: "w", metric: "leadsFound", at: at("2026-10-07T09:00:00Z") }, // after the window
      { workspaceId: "w", metric: "leadsFound", at: at("2026-10-06T21:00:00Z") },
    ],
    [[from - 12 * 3_600_000, from], [from, to]],
  );
  expect(sum(rows, "leadsFound", from, to)).toBe(2);
});

test("a whole day counts the larger of its stored total and its timed hits, because the stored total goes stale", () => {
  // Prod on 2026-10-07: activityDays said 0 leads found on Oct 5 while activityEvents held 215.
  const from = at("2026-10-01T00:00:00Z");
  const to = at("2026-10-08T00:00:00Z");
  const hits = Array.from({ length: 3 }, (_, i) => ({ workspaceId: "w", metric: "leadsFound" as const, at: at("2026-10-05T10:00:00Z") + i }));
  const rows = mergeActivity(
    [
      { workspaceId: "w", day: "2026-10-05", counts: { leadsFound: 0 } },
      // Older history outlives deleted leads, so a higher stored total wins.
      { workspaceId: "w", day: "2026-10-02", counts: { leadsFound: 40, replies: 2 } },
    ],
    [...hits, { workspaceId: "w", metric: "leadsFound", at: at("2026-10-02T09:00:00Z") }],
    [[from - 7 * 86_400_000, from], [from, to]],
  );
  expect(sum(rows, "leadsFound", from, to)).toBe(43);
  expect(sum(rows, "replies", from, to)).toBe(2);
});

test("on a whole day each hit stays at its own hour, so the hourly chart does not pile the day into midnight", () => {
  const from = at("2026-10-05T00:00:00Z");
  const to = at("2026-10-06T00:00:00Z");
  const rows = mergeActivity(
    [{ workspaceId: "w", day: "2026-10-05", counts: { leadsFound: 5 } }],
    [
      { workspaceId: "w", metric: "leadsFound", at: at("2026-10-05T10:15:00Z") },
      { workspaceId: "w", metric: "leadsFound", at: at("2026-10-05T10:45:00Z") },
      { workspaceId: "w", metric: "leadsFound", at: at("2026-10-05T17:00:00Z") },
    ],
    [[from - 86_400_000, from], [from, to]],
  );
  expect(sum(rows, "leadsFound", at("2026-10-05T10:00:00Z"), at("2026-10-05T11:00:00Z"))).toBe(2);
  expect(sum(rows, "leadsFound", at("2026-10-05T17:00:00Z"), at("2026-10-05T18:00:00Z"))).toBe(1);
  // The 2 stored leads with no event have no known hour; they sit at the day start and the day still totals 5.
  expect(sum(rows, "leadsFound", from, from + 1)).toBe(2);
  expect(sum(rows, "leadsFound", from, to)).toBe(5);
});

test("a lead invited by two campaigns on one day counts once as contacted, like the stored daily total", () => {
  const from = at("2026-10-07T00:00:00Z");
  const to = from + 3_600_000 * 6;
  const rows = mergeActivity(
    [],
    [
      { workspaceId: "w", metric: "leadsContacted", at: from + 1000, leadId: "lead-1" },
      { workspaceId: "w", metric: "leadsContacted", at: from + 2000, leadId: "lead-1" },
      { workspaceId: "w", metric: "leadsContacted", at: from + 3000, leadId: "lead-2" },
    ],
    [[from - 6 * 3_600_000, from], [from, to]],
  );
  expect(sum(rows, "leadsContacted", from, to)).toBe(2);
});

test("the comparison window gets its own hits, so the change arrow compares like with like", () => {
  const from = at("2026-10-07T06:00:00Z");
  const prev = from - 3_600_000;
  const rows = mergeActivity(
    [{ workspaceId: "w", day: "2026-10-07", counts: { replies: 9 } }],
    [
      { workspaceId: "w", metric: "replies", at: prev + 60_000 },
      { workspaceId: "w", metric: "replies", at: from + 60_000 },
      { workspaceId: "w", metric: "replies", at: from + 120_000 },
    ],
    [[prev, from], [from, from + 3_600_000]],
  );
  expect(sum(rows, "replies", prev, from)).toBe(1);
  expect(sum(rows, "replies", from, from + 3_600_000)).toBe(2);
});
