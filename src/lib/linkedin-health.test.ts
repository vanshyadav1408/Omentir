import { describe, expect, test } from "bun:test";
import {
  acceptanceRate,
  acceptanceRateLevel,
  acceptanceSample,
  normalizeInviteWithdrawAfterDays,
  pendingInvitesLevel,
  staleInvitationIds,
} from "./linkedin-health";

const NOW = Date.parse("2026-09-25T00:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();

describe("staleInvitationIds", () => {
  test("withdraws only invites past the cutoff, oldest first, so the backlog clears from the least likely accepts", () => {
    const ids = staleInvitationIds(
      [
        { id: "fresh", sentAt: daysAgo(3) },
        { id: "old", sentAt: daysAgo(40) },
        { id: "oldest", sentAt: daysAgo(90) },
        { id: "edge", sentAt: daysAgo(28) },
      ],
      { nowMs: NOW, afterDays: 28, max: 50 },
    );
    expect(ids).toEqual(["oldest", "old", "edge"]);
  });

  test("never withdraws an undated invite, because guessing wrong cancels one the user just sent", () => {
    expect(
      staleInvitationIds([{ id: "undated" }], { nowMs: NOW, afterDays: 28, max: 50 }),
    ).toEqual([]);
  });

  test("off means off: zero days withdraws nothing even with a huge stale pool", () => {
    const pool = Array.from({ length: 400 }, (_, i) => ({ id: `i${i}`, sentAt: daysAgo(100) }));
    expect(staleInvitationIds(pool, { nowMs: NOW, afterDays: 0, max: 50 })).toEqual([]);
  });

  test("caps a run so a 342-invite backlog is spread over days instead of one burst", () => {
    const pool = Array.from({ length: 342 }, (_, i) => ({ id: `i${i}`, sentAt: daysAgo(60) }));
    expect(staleInvitationIds(pool, { nowMs: NOW, afterDays: 28, max: 50 })).toHaveLength(50);
  });
});

describe("normalizeInviteWithdrawAfterDays", () => {
  test("is on at 28 days for workspaces that never set it, so existing customers are protected without a backfill", () => {
    expect(normalizeInviteWithdrawAfterDays(undefined)).toBe(28);
    expect(normalizeInviteWithdrawAfterDays(null)).toBe(28);
  });

  test("an explicit 0 is the only way to turn it off", () => {
    expect(normalizeInviteWithdrawAfterDays(0)).toBe(0);
    expect(normalizeInviteWithdrawAfterDays("0")).toBe(0);
  });

  test("never goes under four weeks, which could withdraw an invite a live sequence still waits on", () => {
    expect(normalizeInviteWithdrawAfterDays(14)).toBe(28);
    expect(normalizeInviteWithdrawAfterDays("42")).toBe(42);
  });
});

describe("acceptance rate", () => {
  test("skips this week's invites, which have not had time to be answered, and anything older than the 30-day window", () => {
    const sample = acceptanceSample(
      [
        { sentAt: daysAgo(2), accepted: false },
        { sentAt: daysAgo(10), accepted: true },
        { sentAt: daysAgo(30), accepted: false },
        { sentAt: daysAgo(45), accepted: true },
        { accepted: true },
      ],
      NOW,
    );
    expect(sample).toEqual({ sent: 2, accepted: 1 });
  });

  test("an ignored or withdrawn invite counts against the rate, as it does on LinkedIn", () => {
    const invites = Array.from({ length: 40 }, (_, i) => ({ sentAt: daysAgo(14), accepted: i < 10 }));
    const { sent, accepted } = acceptanceSample(invites, NOW);
    expect(acceptanceRate(sent, accepted)).toBe(0.25);
    expect(acceptanceRateLevel(acceptanceRate(sent, accepted))).toBe("warn");
    expect(acceptanceRateLevel(acceptanceRate(40, 5))).toBe("danger");
  });

  test("too few invites gives no rate instead of a scary 0%", () => {
    expect(acceptanceRate(5, 0)).toBeNull();
    expect(acceptanceRateLevel(null)).toBe("ok");
  });
});

describe("pendingInvitesLevel", () => {
  test("flags danger before the 342-invite pool that got Vansh's account restricted", () => {
    expect(pendingInvitesLevel(150)).toBe("ok");
    expect(pendingInvitesLevel(220)).toBe("warn");
    expect(pendingInvitesLevel(342)).toBe("danger");
  });
});
