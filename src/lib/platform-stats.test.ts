import { describe, expect, test } from "bun:test";
import { dailyHistory, monthlyUsdFromRenewalPrice, onboardingBreakdown, whopRevenueStats, workspaceStats } from "./platform-stats";

const NOW = Date.parse("2026-09-24T12:00:00Z");

describe("monthlyUsdFromRenewalPrice", () => {
  test("normalizes Whop display prices to a monthly USD amount so yearly plans do not inflate MRR 12x", () => {
    expect(monthlyUsdFromRenewalPrice("$49.00 / month")).toBe(49);
    expect(monthlyUsdFromRenewalPrice("$1,200.00 / year")).toBe(100);
    expect(monthlyUsdFromRenewalPrice("$0.00 / month")).toBe(0);
    // One-time and non-USD memberships are not USD recurring revenue.
    expect(monthlyUsdFromRenewalPrice(null)).toBe(0);
    expect(monthlyUsdFromRenewalPrice("₹4,402.75")).toBe(0);
  });
});

describe("whopRevenueStats", () => {
  test("counts every paying tier in MRR but keeps trials, $0 promos, and churned members out", () => {
    const stats = whopRevenueStats(
      [
        { status: "active", formatted_renewal_price: "$29.00 / month", product: { title: "Omentir Monthly" } },
        { status: "active", formatted_renewal_price: "$49.00 / month", product: { title: "Pro" } },
        { status: "active", formatted_renewal_price: "$49.00 / month", cancel_at_period_end: true, product: { title: "Pro" } },
        { status: "active", formatted_renewal_price: "$20.00 / month", product: { title: "Omentir Extra Seats" } },
        { status: "active", formatted_renewal_price: "$0.00 / month", product: { title: "Omentir Extra Seats" } },
        { status: "trialing", formatted_renewal_price: "$0.00 / month", product: { title: "Pro" } },
        { status: "canceled", formatted_renewal_price: "$49.00 / month", product: { title: "Pro" } },
        { status: "completed", formatted_renewal_price: null, product: { title: "2 Backlink Placements" } },
        { status: "drafted", formatted_renewal_price: "$49.00 / month", product: { title: "Pro" } },
      ],
      [],
      NOW,
    );
    expect(stats.mrr_usd).toBe(147);
    expect(stats.arr_usd).toBe(1764);
    expect(stats.seat_mrr_usd).toBe(20);
    expect(stats.active_subscriptions).toBe(4);
    expect(stats.cancelling_subscriptions).toBe(1);
    expect(stats.trialing_subscriptions).toBe(1);
    expect(stats.churned_subscriptions).toBe(1);
    expect(stats.one_time_purchases).toBe(1);
  });

  test("sums only paid, unrefunded payments so lifetime revenue matches money actually kept", () => {
    const day = 24 * 60 * 60;
    const stats = whopRevenueStats(
      [],
      [
        { status: "paid", usd_total: 49, paid_at: String(NOW / 1000 - 2 * day) },
        { status: "paid", usd_total: "44.1", paid_at: String(NOW / 1000 - 60 * day) },
        { status: "paid", usd_total: 49, paid_at: String(NOW / 1000 - 3 * day), refunded_at: String(NOW / 1000 - day) },
        { status: "open", usd_total: 49, created_at: String(NOW / 1000 - 5 * day) },
      ],
      NOW,
    );
    expect(stats.lifetime_revenue_usd).toBe(93.1);
    expect(stats.revenue_30d_usd).toBe(49);
    expect(stats.paid_payments).toBe(2);
    expect(stats.failed_payments_30d).toBe(1);
  });
});

describe("workspaceStats", () => {
  test("counts people, not workspaces, and uses the same active-or-bypassed rule the app uses to unlock paid features", () => {
    const stats = workspaceStats(
      [
        { ownerId: "a", createdAt: "2026-06-01T00:00:00Z", billing: { provider: "whop", plan: "solo", status: "active" } },
        { ownerId: "a", createdAt: "2026-09-20T00:00:00Z", billing: { provider: "whop", plan: "solo", status: "cancelled" } },
        { ownerId: "b", createdAt: "2026-09-01T00:00:00Z", onboarding: {}, billing: { provider: "manual", plan: "enterprise", status: "bypassed" } },
        { ownerId: "c", createdAt: "2026-07-01T00:00:00Z", billing: { provider: "whop", plan: "lifetime", status: "active" } },
        { ownerId: "d", createdAt: "2026-09-23T00:00:00Z" },
      ],
      NOW,
    );
    expect(stats.users_total).toBe(4);
    expect(stats.workspaces_total).toBe(5);
    expect(stats.users_new_7d).toBe(2);
    expect(stats.users_new_30d).toBe(3);
    expect(stats.paid_users).toBe(3);
    expect(stats.paid_workspaces_pro).toBe(1);
    expect(stats.paid_workspaces_lifetime).toBe(1);
    expect(stats.paid_workspaces_enterprise).toBe(1);
    expect(stats.paid_workspaces_manual).toBe(1);
    expect(stats.workspaces_onboarded).toBe(1);
  });
});

