"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { runScheduledActionNowAction, stopLeadOutreachAction } from "@/app/actions";
import MobileHeaderPortal from "@/app/mobile-header-portal";
import type { ScheduledAction } from "@/lib/server/scheduled-actions";
import { useWorkspaceTimeZone } from "@/app/workspace-time-zone";
import { ActionDetails, dateLabel, resultMessage, timeLabel } from "./action-details";

type Lead = NonNullable<ScheduledAction["lead"]>;
type LeadActions = { lead: Lead; actions: ScheduledAction[] };

const PER_PAGE_OPTIONS = [10, 50, 100];
const VIEW_MODES = [
  { id: "time" as const, label: "By time" },
  { id: "lead" as const, label: "By leads" },
];
const ALL_GROUPS = "all";

function Avatar({ lead, size = "md" }: { lead: Lead; size?: "sm" | "md" | "lg" }) {
  const classes = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return lead.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={lead.avatarUrl} alt="" className={`${classes} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`grid ${classes} shrink-0 place-items-center rounded-full bg-[#f8e8ef] text-[11px] font-bold text-[#ba3871]`}>
      {lead.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

// mobileCaption (mobile-only): hides the page title and shows the caption above the list.
export default function ActionsDashboard({ items, title, serverNow, timezone, headerActions, intro, mobileCaption }: { items: ScheduledAction[]; title: string; serverNow: number; timezone?: string; headerActions?: ReactNode; intro?: ReactNode; loadLiveItems?: boolean; mobileCaption?: string }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const workspaceTimeZone = useWorkspaceTimeZone();
  const timeZone = timezone || workspaceTimeZone;
  const [selectedLeadId, setSelectedLeadId] = useState(items.find((item) => item.lead)?.lead?.id || "");
  const [selectedId, setSelectedId] = useState(items.find((item) => item.lead)?.id || "");
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState("");
  const [confirmingStopLeadId, setConfirmingStopLeadId] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [viewMode, setViewMode] = useState<"time" | "lead">("time");
  const [groupId, setGroupId] = useState(ALL_GROUPS);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && !isRefreshing) {
        startRefresh(() => router.refresh());
      }
    };
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [isRefreshing, router]);

  // Lead groups the scheduled actions actually belong to, so the filter never
  // offers a group with nothing in it.
  const leadGroups = useMemo(() => {
    const named = new Map<string, string>();
    for (const action of items) {
      if (action.groupId && action.group) named.set(action.groupId, action.group);
    }
    return Array.from(named, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const leads = useMemo(() => {
    const groups = new Map<string, LeadActions>();
    for (const action of items) {
      if (!action.lead) continue;
      if (groupId !== ALL_GROUPS && action.groupId !== groupId) continue;
      const group = groups.get(action.lead.id) || { lead: action.lead, actions: [] };
      group.actions.push(action);
      groups.set(action.lead.id, group);
    }
    return Array.from(groups.values()).map((group) => ({ ...group, actions: group.actions.sort((a, b) => a.at.localeCompare(b.at)) })).sort((a, b) => a.actions[0].at.localeCompare(b.actions[0].at));
  }, [items, groupId]);

  const selectedLead = leads.find((group) => group.lead.id === selectedLeadId) || leads[0];
  const selected = selectedLead?.actions.find((action) => action.id === selectedId) || selectedLead?.actions[0];
  // By leads: the best-fit people first, so the highest-value leads are the
  // ones you inspect. By time: whatever fires soonest, as built above.
  const visibleLeads = viewMode === "lead"
    ? [...leads].sort((a, b) =>
        (b.lead.fitScore || 0) - (a.lead.fitScore || 0) ||
        a.actions[0].at.localeCompare(b.actions[0].at) ||
        a.lead.name.localeCompare(b.lead.name),
      )
    : leads;
  const total = leads.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageRows = visibleLeads.slice(start, end);
  function selectAction(action: ScheduledAction) {
    setSelectedLeadId(action.lead?.id || "");
    setSelectedId(action.id);
    setConfirmingId("");
    setConfirmingStopLeadId("");
    setMobileDetailsOpen(true);
  }

  function changeViewMode(mode: "time" | "lead") {
    setViewMode(mode);
    setPage(1);
    setConfirmingId("");
    setConfirmingStopLeadId("");
  }

  function changeGroup(nextGroupId: string) {
    setGroupId(nextGroupId);
    setPage(1);
    setConfirmingId("");
    setConfirmingStopLeadId("");
  }

  async function runNow(action: ScheduledAction) {
    setPendingId(action.id);
    setFeedback((current) => { const next = { ...current }; delete next[action.id]; return next; });
    const formData = new FormData();
    formData.set("enrollmentId", action.id);
    try {
      const { result } = await runScheduledActionNowAction(formData);
      setFeedback((current) => ({ ...current, [action.id]: resultMessage(result, action.kind) }));
      setConfirmingId("");
      router.refresh();
    } catch (error) {
      setFeedback((current) => ({ ...current, [action.id]: { ok: false, text: error instanceof Error ? error.message : "The action could not be sent." } }));
    } finally {
      setPendingId("");
    }
  }

  async function stopOutreach(action: ScheduledAction) {
    const leadId = action.lead?.id;
    if (!leadId) return;
    setPendingId(action.id);
    setFeedback((current) => { const next = { ...current }; delete next[action.id]; return next; });
    const formData = new FormData();
    formData.set("leadId", leadId);
    try {
      await stopLeadOutreachAction(formData);
      setConfirmingStopLeadId("");
      setMobileDetailsOpen(false);
      router.refresh();
    } catch (error) {
      setFeedback((current) => ({ ...current, [action.id]: { ok: false, text: error instanceof Error ? error.message : "Outreach could not be stopped." } }));
    } finally {
      setPendingId("");
    }
  }

  const desktopViewPicker = (
    <label className={`flex h-8 items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 ${mobileCaption ? "md:h-[34px] md:pr-4" : ""}`}>
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
      </svg>
      <span className="relative">
        <select
          aria-label="Group actions"
          value={viewMode}
          onChange={(event) => changeViewMode(event.target.value as "time" | "lead")}
          className={`cursor-pointer appearance-none border-0 bg-transparent pr-6 shadow-none outline-none ${mobileCaption ? "md:pl-2" : ""}`}
        >
          {VIEW_MODES.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[16px] text-zinc-500" aria-hidden="true">
          arrow_drop_down
        </span>
      </span>
    </label>
  );

  const groupPicker = leadGroups.length > 1 ? (
    <label className="flex h-8 items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700">
      {/* Inline SVG, like the view picker beside it: "group" is not in the
          self-hosted icon subset, and font-display: block would paint the raw
          ligature text instead of a glyph. */}
      <svg className="h-3.5 w-3.5 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <span className="relative">
        <select
          aria-label="Filter by lead group"
          value={groupId}
          onChange={(event) => changeGroup(event.target.value)}
          className="max-w-[9.5rem] cursor-pointer appearance-none truncate border-0 bg-transparent pr-6 shadow-none outline-none"
        >
          <option value={ALL_GROUPS}>All lead groups</option>
          {leadGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[16px] text-zinc-500" aria-hidden="true">
          arrow_drop_down
        </span>
      </span>
    </label>
  ) : null;

  // Full-height strip so the control is vertically centered in the 56px mobile
  // app bar (same pattern as the agents header action).
  const mobileViewPicker = (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[92] flex h-14 items-center justify-end px-2 md:hidden">
      <div className="pointer-events-auto relative">
        <svg className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
        </svg>
        <select
          aria-label="Group actions"
          value={viewMode}
          onChange={(event) => changeViewMode(event.target.value as "time" | "lead")}
          className="h-8 w-32 cursor-pointer appearance-none rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] pl-8 pr-8 text-[11px] font-medium text-[var(--md-sys-color-on-surface)] outline-none"
        >
          {VIEW_MODES.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden md:ml-4 md:mr-0.5 md:pb-3">
      {mobileCaption ? <MobileHeaderPortal>{mobileViewPicker}</MobileHeaderPortal> : null}
      <header className={`app-x flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between md:pt-6 ${mobileCaption ? "pt-0" : "pt-5"}`}>
        <h1
          style={{ fontFamily: "var(--font-varta)" }}
          className={`text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)] ${mobileCaption ? "hidden md:block" : ""}`}
        >
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {headerActions}
          {groupPicker}
          <div className={mobileCaption ? "hidden md:block" : ""}>{desktopViewPicker}</div>
        </div>
      </header>

      <main className="app-x flex min-h-0 flex-1 flex-col overflow-hidden">
        {intro ? <div className="shrink-0 pb-4">{intro}</div> : null}
        {!leads.length ? (
          <div className="m3-card m3-card-outlined m3-card-lg border-dashed py-16 text-center">
            <span className="material-symbols-outlined text-3xl text-zinc-400">event_available</span>
            <h2 className="mt-3 text-sm font-semibold text-zinc-900">Nothing scheduled</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {groupId === ALL_GROUPS
                ? "Leads from active campaigns will appear here."
                : "No scheduled actions in this lead group yet."}
            </p>
          </div>
        ) : (
          <>
          {mobileCaption ? (
            <div className="shrink-0 pb-3 md:hidden">
              <p className="text-sm font-medium text-zinc-600">{mobileCaption}</p>
            </div>
          ) : null}
          <div className="grid min-h-0 flex-1 grid-rows-1 gap-4 overflow-hidden md:grid-rows-2 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-1">
            <div className="m3-card m3-card-elevated m3-card-lg flex min-h-0 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-zinc-100">
                {pageRows.map((group) => {
                  const action = group.actions[0];
                  const active = selectedLead?.lead.id === group.lead.id;
                  return (
                    <button
                      key={group.lead.id}
                      type="button"
                      onClick={() => selectAction(action)}
                      className={`flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-zinc-50 ${active ? "bg-[#fff7fa]" : "bg-white"}`}
                    >
                      <Avatar lead={group.lead} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-zinc-950">{group.lead.name}</p>
                          {viewMode === "lead" ? (
                            <span className="shrink-0 text-[11px] font-bold tabular-nums text-zinc-500" aria-label={`Fit score ${group.lead.fitScore || 0}`}>
                              {group.lead.fitScore || 0}
                            </span>
                          ) : null}
                          {!action.awaitingConnection && new Date(action.at).getTime() <= serverNow ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Due now</span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {[group.lead.title, group.lead.company].filter(Boolean).join(" · ")}
                        </p>
                        <p className="mt-2 truncate text-xs font-medium text-zinc-700">
                          {action.title} <span className="font-normal text-zinc-400">· {action.campaign}</span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {action.awaitingConnection ? (
                          <>
                            <p className="text-xs font-semibold text-amber-700">Awaiting</p>
                            <p className="mt-1 text-[11px] text-zinc-400">connection</p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-zinc-800">{dateLabel(action.at, timeZone)}</p>
                            <p className="mt-1 text-[11px] text-zinc-400">{timeLabel(action.at, timeZone)}</p>
                          </>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-zinc-300">chevron_right</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-t border-[var(--md-sys-color-outline-variant)] px-3 text-[11px]">
                <span className="min-w-0 truncate font-medium text-[var(--md-sys-color-on-surface-variant)]">
                  {total === 0 ? "0 results" : `${start + 1}–${end} of ${total}`}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <label className="flex items-center gap-1.5 font-medium text-[var(--md-sys-color-on-surface-variant)]">
                    <span className="hidden sm:inline">Rows</span>
                    <select
                      value={String(perPage)}
                      onChange={(event) => {
                        setPerPage(Number(event.target.value));
                        setPage(1);
                      }}
                      className="h-7 cursor-pointer rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] px-1.5 text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)]"
                      aria-label="Rows per page"
                    >
                      {PER_PAGE_OPTIONS.map((option) => (
                        <option key={option} value={String(option)}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={currentPage === 1}
                      className="grid h-7 w-7 cursor-pointer place-items-center rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:bg-[var(--md-sys-state-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <span className="grid h-7 min-w-7 place-items-center rounded-md bg-[var(--md-sys-color-primary-container)] px-1.5 text-[11px] font-bold text-[var(--md-sys-color-on-primary-container)]">
                      {currentPage}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={currentPage === totalPages}
                      className="grid h-7 w-7 cursor-pointer place-items-center rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:bg-[var(--md-sys-state-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Next page"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden min-h-0 md:block">
              {selected ? (
                <ActionDetails
                  action={selected}
                  siblings={selectedLead?.actions || []}
                  onSelectSibling={selectAction}
                  timeZone={timeZone}
                  pending={pendingId === selected.id}
                  confirming={confirmingId === selected.id}
                  confirmingStop={confirmingStopLeadId === selected.lead?.id}
                  feedback={feedback[selected.id]}
                  onConfirm={() => {
                    setConfirmingStopLeadId("");
                    setConfirmingId(selected.id);
                  }}
                  onCancel={() => setConfirmingId("")}
                  onRun={() => runNow(selected)}
                  onConfirmStop={() => {
                    setConfirmingId("");
                    setConfirmingStopLeadId(selected.lead?.id || "");
                  }}
                  onCancelStop={() => setConfirmingStopLeadId("")}
                  onStop={() => stopOutreach(selected)}
                  showTimeline={viewMode === "lead"}
                />
              ) : (
                <div className="m3-card m3-card-outlined m3-card-lg grid h-full min-h-0 place-items-center p-6 text-center">
                  <p className="text-xs text-zinc-500">Select a lead to preview the next action.</p>
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {/* Mobile: action details open in a centered dialog. */}
        {mobileDetailsOpen && selected ? (
          <div
            className="m3-modal-scrim actions-mobile-dialog-scrim z-[120] md:!hidden"
            role="presentation"
            onClick={() => setMobileDetailsOpen(false)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-label={selected.title}
              className="m3-modal-surface actions-mobile-sheet flex w-full flex-col overflow-hidden bg-[var(--md-sys-color-surface-container)]"
              onClick={(event) => event.stopPropagation()}
            >
              <ActionDetails
                bare
                action={selected}
                siblings={selectedLead?.actions || []}
                onSelectSibling={selectAction}
                timeZone={timeZone}
                pending={pendingId === selected.id}
                confirming={confirmingId === selected.id}
                confirmingStop={confirmingStopLeadId === selected.lead?.id}
                feedback={feedback[selected.id]}
                onConfirm={() => {
                  setConfirmingStopLeadId("");
                  setConfirmingId(selected.id);
                }}
                onCancel={() => setConfirmingId("")}
                onRun={() => runNow(selected)}
                onConfirmStop={() => {
                  setConfirmingId("");
                  setConfirmingStopLeadId(selected.lead?.id || "");
                }}
                onCancelStop={() => setConfirmingStopLeadId("")}
                onStop={() => stopOutreach(selected)}
                onClose={() => setMobileDetailsOpen(false)}
                showTimeline={viewMode === "lead"}
              />
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
