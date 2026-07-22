"use client";

import { useMemo, useState } from "react";
import type { Group, LeadPreview } from "@/lib/server/types";
import { deleteGroupAction } from "@/app/actions";
import { TextField } from "@/app/ui/text-field";
import { useSidebarResource } from "@/app/use-sidebar-resource";
import { ContentReveal, LeadsTableSkeleton, Skeleton } from "@/app/app-skeletons";
import NewAgentButton from "@/app/(app)/agents/new-agent-button";
import { useBodyScrollLock } from "@/app/use-body-scroll-lock";
import { useToast, userFacingError } from "@/app/toast";
import MobileHeaderPortal from "@/app/mobile-header-portal";

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

function timeAgo(iso?: string) {
  if (!iso) return "-";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function FlameScore({ score }: { score: number }) {
  const filled = score >= 80 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0;
  return (
    <span className="inline-flex items-center gap-0.5 text-base leading-none">
      <span className={filled >= 1 ? "" : "grayscale opacity-30"}>🔥</span>
      <span className={filled >= 2 ? "" : "grayscale opacity-30"}>🔥</span>
      <span className={filled >= 3 ? "" : "grayscale opacity-30"}>🔥</span>
    </span>
  );
}

function LinkedInProfileLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open LinkedIn profile"
      className="inline-grid h-[10px] w-[10px] shrink-0 -translate-y-[2px] place-items-center rounded-[2px] transition-opacity hover:opacity-80"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/linkedin-in-mark.svg" alt="" className="h-full w-full object-contain" />
    </a>
  );
}

