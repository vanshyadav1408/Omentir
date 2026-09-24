import "server-only";

import { AggregateField } from "firebase-admin/firestore";
import { isLocalMode } from "@/lib/runtime-mode";
import { capturePostHogEvent } from "@/lib/posthog-server";
import {
  dailyHistory,
  onboardingBreakdown,
  whopRevenueStats,
  workspaceStats,
  type ActivityDayLike,
  type WhopMembershipHistoryLike,
  type WhopPaymentLike,
  type WorkspaceLike,
} from "@/lib/platform-stats";
import { claimSystemTask } from "./data";
import { getDb } from "./firebase";
import { getWhopClient } from "./whop";

// Feeds the PostHog "Overall Statistics" dashboard. PostHog events only start
// in Sep 2026, so all-time totals come from Firestore and Whop instead.
export const PLATFORM_STATS_EVENT = "platform_stats";
// One row per finished UTC day, for trend charts that predate the snapshots.
export const PLATFORM_DAILY_EVENT = "platform_daily";
const PLATFORM_STATS_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function count(name: string, field?: string, value?: string) {
  const ref = getDb().collection(name);
  const query = field ? ref.where(field, "==", value) : ref;
  return (await query.count().get()).data().count;
}

async function countSince(name: string, isoSince: string) {
  return (await getDb().collection(name).where("createdAt", ">=", isoSince).count().get()).data().count;
}

// One field per query: summing several fields at once needs a composite index,
// a single-field sum uses the automatic one.
async function sum(name: string, field: string) {
  const snap = await getDb().collection(name).aggregate({ total: AggregateField.sum(field) }).get();
  return snap.data().total ?? 0;
}

async function activityTotals() {
  const [found, contacted, replies, meetings] = await Promise.all([
    sum("activityDays", "found"),
    sum("activityDays", "contacted"),
    sum("activityDays", "replies"),
    sum("activityDays", "meetingsBooked"),
  ]);
  return {
    leads_found_total: found,
    leads_contacted_total: contacted,
    replies_total: replies,
    meetings_booked_total: meetings,
  };
}

async function whopData() {
  const companyId = process.env.WHOP_COMPANY_ID;
  const memberships: WhopMembershipHistoryLike[] = [];
  const payments: WhopPaymentLike[] = [];
  if (!process.env.WHOP_API_KEY || !companyId) return null;
  const whop = getWhopClient();
  for await (const m of whop.memberships.list({ company_id: companyId, first: 100 })) memberships.push(m);
  for await (const p of whop.payments.list({ company_id: companyId, first: 100 })) payments.push(p);
  return { memberships, payments };
}

async function loadWorkspaces() {
  return (await getDb().collection("workspaces").get()).docs.map((doc) => doc.data() as WorkspaceLike & { onboarding?: Record<string, unknown> | null });
}

export async function collectPlatformStats() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const workspaces = await loadWorkspaces();

  const [
    agents, agentsActive, agentsRunning, agentsPaused, agentsError, agentsSteal,
    campaigns, campaignsActive,
    linkedInAccounts, linkedInConnected,
    leads, leads7d, leadsInvited, leadsConnected, leadsMessaged, leadsReplied,
    conversations, apiKeysActive, activity, revenue,
  ] = await Promise.all([
    count("agents"), count("agents", "status", "active"), count("agents", "status", "running"),
    count("agents", "status", "paused"), count("agents", "status", "error"), count("agents", "mode", "steal_customers"),
    count("campaigns"), count("campaigns", "status", "active"),
    count("linkedinAccounts"), count("linkedinAccounts", "status", "connected"),
    count("leads"), countSince("leads", since7d),
    count("leads", "outreachStatus", "invited"), count("leads", "outreachStatus", "connected"),
    count("leads", "outreachStatus", "messaged"), count("leads", "outreachStatus", "replied"),
    count("conversations"), count("agentApiKeys", "status", "active"),
    activityTotals(), whopData(),
  ]);

  return {
    ...workspaceStats(workspaces),
    ...onboardingBreakdown(workspaces),
    ...(revenue ? whopRevenueStats(revenue.memberships, revenue.payments) : {}),
    agents_total: agents,
    agents_active: agentsActive + agentsRunning,
    agents_paused: agentsPaused,
    agents_error: agentsError,
    agents_steal_customers: agentsSteal,
    campaigns_total: campaigns,
    campaigns_active: campaignsActive,
    linkedin_accounts_total: linkedInAccounts,
    linkedin_accounts_connected: linkedInConnected,
    leads_total: leads,
    leads_new_7d: leads7d,
    leads_status_invited: leadsInvited,
    leads_status_connected: leadsConnected,
    leads_status_messaged: leadsMessaged,
    leads_status_replied: leadsReplied,
    conversations_total: conversations,
    api_keys_active: apiKeysActive,
    ...activity,
  };
}

export async function collectDailyHistory(fromDay: string, toDay: string) {
  const [workspaces, agents, activity, whop] = await Promise.all([
    loadWorkspaces(),
    getDb().collection("agents").select("createdAt").get(),
    getDb().collection("activityDays").select("day", "found", "contacted", "replies", "meetingsBooked").get(),
    whopData(),
  ]);
  return dailyHistory({
    fromDay,
    toDay,
    workspaces,
    agentCreatedAt: agents.docs.map((doc) => String(doc.get("createdAt") ?? "")).filter(Boolean),
    activityDays: activity.docs.map((doc) => doc.data() as ActivityDayLike),
    memberships: whop?.memberships ?? [],
    payments: whop?.payments ?? [],
  });
}

export function platformDailyCapture(row: ReturnType<typeof dailyHistory>[number]) {
  return {
    event: PLATFORM_DAILY_EVENT,
    distinctId: "omentir-platform",
    insertId: `platform-daily:${row.day}`,
    timestamp: `${row.day}T12:00:00Z`,
    properties: { $process_person_profile: false, ...row },
  };
}

// Called from the automation tick. Self-hosted installs never report.
export async function sendPlatformStatsSnapshot(mode: { dryRun: boolean }) {
  if (mode.dryRun || isLocalMode()) return false;
  if (!(await claimSystemTask("platform-stats", PLATFORM_STATS_INTERVAL_MS))) return false;
  const stats = await collectPlatformStats();
  await capturePostHogEvent({
    event: PLATFORM_STATS_EVENT,
    distinctId: "omentir-platform",
    properties: { $process_person_profile: false, ...stats },
    timeoutMs: 10000,
  });
  // Yesterday is final now; each day is claimed once so it is sent once.
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (await claimSystemTask(`platform-daily-${yesterday}`, 400 * 24 * 60 * 60 * 1000)) {
    const [row] = await collectDailyHistory(yesterday, yesterday);
    if (row) await capturePostHogEvent({ ...platformDailyCapture(row), timeoutMs: 10000 });
  }
  return true;
}
