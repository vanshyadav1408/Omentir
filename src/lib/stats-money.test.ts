import { describe, expect, test } from "bun:test";
import { revenueByBucket, sumPayments, toStatsPayment } from "./stats-money";

const paid = {
  id: "pay_1",
  status: "paid",
  usd_total: 49,
  paid_at: "2026-09-08T01:06:49Z",
  billing_reason: "subscription_create",
  product: { title: "Pro" },
  metadata: { workspaceId: "user_abc", clerkUserId: "user_abc" },
};

describe("toStatsPayment", () => {
  test("counts a paid checkout with its real amount and links it to the workspace", () => {
    expect(toStatsPayment(paid)).toEqual({
      id: "pay_1",
      at: Date.parse("2026-09-08T01:06:49Z"),
      usd: 49,
      renewal: false,
      distinctIds: ["user_abc"],
    });
  });

  test("keeps legacy-plan renewals, which PostHog's webhook events used to drop", () => {
    const renewal = toStatsPayment({ ...paid, id: "pay_2", usd_total: 29, billing_reason: "subscription_cycle", product: { title: "Omentir Monthly" }, metadata: null });
    expect(renewal?.usd).toBe(29);
    expect(renewal?.renewal).toBe(true);
  });

  test("matches Whop's own revenue rule: refunded, unpaid and $0 payments are not revenue", () => {
    expect(toStatsPayment({ ...paid, refunded_at: "2026-09-10T00:00:00Z" })).toBeNull();
    expect(toStatsPayment({ ...paid, status: "open" })).toBeNull();
    expect(toStatsPayment({ ...paid, usd_total: 0 })).toBeNull();
  });

  test("counts one-time sales as new revenue, since the page should match everything Whop took in", () => {
    const oneTime = toStatsPayment({ ...paid, id: "pay_4", usd_total: 45, billing_reason: "one_time", product: { title: "2 Backlink Placements" }, metadata: {} });
    expect(oneTime?.usd).toBe(45);
    expect(oneTime?.renewal).toBe(false);
  });

  test("drops ids that are not plain id characters, since they are pasted into HogQL", () => {
    expect(toStatsPayment({ ...paid, metadata: { workspaceId: "x') OR 1=1 --" } })?.distinctIds).toEqual([]);
  });
});

describe("sums", () => {
  const a = { payment: toStatsPayment(paid)!, personId: "person-a" };
  const b = { payment: toStatsPayment({ ...paid, id: "pay_3", paid_at: "2026-09-08T20:00:00Z", billing_reason: "subscription_cycle" })!, personId: "person-a" };

  test("customers are people, not payments: one person paying twice is one customer", () => {
    expect(sumPayments([a, b])).toEqual({ usd: 98, customers: 1, count: 2 });
  });

  test("revenue uses the same UTC day as PostHog while keeping purchases and renewals separate", () => {
    // Both payments belong to Sep 8 in the project timezone.
    const days = revenueByBucket([a, b], "day");
    expect(days.get("2026-09-08")?.newRevenue).toBe(49);
    expect(days.get("2026-09-08")?.renewalRevenue).toBe(49);
  });
});
