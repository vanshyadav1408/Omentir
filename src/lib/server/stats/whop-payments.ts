import "server-only";

import { toStatsPayment, type StatsPayment, type WhopPaymentRecord } from "@/lib/stats-money";
import { STATS_REFRESH_MS } from "@/lib/stats-types";
import { getWhopClient } from "@/lib/server/whop";

// Revenue for stats.omentir.com comes straight from Whop, like DataFast reads
// Stripe. PostHog's payment events missed legacy-plan renewals and once
// recorded a $0 trial as $49, and single PostHog events cannot be deleted.

let cached: { window: number; payments: Promise<StatsPayment[]> } | null = null;

/** Every Omentir payment, re-read from Whop once per 5-minute stats window. */
export function loadWhopPayments(force = false): Promise<StatsPayment[]> {
  const window = Math.floor(Date.now() / STATS_REFRESH_MS);
  // Every card asks at once when a window starts; they share one Whop listing.
  if (!force && cached?.window === window) return cached.payments;
  const payments = listWhopPayments();
  cached = { window, payments };
  payments.catch(() => {
    if (cached?.payments === payments) cached = null;
  });
  return payments;
}

async function listWhopPayments(): Promise<StatsPayment[]> {
  const companyId = process.env.WHOP_COMPANY_ID;
  if (!process.env.WHOP_API_KEY || !companyId) throw new Error("WHOP_API_KEY or WHOP_COMPANY_ID is not set.");
  const payments: StatsPayment[] = [];
  for await (const record of getWhopClient().payments.list({ company_id: companyId, first: 100 })) {
    const payment = toStatsPayment(record as unknown as WhopPaymentRecord);
    if (payment) payments.push(payment);
  }
  return payments;
}
