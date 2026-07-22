"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { setAverageTicketSizeAction } from "@/app/actions";
import AnalysisChart from "@/app/analysis-chart";
import { useSidebarResource } from "@/app/use-sidebar-resource";
import NewAgentButton from "@/app/(app)/agents/new-agent-button";
import { Skeleton } from "@/app/app-skeletons";
import { useBodyScrollLock } from "@/app/use-body-scroll-lock";
import type {
  Agent,
  CampaignEnrollmentPreview,
  Conversation,
  Group,
  LeadPreview,
  LinkedInInboxThread,
} from "@/lib/server/types";
import { sumAgentLeadTotals } from "@/lib/agent-lead-totals";
import { TextField } from "@/app/ui/text-field";

type DashboardViewProps = {
  agents: Agent[];
  leads: LeadPreview[];
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

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; days: number }> = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "3m", label: "3 months", days: 90 },
  { key: "month", label: "This month", days: 31 },
];

const selectLinkedInThreads = (data: Record<string, unknown>) =>
  data.threads as LinkedInInboxThread[] || [];
const selectDashboardData = (data: Record<string, unknown>) => ({
  agents: data.agents as Agent[] || [],
  groups: data.groups as Group[] || [],
  leads: data.leads as LeadPreview[] || [],
  enrollments: data.enrollments as CampaignEnrollmentPreview[] || [],
  conversations: data.conversations as Conversation[] || [],
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
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ff8a73] text-xs font-semibold text-white">
      {initials || "?"}
    </div>
  );
}

function FlameRow() {
  return (
    <span className="flex shrink-0 items-center gap-0.5 text-base leading-none">
      <span>🔥</span>
      <span>🔥</span>
      <span>🔥</span>
    </span>
  );
}

