"use client";

import type { ReactNode } from "react";
import type { ScheduledAction } from "@/lib/server/scheduled-actions";

type Lead = NonNullable<ScheduledAction["lead"]>;

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

function timeZoneLabel(timeZone: string) {
  return TIMEZONE_LABELS[timeZone] || timeZone.split("/").at(-1)?.replaceAll("_", " ") || "Universal";
}

export function dateLabel(value: string | number | Date, timeZone: string, includeYear = false) {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", ...(includeYear ? { year: "numeric" as const } : {}) }).format(new Date(value));
}

export function timeLabel(value: string, timeZone: string) {
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

export function resultMessage(result: string, kind: ScheduledAction["kind"]) {
  if (result === "connection") return { ok: true, text: "Connection request sent. The next step has been scheduled automatically." };
  if (result === "message") return { ok: true, text: "Message sent. The next step has been scheduled automatically." };
  if (result === "already-connected") return { ok: true, text: "This lead is already connected. The sequence advanced to the next step." };
  if (result === "action-claimed") return { ok: true, text: "This action is already being processed." };
  if (result === "invite-limit") return { ok: false, text: "Today’s connection-request limit has been reached. The action was rescheduled." };
  if (result === "invite-cooldown") return { ok: false, text: "New invitations are paused after LinkedIn rejected several attempts. This action remains scheduled; Send connection now will try again." };
  if (result === "invite-spaced") return { ok: false, text: "Another connection request went out in the last few minutes. This one was rescheduled to keep sending human-paced." };
  if (result === "message-limit") return { ok: false, text: "Today’s message limit has been reached. The action was rescheduled." };
  if (result === "message-before-connection") return { ok: false, text: "The connection must be accepted before this message can be sent." };
  if (result === "awaiting-connection") return { ok: false, text: "LinkedIn still shows this connection as pending. The message will send once they accept." };
  return { ok: false, text: `${kind === "connection" ? "Connection request" : "Message"} was not sent yet (${result.replaceAll("-", " ")}).` };
}

function TimelineRow({ item, timeZone }: { item: ScheduledAction["timeline"][number]; timeZone: string }) {
  const marker =
    item.status === "completed"
      ? { className: "bg-emerald-500 text-white", icon: "check" }
      : item.status === "scheduled"
        ? { className: "bg-[#ba3871] text-white", icon: "event_upcoming" }
        : item.status === "waiting"
          ? { className: "bg-amber-100 text-amber-700", icon: "lock_clock" }
          : { className: "border border-zinc-300 bg-white", icon: null };
  const stamp = item.at ? `${dateLabel(item.at, timeZone, true)} · ${timeLabel(item.at, timeZone)}` : "";
  const detail =
    item.status === "completed"
      ? stamp
        ? `Done · ${stamp}`
        : "Done"
      : item.status === "scheduled"
        ? stamp
        : item.at
          ? `Estimated ${stamp}`
          : item.note || "";

  return (
    <div className="relative flex w-full gap-3 py-2">
      <span className={`relative z-10 grid h-[1.1rem] w-[1.1rem] shrink-0 place-items-center overflow-hidden rounded-full ${marker.className}`}>
        {marker.icon ? (
          <span className="material-symbols-outlined ms-size-16" aria-hidden="true">{marker.icon}</span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`truncate text-xs font-semibold leading-4 ${item.status === "scheduled" ? "text-[#ba3871]" : item.status === "completed" ? "text-zinc-800" : "text-zinc-500"}`}>{item.title}</span>
          {item.status === "scheduled" ? (
            <span className="shrink-0 rounded-full bg-[#f8e8ef] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#ba3871]">Next</span>
          ) : null}
        </span>
        {detail ? <span className="mt-0.5 block text-[11px] leading-4 text-zinc-400">{detail}</span> : null}
      </span>
    </div>
  );
}

export function ActionDetails({ action, siblings, onSelectSibling, timeZone, pending, confirming, confirmingStop, feedback, onConfirm, onCancel, onRun, onConfirmStop, onCancelStop, onStop, onClose, bare, showTimeline, variant = "panel", hideCompany, intro }: {
  action: ScheduledAction;
  siblings: ScheduledAction[];
  onSelectSibling: (action: ScheduledAction) => void;
  timeZone: string;
  pending: boolean;
  confirming: boolean;
  confirmingStop: boolean;
  feedback?: { ok: boolean; text: string };
  onConfirm: () => void;
  onCancel: () => void;
  onRun: () => void;
  onConfirmStop: () => void;
  onCancelStop: () => void;
  onStop: () => void;
  onClose?: () => void;
  bare?: boolean;
  showTimeline?: boolean;
  variant?: "panel" | "inline";
  hideCompany?: boolean;
  intro?: ReactNode;
}) {
  if (!action.lead) return null;
  const inline = variant === "inline";
  const showIdentity = !inline;

  return (
    <aside className={`flex min-h-0 flex-col overflow-hidden ${inline ? "" : bare ? "h-full max-h-full" : "m3-card m3-card-elevated m3-card-lg h-full"}`}>
      <div className={`min-h-0 flex-1 ${inline ? "" : "overflow-y-auto p-5"}`}>
        {showIdentity ? (
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <Avatar lead={action.lead} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-950">
                <span className="truncate">{action.lead.name}</span>
                <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-zinc-600" aria-label={`Fit score ${action.lead.fitScore || 0}`}>
                  {action.lead.fitScore || 0}
                </span>
              </h2>
              <p className="truncate text-xs text-zinc-500">
                {hideCompany ? action.lead.title : [action.lead.title, action.lead.company].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!confirmingStop ? (
                <button
                  type="button"
                  onClick={onConfirmStop}
                  disabled={pending}
                  className="flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Stop outreach
                </button>
              ) : null}
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close action details"
                  className="grid h-8 w-8 cursor-pointer place-items-center text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  <span className="material-symbols-outlined ms-size-20" aria-hidden="true">
                    close
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mb-2 flex justify-end gap-1">
            {!confirmingStop ? (
              <button
                type="button"
                onClick={onConfirmStop}
                disabled={pending}
                className="flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Stop outreach
              </button>
            ) : null}
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Hide outreach details"
                className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center text-zinc-400 transition-colors hover:text-zinc-800"
              >
                <span className="material-symbols-outlined ms-size-18" aria-hidden="true">
                  close
                </span>
              </button>
            ) : null}
          </div>
        )}

        {confirmingStop ? (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-semibold text-zinc-900">Stop outreach for {action.lead.name.split(" ")[0] || "this lead"}?</p>
            <p className="mt-1 text-[11px] leading-4 text-zinc-500">
              {siblings.length > 1
                ? "Nothing else will be sent in any campaign for this person."
                : "Nothing else will be sent to this person."}
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={onStop} disabled={pending} className="h-8 rounded-md bg-zinc-900 px-3 text-xs font-semibold text-white disabled:opacity-60">
                {pending ? "Stopping…" : "Yes, stop outreach"}
              </button>
              <button type="button" onClick={onCancelStop} disabled={pending} className="h-8 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700">
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {intro ? <div className={showIdentity ? "mt-4" : ""}>{intro}</div> : null}

        {siblings.length > 1 ? (
          <div className={`${showIdentity ? "mt-4" : ""} flex flex-wrap gap-1.5`}>
            {siblings.map((sibling) => (
              <button
                key={sibling.id}
                type="button"
                onClick={() => onSelectSibling(sibling)}
                className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  sibling.id === action.id
                    ? "bg-[#f8e8ef] text-[#ba3871]"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {sibling.campaign || "Campaign"}
              </button>
            ))}
          </div>
        ) : null}

        <div className={inline ? "grid gap-4 lg:grid-cols-2" : ""}>
          {showTimeline ? (
            <div className={`${showIdentity || siblings.length > 1 ? "mt-5" : ""} ${inline ? "" : "border-b border-zinc-100 pb-5"}`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">Schedule</p>
              <div className="relative mt-3 before:absolute before:bottom-4 before:left-[0.55rem] before:top-4 before:w-px before:-translate-x-1/2 before:bg-zinc-200">
                {action.timeline.map((timelineItem) => (
                  <TimelineRow key={timelineItem.id} item={timelineItem} timeZone={timeZone} />
                ))}
              </div>
              {action.awaitingConnection ? (
                <p className="mt-1 flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-4 text-amber-800">
                  <span className="material-symbols-outlined mt-px text-[14px]">lock_clock</span>
                  LinkedIn only allows messages between connections. The connection request is still pending, so the messages below get their send times the moment {action.lead.name.split(" ")[0] || "this lead"} accepts.
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <div className={`flex items-start gap-3 ${showTimeline && !inline ? "mt-5" : showTimeline && inline ? "" : "mt-5"}`}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f8e8ef] text-[#ba3871]"><span className="material-symbols-outlined text-[18px]">{action.kind === "connection" ? "person_add" : "chat_bubble"}</span></span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">Next action</p>
                <p className="mt-1 text-sm font-semibold text-zinc-950">{action.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{action.awaitingConnection ? "Waiting on the connection request" : `${dateLabel(action.at, timeZone, true)} · ${timeLabel(action.at, timeZone)}`}</p>
              </div>
            </div>

            <div className="m3-card m3-card-filled mt-4 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">{action.kind === "connection" ? "Connection note" : "Message"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{action.message}</p>
            </div>

            {inline ? (
              <p className="mt-3 text-xs text-zinc-500">
                {action.campaign || "Campaign"}
              </p>
            ) : (
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-zinc-400">Campaign</dt><dd className="mt-1 font-medium text-zinc-800">{action.campaign || "Campaign"}</dd></div>
                <div><dt className="text-zinc-400">Channel</dt><dd className="mt-1 font-medium text-zinc-800">LinkedIn</dd></div>
              </dl>
            )}

            {feedback ? <p className={`mt-4 rounded-lg px-3 py-2.5 text-xs leading-5 ${feedback.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{feedback.text}</p> : null}
            {action.blockedReason ? <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800"><span className="material-symbols-outlined mt-0.5 text-[15px]">lock_clock</span>{action.blockedReason}</p> : null}

            {confirming ? (
              <div className="mt-4 rounded-lg border border-[#eac4d5] bg-[#fff7fa] p-3">
                <p className="text-xs font-semibold text-zinc-900">Send this live on LinkedIn now?</p>
                <p className="mt-1 text-[11px] leading-4 text-zinc-500">This skips the timer and cannot be undone.</p>
                <div className="mt-3 flex gap-2"><button type="button" onClick={onRun} disabled={pending} className="dark-keep-brand h-8 rounded-md bg-[#ba3871] px-3 text-xs font-semibold text-white disabled:opacity-60">{pending ? "Sending…" : "Yes, send now"}</button><button type="button" onClick={onCancel} disabled={pending} className="h-8 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700">Cancel</button></div>
              </div>
            ) : (
              <button type="button" onClick={onConfirm} disabled={!action.canRunNow || pending} className={`dark-keep-brand mt-4 flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ba3871] text-sm font-semibold text-white transition hover:bg-[#a92f65] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 ${inline ? "min-w-[10rem] px-3" : "w-full"}`}><span className="material-symbols-outlined text-[17px]">send</span>{action.kind === "connection" ? "Send connection now" : "Send message now"}</button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
