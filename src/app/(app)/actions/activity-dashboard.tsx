"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { runScheduledActionNowAction } from "@/app/actions";
import MobileHeaderPortal from "@/app/mobile-header-portal";
import type { ScheduledAction } from "@/lib/server/scheduled-actions";

type Lead = NonNullable<ScheduledAction["lead"]>;
type LeadActions = { lead: Lead; actions: ScheduledAction[] };

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Chicago",
  "Europe/Berlin",
  "America/New_York",
  "Pacific/Honolulu",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "America/Denver",
  "Pacific/Auckland",
  "America/Los_Angeles",
  "Asia/Singapore",
  "Australia/Sydney",
  "Europe/London",
  "UTC",
];
const TIMEZONE_LABELS: Record<string, string> = {
  UTC: "Universal",
  "America/Sao_Paulo": "Brazil",
  "America/Chicago": "Central US",
  "Europe/Berlin": "Central Europe",
  "America/New_York": "Eastern US",
  "Pacific/Honolulu": "Hawaii",
  "Asia/Kolkata": "India",
  "Asia/Tokyo": "Japan",
  "America/Denver": "Mountain US",
  "Pacific/Auckland": "New Zealand",
  "America/Los_Angeles": "Pacific US",
  "Asia/Singapore": "Singapore",
  "Australia/Sydney": "Australia",
  "Europe/London": "United Kingdom",
};
const PER_PAGE_OPTIONS = [10, 50, 100];

function timeZoneLabel(timeZone: string) {
  return TIMEZONE_LABELS[timeZone] || timeZone.split("/").at(-1)?.replaceAll("_", " ") || "Universal";
}

function dateLabel(value: string | number | Date, timeZone: string, includeYear = false) {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", ...(includeYear ? { year: "numeric" as const } : {}) }).format(new Date(value));
}

function timeLabel(value: string, timeZone: string) {
  const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(value));
  return `${time} ${timeZoneLabel(timeZone)} time`;
}

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

function resultMessage(result: string, kind: ScheduledAction["kind"]) {
  if (result === "connection") return { ok: true, text: "Connection request sent. The next step has been scheduled automatically." };
  if (result === "message") return { ok: true, text: "Message sent. The next step has been scheduled automatically." };
  if (result === "already-connected") return { ok: true, text: "This lead is already connected. The sequence advanced to the next step." };
  if (result === "action-claimed") return { ok: true, text: "This action is already being processed." };
  if (result === "invite-limit") return { ok: false, text: "Today’s connection-request limit has been reached. The action was rescheduled." };
  if (result === "invite-cooldown") return { ok: false, text: "LinkedIn has paused new invitations. This action remains scheduled for later." };
  if (result === "invite-spaced") return { ok: false, text: "Another connection request went out in the last few minutes. This one was rescheduled to keep sending human-paced." };
  if (result === "message-limit") return { ok: false, text: "Today’s message limit has been reached. The action was rescheduled." };
  if (result === "message-before-connection") return { ok: false, text: "The connection must be accepted before this message can be sent." };
  return { ok: false, text: `${kind === "connection" ? "Connection request" : "Message"} was not sent yet (${result.replaceAll("-", " ")}).` };
}

