"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { setAverageTicketSizeAction } from "@/app/actions";
import AnalysisChart from "@/app/analysis-chart";
import { useSidebarResource } from "@/app/use-sidebar-resource";
import { DASHBOARD_RESOURCE, LINKEDIN_INBOX_RESOURCE } from "@/app/sidebar-early-fetch";
import NewAgentButton from "@/app/(app)/agents/new-agent-button";
import { Skeleton } from "@/app/app-skeletons";
import { useBodyScrollLock } from "@/app/use-body-scroll-lock";
import { useHydrated } from "@/app/use-hydrated";
import type {
  ActivityDay,
  Agent,
  CampaignEnrollmentPreview,
  Conversation,
  Group,
  LeadDashboardPreview,
  LinkedInInboxThread,
} from "@/lib/server/types";
import { sumAgentLeadTotals } from "@/lib/agent-lead-totals";
import {
  STAGE_CONTACTED,
  STAGE_MESSAGED,
  countAcceptedConnections,
  combinedOutreachStage,
} from "@/lib/outreach-stage";
import { toActivityDayKey } from "@/lib/activity-overview";
import { TextField } from "@/app/ui/text-field";
import { useWorkspaceTimeZone } from "@/app/workspace-time-zone";
import { formatZonedDate, zonedDayKey, zonedMonthStart } from "@/lib/time-zone";
import ActivityHeatmap, { heatmapTotal } from "./activity-heatmap";

type OverviewViewProps = {
  agents: Agent[];
  leads: LeadDashboardPreview[];
  enrollments: CampaignEnrollmentPreview[];
  conversations: Conversation[];
  linkedInThreads: LinkedInInboxThread[];
  workspace: { id: string; name: string };
  userName: string;
  averageTicketSize?: number;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type RangeKey = "7d" | "30d" | "3m" | "month";

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; caption: string; days: number }> = [
  { key: "7d", label: "7d", caption: "Last 7 days", days: 7 },
  { key: "30d", label: "30d", caption: "Last 30 days", days: 30 },
  { key: "3m", label: "3m", caption: "Last 3 months", days: 90 },
  { key: "month", label: "MTD", caption: "This month", days: 0 },
];

const selectLinkedInThreads = (data: Record<string, unknown>) =>
  data.threads as LinkedInInboxThread[] || [];
const selectDashboardData = (data: Record<string, unknown>) => ({
  agents: data.agents as Agent[] || [],
  groups: data.groups as Group[] || [],
  leads: data.leads as LeadDashboardPreview[] || [],
  enrollments: data.enrollments as CampaignEnrollmentPreview[] || [],
  conversations: data.conversations as Conversation[] || [],
  activityDays: data.activityDays as ActivityDay[] || [],
});

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1f1f1f] text-[10px] font-medium text-[var(--md-sys-color-on-surface)]">
      {initials || "?"}
    </div>
  );
}

function FitScore({ score }: { score: number }) {
  return (
    <span
      className="shrink-0 text-sm font-semibold leading-none tabular-nums text-[var(--md-sys-color-on-surface)]"
      aria-label={`Fit score ${score}`}
    >
      {score}
    </span>
  );
}

