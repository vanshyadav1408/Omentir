"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Agent, CampaignEnrollmentPreview, Group, LeadAgentRef } from "@/lib/server/types";
import { deleteAgentAction, pauseAgentAction, resumeAgentAction } from "@/app/actions";
import { useSidebarResource } from "@/app/use-sidebar-resource";
import { ContentReveal, OutreachListSkeleton } from "@/app/app-skeletons";
import NewAgentButton from "./new-agent-button";
import { useBodyScrollLock } from "@/app/use-body-scroll-lock";
import {
  consumeAgentStartedNotice,
  useToast,
  userFacingError,
} from "@/app/toast";
import MobileHeaderPortal from "@/app/mobile-header-portal";
import { useWorkspaceTimeZone } from "@/app/workspace-time-zone";
import { formatZonedDate } from "@/lib/time-zone";
import {
  STAGE_ACCEPTED,
  STAGE_CONTACTED,
  STAGE_MESSAGED,
  STAGE_REPLIED,
  enrollmentProgressStage,
  leadStage,
} from "@/lib/outreach-stage";

type AgentsViewProps = {
  agents: Agent[];
  groups: Group[];
  leads: LeadAgentRef[];
  enrollments: CampaignEnrollmentPreview[];
  linkedInConnected: boolean;
  /** Finite plan cap, or null when the plan has unlimited agents. */
  agentLimit: number | null;
  atAgentLimit: boolean;
};

const PINK_BG = "bg-[#ba3871]";
const selectLinkedInConnected = (data: Record<string, unknown>) => Boolean(data.connected);
const selectAgentsData = (data: Record<string, unknown>) => ({
  agents: data.agents as Agent[] || [],
  groups: data.groups as Group[] || [],
  leads: data.leads as LeadAgentRef[] || [],
  enrollments: data.enrollments as CampaignEnrollmentPreview[] || [],
});