export default function DashboardView({
  agents,
  leads,
  enrollments,
  conversations,
  linkedInThreads,
  userName,
  averageTicketSize,
}: DashboardViewProps) {
  const dashboardResource = useSidebarResource(
    "agents,groups,leadPreviews,enrollmentPreviews,conversations",
    { agents, groups: [] as Group[], leads, enrollments, conversations },
    selectDashboardData,
  );
  const {
    agents: loadedAgents,
    groups: loadedGroups,
    leads: loadedLeads,
    enrollments: loadedEnrollments,
    conversations: loadedConversations,
  } = dashboardResource.value;
  const dashboardLoading = dashboardResource.loading;
  const linkedInInboxResource = useSidebarResource(
    "linkedinInbox",
    linkedInThreads,
    selectLinkedInThreads,
  );
  const loadedLinkedInThreads = linkedInInboxResource.value;
  const repliesLoading = linkedInInboxResource.loading || dashboardLoading;
  const [range, setRange] = useState<RangeKey>("30d");
  const [now] = useState(() => Date.now());
  const activeRange = RANGE_OPTIONS.find((option) => option.key === range) ?? RANGE_OPTIONS[1];

  // Average ticket size lives on the product profile. Mirror it locally so the
  // pipeline card updates instantly when set from the modal, before the server
  // revalidation lands.
  const [ticketSize, setTicketSize] = useState<number | undefined>(averageTicketSize);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [ticketDraft, setTicketDraft] = useState(
    averageTicketSize ? String(averageTicketSize) : "",
  );
  const [savingTicket, startSavingTicket] = useTransition();
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
    const cutoff = now - activeRange.days * 24 * 60 * 60 * 1000;
    const inRange = <T extends { createdAt?: string; updatedAt?: string }>(item: T) => {
      const stamp = item.createdAt || item.updatedAt;
      return stamp ? new Date(stamp).getTime() >= cutoff : false;
    };

    const hotOpportunities = sumAgentLeadTotals(loadedAgents, loadedGroups, loadedLeads);
    const invitationsSent = loadedEnrollments.filter(
      (enrollment) =>
        ["connection_sent", "connected", "message_sent", "reply_received", "replied"].includes(enrollment.status) &&
        inRange(enrollment),
    ).length;
    const messagesSent = loadedEnrollments.filter(
      (enrollment) =>
        ["message_sent", "reply_received", "replied"].includes(enrollment.status) && inRange(enrollment),
    ).length;

    return { hotOpportunities, invitationsSent, messagesSent };
  }, [loadedAgents, loadedGroups, loadedLeads, loadedEnrollments, activeRange, now]);

  // Pipeline = current hot opportunities × average deal size, not all leads
  // ever discovered — the card estimates open pipeline, not lifetime volume.
  const pipelineGenerated =
    ticketSize !== undefined ? stats.hotOpportunities * ticketSize : undefined;

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
        {/* Welcome + range selector on one row, vertically aligned */}
        <div className="flex min-w-0 items-center justify-between gap-3 pt-3 sm:gap-4 sm:pl-4 sm:pt-5">
          <h1 className="flex min-w-0 flex-wrap items-center gap-2 break-words text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-4xl">
            Welcome <span className="text-gradient-brand">{userName}</span>
            <span className="text-2xl">🚀</span>
          </h1>

          {/* Desktop: pill buttons */}
          <div className="hidden shrink-0 flex-wrap items-center justify-end gap-1.5 md:flex">
            {RANGE_OPTIONS.map((option) => {
              const active = option.key === range;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setRange(option.key)}
                  className={`h-8 cursor-pointer rounded-full px-3 text-xs font-medium transition ${
                    active
                      ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                      : "bg-transparent text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-state-hover)]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Mobile: dropdown picker */}
          <div className="relative shrink-0 md:hidden">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as RangeKey)}
              className="h-8 cursor-pointer appearance-none rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] pl-2 pr-6 text-[11px] font-medium text-[var(--md-sys-color-on-surface)] outline-none"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Stat row + CTA + Edit panel */}
        <div className="mt-5 grid min-w-0 gap-3 lg:grid-cols-[1.05fr_2.4fr_1.05fr]">
          <div className="hidden flex-col items-center justify-center m3-card m3-card-elevated m3-card-lg p-4 text-center sm:flex sm:p-6">
            <p className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
              Ready to outreach?
            </p>
            <NewAgentButton className="m3-btn m3-btn-filled mt-4 h-10 cursor-pointer gap-1.5 px-5 text-sm">
              <span className="text-base leading-none">+</span>
              Start an agent
            </NewAgentButton>
          </div>

          <div className="m3-card m3-card-elevated m3-card-lg grid min-w-0 grid-cols-1 overflow-hidden sm:grid-cols-3">
            <div className="flex flex-col gap-2 border-b border-[var(--md-sys-color-outline-variant)] p-5 sm:border-b-0 sm:border-r">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Hot Opportunities
              </span>
              {dashboardLoading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
                  {stats.hotOpportunities}
                </span>
              )}
              <span className="mt-auto text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                Total leads across agents
              </span>
            </div>
            <div className="flex flex-col gap-2 border-b border-[var(--md-sys-color-outline-variant)] p-5 sm:border-b-0 sm:border-r">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Leads Engaged
              </span>
              {dashboardLoading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
                  {stats.invitationsSent}
                </span>
              )}
              <span className="mt-auto text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                Invitations sent
                <br />
                Last {activeRange.label}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-5">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Conversations
              </span>
              {dashboardLoading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <span className="text-4xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
                  {stats.messagesSent}
                </span>
              )}
              <span className="mt-auto text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                Messages sent
                <br />
                Last {activeRange.label}
              </span>
            </div>
          </div>

          <div className="relative hidden flex-col items-center justify-center m3-card m3-card-elevated m3-card-lg p-4 text-center sm:flex sm:p-6">
            {pipelineGenerated !== undefined ? (
              <>
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">
                  Total Pipeline Generated
                </span>
                {dashboardLoading ? (
                  <>
                    <Skeleton className="mt-2 h-10 w-32" />
                    <Skeleton className="mt-2 h-3 w-24" />
                  </>
                ) : (
                  <>
                    <span className="m3-table-num mt-2 text-4xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
                      {currencyFormatter.format(pipelineGenerated)}
                    </span>
                    <span className="m3-table-num mt-2 text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                      {stats.hotOpportunities.toLocaleString()} hot opportunities
                    </span>
                  </>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={openDealModal}
                className="cursor-pointer text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] underline-offset-4 hover:text-[var(--md-sys-color-on-surface)] hover:underline"
              >
                Set deal size to see pipeline generated
              </button>
            )}
          </div>
        </div>

        {/* Activity overview */}
        <div className="m3-card m3-card-elevated m3-card-lg mt-5 min-w-0 overflow-hidden bg-[var(--md-sys-color-surface-container)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
                Activity Overview
              </h2>
              <p className="mt-1 text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]">
                Track your lead generation &amp; outreach performance
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <NewAgentButton className="m3-btn m3-btn-filled h-9 w-full cursor-pointer gap-1 px-4 text-xs sm:w-auto">
                Create an AI agent
                <span aria-hidden>»</span>
              </NewAgentButton>
            </div>
          </div>

          <div className="mt-4">
            {dashboardLoading ? (
              <div
                className="analysis-chart rounded-xl bg-[var(--md-sys-color-surface-container-low)] p-4 sm:p-5"
                aria-label="Loading activity overview"
                role="status"
              >
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Skeleton className="h-2.5 w-2.5 rounded-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <div className="flex w-6 shrink-0 flex-col justify-between py-1">
                    {[0, 1, 2, 3, 4].map((tick) => (
                      <Skeleton key={tick} className="h-2.5 w-full" />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-48 w-full rounded-lg sm:h-56" />
                    <div className="mt-3 flex justify-between gap-2">
                      {[0, 1, 2, 3, 4].map((label) => (
                        <Skeleton key={label} className="h-2.5 w-10" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <AnalysisChart
                leads={loadedLeads}
                conversations={loadedConversations}
                enrollments={loadedEnrollments}
              />
            )}
          </div>
        </div>

        {/* Hot leads + replies */}
        <div className="mt-5 grid min-w-0 gap-3 lg:grid-cols-2">
          <section className="m3-card m3-card-elevated m3-card-lg min-w-0 overflow-hidden">
            <header className="flex flex-col items-start justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)] p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--md-sys-color-primary)_16%,var(--md-sys-color-surface-container))] text-[var(--md-sys-color-primary)]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
                    Latest Hot Leads
                  </h3>
                  <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                    Your most promising prospects
                  </p>
                </div>
              </div>
              <Link
                href="/leads"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--md-sys-color-primary)] hover:opacity-90"
              >
                View More
                <span aria-hidden>›</span>
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
                  <li key={lead.id} className="flex items-center gap-3 p-4">
                    {lead.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lead.avatarUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
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
                    <FlameRow />
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="m3-card m3-card-elevated m3-card-lg min-w-0 overflow-hidden">
            <header className="flex items-center gap-3 border-b border-[var(--md-sys-color-outline-variant)] p-4 sm:p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,#a8c7fa_16%,var(--md-sys-color-surface-container))] text-[var(--md-sys-color-primary)]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
                  Latest Replies
                </h3>
                <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                  Recent conversation responses
                </p>
              </div>
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
                  <li key={reply.id} className="flex items-start gap-3 p-4">
                    {reply.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reply.avatarUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
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

      {dealModalOpen ? (
        <div
          className="m3-modal-scrim z-[90]"
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
                  {savingTicket ? <span className="m3-dialog-btn__spinner" aria-hidden /> : null}
                  Save
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
