"use client";

import { useEffect, useMemo, useState } from "react";
import type { Group, LeadPreview } from "@/lib/server/types";
import {
  deleteGroupAction,
  listScheduledActionsAction,
  runScheduledActionNowAction,
  stopLeadOutreachAction,
} from "@/app/actions";
import { TextField } from "@/app/ui/text-field";
import { useSidebarResource } from "@/app/use-sidebar-resource";
import { ContentReveal, LeadsTableSkeleton, Skeleton } from "@/app/app-skeletons";
import NewAgentButton from "@/app/(app)/agents/new-agent-button";
import { useBodyScrollLock } from "@/app/use-body-scroll-lock";
import {
  consumeAgentStartedNotice,
  useToast,
  userFacingError,
} from "@/app/toast";
import MobileHeaderPortal from "@/app/mobile-header-portal";
import { useWorkspaceTimeZone } from "@/app/workspace-time-zone";
import { zonedDayKey } from "@/lib/time-zone";
import type { ScheduledAction } from "@/lib/server/scheduled-actions";
import { ActionDetails, resultMessage } from "@/app/(app)/actions/action-details";

type LeadsViewProps = {
  groups: Group[];
  leads: LeadPreview[];
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function LinkedInProfileLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open LinkedIn profile"
      onClick={(event) => event.stopPropagation()}
      className="inline-grid h-[10px] w-[10px] shrink-0 -translate-y-[2px] place-items-center rounded-[2px] transition-opacity hover:opacity-80"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/linkedin-in-mark.svg" alt="" className="h-full w-full object-contain" />
    </a>
  );
}

const ALL_CONTACTS_TAB = "all";

const OUTREACH_STATUS_LABELS: Record<LeadPreview["outreachStatus"], string> = {
  new: "New",
  invited: "Invited",
  connected: "Connected",
  messaged: "Messaged",
  replied: "Replied",
  declined: "Declined",
  stopped: "Stopped",
};

function outreachEmptyCopy(status: LeadPreview["outreachStatus"]) {
  if (status === "replied") return "They replied. Continue the thread in Messages.";
  if (status === "stopped") return "Outreach is stopped.";
  if (status === "declined") return "They declined the invite.";
  if (status === "messaged") return "No more sends are scheduled.";
  if (status === "invited") return "Connection request sent. No follow-up is scheduled.";
  if (status === "connected") return "Connected. No message is scheduled.";
  return "No outreach is scheduled yet.";
}

function LeadContact({ lead }: { lead: LeadPreview }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {lead.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={lead.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ba3871] text-[12px] font-semibold text-white">
          {initials(lead.name)}
        </span>
      )}
      <div className="min-w-0">
        <div className="flex min-w-0 items-end gap-0.5">
          {lead.linkedInUrl ? (
            <a
              href={lead.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="truncate text-[13px] font-semibold leading-none text-[#0a66c2] hover:underline"
            >
              {lead.name}
            </a>
          ) : (
            <span className="truncate text-[13px] font-semibold leading-none text-zinc-950">{lead.name}</span>
          )}
          {lead.linkedInUrl ? <LinkedInProfileLink href={lead.linkedInUrl} /> : null}
        </div>
        <div className="mt-1 truncate text-[12px] font-medium text-zinc-800">{lead.title || "-"}</div>
      </div>
    </div>
  );
}