function statusPill(status: Agent["status"]) {
  if (status === "active" || status === "running") {
    return (
      <span className="inline-flex h-5 items-center gap-1 rounded-md bg-emerald-50 px-2.5 text-[11px] font-medium leading-none text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
      </span>
    );
  }
  if (status === "paused") {
    return (
      <span className="inline-flex h-5 items-center rounded-md bg-zinc-100 px-2.5 text-[11px] font-semibold leading-none text-zinc-700">
        Paused
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex h-5 items-center gap-1 rounded-md bg-red-50 px-2.5 text-[11px] font-medium leading-none text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Error
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 items-center rounded-md bg-zinc-100 px-2.5 text-[11px] font-medium leading-none text-zinc-600">
      Draft
    </span>
  );
}

function modeLabel(agent: Agent) {
  if (agent.mode === "steal_customers") return "Steal Customers";
  if (agent.mode === "outreach") return "Outreach Only";
  // Leads-only agents are stored as "signals" like full agents, so without this
  // there is no way to see which ones are barred from outreach.
  if (agent.leadsOnly) return "Leads Only";
  if (agent.mode === "signals") return "Leads + outreach";
  if (agent.mode === "filters") return "Filters";
  return "Prompt";
}

function linkedGroupName(agent: Agent, groups: Group[]) {
  return (
    groups.find((group) => group.id === agent.targetGroupId)?.name ||
    agent.targetGroupName ||
    "No group"
  );
}

function agentTitle(agent: Agent) {
  return agent.name?.trim() || modeLabel(agent);
}

const NO_METRICS = {
  target: 0,
  contacted: 0,
  accepted: 0,
  messaged: 0,
  replied: 0,
  acceptRate: null as number | null,
  replyRate: null as number | null,
};

export default function AgentsView({
  agents,
  groups,
  leads,
  enrollments,
  linkedInConnected,
  agentLimit,
  atAgentLimit,
}: AgentsViewProps) {
  const router = useRouter();
  const timeZone = useWorkspaceTimeZone();
  const agentsResource = useSidebarResource(
    "agents,groups,leadAgentRefs,enrollmentPreviews",
    { agents, groups, leads, enrollments },
    selectAgentsData,
  );
  const {
    agents: loadedAgents,
    groups: loadedGroups,
    leads: loadedLeads,
    enrollments: loadedEnrollments,
  } = agentsResource.value;
  const isInitialLoading = agentsResource.loading;
  const loadedLinkedInConnected = useSidebarResource(
    "linkedinConnected",
    linkedInConnected,
    selectLinkedInConnected,
  ).value;
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set());
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, Agent["status"]>>({});
  const [deleteAgent, setDeleteAgent] = useState<{ id: string; name: string } | null>(null);
  const { showError, showAgentStarted } = useToast();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  useBodyScrollLock(Boolean(deleteAgent));

  // After launch, setup redirects here for full / steal / outreach agents.
  useEffect(() => {
    const notice = consumeAgentStartedNotice();
    if (!notice) return;
    showAgentStarted(notice.name || undefined, notice.kind);
  }, [showAgentStarted]);
  const visibleAgents = useMemo(
    () => loadedAgents.filter((agent) => !deletedIds.has(agent.id)),
    [loadedAgents, deletedIds],
  );
  // null agentLimit means unlimited. While sidebar agents are still loading,
  // trust the server-computed flag so a Basic user already at capacity cannot
  // open create. After load (or local delete), use the live visible count.
  const effectiveAtAgentLimit =
    agentLimit != null &&
    (isInitialLoading ? atAgentLimit : visibleAgents.length >= agentLimit);

  function setTogglePending(agentId: string, pending: boolean) {
    setPendingToggleIds((current) => {
      const next = new Set(current);
      if (pending) next.add(agentId);
      else next.delete(agentId);
      return next;
    });
  }

  async function toggleAgent(agent: Agent) {
    if (pendingToggleIds.has(agent.id)) return;

    const currentStatus = optimisticStatuses[agent.id] ?? agent.status;
    // Error is treated like paused: toggle resumes discovery instead of no-op.
    const isActive = currentStatus === "active" || currentStatus === "running";
    const nextStatus: Agent["status"] = isActive ? "paused" : "active";
    const formData = new FormData();
    formData.set("agentId", agent.id);

    setTogglePending(agent.id, true);
    setOptimisticStatuses((current) => ({ ...current, [agent.id]: nextStatus }));

    try {
      if (isActive) {
        await pauseAgentAction(formData);
      } else {
        await resumeAgentAction(formData);
        const resumeKind =
          agent.mode === "steal_customers"
            ? "steal_customers"
            : agent.mode === "outreach"
              ? "outreach_only"
              : agent.leadsOnly
                ? "leads_only"
                : "resume";
        showAgentStarted(
          agentTitle(agent),
          resumeKind === "steal_customers" ||
            resumeKind === "outreach_only" ||
            resumeKind === "leads_only"
            ? resumeKind
            : "resume",
        );
      }
      // Drop optimistic override so the next server payload (active after
      // resume, including recovery from status "error") is what we render.
      setOptimisticStatuses((current) => {
        const next = { ...current };
        delete next[agent.id];
        return next;
      });
      router.refresh();
      agentsResource.reload();
    } catch (error) {
      setOptimisticStatuses((current) => ({ ...current, [agent.id]: agent.status }));
      showError(userFacingError(error, "Agent status could not be updated."));
    } finally {
      setTogglePending(agent.id, false);
    }
  }

  async function confirmDeleteAgent() {
    const target = deleteAgent;
    if (!target) return;

    // Optimistically remove the row and close the modal immediately, then
    // run the delete in the background and reconcile with the server.
    setDeleteAgent(null);
    setDeletedIds((current) => new Set(current).add(target.id));

    const formData = new FormData();
    formData.set("agentId", target.id);

    try {
      await deleteAgentAction(formData);
      agentsResource.reload();
      router.refresh();
    } catch (error) {
      setDeletedIds((current) => {
        const next = new Set(current);
        next.delete(target.id);
        return next;
      });
      showError(userFacingError(error, "Agent could not be deleted."));
    }
  }

  const agentMetrics = useMemo(() => {
    const leadsByAgent = new Map<string, LeadAgentRef[]>();
    for (const lead of loadedLeads) {
      const agentId = lead.sourceAgentId;
      if (!agentId) continue;
      const list = leadsByAgent.get(agentId) ?? [];
      list.push(lead);
      leadsByAgent.set(agentId, list);
    }

    // A lead can be enrolled more than once (re-run, second campaign); the
    // furthest of those enrollments is the one that describes the lead.
    const enrollmentStageByLead = new Map<string, number>();
    for (const enrollment of loadedEnrollments) {
      enrollmentStageByLead.set(
        enrollment.leadId,
        Math.max(
          enrollmentStageByLead.get(enrollment.leadId) ?? 0,
          enrollmentProgressStage(enrollment.status, enrollment.connectionSentAt),
        ),
      );
    }

    return new Map(
      loadedAgents.map((agent) => {
        // The agent's own leads, not its group's: groups are shared, so the
        // group count mixed in leads this agent never sourced and made the
        // "x% contacted" denominator bigger than the population it counts.
        const agentLeads = leadsByAgent.get(agent.id) ?? [];
        const target = agentLeads.length;

        // Leads-only agents never send: outreach stats must stay zero even if a
        // shared-group bug left enrollments pointing at their sourced leads.
        if (agent.leadsOnly) {
          return [agent.id, { ...NO_METRICS, target }];
        }

        const stages = agentLeads.map((lead) =>
          Math.max(leadStage(lead.outreachStatus), enrollmentStageByLead.get(lead.id) ?? 0),
        );
        const countAtLeast = (stage: number) => stages.filter((value) => value >= stage).length;
        const contacted = countAtLeast(STAGE_CONTACTED);
        const accepted = countAtLeast(STAGE_ACCEPTED);
        const messaged = countAtLeast(STAGE_MESSAGED);
        const replied = countAtLeast(STAGE_REPLIED);

        const acceptRate = contacted > 0 ? Math.round((accepted / contacted) * 100) : null;
        // Only messaged leads can reply, so they are the reply-rate denominator.
        const replyRate = messaged > 0 ? Math.round((replied / messaged) * 100) : null;

        return [
          agent.id,
          {
            target,
            contacted,
            accepted,
            messaged,
            replied,
            acceptRate,
            replyRate,
          },
        ];
      }),
    );
  }, [loadedAgents, loadedLeads, loadedEnrollments]);

  const createAgentIcon = (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );

  const mobileHeaderFabClass =
    "m3-btn m3-btn-filled h-8 cursor-pointer px-2.5 text-xs";

  return (
    // Scroll lives on a full-width pane so the scrollbar sits at the right
    // edge of main (not inside app-x padding against the agent cards).
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 md:ml-4 md:pb-3">
      {/* Mobile app bar — full-height strip so the control is vertically centered
          in the 56px header (same bar as the sidebar title). */}
      <MobileHeaderPortal>
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[92] flex h-14 items-center justify-end px-2 md:hidden">
          <div className="pointer-events-auto">
            {effectiveAtAgentLimit ? (
              <Link
                href="/agents/new"
                aria-label="New agent"
                className={mobileHeaderFabClass}
              >
                <span className="text-sm leading-none" aria-hidden="true">
                  +
                </span>
                New agent
              </Link>
            ) : (
              <NewAgentButton className={mobileHeaderFabClass} aria-label="New agent">
                <span className="text-sm leading-none" aria-hidden="true">
                  +
                </span>
                New agent
              </NewAgentButton>
            )}
          </div>
        </div>
      </MobileHeaderPortal>

      {/* Header — match Leads page metrics */}
      <div className="app-x hidden shrink-0 items-center justify-between gap-3 pt-6 md:flex">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)]">
            AI Agents
          </h1>
        </div>

        {effectiveAtAgentLimit ? (
          <Link
            href="/agents/new"
            className="m3-btn m3-btn-filled h-8 shrink-0 gap-1 px-2.5 text-xs"
          >
            {createAgentIcon}
            Create an agent
          </Link>
        ) : (
          <NewAgentButton className="m3-btn m3-btn-filled h-8 shrink-0 cursor-pointer gap-1 px-2.5 text-xs">
            {createAgentIcon}
            Create an agent
          </NewAgentButton>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6 pt-2 md:pb-3 md:pt-0">
        <div className="app-x">
        {isInitialLoading ? (
          <OutreachListSkeleton label="Loading agents" />
        ) : (
          <ContentReveal>
        {/* LinkedIn connection banner */}
        {!loadedLinkedInConnected ? (
          <div
            className={`mb-4 flex flex-col items-start justify-between gap-4 rounded-xl border border-[#ba3871] ${PINK_BG} px-4 py-4 sm:flex-row sm:items-center sm:px-5`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-white/70 text-[#0a66c2]">
                <span className="text-base font-bold">in</span>
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-950">LinkedIn not connected!</p>
                <p className="text-xs text-zinc-700">
                  You need to connect your LinkedIn account to run agents.
                </p>
              </div>
            </div>
            <Link
              href="/api/connect/linkedin"
              className="m3-btn m3-btn-filled h-8 w-full px-2.5 text-xs sm:w-auto"
            >
              Connect LinkedIn
              <span aria-hidden>→</span>
            </Link>
          </div>
        ) : null}

        {/* Agent cards */}
        {visibleAgents.length === 0 ? (
          <div className="m3-card m3-card-outlined m3-card-lg border-dashed py-16 text-center">
            <span className="material-symbols-outlined text-3xl text-zinc-400">smart_toy</span>
            <h2 className="mt-3 text-sm font-semibold text-zinc-900">No agents yet</h2>
            <p className="mt-1 text-xs text-zinc-500">Create one to start finding leads.</p>
            <NewAgentButton className="m3-btn m3-btn-filled mt-5 hidden h-8 shrink-0 cursor-pointer gap-1 px-2.5 text-xs md:inline-flex">
              {createAgentIcon}
              Create an agent
            </NewAgentButton>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {visibleAgents.map((agent) => {
              const metrics = agentMetrics.get(agent.id) ?? NO_METRICS;
              const displayStatus = optimisticStatuses[agent.id] ?? agent.status;
              const isActive = displayStatus === "active" || displayStatus === "running";
              const togglePending = pendingToggleIds.has(agent.id);
              const contactedPercent =
                metrics.target > 0
                  ? Math.round((metrics.contacted / metrics.target) * 100)
                  : 0;

              return (
                <li
                  key={agent.id}
                  className={`m3-card m3-card-elevated m3-card-lg min-w-0 px-4 pb-5 pt-5 sm:px-6${
                    agent.mode === "steal_customers" ? " agent-card-steal-customers" : ""
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between gap-3 md:items-start">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h2
                        style={{ fontFamily: "var(--font-varta)" }}
                        className="min-w-0 break-words text-base font-semibold leading-tight text-zinc-950"
                      >
                        {agentTitle(agent)}
                      </h2>
                      {statusPill(displayStatus)}
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-center md:self-auto">
                      <button
                        type="button"
                        aria-label={isActive ? "Pause agent" : "Resume agent"}
                        aria-pressed={isActive}
                        disabled={togglePending}
                        onClick={() => toggleAgent(agent)}
                        className="m3-switch rounded-full"
                      >
                        <span className="m3-switch__thumb" />
                      </button>

                      <details className="relative">
                        <summary className="grid h-7 w-7 cursor-pointer list-none place-items-center rounded-md text-zinc-600 hover:bg-zinc-100">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="5" cy="12" r="1.6" />
                            <circle cx="12" cy="12" r="1.6" />
                            <circle cx="19" cy="12" r="1.6" />
                          </svg>
                        </summary>
                        <div className="m3-menu m3-menu-enter m3-menu--origin-top-right m3-menu--compact absolute right-0 z-10 mt-1 w-36">
                          <Link
                            href={`/agents/new?id=${agent.id}`}
                            className="m3-menu-item"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteAgent({ id: agent.id, name: agentTitle(agent) })}
                            className="m3-menu-item m3-menu-item--danger"
                          >
                            Delete
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-600">
                        {agent.leadsOnly ? "Number of leads" : "Contacted"}
                      </p>
                      <p className="mt-1 text-3xl font-semibold leading-none text-zinc-950">
                        {agent.leadsOnly ? (
                          metrics.target
                        ) : (
                          <>
                            {metrics.contacted}
                            <span className="ml-1 align-baseline text-sm font-medium text-zinc-600">
                              / {metrics.target}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="mt-1.5 text-[11px] font-medium text-zinc-700">
                        {agent.leadsOnly ? "leads found" : `${contactedPercent}% contacted`}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-600">
                        Accepted
                      </p>
                      <p className="mt-1 text-3xl font-semibold leading-none text-zinc-950">
                        {agent.leadsOnly ? "N/A" : metrics.accepted}
                      </p>
                      <p className="mt-1.5 text-[11px] font-medium text-zinc-700">
                        {agent.leadsOnly
                          ? "N/A"
                          : metrics.acceptRate === null
                            ? "- accept rate"
                            : `${metrics.acceptRate}% accept rate`}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-600">
                        Messaged
                      </p>
                      <p className="mt-1 text-3xl font-semibold leading-none text-zinc-950">
                        {agent.leadsOnly ? "N/A" : metrics.messaged}
                      </p>
                      <p className="mt-1.5 text-[11px] font-medium text-zinc-700">
                        {agent.leadsOnly ? "N/A" : "total messaged"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-600">
                        Replied
                      </p>
                      <p className="mt-1 text-3xl font-semibold leading-none text-zinc-950">
                        {agent.leadsOnly ? "N/A" : metrics.replied}
                      </p>
                      <p className="mt-1.5 text-[11px] font-medium text-zinc-700">
                        {agent.leadsOnly
                          ? "N/A"
                          : metrics.replyRate === null
                            ? "- reply rate"
                            : `${metrics.replyRate}% reply rate`}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center">
                    <p className="min-w-0 break-words text-xs font-medium text-zinc-700">
                      {linkedGroupName(agent, loadedGroups)}
                      {agent.createdAt ? (
                        <>
                          <span className="mx-1.5 text-zinc-500">·</span>
                          Created {formatZonedDate(agent.createdAt, timeZone)}
                        </>
                      ) : null}
                    </p>
                    <div className="flex w-full items-stretch gap-2 sm:w-auto">
                      <Link
                        href={`/agents/${agent.id}`}
                        className="m3-btn m3-btn-outlined box-border h-7 flex-1 px-2.5 text-xs leading-none sm:flex-none"
                      >
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 12h4l2-7 4 14 2-7h6" />
                        </svg>
                        View
                      </Link>
                      <Link
                        href={`/agents/new?id=${agent.id}`}
                        className="m3-btn m3-btn-filled box-border h-7 flex-1 px-2.5 text-xs leading-none sm:flex-none"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
          </ContentReveal>
        )}
        </div>
      </div>

      {deleteAgent ? (
        <div
          className="m3-dialog-scrim z-[95]"
          role="presentation"
          onClick={() => setDeleteAgent(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-agent-title"
            className="m3-dialog-surface"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-agent-title" className="m3-dialog-title">
              Delete agent?
            </h2>
            <p className="m3-dialog-body">
              Are you sure you want to delete {deleteAgent.name}? This stops outreach, deletes its
              lead group and campaigns, and permanently deletes the leads in that group.
            </p>
            <div className="m3-dialog-actions">
              <button
                type="button"
                onClick={() => setDeleteAgent(null)}
                className="m3-dialog-btn m3-dialog-btn--text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAgent}
                className="m3-dialog-btn m3-dialog-btn--destructive"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