function SortIcon() {
  return (
    <svg className="ml-1 inline h-3 w-3 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7 4 7 20" />
      <polyline points="3 8 7 4 11 8" />
      <polyline points="17 20 17 4" />
      <polyline points="13 16 17 20 21 16" />
    </svg>
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

function csvCell(value: string) {
  // Prefix cells that Excel/Sheets would evaluate as formulas.
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

function buildLeadsCsv(rows: LeadPreview[]) {
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
      lead.createdAt ? new Date(lead.createdAt).toISOString().slice(0, 10) : "",
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
const TABLE_COLUMNS =
  "grid-cols-[40px_minmax(300px,1.45fr)_minmax(340px,2fr)_120px_120px]";
const selectLeadsData = (data: Record<string, unknown>) => ({
  groups: data.groups as Group[] || [],
  leads: data.leads as LeadPreview[] || [],
});

export default function LeadsView({ groups, leads }: LeadsViewProps) {
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
  const [sortByScore, setSortByScore] = useState<"none" | "asc" | "desc">("desc");
  const [mobileGroupMenu, setMobileGroupMenu] = useState<Group | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);
  const [exportGroup, setExportGroup] = useState<Group | null>(null);
  const [deletedGroupIds, setDeletedGroupIds] = useState<Set<string>>(new Set());
  const { showError } = useToast();
  useBodyScrollLock(Boolean(mobileGroupMenu || deleteGroup || exportGroup));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Leads whose every group was deleted (deleting a group/agent strips the
    // group id but keeps the lead) are hidden everywhere, including All
    // contacts. Leads of paused agents still belong to a live group, so they
    // stay visible.
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
    if (sortByScore === "desc") {
      next = [...next].sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
    } else if (sortByScore === "asc") {
      next = [...next].sort((a, b) => (a.fitScore || 0) - (b.fitScore || 0));
    }
    return next;
  }, [loadedLeads, loadedGroups, deletedGroupIds, search, selectedGroupId, sortByScore]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageRows = filtered.slice(start, end);

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
    downloadCsv(`${slug}-leads.csv`, buildLeadsCsv(rows));
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

  return (
    <div className="app-x flex h-full min-h-0 min-w-0 flex-col gap-3 md:ml-4 md:mr-0.5 md:pb-3">
      {/* Header */}
      <div className="hidden shrink-0 items-center justify-between gap-3 pt-6 md:flex">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-3xl">
            Leads
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NewAgentButton className="m3-btn m3-btn-filled h-10 shrink-0 cursor-pointer gap-1.5 px-4 text-sm">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        <div className="relative z-10 -mb-px flex shrink-0 items-end gap-1 overflow-x-auto px-2 md:overflow-visible">
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
                      onClick={(event) => {
                        event.stopPropagation();
                        if (window.matchMedia("(max-width: 767.98px)").matches) {
                          setMobileGroupMenu(item as Group);
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
                    {/* pt-1 (not mt-1) keeps the gap hoverable on the way to the menu */}
                    <div className="absolute right-0 top-full z-20 hidden pt-1 group-focus-within/dots:block group-hover/dots:block">
                      <div className="m3-menu m3-menu-enter m3-menu--origin-top-right m3-menu--compact w-36">
                        <button
                          type="button"
                          onClick={() => setExportGroup(item as Group)}
                          className="m3-menu-item"
                        >
                          Export CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteGroup(item as Group)}
                          className="m3-menu-item m3-menu-item--danger"
                        >
                          Delete group
                        </button>
                      </div>
                    </div>
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
          <ContentReveal key={selectedGroupId} className="m3-lateral-panel flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto md:hidden">
          {pageRows.length === 0 ? (
            <div className="grid h-full place-items-center p-6 text-center text-[12px] font-medium text-zinc-700">
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
            <div className="m3-table-grid">
              {pageRows.map((lead) => {
                const group = loadedGroups.find((g) => lead.groupIds.includes(g.id));
                const isSelected = selected.has(lead.id);
                const signalKeyword =
                  lead.signalText ||
                  (group ? `"${group.name.toLowerCase()}"` : "");

                return (
                  <article
                    key={lead.id}
                    className={`m3-table-grid-row !h-auto min-h-[52px] p-4 ${isSelected ? "bg-[#fff5f6]/50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(lead.id)}
                        className="mt-3 h-3.5 w-3.5 shrink-0 cursor-pointer accent-[#e85e6b]"
                      />
                      {lead.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={lead.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ba3871] text-[12px] font-semibold text-white">
                          {initials(lead.name)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-end gap-0.5">
                          {lead.linkedInUrl ? (
                            <a
                              href={lead.linkedInUrl}
                              target="_blank"
                              rel="noopener noreferrer"
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
                        {lead.company ? (
                          <div className="truncate text-[11px] font-medium text-zinc-600">@{lead.company}</div>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <FlameScore score={lead.fitScore || 0} />
                        <div className="mt-1 text-[11px] font-medium text-zinc-600">{timeAgo(lead.createdAt)}</div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-md bg-zinc-50 px-3 py-2 text-[12px] font-medium text-zinc-800">
                      Just engaged with a{" "}
                      {lead.signalUrl ? (
                        <a
                          href={lead.signalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0a66c2] underline"
                        >
                          LinkedIn post
                        </a>
                      ) : (
                        <span className="text-[#0a66c2] underline">LinkedIn post</span>
                      )}
                      {signalKeyword ? (
                        <div className="mt-1 text-[11px] font-medium text-zinc-700">
                          <span className="font-bold text-zinc-800">Keyword:</span> {signalKeyword}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Table header — M3 56px, medium emphasis, horizontal rule only */}
        <div className={`m3-table-grid-header hidden shrink-0 ${TABLE_COLUMNS} items-center gap-3 md:grid`}>
          <span>
            <input
              type="checkbox"
              checked={pageRows.length > 0 && selected.size === pageRows.length}
              onChange={toggleAll}
              className="h-3.5 w-3.5 cursor-pointer accent-[#e85e6b]"
            />
          </span>
          <span>Contact</span>
          <span className="justify-self-start">Signal</span>
          <button
            type="button"
            onClick={() => setSortByScore((current) => (current === "desc" ? "asc" : "desc"))}
            className="m3-table-num flex cursor-pointer items-center justify-end text-[12px] font-semibold uppercase tracking-wide text-[var(--md-sys-color-text-medium)] hover:text-zinc-900"
          >
            AI Score
            <SortIcon />
          </button>
          <span className="m3-table-num">Imported</span>
        </div>

        {/* Table rows — M3 52px body, hover overlay, tabular nums for metrics */}
        <div className="m3-table-grid hidden min-h-0 flex-1 overflow-y-auto md:block">
          {pageRows.length === 0 ? (
            <div className="grid h-full place-items-center p-10 text-center text-[12px] font-medium text-zinc-700">
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
              const group = loadedGroups.find((g) => lead.groupIds.includes(g.id));
              const isSelected = selected.has(lead.id);
              const signalKeyword =
                lead.signalText ||
                (group ? `"${group.name.toLowerCase()}"` : "");

              return (
                <div
                  key={lead.id}
                  className={`m3-table-grid-row grid ${TABLE_COLUMNS} items-center gap-3 ${
                    isSelected ? "bg-[#fff5f6]/40" : ""
                  }`}
                >
                  <span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelected(lead.id)}
                      className="h-3.5 w-3.5 cursor-pointer accent-[#e85e6b]"
                    />
                  </span>

                  {/* Contact */}
                  <div className="flex min-w-0 items-center gap-3 text-[14px]">
                    {lead.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={lead.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ba3871] text-[12px] font-semibold text-white">
                        {initials(lead.name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-end gap-0.5">
                        {lead.linkedInUrl ? (
                          <a
                            href={lead.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-[13px] font-semibold leading-none text-[#0a66c2] hover:underline"
                          >
                            {lead.name}
                          </a>
                        ) : (
                          <span className="truncate text-[13px] font-semibold leading-none text-zinc-950">{lead.name}</span>
                        )}
                        {lead.linkedInUrl ? <LinkedInProfileLink href={lead.linkedInUrl} /> : null}
                      </div>
                      <div className="truncate text-[12px] font-medium text-zinc-800">{lead.title || "-"}</div>
                      {lead.company ? (
                        <div className="truncate text-[11px] font-medium text-zinc-600">@{lead.company}</div>
                      ) : null}
                    </div>
                  </div>

                  {/* Signal */}
                  <div className="min-w-0 justify-self-start text-[12px] font-medium text-zinc-800">
                    <div>
                      Just engaged with a{" "}
                      {lead.signalUrl ? (
                        <a
                          href={lead.signalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0a66c2] underline"
                        >
                          LinkedIn post
                        </a>
                      ) : (
                        <span className="text-[#0a66c2] underline">LinkedIn post</span>
                      )}
                    </div>
                    {signalKeyword ? (
                      <div className="text-[11px] font-medium text-zinc-700">
                        <span className="font-bold text-zinc-800">Keyword:</span> {signalKeyword}
                      </div>
                    ) : null}
                  </div>

                  {/* AI Score — numerical column */}
                  <div className="m3-table-num flex justify-end">
                    <FlameScore score={lead.fitScore || 0} />
                  </div>

                  {/* Imported — numerical/time column */}
                  <div className="m3-table-num text-[14px] font-normal text-zinc-700">
                    {timeAgo(lead.createdAt)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination footer — compact single row */}
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
          </ContentReveal>
        )}
      </section>
      </div>

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
              Delete {deleteGroup.name}? Its leads will no longer appear on this page.
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