function LeadSignal({
  lead,
  groupName,
}: {
  lead: LeadPreview;
  groupName?: string;
}) {
  const signalKeyword = lead.signalText || (groupName ? `"${groupName.toLowerCase()}"` : "");
  return (
    <div className="min-w-0 text-[12px] font-medium text-zinc-800">
      <div>
        {lead.leadReason || "Engaged with a LinkedIn post"}
        {lead.signalUrl || lead.engagementContext?.postUrl ? (
          <>
            {" · "}
            <a
              href={lead.signalUrl || lead.engagementContext?.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="text-[#0a66c2] underline"
            >
              View post
            </a>
          </>
        ) : null}
      </div>
      {lead.engagementContext?.postText ? (
        <div className="line-clamp-2 text-[11px] font-medium text-zinc-700">
          <span className="font-bold text-zinc-800">Post:</span>{" "}
          {lead.engagementContext.postText}
        </div>
      ) : null}
      {lead.engagementContext?.commentText ? (
        <div className="line-clamp-2 text-[11px] font-medium text-zinc-700">
          <span className="font-bold text-zinc-800">Their comment:</span>{" "}
          {lead.engagementContext.commentText}
        </div>
      ) : !lead.engagementContext?.postText && signalKeyword ? (
        <div className="line-clamp-2 whitespace-pre-wrap text-[11px] font-medium text-zinc-700">
          <span className="font-bold text-zinc-800">Signal:</span> {signalKeyword}
        </div>
      ) : null}
    </div>
  );
}

function csvCell(value: string) {
  // Prefix cells that Excel/Sheets would evaluate as formulas.
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

function buildLeadsCsv(rows: LeadPreview[], timeZone: string) {
  const header = [
    "Name",
    "Title",
    "Company",
    "Location",
    "LinkedIn URL",
    "AI Fit Score",
    "Why They're a Great Fit",
    "Summary",
    "Signal",
    "Signal URL",
    "Outreach Status",
    "Added",
  ];
  const lines = rows.map((lead) =>
    [
      lead.name,
      lead.title,
      lead.company,
      lead.location,
      lead.linkedInUrl,
      String(lead.fitScore || 0),
      (lead.scoreReasons || []).join("; "),
      lead.summary,
      lead.signalText || "",
      lead.signalUrl || "",
      OUTREACH_STATUS_LABELS[lead.outreachStatus] || lead.outreachStatus,
      // The workspace's calendar day, not UTC's - a lead added at 11pm local
      // otherwise exports under tomorrow's date.
      zonedDayKey(lead.createdAt, timeZone),
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.map(csvCell).join(","), ...lines].join("\r\n");
}

function downloadCsv(filename: string, csv: string) {
  // UTF-8 BOM so Excel opens accented names correctly.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const PER_PAGE_OPTIONS = [25, 50, 100];
const selectLeadsData = (data: Record<string, unknown>) => ({
  groups: data.groups as Group[] || [],
  leads: data.leads as LeadPreview[] || [],
});

export default function LeadsView({ groups, leads }: LeadsViewProps) {
  const timeZone = useWorkspaceTimeZone();
  const leadsResource = useSidebarResource(
    "groups,leadPreviews",
    { groups, leads },
    selectLeadsData,
  );
  const { groups: loadedGroups, leads: loadedLeads } = leadsResource.value;
  const isInitialLoading = leadsResource.loading;
  const [selectedGroupId, setSelectedGroupId] = useState<string>(ALL_CONTACTS_TAB);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState<number>(100);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mobileGroupMenu, setMobileGroupMenu] = useState<Group | null>(null);
  const [desktopGroupMenu, setDesktopGroupMenu] = useState<{
    groupId: string;
    left: number;
    top: number;
  } | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);
  const [exportGroup, setExportGroup] = useState<Group | null>(null);
  const [deletedGroupIds, setDeletedGroupIds] = useState<Set<string>>(new Set());
  const [openLeadId, setOpenLeadId] = useState("");
  const [openActionId, setOpenActionId] = useState("");
  const [scheduledActions, setScheduledActions] = useState<ScheduledAction[] | undefined>(undefined);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [scheduledError, setScheduledError] = useState("");
  const [confirmingId, setConfirmingId] = useState("");
  const [confirmingStopLeadId, setConfirmingStopLeadId] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const { showError, showAgentStarted } = useToast();
  useBodyScrollLock(Boolean(mobileGroupMenu || deleteGroup || exportGroup || mobilePreviewOpen));

  const actionsForOpenLead = useMemo(
    () => (scheduledActions || []).filter((action) => action.lead?.id === openLeadId).sort((a, b) => a.at.localeCompare(b.at)),
    [scheduledActions, openLeadId],
  );
  const openAction = actionsForOpenLead.find((action) => action.id === openActionId) || actionsForOpenLead[0];

  async function loadScheduledActions() {
    setScheduledLoading(true);
    setScheduledError("");
    try {
      const items = await listScheduledActionsAction();
      setScheduledActions(items);
      return items;
    } catch (error) {
      setScheduledError(userFacingError(error, "Outreach details could not be loaded."));
      return [];
    } finally {
      setScheduledLoading(false);
    }
  }

  function selectLead(leadId: string) {
    setConfirmingId("");
    setConfirmingStopLeadId("");
    setOpenLeadId(leadId);
    setOpenActionId("");
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches) {
      setMobilePreviewOpen(true);
    }
    if (scheduledActions === undefined && !scheduledLoading) {
      void loadScheduledActions();
    }
  }

  async function runNow(action: ScheduledAction) {
    setPendingId(action.id);
    setFeedback((current) => {
      const next = { ...current };
      delete next[action.id];
      return next;
    });
    const formData = new FormData();
    formData.set("enrollmentId", action.id);
    try {
      const { result } = await runScheduledActionNowAction(formData);
      setFeedback((current) => ({ ...current, [action.id]: resultMessage(result, action.kind) }));
      setConfirmingId("");
      await loadScheduledActions();
      leadsResource.reload();
    } catch (error) {
      setFeedback((current) => ({
        ...current,
        [action.id]: { ok: false, text: error instanceof Error ? error.message : "The action could not be sent." },
      }));
    } finally {
      setPendingId("");
    }
  }

  async function stopOutreach(action: ScheduledAction) {
    const leadId = action.lead?.id;
    if (!leadId) return;
    setPendingId(action.id);
    setFeedback((current) => {
      const next = { ...current };
      delete next[action.id];
      return next;
    });
    const formData = new FormData();
    formData.set("leadId", leadId);
    try {
      await stopLeadOutreachAction(formData);
      setConfirmingStopLeadId("");
      await loadScheduledActions();
      leadsResource.reload();
    } catch (error) {
      setFeedback((current) => ({
        ...current,
        [action.id]: { ok: false, text: error instanceof Error ? error.message : "Outreach could not be stopped." },
      }));
    } finally {
      setPendingId("");
    }
  }

  useEffect(() => {
    if (isInitialLoading) return;
    if (scheduledActions === undefined && !scheduledLoading) {
      void loadScheduledActions();
    }
  }, [isInitialLoading]);

  // Leads-only agents land here after launch. Show the same started card.
  useEffect(() => {
    const notice = consumeAgentStartedNotice();
    if (!notice) return;
    showAgentStarted(notice.name || undefined, notice.kind);
  }, [showAgentStarted]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Only show leads that still belong to a live group. Deleting a group
    // permanently removes its leads from the database; this filter also hides
    // any legacy orphan rows with empty groupIds.
    const liveGroupIds = new Set(
      loadedGroups
        .filter((group) => !deletedGroupIds.has(group.id))
        .map((group) => group.id),
    );
    let next = loadedLeads.filter((lead) =>
      lead.groupIds.some((id) => liveGroupIds.has(id)),
    );
    if (selectedGroupId !== ALL_CONTACTS_TAB) {
      next = next.filter((lead) => lead.groupIds.includes(selectedGroupId));
    }
    if (q) {
      next = next.filter(
        (lead) =>
          lead.name.toLowerCase().includes(q) ||
          lead.company.toLowerCase().includes(q) ||
          lead.title.toLowerCase().includes(q),
      );
    }
    next = [...next].sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
    return next;
  }, [loadedLeads, loadedGroups, deletedGroupIds, search, selectedGroupId]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageRows = filtered.slice(start, end);
  const openLead = pageRows.find((lead) => lead.id === openLeadId) ?? null;
  const pageLeadKey = pageRows.map((lead) => lead.id).join(",");

  useEffect(() => {
    if (!pageLeadKey) {
      setOpenLeadId("");
      setOpenActionId("");
      return;
    }
    const ids = pageLeadKey.split(",");
    setOpenLeadId((current) => (ids.includes(current) ? current : ids[0]));
  }, [pageLeadKey]);

  function outreachPreview(onClose?: () => void) {
    if (!openLead) {
      return (
        <div className="grid h-full place-items-center p-6 text-center">
          <p className="text-xs text-zinc-500">Select a lead to preview outreach.</p>
        </div>
      );
    }
    const group = loadedGroups.find((item) => openLead.groupIds.includes(item.id));
    if (scheduledLoading && scheduledActions === undefined) {
      return (
        <div className="grid h-full place-items-center p-6 text-center">
          <p className="text-xs text-zinc-500">Loading outreach…</p>
        </div>
      );
    }
    if (scheduledError) {
      return (
        <div className="grid h-full place-items-center p-6 text-center">
          <p className="text-xs text-amber-800">{scheduledError}</p>
        </div>
      );
    }
    if (openAction) {
      return (
        <ActionDetails
          bare
          hideCompany
          showTimeline
          action={openAction}
          siblings={actionsForOpenLead}
          onSelectSibling={(action) => setOpenActionId(action.id)}
          timeZone={timeZone}
          pending={pendingId === openAction.id}
          confirming={confirmingId === openAction.id}
          confirmingStop={confirmingStopLeadId === openAction.lead?.id}
          feedback={feedback[openAction.id]}
          onConfirm={() => {
            setConfirmingStopLeadId("");
            setConfirmingId(openAction.id);
          }}
          onCancel={() => setConfirmingId("")}
          onRun={() => runNow(openAction)}
          onConfirmStop={() => {
            setConfirmingId("");
            setConfirmingStopLeadId(openAction.lead?.id || "");
          }}
          onCancelStop={() => setConfirmingStopLeadId("")}
          onStop={() => stopOutreach(openAction)}
          onClose={onClose}
          intro={<LeadSignal lead={openLead} groupName={group?.name} />}
        />
      );
    }
    return (
      <div className="relative grid h-full place-items-center p-6 text-center">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close outreach preview"
            className="absolute right-3 top-3 grid h-8 w-8 cursor-pointer place-items-center text-zinc-500 hover:text-zinc-900"
          >
            <span className="material-symbols-outlined ms-size-20" aria-hidden="true">close</span>
          </button>
        ) : null}
        <div>
          <span className="material-symbols-outlined text-3xl text-white" aria-hidden="true">
            chat_bubble
          </span>
          <p className="mt-4 text-sm font-medium text-zinc-500">
            {outreachEmptyCopy(openLead.outreachStatus)}
          </p>
        </div>
      </div>
    );
  }

  function toggleSelected(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === pageRows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageRows.map((row) => row.id)));
    }
  }

  function confirmExportGroup() {
    const target = exportGroup;
    if (!target) return;
    setExportGroup(null);

    const rows = loadedLeads.filter((lead) => lead.groupIds.includes(target.id));
    if (rows.length === 0) {
      showError("This lead group has no leads to export.");
      return;
    }
    const slug =
      target.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "lead-group";
    downloadCsv(`${slug}-leads.csv`, buildLeadsCsv(rows, timeZone));
  }

  async function confirmDeleteGroup() {
    const target = deleteGroup;
    if (!target) return;

    const wasSelected = selectedGroupId === target.id;
    setDeletedGroupIds((current) => new Set(current).add(target.id));
    if (wasSelected) setSelectedGroupId(ALL_CONTACTS_TAB);
    setDeleteGroup(null);

    const formData = new FormData();
    formData.set("groupId", target.id);

    try {
      await deleteGroupAction(formData);
      leadsResource.reload();
    } catch (error) {
      setDeletedGroupIds((current) => {
        const next = new Set(current);
        next.delete(target.id);
        return next;
      });
      if (wasSelected) setSelectedGroupId(target.id);
      showError(
        userFacingError(error, "Lead group could not be deleted."),
      );
    }
  }

  function openDesktopGroupMenu(button: HTMLButtonElement, group: Group) {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const rect = button.getBoundingClientRect();
    const menuWidth = 144;
    setDesktopGroupMenu({
      groupId: group.id,
      left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
      top: rect.bottom,
    });
  }

  return (
    <div className="app-x flex h-full min-h-0 min-w-0 flex-col gap-3 md:ml-4 md:mr-0.5 md:pb-3">
      {/* Header */}
      <div className="hidden shrink-0 items-center justify-between gap-3 pt-6 md:flex">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)]">
            Leads
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NewAgentButton className="m3-btn m3-btn-filled h-8 shrink-0 cursor-pointer gap-1 px-2.5 text-xs">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Add leads
          </NewAgentButton>
          <TextField
            className="m3-text-field--compact w-56"
            variant="filled"
            placeholder="Search leads"
            aria-label="Search leads"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            leadingIcon={
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Mobile header actions */}
      <MobileHeaderPortal>
        <div className="md:hidden">
          <div className="m3-mobile-header-action fixed right-2 z-[92] w-[152px] min-w-0">
            <TextField
              className="m3-text-field--compact [&_.m3-text-field__input]:pl-2"
              variant="filled"
              placeholder="Search leads"
              aria-label="Search leads"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              leadingIcon={
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              }
            />
          </div>
        </div>
      </MobileHeaderPortal>

      {/* Tabs fused with the table card: the active tab shares the card's white
          surface and borders, browser-style, so the selected group is obvious.
          The row overlaps the card's top border by 1px (-mb-px) and the active
          tab's white fill erases the border segment beneath it. */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="relative z-10 -mb-px flex min-w-0 shrink-0 touch-pan-x items-end gap-1 overflow-x-auto px-2 thin-scroll-overlay"
          onScroll={() => setDesktopGroupMenu(null)}
        >
          {[{ id: ALL_CONTACTS_TAB, name: "All contacts" }, ...loadedGroups]
            .filter((item) => !deletedGroupIds.has(item.id))
            .map((item) => {
            const active = selectedGroupId === item.id;
            return (
              <div
                key={item.id}
                className={`group relative flex shrink-0 items-center rounded-t-lg border transition-colors ${
                  active
                    ? "border-zinc-200 border-b-transparent bg-white text-zinc-950"
                    : "border-transparent text-zinc-600 hover:bg-zinc-950/[0.04] hover:text-zinc-900"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(item.id);
                    setSelected(new Set());
                    setPage(1);
                  }}
                  title={item.name}
                  className={`cursor-pointer py-2 pl-3.5 text-[13px] ${active ? "font-semibold" : "font-medium"} ${item.id === ALL_CONTACTS_TAB ? "pr-3.5" : "pr-1"}`}
                >
                  <span className="block max-w-[220px] translate-y-px truncate whitespace-nowrap">{item.name}</span>
                </button>
                {item.id !== ALL_CONTACTS_TAB ? (
                  <div className="group/dots relative mr-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-label={`Actions for ${item.name}`}
                      onMouseEnter={(event) => openDesktopGroupMenu(event.currentTarget, item as Group)}
                      onFocus={(event) => openDesktopGroupMenu(event.currentTarget, item as Group)}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (window.matchMedia("(max-width: 767.98px)").matches) {
                          setMobileGroupMenu(item as Group);
                        } else {
                          openDesktopGroupMenu(event.currentTarget, item as Group);
                        }
                      }}
                      className="grid h-6 w-6 cursor-pointer place-items-center rounded text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="5" cy="12" r="1.7" />
                        <circle cx="12" cy="12" r="1.7" />
                        <circle cx="19" cy="12" r="1.7" />
                      </svg>
                    </button>
                    {/* Keep the menu outside the tab strip's overflow clip while retaining its hover bridge. */}
                    {desktopGroupMenu?.groupId === item.id ? (
                      <div
                        className="fixed z-50 hidden pt-1 group-focus-within/dots:block group-hover/dots:block"
                        style={{ left: desktopGroupMenu.left, top: desktopGroupMenu.top }}
                      >
                        <div className="m3-menu m3-menu-enter m3-menu--origin-top-right m3-menu--compact w-36">
                          <button
                            type="button"
                            onClick={() => {
                              setDesktopGroupMenu(null);
                              setExportGroup(item as Group);
                            }}
                            className="m3-menu-item"
                          >
                            Export CSV
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDesktopGroupMenu(null);
                              setDeleteGroup(item as Group);
                            }}
                            className="m3-menu-item m3-menu-item--danger"
                          >
                            Delete group
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
          {isInitialLoading
            ? [0, 1].map((item) => <Skeleton key={item} className="mb-2.5 h-4 w-20 shrink-0" />)
            : null}
        </div>

        {/* Table card — M3 outlined card hosting scannable grid */}
        <section className="m3-card m3-card-outlined m3-card-lg m3-lateral-viewport flex min-h-0 flex-1 flex-col bg-white">
        {isInitialLoading ? (
          <LeadsTableSkeleton />
        ) : (
          <ContentReveal key={selectedGroupId} className="m3-lateral-panel grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(22rem,2fr)_minmax(0,3fr)]">
            <div className="flex min-h-0 min-w-0 flex-col md:border-r md:border-zinc-200">
              <div className="m3-table-grid-header hidden shrink-0 grid-cols-[40px_minmax(0,1fr)] items-center gap-3 md:grid">
                <span>
                  <input
                    type="checkbox"
                    checked={pageRows.length > 0 && selected.size === pageRows.length}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 cursor-pointer accent-[#e85e6b]"
                  />
                </span>
                <span>Contact</span>
              </div>

              <div className="m3-table-grid min-h-0 flex-1 overflow-y-auto">
                {pageRows.length === 0 ? (
                  <div className="grid h-full place-items-center p-6 text-center text-[12px] font-medium text-zinc-700 md:p-10">
                    {search ? (
                      "No leads match your search."
                    ) : (
                      <div>
                        <span className="material-symbols-outlined text-3xl text-zinc-400">person_search</span>
                        <h2 className="mt-3 text-sm font-semibold text-zinc-900">No leads yet</h2>
                        <p className="mt-1 text-xs font-normal text-zinc-500">Leads your agents find will appear here.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  pageRows.map((lead) => {
                    const isChecked = selected.has(lead.id);
                    const isOpen = openLeadId === lead.id;
                    return (
                      <div
                        key={lead.id}
                        aria-selected={isOpen}
                        onClick={() => selectLead(lead.id)}
                        className={`m3-table-grid-row grid cursor-pointer grid-cols-[40px_minmax(0,1fr)] items-center gap-3 ${
                          isOpen ? "bg-[#fff7fa]" : isChecked ? "bg-[#fff5f6]/40" : ""
                        }`}
                      >
                        <span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => toggleSelected(lead.id)}
                            className="h-3.5 w-3.5 cursor-pointer accent-[#e85e6b]"
                          />
                        </span>
                        <div className="min-w-0 py-1">
                          <LeadContact lead={lead} />
                        </div>
                      </div>
                    );
                  })
                )}
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

            <div className="hidden min-h-0 min-w-0 bg-[var(--md-sys-color-surface-container)] md:flex md:flex-col">
              {outreachPreview()}
            </div>
          </ContentReveal>
        )}
      </section>
      </div>

      {mobilePreviewOpen && openLead ? (
        <div
          className="m3-modal-scrim actions-mobile-dialog-scrim z-[120] md:!hidden"
          role="presentation"
          onClick={() => setMobilePreviewOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Outreach for ${openLead.name}`}
            className="m3-modal-surface actions-mobile-sheet flex w-full flex-col overflow-hidden bg-[var(--md-sys-color-surface-container)]"
            onClick={(event) => event.stopPropagation()}
          >
            {outreachPreview(() => setMobilePreviewOpen(false))}
          </section>
        </div>
      ) : null}

      {mobileGroupMenu ? (
        <div
          className="m3-modal-scrim z-[120] md:hidden"
          role="presentation"
          onClick={() => setMobileGroupMenu(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Actions for ${mobileGroupMenu.name}`}
            className="m3-modal-surface"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="truncate text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
              {mobileGroupMenu.name}
            </p>
            <button
              type="button"
              onClick={() => {
                setExportGroup(mobileGroupMenu);
                setMobileGroupMenu(null);
              }}
              className="m3-menu-item mt-4 w-full rounded-lg"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteGroup(mobileGroupMenu);
                setMobileGroupMenu(null);
              }}
              className="m3-menu-item m3-menu-item--danger mt-1 w-full rounded-lg"
            >
              Delete group
            </button>
          </section>
        </div>
      ) : null}

      {exportGroup ? (
        <div
          className="m3-dialog-scrim z-50"
          role="presentation"
          onClick={() => setExportGroup(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-group-title"
            className="m3-dialog-surface"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="export-group-title" className="m3-dialog-title">
              Export lead group?
            </h2>
            <p className="m3-dialog-body">
              Download the leads in {exportGroup.name} as a CSV file, including
              names, LinkedIn profiles, companies, AI fit scores, and why each
              lead is a great fit.
            </p>
            <div className="m3-dialog-actions">
              <button
                type="button"
                onClick={() => setExportGroup(null)}
                className="m3-dialog-btn m3-dialog-btn--text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmExportGroup}
                className="m3-dialog-btn m3-dialog-btn--filled"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteGroup ? (
        <div
          className="m3-dialog-scrim z-50"
          role="presentation"
          onClick={() => setDeleteGroup(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-group-title"
            className="m3-dialog-surface"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-group-title" className="m3-dialog-title">
              Delete lead group?
            </h2>
            <p className="m3-dialog-body">
              Delete {deleteGroup.name}? Every lead in this group is permanently deleted
              from your workspace, including outreach history for those leads.
            </p>
            <div className="m3-dialog-actions">
              <button
                type="button"
                onClick={() => setDeleteGroup(null)}
                className="m3-dialog-btn m3-dialog-btn--text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteGroup}
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
