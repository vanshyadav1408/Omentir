import "server-only";

import { PRODUCT_APP_PATH_REGEX } from "@/lib/posthog-product-paths";
import { bucketFor, type StatsInterval } from "@/lib/stats-periods";
import type {
  ProductAppData,
  ProductListRow,
  ProductListTab,
  ProductMetric,
  ProductOverviewData,
} from "@/lib/stats-types";
import { getDb } from "../firebase";
import { runHogQL } from "./posthog-query";
import { LIVE_SITE, bucketExpr } from "./queries";

// Product analytics on stats.omentir.com: what customers do inside Omentir.
// Outreach numbers come from Firestore's activityDays, the same counters the
// customer dashboard shows. They are daily, so this view has no hourly chart.
// App usage (active users, pages) comes from PostHog pageviews on app paths.

type Range = { from: Date; to: Date };

const num = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};
const str = (value: unknown) => (value == null ? "" : String(value));
// activityDays and usageDays store a plain YYYY-MM-DD; read it as an India day like the rest of the page.
const dayMs = (day: string) => Date.parse(`${day}T00:00:00+05:30`);

const PLAN_LABELS: Record<string, string> = { solo: "Pro", lifetime: "Lifetime", startup: "Startup", enterprise: "Enterprise" };
const MODE_LABELS: Record<string, string> = { signals: "Signals", outreach: "Outreach only", prompt: "Prompt", steal_customers: "Steal customers" };

type Workspace = {
  id: string;
  ownerId: string;
  name?: string;
  notificationEmail?: string;
  createdAt?: string;
  onboarding?: Record<string, unknown> | null;
  billing?: { plan?: string; status?: string } | null;
};

function tally(values: string[], unit: string, label: string): ProductListTab {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return {
    label,
    unit,
    rows: [...counts].sort((a, b) => b[1] - a[1]).map(([key, value]) => ({ key, label: key, value })),
  };
}

const answer = (w: Workspace, key: string) => {
  const raw = w.onboarding?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : "(not answered)";
};