describe("dailyHistory", () => {
  const base = {
    workspaces: [
      { ownerId: "a", createdAt: "2026-06-01T09:00:00Z" },
      { ownerId: "a", createdAt: "2026-06-03T09:00:00Z" },
      { ownerId: "b", createdAt: "2026-06-02T09:00:00Z" },
    ],
    agentCreatedAt: ["2026-06-02T10:00:00Z"],
    activityDays: [
      { day: "2026-06-02", found: 10, contacted: 3, replies: 1, meetingsBooked: 0 },
      { day: "2026-06-02", found: 5, contacted: 1, replies: 0, meetingsBooked: 1 },
    ],
    memberships: [
      // Paid from 06-01, cancelled at period end 06-03: counts in MRR through 06-02.
      { status: "canceled", formatted_renewal_price: "$49.00 / month", created_at: "2026-06-01T00:00:00Z", cancel_at_period_end: true, renewal_period_end: String(Date.parse("2026-06-03T00:00:00Z") / 1000) },
      { status: "active", formatted_renewal_price: "$29.00 / month", created_at: "2026-06-02T12:00:00Z" },
      { status: "trialing", formatted_renewal_price: "$0.00 / month", created_at: "2026-06-01T00:00:00Z" },
    ],
    payments: [{ status: "paid", usd_total: 49, paid_at: "2026-06-01T08:00:00Z" }],
  };

  test("rebuilds users, activity, and MRR per day so trend charts have history from before snapshots began", () => {
    const rows = dailyHistory({ ...base, fromDay: "2026-06-01", toDay: "2026-06-03" });
    expect(rows.map((r) => r.day)).toEqual(["2026-06-01", "2026-06-02", "2026-06-03"]);
    // A second workspace for the same person is not a new user.
    expect(rows.map((r) => r.users_total)).toEqual([1, 2, 2]);
    // activityDays rows from several workspaces add up per day.
    expect(rows[1]).toMatchObject({ leads_found: 15, leads_contacted: 4, replies: 1, meetings_booked: 1, agents_total: 1 });
    expect(rows.map((r) => r.mrr_usd)).toEqual([49, 78, 29]);
    expect(rows.map((r) => r.churned_subscriptions)).toEqual([0, 0, 1]);
    expect(rows[0]!.revenue_usd).toBe(49);
  });

  test("ends a cancel-at-period-end membership at its next billing date even when Whop reports a later period end", () => {
    // Real Whop shape: created 08-15, canceled 08-27 at period end, yet
    // renewal_period_end says 10-14. Paid access ran to 09-15.
    const rows = dailyHistory({
      ...base,
      memberships: [{
        status: "canceled", formatted_renewal_price: "$49.00 / month", cancel_at_period_end: true,
        created_at: "2026-08-15T04:56:15Z", canceled_at: "2026-08-27T20:37:41Z", renewal_period_end: "2026-10-14T04:56:15Z",
      }],
      fromDay: "2026-09-14",
      toDay: "2026-09-15",
    });
    expect(rows.map((r) => r.mrr_usd)).toEqual([49, 0]);
    expect(rows[1]!.churned_subscriptions).toBe(1);
  });

  test("starts cumulative totals from everything before the window, not from zero", () => {
    const rows = dailyHistory({ ...base, fromDay: "2026-06-03", toDay: "2026-06-03" });
    expect(rows[0]).toMatchObject({ users_total: 2, agents_total: 1, new_users: 0 });
  });
});

describe("onboardingBreakdown", () => {
  test("keeps unanswered workspaces visible so breakdown bars add up to the total", () => {
    const b = onboardingBreakdown([{ onboarding: { source: "LinkedIn", role: "Founder" } }, { onboarding: null }, { onboarding: { source: "LinkedIn" } }]);
    expect(b.users_by_source).toEqual({ LinkedIn: 2, "(not answered)": 1 });
    expect(b.users_by_role).toEqual({ Founder: 1, "(not answered)": 2 });
  });
});
