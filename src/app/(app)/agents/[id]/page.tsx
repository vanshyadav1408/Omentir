import { auth } from "@/lib/server/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { createPageMetadata } from "@/app/seo";
import {
  getAgent,
  listAgentLeads,
  listCampaignEnrollmentPreviews,
  listCampaigns,
  listLinkedInAccounts,
} from "@/lib/server/data";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { loadAgentStatusFacts } from "@/lib/server/agent-status";
import { listScheduledActions, type ScheduledAction } from "@/lib/server/scheduled-actions";
import type { Agent, Campaign, CampaignEnrollmentPreview, CampaignStep, Lead } from "@/lib/server/types";
import {
  agentModeLabel,
  describeAgentStatus,
  formatStatusTime,
  type AgentSendKind,
  type AgentStatusFacts,
  type AgentStatusLine,
} from "@/lib/agent-status";
import {
  STAGE_ACCEPTED,
  STAGE_CONTACTED,
  STAGE_MESSAGED,
  STAGE_REPLIED,
  enrollmentProgressStage,
  leadStage,
} from "@/lib/outreach-stage";
import { formatZonedDate } from "@/lib/time-zone";
import { AgentActionsSkeleton, AgentLeadsSkeleton, AgentOverviewSkeleton } from "@/app/app-skeletons";
import { LeadAvatar } from "@/app/lead-avatar";
import ActivityDashboard from "../../actions/activity-dashboard";
import { AgentStatusPill } from "../agent-status-pill";
import { AgentStartedToast } from "../agent-started-toast";