export async function loadProductOverview(range: Range, interval: StatsInterval): Promise<ProductOverviewData> {
  const db = getDb();
  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();
  const prevMs = fromMs - (toMs - fromMs);
  const inRange = (ms: number) => ms >= fromMs && ms < toMs;
  const inPrev = (ms: number) => ms >= prevMs && ms < fromMs;

  const [workspaceSnap, agentSnap, activitySnap, accountSnap, usageSnap, conversationSnap, leadSnap] = await Promise.all([
    db.collection("workspaces").select("ownerId", "name", "notificationEmail", "createdAt", "onboarding", "billing").get(),
    db.collection("agents").select("workspaceId", "name", "mode", "status", "createdAt").get(),
    db.collection("activityDays").select("workspaceId", "day", "found", "contacted", "replies", "meetingsBooked").get(),
    db.collection("linkedinAccounts").select("accountId", "displayName", "status", "workspaceId").get(),
    db.collection("usageDays").select("accountId", "day", "profileViews").get(),
    db.collection("conversations").select("replyIntent", "replyIntentAt").get(),
    // Only this period's leads, for the per-agent ranking.
    db.collection("leads")
      .where("createdAt", ">=", range.from.toISOString())
      .where("createdAt", "<", range.to.toISOString())
      .select("sourceAgentId", "outreachStatus")
      .get(),
  ]);

  const workspaces = workspaceSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Workspace);
  const byId = new Map(workspaces.map((w) => [w.id, w]));
  const who = (workspaceId: string) => {
    const w = byId.get(workspaceId) ?? workspaces.find((x) => x.ownerId === workspaceId);
    return { label: w?.notificationEmail || w?.name || workspaceId, sub: w?.notificationEmail ? w.name : undefined };
  };

  const series = new Map<string, Record<ProductMetric, number>>();
  const zero = (): Record<ProductMetric, number> => ({ newUsers: 0, agentsCreated: 0, leadsFound: 0, leadsContacted: 0, replies: 0, meetings: 0 });
  const kpis = Object.fromEntries(
    (Object.keys(zero()) as ProductMetric[]).map((k) => [k, { current: 0, previous: 0 }]),
  ) as ProductOverviewData["kpis"];
  const add = (metric: ProductMetric, ms: number, by = 1) => {
    if (!by) return;
    if (inPrev(ms)) kpis[metric].previous += by;
    if (!inRange(ms)) return;
    kpis[metric].current += by;
    const key = bucketFor(ms, interval);
    const row = series.get(key) ?? zero();
    row[metric] += by;
    series.set(key, row);
  };

  // A user is an owner; they count as new on the day of their first workspace.
  const firstSeen = new Map<string, Workspace>();
  for (const w of workspaces) {
    if (!w.createdAt) continue;
    const prev = firstSeen.get(w.ownerId);
    if (!prev || w.createdAt < prev.createdAt!) firstSeen.set(w.ownerId, w);
  }
  const newcomers: Workspace[] = [];
  for (const w of firstSeen.values()) {
    const ms = Date.parse(w.createdAt!);
    add("newUsers", ms);
    if (inRange(ms)) newcomers.push(w);
  }

  const agents = agentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as { id: string; workspaceId: string; name?: string; mode?: string; status?: string; createdAt?: string });
  const agentsByWorkspace = new Map<string, number>();
  for (const a of agents) {
    const ms = Date.parse(a.createdAt ?? "");
    if (!Number.isFinite(ms)) continue;
    add("agentsCreated", ms);
    if (inRange(ms)) agentsByWorkspace.set(a.workspaceId, (agentsByWorkspace.get(a.workspaceId) ?? 0) + 1);
  }

  const perWorkspace = new Map<string, { found: number; contacted: number; replies: number; meetings: number }>();
  for (const doc of activitySnap.docs) {
    const d = doc.data();
    const ms = dayMs(str(d.day));
    const found = num(d.found);
    const contacted = num(d.contacted);
    const replies = num(d.replies);
    const meetings = num(d.meetingsBooked);
    add("leadsFound", ms, found);
    add("leadsContacted", ms, contacted);
    add("replies", ms, replies);
    add("meetings", ms, meetings);
    if (!inRange(ms)) continue;
    const row = perWorkspace.get(str(d.workspaceId)) ?? { found: 0, contacted: 0, replies: 0, meetings: 0 };
    row.found += found;
    row.contacted += contacted;
    row.replies += replies;
    row.meetings += meetings;
    perWorkspace.set(str(d.workspaceId), row);
  }

  const userRows = (pick: (r: { found: number; contacted: number; replies: number }) => number): ProductListRow[] =>
    [...perWorkspace]
      .map(([id, r]) => ({
        key: id,
        ...who(id),
        value: pick(r),
        tip: [
          ["Leads found", r.found],
          ["Contacted", r.contacted],
          ["Replies", r.replies],
          ["Meetings", r.meetings],
          ["Agents created", agentsByWorkspace.get(id) ?? 0],
        ] as [string, number][],
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);

  // Leads each agent found this period, and how many of them were contacted.
  const perAgent = new Map<string, { found: number; contacted: number }>();
  for (const doc of leadSnap.docs) {
    const id = str(doc.get("sourceAgentId"));
    if (!id) continue;
    const row = perAgent.get(id) ?? { found: 0, contacted: 0 };
    row.found += 1;
    if (str(doc.get("outreachStatus")) && doc.get("outreachStatus") !== "new") row.contacted += 1;
    perAgent.set(id, row);
  }
  const agentById = new Map(agents.map((a) => [a.id, a]));
  const topAgents: ProductListRow[] = [...perAgent]
    .map(([id, r]) => {
      const a = agentById.get(id);
      return {
        key: id,
        label: a?.name || "(deleted agent)",
        sub: a ? who(a.workspaceId).label : undefined,
        value: r.found,
        tip: [["Leads found", r.found], ["Contacted", r.contacted]] as [string, number][],
      };
    })
    .sort((a, b) => b.value - a.value);

  const found = kpis.leadsFound.current;
  const contacted = kpis.leadsContacted.current;
  const replies = kpis.replies.current;
  const meetings = kpis.meetings.current;
  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 1000) / 10}% of the step before` : undefined);
  const funnel: ProductListRow[] = [
    { key: "found", label: "Leads found", value: found },
    { key: "contacted", label: "Contacted", sub: pct(contacted, found), value: contacted },
    { key: "replies", label: "Replied", sub: pct(replies, contacted), value: replies },
    { key: "meetings", label: "Meetings booked", sub: pct(meetings, replies), value: meetings },
  ];
  const intents = conversationSnap.docs
    .filter((doc) => inRange(Date.parse(str(doc.get("replyIntentAt")))))
    .map((doc) => str(doc.get("replyIntent")).replace(/_/g, " ") || "(unclassified)");

  const accounts = new Map(accountSnap.docs.map((doc) => [str(doc.get("accountId")), doc.data()]));
  const views = new Map<string, { views: number; days: number }>();
  for (const doc of usageSnap.docs) {
    if (!inRange(dayMs(str(doc.get("day"))))) continue;
    const id = str(doc.get("accountId"));
    const row = views.get(id) ?? { views: 0, days: 0 };
    row.views += num(doc.get("profileViews"));
    row.days += 1;
    views.set(id, row);
  }
  const viewRows: ProductListRow[] = [...views]
    .map(([id, r]) => {
      const account = accounts.get(id);
      return {
        key: id,
        label: str(account?.displayName) || id,
        sub: account ? `${who(str(account.workspaceId)).label} · ${str(account.status)}` : undefined,
        value: r.views,
        tip: [["Profile views", r.views], ["Days used", r.days]] as [string, number][],
      };
    })
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  const paid = (w: Workspace) => w.billing?.status === "active" || w.billing?.status === "bypassed";
  return {
    kpis,
    series: [...series].sort(([a], [b]) => a.localeCompare(b)).map(([bucket, row]) => ({ bucket, ...row })),
    users: [
      { label: "Contacted", unit: "Contacted", rows: userRows((r) => r.contacted) },
      { label: "Leads found", unit: "Leads", rows: userRows((r) => r.found) },
      { label: "Replies", unit: "Replies", rows: userRows((r) => r.replies) },
    ],
    agents: [
      { label: "Top agents", unit: "Leads", rows: topAgents },
      { ...tally(agents.map((a) => a.status ?? "(none)"), "Agents", "Status now") },
      { ...tally(agents.map((a) => MODE_LABELS[a.mode ?? ""] ?? a.mode ?? "(none)"), "Agents", "Type") },
    ],
    outreach: [
      { label: "Funnel", unit: "Count", rows: funnel },
      tally(intents, "Replies", "Reply intent"),
    ],
    customers: [
      tally(newcomers.map((w) => (paid(w) ? PLAN_LABELS[w.billing?.plan ?? ""] ?? w.billing?.plan ?? "Paid" : "Free")), "Users", "Plan"),
      tally(newcomers.map((w) => answer(w, "source")), "Users", "Source"),
      tally(newcomers.map((w) => answer(w, "role")), "Users", "Role"),
      tally(newcomers.map((w) => answer(w, "companySize")), "Users", "Company size"),
    ],
    linkedin: [
      { label: "Profile views", unit: "Views", rows: viewRows },
      tally(accountSnap.docs.map((doc) => str(doc.get("status")) || "(none)"), "Accounts", "Accounts now"),
    ],
  };
}

// ------------------------------------------------------------------ PostHog

const F = "{filters.dateRange.from}";
const T = "{filters.dateRange.to}";
const PREV = `${F} - toIntervalSecond(dateDiff('second', ${F}, ${T}))`;
const APP_VIEWS = `event = '$pageview' AND ${LIVE_SITE} AND match(toString(properties.$pathname), '${PRODUCT_APP_PATH_REGEX}')`;
// Record ids in app URLs (/agents/abc123...) would split one page into hundreds of rows.
const APP_PAGE = "replaceRegexpAll(toString(properties.$pathname), '/[A-Za-z0-9_-]{12,}', '/:id')";
const SYSTEM_EVENTS = "('platform_daily', 'platform_stats', 'posthog_setup_check', 'survey shown', 'survey dismissed', 'survey sent')";

export async function loadProductApp(range: Range, interval: StatsInterval): Promise<ProductAppData> {
  const [kpi, chart, online, users, pages, events] = await Promise.all([
    runHogQL(`SELECT uniqIf(person_id, timestamp >= ${F}), uniqIf(person_id, timestamp < ${F})