export default function OverviewView({
  agents,
  leads,
  enrollments,
  conversations,
  linkedInThreads,
  averageTicketSize,
}: OverviewViewProps) {
  const dashboardResource = useSidebarResource(
    DASHBOARD_RESOURCE,
    {
      agents,
      groups: [] as Group[],
      leads,
      enrollments,
      conversations,
      activityDays: [] as ActivityDay[],
    },
    selectDashboardData,
  );
  const {
    agents: loadedAgents,
    groups: loadedGroups,
    leads: loadedLeads,
    enrollments: loadedEnrollments,
    conversations: loadedConversations,
    activityDays: loadedActivityDays,
  } = dashboardResource.value;
  const reloadDashboard = dashboardResource.reload;
  const dashboardLoading = dashboardResource.loading;
  const linkedInInboxResource = useSidebarResource(
    LINKEDIN_INBOX_RESOURCE,
    linkedInThreads,
    selectLinkedInThreads,
  );
  const loadedLinkedInThreads = linkedInInboxResource.value;
  const reloadLinkedInInbox = linkedInInboxResource.reload;
  const repliesLoading = linkedInInboxResource.loading || dashboardLoading;
  const [range, setRange] = useState<RangeKey>("30d");
  const [now, setNow] = useState(() => Date.now());
  const timeZone = useWorkspaceTimeZone();
  const activeRange = RANGE_OPTIONS.find((option) => option.key === range) ?? RANGE_OPTIONS[1];
  const currentMonthDay = Number(zonedDayKey(now, timeZone).slice(8, 10)) || 1;
  const rangeStart = useMemo(() => {
    if (activeRange.key !== "month") {
      return now - activeRange.days * 24 * 60 * 60 * 1000;
    }
    return zonedMonthStart(now, timeZone);
  }, [activeRange, now, timeZone]);
  const chartStartDateKey = toActivityDayKey(new Date(rangeStart).toISOString()) || undefined;
  const chartEndDateKey = toActivityDayKey(new Date(now).toISOString()) || undefined;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
      reloadDashboard();
      reloadLinkedInInbox();
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [reloadDashboard, reloadLinkedInInbox]);

  // Average ticket size lives on the product profile. Mirror it locally so the
  // pipeline card updates instantly when set from the modal, before the server
  // revalidation lands.
  const [ticketSize, setTicketSize] = useState<number | undefined>(averageTicketSize);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [ticketDraft, setTicketDraft] = useState(
    averageTicketSize ? String(averageTicketSize) : "",
  );
  const [savingTicket, startSavingTicket] = useTransition();
  const hydrated = useHydrated();
  useBodyScrollLock(dealModalOpen);

  function openDealModal() {
    setTicketDraft(ticketSize ? String(ticketSize) : "");
    setDealModalOpen(true);
  }

  function submitDealSize(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Math.round(Number(ticketDraft.replace(/[^0-9.]/g, "")));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    const formData = new FormData();
    formData.set("averageTicketSize", String(parsed));
    setTicketSize(parsed);
    setDealModalOpen(false);
    startSavingTicket(() => setAverageTicketSizeAction(formData));
  }

  const stats = useMemo(() => {
    const cutoff = rangeStart;
    const inRange = (stamp?: string) =>
      Boolean(stamp) && new Date(stamp as string).getTime() >= cutoff;

    const hotOpportunities = sumAgentLeadTotals(loadedAgents, loadedGroups, loadedLeads);
    const acceptedConnections = countAcceptedConnections(loadedLeads, loadedEnrollments);

    // These count sends, so the unit stays the enrollment. Its status is not a
    // record of what was sent though - it collapses to "stopped"/"error" when
    // the sequence ends, expires or is cut short, which used to drop those
    // invites and messages out of the totals. Where the stage was lost, the
    // lead's own status still remembers how far it got.
    const leadStatusById = new Map(
      loadedLeads.map((lead) => [lead.id, lead.outreachStatus]),
    );
    const stageOf = (enrollment: CampaignEnrollmentPreview) =>
      combinedOutreachStage(enrollment.status, leadStatusById.get(enrollment.leadId));
    const invitationsSent = loadedEnrollments.filter(
      (enrollment) =>
        stageOf(enrollment) >= STAGE_CONTACTED && inRange(enrollment.connectionSentAt),
    ).length;
    const messagesSent = loadedEnrollments.filter(
      (enrollment) =>
        stageOf(enrollment) >= STAGE_MESSAGED && inRange(enrollment.updatedAt),
    ).length;

    return { hotOpportunities, acceptedConnections, invitationsSent, messagesSent };
  }, [loadedAgents, loadedGroups, loadedLeads, loadedEnrollments, rangeStart]);

  // Pipeline = accepted connections × average ticket size, not all leads
  // ever discovered.
  const pipelineGenerated =
    ticketSize !== undefined ? stats.acceptedConnections * ticketSize : undefined;

  const hotLeads = useMemo(
    () =>
      [...loadedLeads].sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0)).slice(0, 5),
    [loadedLeads],
  );

  const recentReplies = useMemo(() => {
    return loadedLinkedInThreads
      .filter((thread) => thread.unread)
      .map((thread) => {
        const lead = loadedLeads.find(
          (item) =>
            (item.linkedInUrl && thread.profileUrl && item.linkedInUrl === thread.profileUrl) ||
            (item.name &&
              thread.profileName &&
              item.name.trim().toLowerCase() === thread.profileName.trim().toLowerCase()),
        );
        const inbound = [...thread.messages]
          .reverse()
          .find((message) => message.direction === "inbound");
        if (!inbound) return null;
        return {
          id: thread.id,
          leadName: lead?.name ?? thread.profileName ?? thread.title ?? "LinkedIn lead",
          title: lead?.title ?? thread.profileHeadline ?? "",
          company: lead?.company ?? "",
          avatarUrl: lead?.avatarUrl ?? thread.avatarUrl,
          body: inbound.body,
          when: inbound.createdAt,
        };
      })
      .filter((reply): reply is NonNullable<typeof reply> => Boolean(reply))
      .sort((a, b) => new Date(b.when ?? 0).getTime() - new Date(a.when ?? 0).getTime())
      .slice(0, 5);
  }, [loadedLinkedInThreads, loadedLeads]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="app-x min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 pt-8">
          <div className="min-w-0">
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              {formatZonedDate(rangeStart, timeZone, { month: "short", day: "numeric" })}
              {" - "}
              {formatZonedDate(now, timeZone, { month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="app-seg" role="group" aria-label="Date range">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={option.key === range}
                  onClick={() => setRange(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <NewAgentButton className="m3-btn m3-btn-filled hidden h-8 cursor-pointer px-2.5 text-xs sm:inline-flex">
              New agent
            </NewAgentButton>
          </div>
        </div>

        <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="m3-card m3-card-outlined p-4">
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">Hot opportunities</p>
            {dashboardLoading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="stat-value mt-2 text-[var(--md-sys-color-on-surface)]">{stats.hotOpportunities}</p>
            )}
          </div>
          <div className="m3-card m3-card-outlined p-4">
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">Invitations sent</p>
            {dashboardLoading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="stat-value mt-2 text-[var(--md-sys-color-on-surface)]">{stats.invitationsSent}</p>
            )}
            <p className="mt-1 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">{activeRange.caption}</p>
          </div>
          <div className="m3-card m3-card-outlined p-4">
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">Messages sent</p>
            {dashboardLoading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="stat-value mt-2 text-[var(--md-sys-color-on-surface)]">{stats.messagesSent}</p>
            )}
            <p className="mt-1 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">{activeRange.caption}</p>
          </div>
          <div className="m3-card m3-card-outlined p-4">
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">Pipeline</p>
            {pipelineGenerated !== undefined ? (
              dashboardLoading ? (
                <Skeleton className="mt-2 h-8 w-24" />
              ) : (
                <>
                  <p className="stat-value mt-2 text-[var(--md-sys-color-on-surface)]">
                    {currencyFormatter.format(pipelineGenerated)}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {stats.acceptedConnections.toLocaleString()} accepted connections
                  </p>
                </>
              )
            ) : (
              <button
                type="button"
                onClick={openDealModal}
                className="mt-3 cursor-pointer text-left text-sm text-[var(--md-sys-color-on-surface-variant)] underline-offset-4 hover:text-[var(--md-sys-color-on-surface)] hover:underline"
              >
                Set deal size
              </button>
            )}
          </div>
        </div>

        <div className="m3-card m3-card-outlined mt-5 min-w-0 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="section-title text-[var(--md-sys-color-on-surface)]">
              Your activity
            </h2>
            <p className="mt-1 text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]">
              Leads, outreach, and replies for this range.
            </p>
          </div>

          <div className="mt-4">
            {dashboardLoading ? (
              <div
                className="analysis-chart"
                aria-label="Loading activity"
                role="status"
              >
                <Skeleton className="h-48 w-full rounded-lg sm:h-56" />
              </div>
            ) : (
              <AnalysisChart
                leads={loadedLeads}
                conversations={loadedConversations}
                enrollments={loadedEnrollments}
                activityDays={loadedActivityDays}
                maxDays={
                  activeRange.key === "month"
                    ? currentMonthDay
                    : activeRange.days
                }
                startDateKey={chartStartDateKey}
                endDateKey={chartEndDateKey}
              />
            )}
          </div>
        </div>

        <Link
          href="/api-keys"
          className="m3-card m3-card-outlined m3-state-layer mt-5 flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5"
        >
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]"
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
              Connect an AI app
            </p>
            <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Claude, ChatGPT, and Cursor can run this workspace from chat.
            </p>
          </div>
          <span className="m3-btn m3-btn-outlined h-7 shrink-0 px-2.5 text-[11px]">
            Connect
          </span>
        </Link>

        <div className="m3-card m3-card-outlined mt-5 min-w-0 px-5 py-4 sm:px-6 sm:py-5">
          <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">Outreach</p>
          {dashboardLoading ? (
            <Skeleton className="mt-2 h-8 w-24" />
          ) : (
            <p className="stat-value mt-1 text-[var(--md-sys-color-on-surface)]">
              {heatmapTotal(loadedActivityDays).toLocaleString()}
            </p>
          )}
          <div className="mt-4 min-w-0">
            {dashboardLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <ActivityHeatmap days={loadedActivityDays} timeZone={timeZone} />
            )}
          </div>
        </div>

        {/* Hot leads + replies */}
        <div className="mt-5 grid min-w-0 gap-3 lg:grid-cols-2">
          <section className="m3-card m3-card-outlined min-w-0 overflow-hidden px-4">
            <header className="flex items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <h3 className="text-[11px] font-medium uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)]">
                  Hot leads
                </h3>
              </div>
              <Link
                href="/leads"
                className="m3-btn m3-btn-outlined h-7 px-2.5 text-[11px]"
              >
                View all
              </Link>
            </header>

            <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]">
              {dashboardLoading ? (
                [0, 1, 2, 3, 4].map((item) => (
                  <li key={item} className="flex items-center gap-3 p-4" aria-label="Loading leads" role="status">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="mt-2 h-3 w-52 max-w-full" />
                    </div>
                    <Skeleton className="h-4 w-12 shrink-0" />
                  </li>
                ))
              ) : hotLeads.length === 0 ? (
                <li className="flex flex-col items-center justify-center px-6 py-10 text-center">
                  <span className="material-symbols-outlined text-3xl text-[var(--md-sys-color-on-surface-variant)]">local_fire_department</span>
                  <p className="mt-3 text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                    No hot leads yet
                  </p>
                  <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    High-intent leads show up here once your outreach is running.
                  </p>
                </li>
              ) : (
                hotLeads.map((lead) => (
                  <li key={lead.id} className="app-list-row px-0">
                    {lead.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lead.avatarUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <Initials name={lead.name} />
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={lead.linkedInUrl || "/leads"}
                        target={lead.linkedInUrl ? "_blank" : undefined}
                        rel={lead.linkedInUrl ? "noreferrer" : undefined}
                        className="block truncate text-sm font-semibold text-[var(--md-sys-color-primary)] hover:opacity-90"
                      >
                        {lead.name}
                      </Link>
                      <p className="truncate text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                        {lead.title}
                        {lead.company ? (
                          <>
                            {" "}
                            <span className="opacity-80">@</span> {lead.company}
                          </>
                        ) : null}
                      </p>
                    </div>
                    <FitScore score={lead.fitScore || 0} />
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="m3-card m3-card-outlined min-w-0 overflow-hidden px-4">
            <header className="flex items-center justify-between gap-3 py-4">
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)]">
                Replies
              </h3>
              <Link
                href="/messages"
                className="m3-btn m3-btn-outlined h-7 px-2.5 text-[11px]"
              >
                Inbox
              </Link>
            </header>

            {repliesLoading ? (
              <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]" aria-label="Loading replies" role="status">
                {[0, 1, 2].map((item) => (
                  <li key={item} className="flex items-start gap-3 p-4">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-12 shrink-0" />
                      </div>
                      <Skeleton className="mt-2 h-3 w-48 max-w-full" />
                      <Skeleton className="mt-2 h-3 w-full max-w-sm" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : recentReplies.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <span className="material-symbols-outlined text-3xl text-[var(--md-sys-color-on-surface-variant)]">forum</span>
                <p className="mt-3 text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                  No unseen replies
                </p>
                <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  New unread replies will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                {recentReplies.map((reply) => (
                  <li key={reply.id} className="app-list-row items-start px-0">
                    {reply.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reply.avatarUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <Initials name={reply.leadName} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                          {reply.leadName}
                        </span>
                        <span className="shrink-0 text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                          {timeAgo(reply.when)}
                        </span>
                      </div>
                      {reply.title || reply.company ? (
                        <p className="truncate text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                          {reply.title}
                          {reply.company ? (
                            <>
                              {" "}
                              <span className="opacity-80">@</span> {reply.company}
                            </>
                          ) : null}
                        </p>
                      ) : null}
                      {reply.body ? (
                        <p className="mt-1 line-clamp-2 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                          {reply.body}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {dealModalOpen && hydrated
        ? createPortal(
            <div
              className="app-compact m3-modal-scrim z-[200]"
              role="presentation"
              onClick={() => setDealModalOpen(false)}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="deal-size-title"
                className="m3-modal-surface"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="deal-size-title" className="m3-dialog-title">
                  Average ticket size
                </h2>
                <p className="m3-dialog-body">Your typical deal value per customer.</p>
                <form onSubmit={submitDealSize} className="mt-6">
                  <TextField
                    autoFocus
                    inputMode="numeric"
                    value={ticketDraft}
                    onChange={(event) => setTicketDraft(event.target.value)}
                    label="Amount"
                    placeholder="5,000"
                    leadingIcon={<span className="text-[16px] font-medium">$</span>}
                  />
                  <div className="m3-dialog-actions">
                    <button
                      type="button"
                      onClick={() => setDealModalOpen(false)}
                      className="m3-dialog-btn m3-dialog-btn--text"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingTicket || !ticketDraft.trim()}
                      aria-busy={savingTicket}
                      className="m3-dialog-btn m3-dialog-btn--filled"
                    >
                      {savingTicket ? (
                        <span className="m3-dialog-btn__spinner" aria-hidden />
                      ) : null}
                      Save
                    </button>
                  </div>
                </form>
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
