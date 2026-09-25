// Pure money math for stats.omentir.com: which Whop payments count as Omentir
// revenue and how they add up. The Whop fetch lives in
// src/lib/server/stats/whop-payments.ts.

import { bucketKey, type StatsInterval } from "./stats-periods";

export type StatsPayment = {
  id: string;
  /** Epoch ms when the payment was paid. */
  at: number;
  usd: number;
  /** A subscription renewal, as opposed to a first purchase. */
  renewal: boolean;
  /** Workspace or Clerk user ids from checkout metadata; links the payer to their visits. */
  distinctIds: string[];
};

export type WhopPaymentRecord = {
  id?: string;
  status?: string | null;
  usd_total?: number | string | null;
  paid_at?: string | number | null;
  created_at?: string | number | null;
  refunded_at?: string | number | null;
  billing_reason?: string | null;
  product?: { title?: string | null } | null;
  metadata?: Record<string, unknown> | null;
};

// Ids are pasted into HogQL, so only plain id characters are accepted.
const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;

function toMs(value: string | number | null | undefined) {
  if (value == null) return NaN;
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(n)) return n < 1e12 ? n * 1000 : n;
  return Date.parse(String(value));
}

/** A Whop payment as revenue, or null when it does not count. One-time sales (backlink placements) count too. */
export function toStatsPayment(record: WhopPaymentRecord): StatsPayment | null {
  if (record.status !== "paid" || record.refunded_at) return null;
  const usd = Number(record.usd_total ?? 0);
  if (!Number.isFinite(usd) || usd <= 0) return null;
  const at = toMs(record.paid_at ?? record.created_at);
  if (!Number.isFinite(at) || !record.id) return null;
  const meta = record.metadata ?? {};
  const distinctIds = [meta.workspaceId, meta.clerkUserId].filter(
    (id, i, all): id is string => typeof id === "string" && SAFE_ID.test(id) && all.indexOf(id) === i,
  );
  return { id: record.id, at, usd, renewal: record.billing_reason === "subscription_cycle", distinctIds };
}

/** Who paid: the PostHog person when linked, else the checkout id, else the payment itself. */
export function payerKey(payment: StatsPayment, personId: string | null) {
  return personId ?? payment.distinctIds[0] ?? `payment:${payment.id}`;
}

export type LinkedPayment = { payment: StatsPayment; personId: string | null };

export function sumPayments(linked: LinkedPayment[]) {
  let usd = 0;
  const payers = new Set<string>();
  for (const { payment, personId } of linked) {
    usd += payment.usd;
    payers.add(payerKey(payment, personId));
  }
  return { usd: Math.round(usd * 100) / 100, customers: payers.size, count: linked.length };
}

/** Revenue per chart bucket, split into first purchases and renewals. */
export function revenueByBucket(linked: LinkedPayment[], interval: StatsInterval) {
  const buckets = new Map<string, { newRevenue: number; renewalRevenue: number; payers: Set<string> }>();
  for (const { payment, personId } of linked) {
    const key = bucketKey(payment.at, interval);
    const bucket = buckets.get(key) ?? { newRevenue: 0, renewalRevenue: 0, payers: new Set<string>() };
    if (payment.renewal) bucket.renewalRevenue += payment.usd;
    else bucket.newRevenue += payment.usd;
    bucket.payers.add(payerKey(payment, personId));
    buckets.set(key, bucket);
  }
  return buckets;
}