export const metadata = createPageMetadata({
  title: "Agent - Omentir",
  description: "Everything one Omentir agent does: lead search schedule, outreach, results and upcoming actions.",
  path: "/agents",
  noIndex: true,
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "actions", label: "Actions" },
  { id: "leads", label: "Leads" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const DAY_MS = 86_400_000;
const LEADS_SHOWN = 100;

const STATUS_DOT: Record<AgentStatusLine["tone"], string> = {
  active: "bg-emerald-500",
  waiting: "bg-amber-500",
  paused: "bg-zinc-400",
  stopped: "bg-red-500",
};

const STATUS_LABEL: Record<AgentStatusLine["tone"], string> = {
  active: "text-emerald-700",
  waiting: "text-amber-700",
  paused: "text-zinc-800",
  stopped: "text-red-700",
};

const STAGE_LABEL = ["Not contacted", "Invited", "Accepted", "Messaged", "Replied"];

const SEND_NOUN: Record<AgentSendKind, string> = {
  invite: "Connection request",
  message: "Message",
  reply: "Reply",
};

const SEND_WINDOW_LABEL: Record<NonNullable<Campaign["sendWindow"]>, string> = {
  always: "Any time of day",
  business: "Weekdays, 9 AM to 6 PM their time",
  extended: "Every day, 7 AM to 10 PM their time",
};

const REPLY_HANDLING_LABEL: Record<NonNullable<Campaign["replyHandling"]>, string> = {
  handoff: "You take over after the first reply",
  ai: "AI replies until they show interest",
  ai_until_interest: "AI replies until they show interest",
  ai_until_booked: "AI replies until a meeting is booked",
};

// Tile count to columns on wide screens, so a fifth tile never wraps alone.
const UPCOMING_COLUMNS = ["", "", "xl:grid-cols-2", "xl:grid-cols-3", "xl:grid-cols-4", "xl:grid-cols-5"];

const CAMPAIGN_STATUS_LABEL: Record<Campaign["status"], string> = {
  active: "Running",
  paused: "Paused",
  draft: "Draft",
};

export default async function AgentPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab: tabParam }] = await Promise.all([props.params, props.searchParams]);
  const tab: Tab = TABS.some((item) => item.id === tabParam) ? (tabParam as Tab) : "overview";
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }

  const workspace = await resolveActiveWorkspace(userId);
  const agent = await getAgent(workspace.id, id);
  if (!agent) return notFound();

  // The header needs only the agent doc, so it paints right away; each tab
  // streams in behind its own skeleton and reads only what it shows.
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden md:mr-0.5 md:pb-3">
      <AgentStartedToast />
      <header className="app-x shrink-0 pt-5 md:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <h1 className="min-w-0 break-words text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)]">
                {agent.name || agent.targetGroupName || "Agent"}
              </h1>
              <AgentStatusPill status={agent.status} />
            </div>
            <p className="mt-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              {agentModeLabel(agent)} · Created {formatZonedDate(agent.createdAt, workspace.timezone, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/agents" className="m3-btn m3-btn-outlined h-8 px-2.5 text-xs">
              Back
            </Link>
            <Link href={`/agents/new?id=${agent.id}`} className="m3-btn m3-btn-filled h-8 px-2.5 text-xs">
              Edit
            </Link>
          </div>
        </div>
        <nav aria-label="Agent sections" className="mt-5 flex gap-6 border-b border-[var(--md-sys-color-outline-variant)]">
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <Link
                key={item.id}
                href={item.id === "overview" ? `/agents/${agent.id}` : `/agents/${agent.id}?tab=${item.id}`}
                aria-current={active ? "page" : undefined}
                className={`-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-[var(--md-sys-color-on-surface)] text-[var(--md-sys-color-on-surface)]"
                    : "border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {tab === "actions" ? (
        // The queue sizes itself to the space left, with its own scrolling
        // list and detail panel, as on the Actions page.
        <div className="flex min-h-0 flex-1 flex-col pt-4">
          <Suspense fallback={<AgentActionsSkeleton />}>
            <AgentQueue workspaceId={workspace.id} agentId={agent.id} timezone={workspace.timezone} />
          </Suspense>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pb-6 pt-5">
          {tab === "leads" ? (
            <Suspense fallback={<AgentLeadsSkeleton />}>
              <AgentLeads agent={agent} workspaceId={workspace.id} timezone={workspace.timezone} />
            </Suspense>
          ) : (
            <Suspense fallback={<AgentOverviewSkeleton />}>
              <AgentOverview
                agent={agent}
                workspaceId={workspace.id}
                timezone={workspace.timezone}
                subscriptionActive={hasActiveSubscription(workspace)}
              />
            </Suspense>
          )}
        </div>
      )}
    </div>
  );
}

async function AgentOverview({
  agent,
  workspaceId,
  timezone,
  subscriptionActive,
}: {
  agent: Agent;
  workspaceId: string;
  timezone?: string;
  subscriptionActive: boolean;
}) {
  const [statusFacts, leads, enrollments, campaigns, accounts, queue] = await Promise.all([
    loadAgentStatusFacts(workspaceId, agent.id),
    listAgentLeads(workspaceId, agent.id),
    listCampaignEnrollmentPreviews(workspaceId),
    listCampaigns(workspaceId),
    listLinkedInAccounts(workspaceId),
    listScheduledActions(workspaceId, { agentId: agent.id }),
  ]);
  const nowMs = new Date().getTime();
  const formatAt = (iso: string) => formatStatusTime(iso, timezone, nowMs);

  // The status facts read the campaign on the agent's group, but the agent's
  // leads can sit in another campaign. Its own queue (the Actions tab) is what
  // will actually send, so next send and the waiting count come from there.
  const groupFacts = statusFacts[agent.id];
  const nextAction = nextQueuedAction(queue, Boolean(groupFacts?.inviteLimitUntil));
  const waiting = queue.filter((action) => action.awaitingConnection).length;
  const facts: AgentStatusFacts | undefined = groupFacts && {
    ...groupFacts,
    nextSend: nextAction && { kind: sendKind(nextAction), at: nextAction.at },
    awaitingAcceptance: waiting,
  };
  const status = facts ? describeAgentStatus(facts, { subscriptionActive, nowMs, formatAt }) : null;

  const leadIds = new Set(leads.map((lead) => lead.id));
  const agentEnrollments = enrollments.filter((item) => leadIds.has(item.leadId));
  const campaign = contactingCampaign(agent, campaigns, agentEnrollments);
  const accountId = campaign?.linkedInAccountId ?? agent.linkedInAccountId;
  const account = accounts.find((item) => item.id === accountId) ?? accounts[0];

  const stageOf = leadStages(agent, agentEnrollments);
  const stages = leads.map(stageOf);
  const atLeast = (stage: number) => stages.filter((value) => value >= stage).length;
  const contacted = atLeast(STAGE_CONTACTED);
  const accepted = atLeast(STAGE_ACCEPTED);
  const messaged = atLeast(STAGE_MESSAGED);
  const replied = atLeast(STAGE_REPLIED);
  const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
  const foundThisWeek = leads.filter((lead) => nowMs - Date.parse(lead.createdAt) < 7 * DAY_MS).length;

  const findsLeads = agent.mode !== "outreach";
  const sends = !agent.leadsOnly;
  const results = [
    { label: "Leads found", value: leads.length, note: `${foundThisWeek} this week` },
    ...(sends
      ? [
          { label: "Contacted", value: contacted, note: `${percent(contacted, leads.length)}% of leads` },
          { label: "Accepted", value: accepted, note: `${percent(accepted, contacted)}% accepted` },
          { label: "Messaged", value: messaged, note: `${percent(messaged, leads.length)}% of leads` },
          // Only messaged leads can reply, so they are the reply-rate denominator.
          { label: "Replied", value: replied, note: `${percent(replied, messaged)}% replied` },
        ]
      : []),
  ];

  const upcoming: { label: string; value: string; detail: string; warn?: boolean }[] = [];
  if (findsLeads) upcoming.push({ label: "Next lead search", ...nextSearch(agent, timezone, formatAt) });
  if (sends) {
    upcoming.push(
      nextAction
        ? {
            label: "Next send",
            value: capitalize(formatAt(nextAction.at)),
            detail: `${SEND_NOUN[sendKind(nextAction)]} to ${nextAction.lead?.name || "a lead"}`,
          }
        : {
            label: "Next send",
            value: "Nothing queued",
            detail: facts?.inviteLimitUntil ? "Invites wait for the LinkedIn limit to end" : "No invite or message is waiting to go out",
          },
      {
        label: "Waiting on acceptance",
        value: `${waiting} ${waiting === 1 ? "invite" : "invites"}`,
        detail: waiting ? "Follow-ups go out once they accept" : "No open invites",
      },
    );
  }
  if (findsLeads) {
    upcoming.push({
      label: "Last lead search",
      value: agent.lastRunAt ? capitalize(formatAt(agent.lastRunAt)) : "Not run yet",
      detail: `${foundThisWeek} ${foundThisWeek === 1 ? "lead" : "leads"} found this week`,
    });
  }
  if (sends && facts?.inviteLimitUntil) {
    upcoming.push({
      label: "LinkedIn invite limit",
      value: `Until ${formatAt(facts.inviteLimitUntil)}`,
      detail: "Messages still go out, invites wait",
      warn: true,
    });
  }

  return (
    <div className="app-x flex flex-col gap-4">
      {status ? (
        <section className="m3-card m3-card-outlined flex items-start gap-3 px-5 py-4">
          <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[status.tone]}`} aria-hidden="true" />
          <div className="min-w-0">
            <p className={`text-base font-semibold ${STATUS_LABEL[status.tone]}`}>{status.label}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]">{status.text}</p>
          </div>
        </section>
      ) : null}

      <section aria-label="Coming up" className={`grid grid-cols-2 gap-3 ${UPCOMING_COLUMNS[upcoming.length]}`}>
        {upcoming.map((item) => (
          <div key={item.label} className="m3-card m3-card-outlined p-4">
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">{item.label}</p>
            <p className={`mt-1.5 text-lg font-semibold leading-snug ${item.warn ? "text-amber-700" : "text-[var(--md-sys-color-on-surface)]"}`}>
              {item.value}
            </p>
            <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">{item.detail}</p>
          </div>
        ))}
      </section>

      <Panel title="Results" subtitle="Counted from the leads this agent found.">
        <div className={`grid grid-cols-2 gap-x-6 gap-y-5 ${sends ? "sm:grid-cols-3 lg:grid-cols-5" : ""}`}>
          {results.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">{item.label}</p>
              <p className="stat-value mt-1 text-[var(--md-sys-color-on-surface)]">{item.value}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--md-sys-color-surface-container-high)]">
                <div
                  className="h-full rounded-full bg-[var(--md-sys-color-primary)]"
                  style={{ width: `${percent(item.value, leads.length)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">{item.note}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title="How it finds leads">
          <LeadFinding agent={agent} timezone={timezone} />
        </Panel>
        <Panel title="How it reaches out">
          <Outreach agent={agent} campaign={campaign} accountName={account?.displayName} />
        </Panel>
      </div>
    </div>
  );
}

function LeadFinding({ agent, timezone }: { agent: Agent; timezone?: string }) {
  if (agent.mode === "outreach") {
    return (
      <p className="text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]">
        This agent doesn&apos;t search. It contacts the leads already in {agent.targetGroupName || "its group"}.
      </p>
    );
  }

  const { filters, signalSources } = agent;
  const chipGroups = [
    { label: "Job titles", items: filters?.titles ?? [] },
    { label: "Industries", items: filters?.industries ?? [] },
    { label: "Locations", items: filters?.locations ?? [] },
    { label: "Keywords", items: filters?.keywords ?? [] },
    { label: "Words in their posts", items: signalSources?.keywords ?? [] },
    { label: "Competitor pages", items: (signalSources?.competitorUrls ?? []).map(shortUrl) },
    { label: "Founder pages", items: (signalSources?.founderUrls ?? []).map(shortUrl) },
  ].filter((group) => group.items.length);

  return (
    <div className="flex flex-col gap-4">
      {agent.prompt?.trim() ? (
        <div>
          <FieldLabel>Looking for</FieldLabel>
          <p className="mt-1 text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]">{agent.prompt.trim()}</p>
        </div>
      ) : null}
      {chipGroups.map((group) => (
        <div key={group.label}>
          <FieldLabel>{group.label}</FieldLabel>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {group.items.map((item) => (
              <li
                key={item}
                className="rounded-md bg-[var(--md-sys-color-surface-container-high)] px-2 py-1 text-xs text-[var(--md-sys-color-on-surface)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <Facts>
        <Fact label="Schedule">{searchSchedule(agent, timezone)}</Fact>
        <Fact label="Saves leads to">{agent.targetGroupName || "No group"}</Fact>
      </Facts>
      {/* The refill in runAgents: short days get up to 4 runs, 30 minutes apart. */}
      <p className="text-xs leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
        If a search finds fewer leads than the day&apos;s target, it searches again 30 minutes later, up to 4 times a day.
      </p>
    </div>
  );
}

function Outreach({ agent, campaign, accountName }: { agent: Agent; campaign?: Campaign; accountName?: string }) {
  if (agent.leadsOnly) {
    return (
      <p className="text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]">
        This agent finds leads and stops. It never contacts anyone.
      </p>
    );
  }
  if (!campaign) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]">
          No outreach is set up for {agent.targetGroupName || "this agent's group"}, so nobody gets contacted.
        </p>
        <Link href={`/agents/new?id=${agent.id}`} className="m3-btn m3-btn-outlined h-8 px-2.5 text-xs">
          Set up outreach
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="min-w-0 text-sm font-semibold text-[var(--md-sys-color-on-surface)] hover:underline"
        >
          {campaign.name}
        </Link>
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
            campaign.status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]"
          }`}
        >
          {CAMPAIGN_STATUS_LABEL[campaign.status]}
        </span>
      </div>
      <StepTimeline steps={campaign.steps} />
      <Facts>
        <Fact label="Sends from">{accountName || "No connected LinkedIn account"}</Fact>
        <Fact label="Send hours">{SEND_WINDOW_LABEL[campaign.sendWindow ?? "always"]}</Fact>
        {campaign.replyHandling ? <Fact label="Replies">{REPLY_HANDLING_LABEL[campaign.replyHandling]}</Fact> : null}
      </Facts>
    </div>
  );
}