FROM events WHERE ${APP_VIEWS} AND {filters} AND timestamp >= ${PREV} AND timestamp < ${T}`, range),
    runHogQL(`SELECT ${bucketExpr(interval)} AS bucket, uniq(person_id)
FROM events WHERE ${APP_VIEWS} AND {filters} AND timestamp >= ${F} AND timestamp < ${T}
GROUP BY bucket ORDER BY bucket LIMIT 5000`, range),
    runHogQL(`SELECT uniq(person_id) FROM events WHERE ${APP_VIEWS} AND {filters} AND timestamp > now() - INTERVAL 5 MINUTE`, range),
    runHogQL(`SELECT coalesce(nullIf(toString(person.properties.email), ''), toString(person_id)) AS who,
  count() AS views, uniq(toDate(toTimeZone(timestamp, 'Asia/Kolkata'))) AS days, uniq(\`$session_id\`) AS sessions
FROM events WHERE ${APP_VIEWS} AND {filters} AND timestamp >= ${F} AND timestamp < ${T}
GROUP BY who ORDER BY views DESC LIMIT 100`, range),
    runHogQL(`SELECT ${APP_PAGE} AS page, uniq(person_id) AS people, count() AS views
FROM events WHERE ${APP_VIEWS} AND {filters} AND timestamp >= ${F} AND timestamp < ${T}
GROUP BY page ORDER BY people DESC, views DESC LIMIT 100`, range),
    runHogQL(`SELECT event, count() AS times, uniq(person_id) AS people
FROM events WHERE {filters} AND event NOT LIKE '$%' AND event NOT IN ${SYSTEM_EVENTS} AND timestamp >= ${F} AND timestamp < ${T}
GROUP BY event ORDER BY times DESC LIMIT 100`, range),
  ]);
  const [current, previous] = (kpi.results[0] ?? []).map(num);
  return {
    activeUsers: { current: current ?? 0, previous: previous ?? 0 },
    activeNow: num(online.results[0]?.[0]),
    series: chart.results.map((row) => ({ bucket: str(row[0]), activeUsers: num(row[1]) })),
    users: users.results.map((row) => ({
      key: str(row[0]),
      label: str(row[0]),
      value: num(row[1]),
      tip: [["Page views", num(row[1])], ["Days active", num(row[2])], ["Sessions", num(row[3])]],
    })),
    pages: pages.results.map((row) => ({
      key: str(row[0]),
      label: str(row[0]),
      value: num(row[1]),
      tip: [["Users", num(row[1])], ["Views", num(row[2])]],
    })),
    events: events.results.map((row) => ({
      key: str(row[0]),
      label: str(row[0]).replace(/_/g, " "),
      value: num(row[1]),
      tip: [["Times", num(row[1])], ["People", num(row[2])]],
    })),
  };
}
