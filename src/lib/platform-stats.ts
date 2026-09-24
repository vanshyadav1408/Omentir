// Pure math behind the "platform_stats" PostHog snapshot. PostHog only holds
// events from Sep 2026 on, so all-time totals (users, paid users, MRR) are
// computed from Firestore and Whop and shipped as one snapshot event.

export type WhopMembershipLike = {
  status: string;
  formatted_renewal_price?: string | null;
  cancel_at_period_end?: boolean | null;
  product?: { title?: string | null } | null;
};

export type WhopPaymentLike = {
  status?: string | null;
  usd_total?: number | string | null;
  paid_at?: string | number | null;
  created_at?: string | number | null;
  refunded_at?: string | number | null;
};

// Whop only exposes the membership's real recurring amount (after promos) as a
// display string like "$49.00 / month". Non-USD and one-time strings return 0.
export function monthlyUsdFromRenewalPrice(formatted: string | null | undefined): number {
  if (!formatted) return 0;
  const match = formatted.match(/^\s*\$\s*([\d,]+(?:\.\d+)?)\s*(?:\/|every)?\s*(.*)$/i);
  if (!match) return 0;
  const amount = Number(match[1]!.replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const period = match[2]!.toLowerCase();
  if (period.includes("year")) return amount / 12;
  if (period.includes("week")) return (amount * 52) / 12;
  if (period.includes("month") || period === "") return amount;
  const days = period.match(/(\d+)\s*day/);
  return days ? (amount * 30) / Number(days[1]) : amount;
}

function toMs(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return NaN;
  if (typeof value === "number") return value < 1e12 ? value * 1000 : value;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric < 1e12 ? numeric * 1000 : numeric;
  return Date.parse(value);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function whopRevenueStats(
  memberships: WhopMembershipLike[],
  payments: WhopPaymentLike[],
  now = Date.now(),
) {
  let mrr = 0;
  let seatMrr = 0;
  let activeSubscriptions = 0;
  let cancelling = 0;
  for (const m of memberships) {
    // Only live, billing memberships are recurring revenue. Trials and $0
    // promos are counted separately below so they never inflate MRR.
    if (m.status !== "active" && m.status !== "past_due" && m.status !== "canceling") continue;
    const monthly = monthlyUsdFromRenewalPrice(m.formatted_renewal_price);
    if (monthly <= 0) continue;
    mrr += monthly;
    activeSubscriptions += 1;
    if (m.product?.title?.toLowerCase().includes("seat")) seatMrr += monthly;
    if (m.cancel_at_period_end || m.status === "canceling") cancelling += 1;
  }

  const day = 24 * 60 * 60 * 1000;
  let lifetimeRevenue = 0;
  let revenue30d = 0;
  let paidPayments = 0;
  let failedPayments30d = 0;
  for (const p of payments) {
    const at = toMs(p.paid_at ?? p.created_at);
    if (p.status === "paid" && !p.refunded_at) {
      const usd = Number(p.usd_total ?? 0);
      if (!Number.isFinite(usd) || usd <= 0) continue;
      lifetimeRevenue += usd;
      paidPayments += 1;
      if (now - at <= 30 * day) revenue30d += usd;
    } else if (p.status === "open" && now - toMs(p.created_at) <= 30 * day) {
      failedPayments30d += 1;
    }
  }

  return {
    mrr_usd: round2(mrr),
    arr_usd: round2(mrr * 12),
    seat_mrr_usd: round2(seatMrr),
    active_subscriptions: activeSubscriptions,
    trialing_subscriptions: memberships.filter((m) => m.status === "trialing").length,
    cancelling_subscriptions: cancelling,
    churned_subscriptions: memberships.filter((m) => m.status === "canceled" || m.status === "expired").length,
    one_time_purchases: memberships.filter((m) => m.status === "completed").length,
    lifetime_revenue_usd: round2(lifetimeRevenue),
    revenue_30d_usd: round2(revenue30d),
    paid_payments: paidPayments,
    failed_payments_30d: failedPayments30d,
  };
}

export type WorkspaceLike = {
  ownerId: string;
  createdAt: string;
  onboarding?: unknown;
  billing?: { provider: string; plan: string; status: string } | null;
};

export function workspaceStats(workspaces: WorkspaceLike[], now = Date.now()) {
  const day = 24 * 60 * 60 * 1000;
  const owners = new Set<string>();
  const newOwners7d = new Set<string>();
  const newOwners30d = new Set<string>();
  const paidOwners = new Set<string>();
  const plans: Record<string, number> = { solo: 0, lifetime: 0, startup: 0, enterprise: 0 };
  let manualPaid = 0;
  let onboarded = 0;
  for (const w of workspaces) {
    owners.add(w.ownerId);
    const age = now - Date.parse(w.createdAt);
    if (age <= 7 * day) newOwners7d.add(w.ownerId);
    if (age <= 30 * day) newOwners30d.add(w.ownerId);
    if (w.onboarding) onboarded += 1;
    // Same rule as entitlementsFor(): active or bypassed means the app treats
    // the workspace as paid.
    const paid = w.billing?.status === "active" || w.billing?.status === "bypassed";
    if (!paid) continue;
    paidOwners.add(w.ownerId);
    plans[w.billing!.plan] = (plans[w.billing!.plan] ?? 0) + 1;
    if (w.billing!.provider === "manual" || w.billing!.status === "bypassed") manualPaid += 1;
  }
  return {
    users_total: owners.size,
    workspaces_total: workspaces.length,
    users_new_7d: newOwners7d.size,
    users_new_30d: newOwners30d.size,
    workspaces_onboarded: onboarded,
    paid_users: paidOwners.size,
    paid_workspaces_pro: plans.solo ?? 0,
    paid_workspaces_lifetime: plans.lifetime ?? 0,
    paid_workspaces_startup: plans.startup ?? 0,
    paid_workspaces_enterprise: plans.enterprise ?? 0,
    paid_workspaces_manual: manualPaid,
  };
}

export type WhopMembershipHistoryLike = WhopMembershipLike & {
  created_at?: string | number | null;
  canceled_at?: string | number | null;
  renewal_period_end?: string | number | null;
};

export type ActivityDayLike = {
  day: string;
  found?: number;
  contacted?: number;
  replies?: number;
  meetingsBooked?: number;
};

const dayOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// When a finished membership stopped being recurring revenue. An immediate
// cancel stops at canceled_at. Cancel-at-period-end runs to the end of the
// billing month the cancel happened in; Whop's renewal_period_end can point a
// month past that on already-canceled memberships, so it only caps the result.
function membershipEndMs(m: WhopMembershipHistoryLike): number {
  if (m.status !== "canceled" && m.status !== "expired") return Infinity;
  const periodEnd = toMs(m.renewal_period_end);
  const canceledAt = toMs(m.canceled_at);
  if (!Number.isFinite(canceledAt)) return Number.isFinite(periodEnd) ? periodEnd : Infinity;
  if (!m.cancel_at_period_end) return canceledAt;
  const boundary = new Date(toMs(m.created_at));
  while (boundary.getTime() <= canceledAt) boundary.setUTCMonth(boundary.getUTCMonth() + 1);
  return Number.isFinite(periodEnd) ? Math.min(boundary.getTime(), periodEnd) : boundary.getTime();
}

// One row per UTC day from `fromDay` to `toDay` inclusive. Past MRR uses each
// membership's current renewal price, so a price change is applied backwards.
export function dailyHistory(input: {
  fromDay: string;
  toDay: string;
  workspaces: WorkspaceLike[];
  agentCreatedAt: string[];
  activityDays: ActivityDayLike[];
  memberships: WhopMembershipHistoryLike[];
  payments: WhopPaymentLike[];
}) {
  const firstSeen = new Map<string, string>();
  for (const w of input.workspaces) {
    // Some early workspaces predate createdAt; they cannot be placed on a day.
    if (!w.createdAt) continue;
    const d = w.createdAt.slice(0, 10);
    const prev = firstSeen.get(w.ownerId);
    if (!prev || d < prev) firstSeen.set(w.ownerId, d);
  }
  const bump = (map: Map<string, number>, key: string, by = 1) => map.set(key, (map.get(key) ?? 0) + by);
  const newUsers = new Map<string, number>();
  for (const d of firstSeen.values()) bump(newUsers, d);
  const newAgents = new Map<string, number>();
  for (const at of input.agentCreatedAt) bump(newAgents, at.slice(0, 10));
  const activity = new Map<string, { found: number; contacted: number; replies: number; meetings: number }>();
  for (const a of input.activityDays) {
    const row = activity.get(a.day) ?? { found: 0, contacted: 0, replies: 0, meetings: 0 };
    row.found += a.found ?? 0;
    row.contacted += a.contacted ?? 0;
    row.replies += a.replies ?? 0;
    row.meetings += a.meetingsBooked ?? 0;
    activity.set(a.day, row);
  }
  const revenue = new Map<string, number>();
  for (const p of input.payments) {
    if (p.status !== "paid" || p.refunded_at) continue;
    const usd = Number(p.usd_total ?? 0);
    const at = toMs(p.paid_at ?? p.created_at);
    if (Number.isFinite(usd) && usd > 0 && Number.isFinite(at)) bump(revenue, dayOf(at), usd);
  }
  const recurring = input.memberships
    .filter((m) => m.status !== "drafted" && m.status !== "trialing" && m.status !== "completed")
    .map((m) => ({ start: toMs(m.created_at), end: membershipEndMs(m), monthly: monthlyUsdFromRenewalPrice(m.formatted_renewal_price) }))
    .filter((m) => m.monthly > 0 && Number.isFinite(m.start));
  const newSubs = new Map<string, number>();
  const churned = new Map<string, number>();
  for (const m of recurring) {
    bump(newSubs, dayOf(m.start));
    if (Number.isFinite(m.end)) bump(churned, dayOf(m.end));
  }

  let users = [...firstSeen.values()].filter((d) => d < input.fromDay).length;
  let agents = input.agentCreatedAt.filter((at) => at.slice(0, 10) < input.fromDay).length;
  const rows = [];
  for (let t = Date.parse(`${input.fromDay}T00:00:00Z`); dayOf(t) <= input.toDay; t += 24 * 60 * 60 * 1000) {
    const day = dayOf(t);
    const endOfDay = t + 24 * 60 * 60 * 1000 - 1;
    users += newUsers.get(day) ?? 0;
    agents += newAgents.get(day) ?? 0;
    const live = recurring.filter((m) => m.start <= endOfDay && m.end > endOfDay);
    const a = activity.get(day);
    rows.push({
      day,
      new_users: newUsers.get(day) ?? 0,
      users_total: users,
      new_agents: newAgents.get(day) ?? 0,
      agents_total: agents,
      leads_found: a?.found ?? 0,
      leads_contacted: a?.contacted ?? 0,
      replies: a?.replies ?? 0,
      meetings_booked: a?.meetings ?? 0,
      revenue_usd: round2(revenue.get(day) ?? 0),
      new_subscriptions: newSubs.get(day) ?? 0,
      churned_subscriptions: churned.get(day) ?? 0,
      paying_subscriptions: live.length,
      mrr_usd: round2(live.reduce((s, m) => s + m.monthly, 0)),
    });
  }
  return rows;
}

// Onboarding answers as {answer: workspaces} maps for breakdown charts.
export function onboardingBreakdown(workspaces: { onboarding?: Record<string, unknown> | null }[]) {
  const out = { source: {}, role: {}, companySize: {}, goal: {} } as Record<"source" | "role" | "companySize" | "goal", Record<string, number>>;
  for (const w of workspaces) {
    for (const key of Object.keys(out) as (keyof typeof out)[]) {
      const raw = w.onboarding?.[key];
      const value = typeof raw === "string" && raw.trim() ? raw.trim() : "(not answered)";
      out[key][value] = (out[key][value] ?? 0) + 1;
    }
  }
  return {
    users_by_source: out.source,
    users_by_role: out.role,
    users_by_company_size: out.companySize,
    users_by_goal: out.goal,
  };
}