// Wait steps fold into the step after them as "1 day later", so the list reads
// as what gets sent and when.
function StepTimeline({ steps }: { steps: CampaignStep[] }) {
  const sent: { id: string; title: string; detail: string; after: number }[] = [];
  let waited = 0;
  let messages = 0;
  for (const step of steps) {
    if (step.type === "wait") {
      waited += step.delayMinutes;
      continue;
    }
    if (step.type === "connect") {
      sent.push({
        id: step.id,
        title: "Connection request",
        detail: step.includeNote ? "With a note" : "No note",
        after: waited,
      });
    } else {
      messages += 1;
      sent.push({
        id: step.id,
        title: `Message ${messages}`,
        detail: step.messageTemplate.trim() ? "Your template" : "AI writes it when it's due",
        after: waited,
      });
    }
    waited = 0;
  }
  if (!sent.length) return <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">No steps yet.</p>;

  return (
    <ol className="flex flex-col">
      {sent.map((step, index) => (
        <li key={step.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--md-sys-color-outline-variant)] text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
              {index + 1}
            </span>
            {index < sent.length - 1 ? <span className="w-px flex-1 bg-[var(--md-sys-color-outline-variant)]" aria-hidden="true" /> : null}
          </div>
          <div className={`min-w-0 flex-1 ${index < sent.length - 1 ? "pb-4" : ""}`}>
            <p className="text-sm font-medium leading-6 text-[var(--md-sys-color-on-surface)]">{step.title}</p>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {index === 0 ? "First step" : `${durationLabel(step.after)} later`} · {step.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

async function AgentLeads({ agent, workspaceId, timezone }: { agent: Agent; workspaceId: string; timezone?: string }) {
  const [leads, enrollments] = await Promise.all([
    listAgentLeads(workspaceId, agent.id),
    listCampaignEnrollmentPreviews(workspaceId),
  ]);
  const leadIds = new Set(leads.map((lead) => lead.id));
  const stageOf = leadStages(agent, enrollments.filter((item) => leadIds.has(item.leadId)));
  const shown = [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, LEADS_SHOWN);

  return (
    <div className="app-x">
      <section className="m3-card m3-card-outlined overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)] px-5 py-3.5">
          <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
            {leads.length > shown.length
              ? `Newest ${shown.length} of ${leads.length} leads`
              : `${leads.length} ${leads.length === 1 ? "lead" : "leads"}`}
          </p>
          <Link href="/leads" className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline">
            Open Leads
          </Link>
        </div>
        {shown.length ? (
          <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]">
            {shown.map((lead) => {
              const stage = stageOf(lead);
              return (
                <li key={lead.id} className="flex items-center gap-3 px-5 py-3">
                  <LeadAvatar
                    name={lead.name}
                    avatarUrl={lead.avatarUrl}
                    leadId={lead.id}
                    className="h-9 w-9 bg-[#f8e8ef]"
                    initialsClassName="text-[11px] font-bold text-[#ba3871]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--md-sys-color-on-surface)]">{lead.name}</p>
                    <p className="truncate text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      {[lead.title, lead.company].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        stage >= STAGE_REPLIED
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]"
                      }`}
                    >
                      {STAGE_LABEL[stage]}
                    </span>
                    <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      Found {formatZonedDate(lead.createdAt, timezone, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
            {agent.mode === "outreach"
              ? "This agent doesn't search, so it hasn't found anyone."
              : "No leads yet. They show up here after the first search."}
          </p>
        )}
      </section>
    </div>
  );
}

async function AgentQueue({ workspaceId, agentId, timezone }: { workspaceId: string; agentId: string; timezone?: string }) {
  const items = await listScheduledActions(workspaceId, { agentId });
  const serverNow = new Date().getTime();
  return <ActivityDashboard items={items} serverNow={serverNow} timezone={timezone} />;
}

// Same counting as the agent card: a lead's stage is the furthest of its own
// status and any of its enrollments. Leads-only agents never send, so their
// leads read as not contacted even if a shared-group enrollment points at them.
function leadStages(agent: Agent, enrollments: CampaignEnrollmentPreview[]) {
  const enrollmentStage = new Map<string, number>();
  for (const enrollment of enrollments) {
    enrollmentStage.set(
      enrollment.leadId,
      Math.max(
        enrollmentStage.get(enrollment.leadId) ?? 0,
        enrollmentProgressStage(enrollment.status, enrollment.connectionSentAt),
      ),
    );
  }
  return (lead: Lead) =>
    agent.leadsOnly ? 0 : Math.max(leadStage(lead.outreachStatus), enrollmentStage.get(lead.id) ?? 0);
}

// The campaign holding most of the agent's leads, a running one first. Falls
// back to the campaign on the agent's group before anyone is enrolled.
function contactingCampaign(agent: Agent, campaigns: Campaign[], agentEnrollments: { campaignId: string }[]) {
  const enrolled = new Map<string, number>();
  for (const { campaignId } of agentEnrollments) enrolled.set(campaignId, (enrolled.get(campaignId) ?? 0) + 1);
  const ranked = (list: Campaign[]) =>
    [...list].sort(
      (a, b) =>
        Number(b.status === "active") - Number(a.status === "active") ||
        (enrolled.get(b.id) ?? 0) - (enrolled.get(a.id) ?? 0),
    )[0];
  return ranked(campaigns.filter((campaign) => enrolled.has(campaign.id)))
    ?? ranked(campaigns.filter((campaign) => campaign.groupId === agent.targetGroupId));
}

// Rows waiting on an accepted invite have no real send time, so they never
// count as the next send. Neither do invites while LinkedIn limits them: they
// wait for the limit to end however soon their row says.
function nextQueuedAction(queue: ScheduledAction[], invitesLimited: boolean) {
  return queue
    .filter((action) => !action.awaitingConnection)
    .filter((action) => !invitesLimited || sendKind(action) !== "invite")
    .sort((a, b) => a.at.localeCompare(b.at))[0];
}

function sendKind(action: ScheduledAction): AgentSendKind {
  if (action.isReply) return "reply";
  return action.kind === "connection" ? "invite" : "message";
}

function nextSearch(agent: Agent, timezone: string | undefined, formatAt: (iso: string) => string) {
  const schedule = searchSchedule(agent, timezone);
  if (agent.status === "running") return { value: "Searching now", detail: schedule };
  if (agent.status === "paused") return { value: "Paused", detail: "Turn the agent on to search again" };
  if (agent.status === "error") return { value: "Stopped", detail: "The last search failed", warn: true };
  if (!agent.nextRunAt) return { value: "Not scheduled", detail: schedule };
  return { value: capitalize(formatAt(agent.nextRunAt)), detail: schedule };
}

// Discovery runs once a day at the wall-clock time the agent was created
// (runAnchorAt), or at the legacy runAtHour on older agents.
function searchSchedule(agent: Agent, timezone?: string) {
  if (agent.runAnchorAt) {
    return `Every day at ${formatZonedDate(agent.runAnchorAt, timezone, { hour: "numeric", minute: "2-digit" })}`;
  }
  if (typeof agent.runAtHour === "number") {
    const hour = agent.runAtHour % 12 || 12;
    return `Every day at ${hour}:00 ${agent.runAtHour < 12 ? "AM" : "PM"}`;
  }
  return "Once a day";
}

function durationLabel(minutes: number) {
  if (minutes >= 1440 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} ${days === 1 ? "day" : "days"}`;
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  return `${minutes} min`;
}

function shortUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="m3-card m3-card-outlined min-w-0 px-5 py-4 sm:px-6 sm:py-5">
      <h2 className="section-title text-[var(--md-sys-color-on-surface)]">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="text-[12px] font-medium text-[var(--md-sys-color-on-surface-variant)]">{children}</p>;
}

// Short label-value pairs, label left and value right, on a divided list.
function Facts({ children }: { children: ReactNode }) {
  return (
    <dl className="divide-y divide-[var(--md-sys-color-outline-variant)] border-t border-[var(--md-sys-color-outline-variant)]">
      {children}
    </dl>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-[var(--md-sys-color-on-surface-variant)]">{label}</dt>
      <dd className="min-w-0 text-right text-[var(--md-sys-color-on-surface)]">{children}</dd>
    </div>
  );
}