function ActionDetails({ action, timeZone, pending, confirming, feedback, onConfirm, onCancel, onRun, onClose, bare }: {
  action: ScheduledAction;
  timeZone: string;
  pending: boolean;
  confirming: boolean;
  feedback?: { ok: boolean; text: string };
  onConfirm: () => void;
  onCancel: () => void;
  onRun: () => void;
  onClose?: () => void;
  bare?: boolean;
}) {
  if (!action.lead) return null;
  return (
    <aside className={`flex min-h-0 flex-col overflow-hidden ${bare ? "max-h-full" : "m3-card m3-card-elevated m3-card-lg h-full"}`}>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <Avatar lead={action.lead} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-zinc-950">{action.lead.name}</h2>
            <p className="truncate text-xs text-zinc-500">{[action.lead.title, action.lead.company].filter(Boolean).join(" · ")}</p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close action details"
              className="ml-auto grid h-8 w-8 shrink-0 cursor-pointer place-items-center text-zinc-500 transition-colors hover:text-zinc-900"
            >
              <span className="material-symbols-outlined ms-size-20" aria-hidden="true">
                close
              </span>
            </button>
          ) : null}
        </div>

        <div className="mt-5 flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f8e8ef] text-[#ba3871]"><span className="material-symbols-outlined text-[18px]">{action.kind === "connection" ? "person_add" : "chat_bubble"}</span></span>
          <div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">Next action</p><p className="mt-1 text-sm font-semibold text-zinc-950">{action.title}</p><p className="mt-1 text-xs text-zinc-500">{dateLabel(action.at, timeZone, true)} · {timeLabel(action.at, timeZone)}</p></div>
        </div>

        <div className="m3-card m3-card-filled mt-5 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">{action.kind === "connection" ? "Connection note" : "Message"}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{action.message}</p>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div><dt className="text-zinc-400">Campaign</dt><dd className="mt-1 font-medium text-zinc-800">{action.campaign || "Campaign"}</dd></div>
          <div><dt className="text-zinc-400">Channel</dt><dd className="mt-1 font-medium text-zinc-800">LinkedIn</dd></div>
        </dl>

        {feedback ? <p className={`mt-4 rounded-lg px-3 py-2.5 text-xs leading-5 ${feedback.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{feedback.text}</p> : null}
        {action.blockedReason ? <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800"><span className="material-symbols-outlined mt-0.5 text-[15px]">lock_clock</span>{action.blockedReason}</p> : null}

        {confirming ? (
          <div className="mt-5 rounded-lg border border-[#eac4d5] bg-[#fff7fa] p-3">
            <p className="text-xs font-semibold text-zinc-900">Send this live on LinkedIn now?</p>
            <p className="mt-1 text-[11px] leading-4 text-zinc-500">This skips the timer and cannot be undone.</p>
            <div className="mt-3 flex gap-2"><button type="button" onClick={onRun} disabled={pending} className="dark-keep-brand h-8 rounded-md bg-[#ba3871] px-3 text-xs font-semibold text-white disabled:opacity-60">{pending ? "Sending…" : "Yes, send now"}</button><button type="button" onClick={onCancel} disabled={pending} className="h-8 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700">Cancel</button></div>
          </div>
        ) : (
          <button type="button" onClick={onConfirm} disabled={!action.canRunNow || pending} className="dark-keep-brand mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#ba3871] text-sm font-semibold text-white transition hover:bg-[#a92f65] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"><span className="material-symbols-outlined text-[17px]">send</span>{action.kind === "connection" ? "Send connection now" : "Send message now"}</button>
        )}
      </div>
    </aside>
  );
}

// mobileCaption (mobile-only): hides the page title + inline timezone picker,
// docks the picker into the fixed app bar, and shows the caption above the list.
export default function ActionsDashboard({ items, title, serverNow, timezone = "UTC", headerActions, intro, mobileCaption }: { items: ScheduledAction[]; title: string; serverNow: number; timezone?: string; headerActions?: ReactNode; intro?: ReactNode; loadLiveItems?: boolean; mobileCaption?: string }) {
  const router = useRouter();
  const [timeZone, setTimeZone] = useState(timezone || "UTC");
  const [selectedLeadId, setSelectedLeadId] = useState(items.find((item) => item.lead)?.lead?.id || "");
  const [selectedId, setSelectedId] = useState(items.find((item) => item.lead)?.id || "");
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = window.setInterval(refresh, 15_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  const leads = useMemo(() => {
    const groups = new Map<string, LeadActions>();
    for (const action of items) {
      if (!action.lead) continue;
      const group = groups.get(action.lead.id) || { lead: action.lead, actions: [] };
      group.actions.push(action);
      groups.set(action.lead.id, group);
    }
    return Array.from(groups.values()).map((group) => ({ ...group, actions: group.actions.sort((a, b) => a.at.localeCompare(b.at)) })).sort((a, b) => a.actions[0].at.localeCompare(b.actions[0].at));
  }, [items]);

  const selectedLead = leads.find((group) => group.lead.id === selectedLeadId) || leads[0];
  const selected = selectedLead?.actions.find((action) => action.id === selectedId) || selectedLead?.actions[0];
  const total = leads.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageRows = leads.slice(start, end);
  const timeZoneOptions = Array.from(new Set([timeZone, ...TIMEZONES])).sort((a, b) => timeZoneLabel(a).localeCompare(timeZoneLabel(b)));

  function selectAction(action: ScheduledAction) {
    setSelectedLeadId(action.lead?.id || "");
    setSelectedId(action.id);
    setConfirmingId("");
    setMobileDetailsOpen(true);
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

  const desktopTimeZonePicker = (
    <label className={`flex h-8 items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 ${mobileCaption ? "md:h-[34px] md:pr-4" : ""}`}>
      <span className="material-symbols-outlined text-[15px]">language</span>
      <span className="relative">
        <select
          aria-label="Display actions in timezone"
          value={timeZone}
          onChange={(event) => setTimeZone(event.target.value)}
          className={`cursor-pointer appearance-none border-0 bg-transparent pr-6 shadow-none outline-none ${mobileCaption ? "md:pl-2" : ""}`}
        >
          {timeZoneOptions.map((zone) => (
            <option key={zone} value={zone}>
              {timeZoneLabel(zone)}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[16px] text-zinc-500" aria-hidden="true">
          arrow_drop_down
        </span>
      </span>
    </label>
  );

  const mobileTimeZonePicker = (
    <div className="m3-mobile-header-action fixed right-2 z-[92] md:hidden">
      <div className="relative">
        <select
          aria-label="Display actions in timezone"
          value={timeZone}
          onChange={(event) => setTimeZone(event.target.value)}
          className="h-8 w-32 cursor-pointer appearance-none rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] pl-3 pr-8 text-[11px] font-medium text-[var(--md-sys-color-on-surface)] outline-none"
        >
          {timeZoneOptions.map((zone) => (
            <option key={zone} value={zone}>
              {timeZoneLabel(zone)}
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
      {mobileCaption ? <MobileHeaderPortal>{mobileTimeZonePicker}</MobileHeaderPortal> : null}
      <header className={`app-x flex shrink-0 flex-col gap-4 md:flex-row md:justify-between md:pt-6 ${mobileCaption ? "pt-0 md:items-center" : "pt-5 md:items-end"}`}>
        <h1
          style={{ fontFamily: "var(--font-varta)" }}
          className={`text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl ${mobileCaption ? "hidden md:block" : ""}`}
        >
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {headerActions}
          <div className={mobileCaption ? "hidden md:block" : ""}>{desktopTimeZonePicker}</div>
        </div>
      </header>

      <main className="app-x flex min-h-0 flex-1 flex-col overflow-hidden">
        {intro ? <div className="shrink-0 pb-4">{intro}</div> : null}
        {!leads.length ? (
          <div className="m3-card m3-card-outlined m3-card-lg border-dashed py-16 text-center">
            <span className="material-symbols-outlined text-3xl text-zinc-400">event_available</span>
            <h2 className="mt-3 text-sm font-semibold text-zinc-900">Nothing scheduled</h2>
            <p className="mt-1 text-xs text-zinc-500">Leads from active campaigns will appear here.</p>
          </div>
        ) : (
          <>
          {mobileCaption ? (
            <p className="shrink-0 pb-3 text-sm font-medium text-zinc-600 md:hidden">{mobileCaption}</p>
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
                          {new Date(action.at).getTime() <= serverNow ? (
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
                        <p className="text-xs font-semibold text-zinc-800">{dateLabel(action.at, timeZone)}</p>
                        <p className="mt-1 text-[11px] text-zinc-400">{timeLabel(action.at, timeZone)}</p>
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
                  timeZone={timeZone}
                  pending={pendingId === selected.id}
                  confirming={confirmingId === selected.id}
                  feedback={feedback[selected.id]}
                  onConfirm={() => setConfirmingId(selected.id)}
                  onCancel={() => setConfirmingId("")}
                  onRun={() => runNow(selected)}
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
                timeZone={timeZone}
                pending={pendingId === selected.id}
                confirming={confirmingId === selected.id}
                feedback={feedback[selected.id]}
                onConfirm={() => setConfirmingId(selected.id)}
                onCancel={() => setConfirmingId("")}
                onRun={() => runNow(selected)}
                onClose={() => setMobileDetailsOpen(false)}
              />
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
