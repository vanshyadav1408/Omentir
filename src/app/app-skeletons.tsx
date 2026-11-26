// Shared loading skeletons for the app views. Pages render their real chrome
// (headers, tabs, buttons) immediately; these blocks stand in only for the
// data regions that are still being fetched from the backend or external
// services (Firestore, LinkedIn).
//
// Material 3 structural placeholder rules (globals.css `.skeleton`):
// - Structural parity: mirror final height/width/margin/padding/radius
// - Surface tonality: soft 4–8% neutral overlay (light) / white shimmer (dark)
// - Soft horizontal shimmer (~1400ms, cubic-bezier(0.4, 0, 0.6, 1) pulse)
// - On resolve: wrap loaded content in ContentReveal for a 350ms fade-in

import Link from "next/link";
import type { ReactNode } from "react";
import { TextAreaField, TextField } from "@/app/ui/text-field";

export function Skeleton({ className = "" }: { className?: string }) {
  // Default radius only when the caller sets none: Tailwind emits rounded-md
  // after rounded-full, so passing both drew every avatar as a square.
  const radius = /(^|\s)rounded-/.test(className) ? "" : "rounded-md ";
  return <div className={`skeleton ${radius}${className}`} aria-hidden="true" />;
}

/** Wraps content that replaces a skeleton. No entrance animation: data paints
 * the moment it is ready, including cached data on every page switch. */
export function ContentReveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

// Matches the agent card on /agents: title with status pill, on/off switch and
// menu, the status line, the 4-column stats, and the footer with View and Edit.
function OutreachCardSkeleton() {
  return (
    <li className="m3-card m3-card-elevated m3-card-lg min-w-0 px-4 pb-5 pt-5 sm:px-6">
      <div className="flex items-center justify-between gap-3 md:items-start">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="h-5 w-56 max-w-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-5 w-9 rounded-full" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>
      <Skeleton className="mt-3 h-5 w-[28rem] max-w-full" />
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
        {/* Each bar sits in a box the height of the text it stands for. */}
        {[0, 1, 2, 3].map((item) => (
          <div key={item}>
            <div className="flex h-[17px] items-center">
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="mt-1 h-6 w-14" />
            <div className="mt-1.5 flex h-[17px] items-center">
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center">
        <Skeleton className="h-4 w-72 max-w-full" />
        <div className="flex w-full items-stretch gap-2 sm:w-auto">
          <Skeleton className="h-7 flex-1 rounded-full sm:w-[75px] sm:flex-none" />
          <Skeleton className="h-7 flex-1 rounded-full sm:w-[51px] sm:flex-none" />
        </div>
      </div>
    </li>
  );
}

// The agent list while it loads: the filter and sort controls, then cards.
export function OutreachListSkeleton({ label }: { label: string }) {
  return (
    <div aria-label={label} role="status">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
      <ul className="flex flex-col gap-3">
        {[0, 1, 2].map((item) => (
          <OutreachCardSkeleton key={item} />
        ))}
      </ul>
    </div>
  );
}

// Matches the leads split: contact list on the left, outreach preview on the right.
export function LeadsTableSkeleton() {
  return (
    <div
      className="skeleton-static grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(22rem,2fr)_minmax(0,3fr)]"
      aria-label="Loading leads"
      role="status"
    >
      <div className="flex min-h-0 flex-col md:border-r md:border-zinc-200">
        <div className="m3-table-grid-header hidden shrink-0 grid-cols-[40px_minmax(0,1fr)] items-center gap-3 md:grid">
          <Skeleton className="h-3.5 w-3.5" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="m3-table-grid min-h-0 flex-1 overflow-hidden">
          {[0, 1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="m3-table-grid-row grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3">
              <Skeleton className="h-3.5 w-3.5" />
              <div className="flex items-center gap-3 py-1">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="mt-1.5 h-3 w-48 max-w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-t border-[var(--md-sys-color-outline-variant)] px-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-40" />
        </div>
      </div>
      <div className="hidden bg-[var(--md-sys-color-surface-container)] p-5 md:block">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-56" />
          </div>
        </div>
        <Skeleton className="mt-6 h-3 w-20" />
        <Skeleton className="mt-3 h-16 w-full" />
        <Skeleton className="mt-6 h-24 w-full" />
      </div>
    </div>
  );
}

// Matches the loaded messages layout: thread list (avatar + two lines) on the
// left, conversation header, chat bubbles, and composer on the right.
export function MessagesInboxSkeleton() {
  return (
    <div
      className="skeleton-static grid min-h-[460px] flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[320px_1fr]"
      aria-label="Loading conversations"
      role="status"
    >
      <aside className="flex min-h-0 flex-col border-b border-zinc-200 lg:border-b-0 lg:border-r">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-4 py-3">
          <span style={{ fontFamily: "var(--font-varta)" }} className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
            Inbox
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700">
            Newest
            <svg className="h-3 w-3 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {/* Line heights as measured on a loaded row: 12px name, 11px
              headline, 12px preview, beside the 40px avatar. */}
          {[0, 1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="flex items-start gap-3 border-b border-zinc-100 px-4 py-3.5">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-[11px] w-40" />
                <Skeleton className="mt-1 h-3 w-48 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      </aside>
      <section className="hidden min-h-0 min-w-0 flex-col lg:flex">
        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3.5 sm:px-5">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="mt-1.5 h-3 w-56" />
          </div>
        </div>
        <div className="min-h-0 flex-1 bg-[#fbfaf6] p-4 sm:p-5">
          <MessageBubblesSkeleton />
        </div>
        <div className="border-t border-zinc-200 bg-white p-3">
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </section>
    </div>
  );
}

// Matches the chat bubbles inside a conversation (used while a LinkedIn
// thread's message history is being fetched).
export function MessageBubblesSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading messages" role="status">
      <div className="flex justify-start gap-2">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <Skeleton className="h-16 w-2/3 max-w-[85%] rounded-2xl rounded-tl-md sm:max-w-[75%]" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-12 w-1/2 max-w-[85%] rounded-2xl rounded-tr-md sm:max-w-[75%]" />
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      </div>
      <div className="flex justify-start gap-2">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <Skeleton className="h-20 w-3/4 max-w-[85%] rounded-2xl rounded-tl-md sm:max-w-[75%]" />
      </div>
    </div>
  );
}

// Matches an API key row: label + created line on the left, Revoke button on
// the right.
export function ApiKeyRowsSkeleton() {
  return (
    <div className="divide-y divide-zinc-100" aria-label="Loading API keys" role="status">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="flex flex-col items-start justify-between gap-3 px-4 py-3.5 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-2 h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      ))}
    </div>
  );
}

// Matches a connected LinkedIn account card in Settings: avatar, name +
// status pill + connected-on lines, and the Reconnect/Disconnect buttons.
export function LinkedInAccountsSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading connected accounts" role="status">
      <div className="flex flex-col items-start gap-3 rounded-md border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-3 w-28" />
          <Skeleton className="mt-1.5 h-3 w-44" />
        </div>
        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full sm:w-28" />
          <Skeleton className="h-9 w-full sm:w-28" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route-level skeletons (each route's loading.tsx). Next prefetches a dynamic
// route only down to its first loading boundary, so these are what a click
// shows instantly. Each mirrors its view's real frame: same wrapper classes,
// real static titles/tabs, and the same data skeleton the view shows while
// its client fetch runs, so nothing jumps when the page takes over.
// ---------------------------------------------------------------------------

const PAGE_TITLE_CLASS =
  "text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)]";
const PAGE_FRAME_CLASS = "app-x flex h-full min-h-0 min-w-0 flex-col gap-3 md:mr-0.5 md:pb-3";
const HEADER_BUTTON_CLASS = "m3-btn m3-btn-filled h-8 shrink-0 gap-1 px-2.5 text-xs";

// Static chrome (titles, tabs, labels, buttons) renders for real so only the
// data is a placeholder. Buttons are inert spans; they act once the page lands.
function SearchIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SearchFieldSkeleton({ placeholder, className }: { placeholder: string; className?: string }) {
  return (
    <TextField
      className={`m3-text-field--compact ${className ?? ""}`}
      variant="filled"
      placeholder={placeholder}
      aria-label={placeholder}
      readOnly
      tabIndex={-1}
      leadingIcon={<SearchIcon />}
    />
  );
}

// The real field (label, box, helper text) with a shimmer in the box
// (globals.css .field-skeleton), so a form keeps its exact geometry.
function FieldSkeleton({
  label,
  rows,
  supportingText,
  leadingIcon,
  className,
}: {
  label: string;
  rows?: number;
  supportingText?: string;
  leadingIcon?: ReactNode;
  className?: string;
}) {
  const shared = { label, supportingText, leadingIcon, className, readOnly: true, tabIndex: -1 };
  return (
    <div className="field-skeleton" aria-hidden="true">
      {rows ? <TextAreaField {...shared} rows={rows} /> : <TextField {...shared} />}
    </div>
  );
}

// Same markup as the SectionHeader in the Settings, Workspace and API views.
function SectionHeaderSkeleton({
  title,
  description,
  descriptionClassName = "mt-2 text-[13px] leading-relaxed text-zinc-600",
  className = "mb-5",
}: {
  title: string;
  description: string;
  descriptionClassName?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 style={{ fontFamily: "var(--font-varta)" }} className="text-xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h2>
      <span className="mt-1.5 block h-0.5 w-8 rounded-full bg-[#ba3871]/60" aria-hidden />
      <p className={descriptionClassName}>{description}</p>
    </div>
  );
}

// Underlined tab row (Settings, Messages). Buttons, as in the views, so the
// app's button density rules size them the same.
function TabRowSkeleton({
  tabs,
  className,
  tabClassName,
  count,
}: {
  tabs: string[];
  className: string;
  tabClassName: string;
  count?: boolean;
}) {
  return (
    <div className={className}>
      {tabs.map((label, index) => (
        <button
          key={label}
          type="button"
          tabIndex={-1}
          className={`${tabClassName} ${index === 0 ? "text-zinc-950" : "text-zinc-600"}`}
        >
          {label}
          {count ? <Skeleton className="h-[11px] w-5 rounded-full" /> : null}
          {index === 0 ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-950" /> : null}
        </button>
      ))}
    </div>
  );
}

// Matches the Overview "Hot leads" rows (app-list-row, 32px avatar, fit
// score). Returns bare <li>s: the view renders them inside its own list.
export function HotLeadSkeletonRows() {
  return [0, 1, 2, 3, 4].map((item) => (
    <li key={item} className="app-list-row px-0" aria-label="Loading leads" role="status">
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="mt-1.5 h-3 w-52 max-w-full" />
      </div>
      <Skeleton className="h-3.5 w-6 shrink-0" />
    </li>
  ));
}

// Matches the Overview "Replies" rows (name + time, title line, message preview).
export function ReplySkeletonRows() {
  return (
    <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]" aria-label="Loading replies" role="status">
      {[0, 1, 2].map((item) => (
        <li key={item} className="app-list-row items-start px-0">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
            <Skeleton className="mt-1.5 h-3 w-48 max-w-full" />
            <Skeleton className="mt-2 h-3 w-full max-w-sm" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function OverviewStatCard({ label, caption }: { label: string; caption?: boolean }) {
  return (
    <div className="m3-card m3-card-outlined p-4">
      <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">{label}</p>
      <Skeleton className="mt-2 h-8 w-16" />
      {caption ? (
        <p className="mt-1 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Last 30 days</p>
      ) : null}
    </div>
  );
}

function OverviewListCard({ title, action, children }: { title: string; action: string; children: ReactNode }) {
  return (
    <section className="m3-card m3-card-outlined min-w-0 overflow-hidden px-4">
      <header className="flex items-center justify-between gap-3 py-4">
        <h3 className="text-[11px] font-medium uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)]">
          {title}
        </h3>
        <span className="m3-btn m3-btn-outlined h-7 px-2.5 text-[11px]">{action}</span>
      </header>
      {children}
    </section>
  );
}

// Mirrors OverviewView on its default 30d range.
export function OverviewPageSkeleton() {
  return (
    <div className="relative flex h-full min-h-0 flex-col" role="status" aria-label="Loading overview">
      <div className="app-x min-h-0 flex-1 overflow-hidden pb-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 pt-8">
          <Skeleton className="h-4 w-28" />
          <div className="flex items-center gap-2">
            <div className="app-seg" aria-hidden="true">
              {["7d", "30d", "3m", "MTD"].map((label) => (
                <button key={label} type="button" tabIndex={-1} aria-pressed={label === "30d"}>
                  {label}
                </button>
              ))}
            </div>
            <span className="m3-btn m3-btn-filled hidden h-8 px-2.5 text-xs sm:inline-flex">New agent</span>
          </div>
        </div>

        <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewStatCard label="Hot opportunities" />
          <OverviewStatCard label="Invitations sent" caption />
          <OverviewStatCard label="Messages sent" caption />
          <div className="m3-card m3-card-outlined p-4">
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">Pipeline</p>
            <Skeleton className="mt-2 h-8 w-24" />
          </div>
        </div>

        <div className="m3-card m3-card-outlined mt-5 min-w-0 px-5 py-4 sm:px-6 sm:py-5">
          <h2 className="section-title text-[var(--md-sys-color-on-surface)]">Your activity</h2>
          <p className="mt-1 text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]">
            Leads, outreach, and replies for this range.
          </p>
          <div className="analysis-chart mt-4">
            <Skeleton className="h-[240px] w-full rounded-lg" />
          </div>
        </div>

        {/* Static in the view, so it is the real card here too. */}
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
            <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Connect an assistant</p>
            <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Claude, ChatGPT, and Cursor can run this workspace from chat.
            </p>
          </div>
          <span className="m3-btn m3-btn-outlined h-7 shrink-0 px-2.5 text-[11px]">Connect</span>
        </Link>

        <div className="heatmap-card m3-card m3-card-outlined mt-5 min-w-0 px-5 py-4 sm:px-6 sm:py-5">
          <div className="heatmap-inset">
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">Outreach</p>
            <Skeleton className="mt-2 h-8 w-24" />
          </div>
          <div className="mt-4 min-w-0">
            <Skeleton className="h-28 w-full" />
          </div>
        </div>

        <div className="mt-5 grid min-w-0 gap-3 lg:grid-cols-2">
          <OverviewListCard title="Hot leads" action="View all">
            <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]">
              <HotLeadSkeletonRows />
            </ul>
          </OverviewListCard>
          <OverviewListCard title="Replies" action="Inbox">
            <ReplySkeletonRows />
          </OverviewListCard>
        </div>
      </div>
    </div>
  );
}

function PageHeaderSkeleton({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="hidden shrink-0 items-center justify-between gap-3 pt-6 md:flex">
      <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function LeadsPageSkeleton() {
  return (
    <div className={`${PAGE_FRAME_CLASS} skeleton-static`}>
      <PageHeaderSkeleton title="Leads">
        <span className={HEADER_BUTTON_CLASS}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Add leads
        </span>
        <SearchFieldSkeleton placeholder="Search leads" className="w-56" />
      </PageHeaderSkeleton>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative z-10 -mb-px flex min-w-0 shrink-0 items-end gap-1 overflow-hidden px-2">
          <div className="flex shrink-0 items-center rounded-t-lg border border-zinc-200 border-b-transparent bg-white text-zinc-950">
            {/* A button, as in the view: the app's button density rules set its height. */}
            <button type="button" tabIndex={-1} className="py-2 pl-3.5 pr-3.5 text-[13px] font-semibold">
              <span className="block max-w-[220px] translate-y-px truncate whitespace-nowrap">All contacts</span>
            </button>
          </div>
          {[0, 1].map((item) => (
            <Skeleton key={item} className="mb-2.5 h-4 w-20 shrink-0" />
          ))}
        </div>
        <section className="m3-card m3-card-outlined m3-card-lg flex min-h-0 flex-1 flex-col bg-white">
          <LeadsTableSkeleton />
        </section>
      </div>
    </div>
  );
}

const MESSAGE_TABS = ["All", "Successful", "Meetings booked", "Interested", "Needs a follow up", "Denied"];

function MessageTabsSkeleton() {
  return (
    <TabRowSkeleton
      tabs={MESSAGE_TABS}
      count
      className="flex shrink-0 items-center gap-6 overflow-hidden border-b border-zinc-200 pt-4 md:pt-0"
      tabClassName="relative -mb-px flex shrink-0 items-center gap-1.5 pb-2.5 text-[13px] font-semibold"
    />
  );
}

export function MessagesPageSkeleton() {
  return (
    <div className={`${PAGE_FRAME_CLASS} skeleton-static`}>
      <PageHeaderSkeleton title="Messages">
        <div className="w-52">
          <SearchFieldSkeleton placeholder="Search conversations" />
        </div>
      </PageHeaderSkeleton>
      <MessageTabsSkeleton />
      <section className="m3-card m3-card-elevated m3-card-lg flex min-h-0 flex-1 overflow-hidden">
        <MessagesInboxSkeleton />
      </section>
    </div>
  );
}

export function AgentsPageSkeleton() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 md:pb-3">
      <div className="app-x hidden md:block">
        <PageHeaderSkeleton title="AI Agents">
          <span className={HEADER_BUTTON_CLASS}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create an agent
          </span>
        </PageHeaderSkeleton>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden pb-6 pt-2 md:pb-3 md:pt-0">
        <div className="app-x">
          <OutreachListSkeleton label="Loading agents" />
        </div>
      </div>
    </div>
  );
}

// Settings, Workspace, and API share one frame: header with its action button,
// optional tab row, then a max-w-5xl form column. Each body mirrors its view:
// real section titles, descriptions and field labels, shimmer where values go.
function FormPageSkeleton({
  title,
  headerLead,
  action,
  tabs,
  children,
}: {
  title: string;
  headerLead?: ReactNode;
  action?: string;
  tabs?: string[];
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 md:mr-0.5" role="status" aria-label={`Loading ${title}`}>
      <div className="app-x hidden shrink-0 items-center justify-between gap-3 pt-6 md:flex">
        <div className="flex min-w-0 items-center gap-2.5">
          {headerLead}
          <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
        </div>
        {action ? (
          <span className={HEADER_BUTTON_CLASS}>
            <CheckIcon />
            {action}
          </span>
        ) : null}
      </div>
      {tabs ? (
        <div className="app-x shrink-0">
          <TabRowSkeleton
            tabs={tabs}
            className="flex items-center gap-6 overflow-hidden border-b border-zinc-200 pt-4 md:pt-0"
            tabClassName="relative -mb-px pb-2.5 text-[14px] font-semibold"
          />
        </div>
      ) : null}
      <div className={`min-h-0 flex-1 overflow-hidden ${tabs ? "" : "mt-2 md:mt-0"}`}>
        <div className="app-x h-full overflow-hidden">
          <div className="max-w-5xl pb-8 pt-1 sm:pb-10 sm:pt-2 md:pb-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

const FORM_DIVIDER = <div className="my-8 h-px bg-zinc-200" />;

// Settings opens on its Profile tab.
export function SettingsPageSkeleton() {
  return (
    <FormPageSkeleton title="Settings" action="Save settings" tabs={["Profile", "Connected Accounts", "Subscription"]}>
      <SectionHeaderSkeleton title="Profile" description="Your personal information and workspace preferences." />
      <div className="m3-card m3-card-outlined flex min-w-0 items-center gap-3 p-3">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-[17px] w-36" />
          <Skeleton className="mt-1 h-4 w-52 max-w-full" />
        </div>
      </div>
      <div className="mt-6 grid gap-x-6 gap-y-6 md:grid-cols-2">
        <FieldSkeleton label="Language" />
        <div>
          <FieldSkeleton label="Time zone" />
          <p className="mt-1.5 text-[11px] font-medium text-zinc-600">
            Every date and time in Omentir is shown in this zone, and your daily
            sending limits reset at its midnight. Send windows follow each lead&apos;s
            own zone, falling back to this one when their location is unknown.
          </p>
        </div>
        <FieldSkeleton label="Date format" />
      </div>
      {FORM_DIVIDER}
      <SectionHeaderSkeleton
        title="Automation limits"
        description="Control how aggressively your agents and campaigns reach out."
      />
      <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
        <FieldSkeleton label="Daily connection invites" />
        <FieldSkeleton label="Daily messages" />
        <FieldSkeleton label="First message delay" />
      </div>
    </FormPageSkeleton>
  );
}

export function WorkspacePageSkeleton() {
  return (
    <FormPageSkeleton
      title="Workspace"
      action="Save changes"
      headerLead={<Skeleton className="h-7 w-7 shrink-0 rounded-md" />}
    >
      <SectionHeaderSkeleton
        title="Company Information"
        description="These details power outreach from this workspace. Update them when the offer changes."
        className="mb-8"
        descriptionClassName="mt-2 text-sm leading-relaxed text-zinc-600"
      />
      <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
        <FieldSkeleton label="Company Name" />
        <div className="flex flex-row items-end gap-2">
          <div className="min-w-0 flex-1">
            <FieldSkeleton label="Website" />
          </div>
          <span className="m3-btn m3-btn-filled m3-btn-field shrink-0">AI Analyse</span>
        </div>
      </div>
      <div className="mt-8 grid gap-x-6 gap-y-6 md:grid-cols-2">
        <FieldSkeleton label="Industry" />
        <FieldSkeleton label="Company Size" />
      </div>
      <div className="mt-8 md:max-w-xs">
        <FieldSkeleton
          label="Average Ticket Size"
          className="average-ticket-size-field"
          leadingIcon={<span className="text-[16px] font-medium">$</span>}
          supportingText="Your typical deal value per customer, used to estimate pipeline generated."
        />
      </div>
      <div className="mt-8">
        <FieldSkeleton label="Company Description" rows={3} />
      </div>
      <div className="mt-8">
        <FieldSkeleton label="Pain Points" rows={3} />
      </div>
      <div className="mt-8">
        <FieldSkeleton label="Pricing" rows={3} />
      </div>
    </FormPageSkeleton>
  );
}

export function ApiKeysPageSkeleton() {
  return (
    <FormPageSkeleton title="API">
      <SectionHeaderSkeleton title="API keys" description="Connect Omentir to your favorite AI app." />
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <TextField label="Key label" placeholder="Claude, Hermes, my-script..." readOnly tabIndex={-1} />
        <span className="m3-btn m3-btn-filled m3-btn-field">Create</span>
      </div>
      <div className="mt-4 rounded-md border border-zinc-200 bg-white">
        <ApiKeyRowsSkeleton />
      </div>
      {FORM_DIVIDER}
      <SectionHeaderSkeleton title="How to connect" description="Create a key above, then pick the app you're connecting." />
      <Skeleton className="mb-4 h-10 w-full max-w-sm" />
      <div className="rounded-md border border-zinc-200 bg-white p-4">
        <Skeleton className="h-5 w-64 max-w-full" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-3 h-24 w-full" />
      </div>
    </FormPageSkeleton>
  );
}

// /agents/new: the setup wizard's header, step indicator and centered card on
// its first step. The agent type comes from the URL (see agents/new/loading),
// so steps, title and the ICP card are exact for a new agent. An edit takes its
// type from the saved agent, which this screen cannot read, so those shimmer.
// A new agent's ICP fields always start empty, so they show for real.
const SETUP_FIELDS = [
  ["Target job titles", "e.g. Sales Manager"],
  ["Target industries", "e.g. Marketing"],
  ["Target locations", "e.g. United States"],
  ["Mandatory keywords", "e.g. B2B"],
];
const SETUP_BUTTON_CLASS =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#ba3871] text-[13px] font-semibold text-white shadow-[0_12px_35px_rgba(255,255,255,0.12)]";

export function AgentSetupPageSkeleton({
  title,
  steps,
  icpFirst = false,
}: {
  title?: string;
  steps?: string[];
  icpFirst?: boolean;
}) {
  const stepLabels: Array<string | null> = steps ?? [null, null, null, null];
  return (
    <div className="app-x flex h-full min-h-0 min-w-0 flex-col gap-2 md:mr-0.5 md:pb-3" role="status" aria-label="Loading agent setup">
      <div className="hidden shrink-0 flex-col items-start justify-between gap-3 pt-6 md:flex md:flex-row md:items-center">
        <h1
          style={{ fontFamily: "var(--font-varta)" }}
          className="flex min-w-0 items-center gap-2 text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)]"
        >
          <span className="material-symbols-outlined shrink-0 text-[20px]! font-light leading-none text-zinc-500" aria-hidden="true">
            edit
          </span>
          {title ?? <Skeleton className="h-6 w-40" />}
        </h1>
        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
          <Link
            href="/agents"
            style={{ fontFamily: "var(--font-varta)" }}
            className="flex h-8 cursor-pointer items-center px-3 text-[13px] font-semibold text-zinc-700 hover:text-zinc-900"
          >
            Cancel
          </Link>
          <button type="button" tabIndex={-1} style={{ fontFamily: "var(--font-varta)" }} className={`${SETUP_BUTTON_CLASS} h-8 px-4`}>
            <span className="translate-y-px leading-none">Continue</span>
          </button>
        </div>
      </div>
      <div className="mt-4 mb-1.5 flex shrink-0 flex-nowrap items-center gap-3 overflow-hidden py-1 sm:mt-0 sm:mb-0 sm:flex-wrap sm:justify-center sm:gap-5">
        {stepLabels.map((label, index) => (
          <div key={index} className="flex items-center gap-3 sm:gap-5">
            <div className="flex shrink-0 items-center gap-2.5">
              <span
                style={{ fontFamily: "var(--font-varta)" }}
                className={`grid h-9 w-9 place-items-center rounded-full text-[14px] font-semibold ${
                  index === 0 ? "bg-[#ba3871] text-white" : "border border-zinc-300 bg-white text-zinc-400"
                }`}
              >
                {index + 1}
              </span>
              {label ? (
                <span
                  style={{ fontFamily: "var(--font-varta)" }}
                  className={`text-[15px] ${index === 0 ? "font-semibold text-zinc-900" : "text-zinc-400"}`}
                >
                  {label}
                </span>
              ) : (
                <Skeleton className="h-4 w-14" />
              )}
            </div>
            {index < stepLabels.length - 1 ? (
              <span className="relative h-0.5 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-200 sm:h-[3px] sm:w-16" />
            ) : null}
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-4 sm:p-10">
          {icpFirst ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 style={{ fontFamily: "var(--font-varta)" }} className="text-[20px] font-semibold tracking-tight text-zinc-950">
                    Define your ideal customer profile
                  </h2>
                  <p className="mt-1 text-[14px] font-medium text-zinc-700">
                    Tell us who your perfect customers are so Omentir can find the right people.
                  </p>
                </div>
                <button
                  type="button"
                  tabIndex={-1}
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 self-start rounded-md bg-[#ba3871] px-3 text-[13px] font-semibold leading-none text-white shadow-[0_10px_25px_rgba(255,255,255,0.12)] sm:self-center"
                >
                  <span className="translate-y-px">Fill with AI</span>
                </button>
              </div>
              {SETUP_FIELDS.map(([label, placeholder]) => (
                <div key={label} className="grid gap-2">
                  <TextField label={label} placeholder={placeholder} readOnly tabIndex={-1} />
                </div>
              ))}
              <TextAreaField
                label="Describe the leads you want"
                placeholder="Describe the exact leads this agent should find."
                rows={4}
                readOnly
                tabIndex={-1}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div>
                <Skeleton className="h-6 w-72 max-w-full" />
                <Skeleton className="mt-2 h-4 w-96 max-w-full" />
              </div>
              {[0, 1, 2].map((field) => (
                <div key={field}>
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="mt-1.5 h-8 w-full rounded-full" />
                </div>
              ))}
            </div>
          )}
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-zinc-100 pt-5">
            <button type="button" tabIndex={-1} style={{ fontFamily: "var(--font-varta)" }} className={`${SETUP_BUTTON_CLASS} h-10 gap-1 px-5 leading-none`}>
              <span className="translate-y-px leading-none">Continue</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// Matches the agent page's queue (ActionsDashboard): the 4 stat cards, the
// "Next actions" toolbar, the action list and the details panel.
export function AgentActionsSkeleton() {
  return (
    <div className="app-x flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" role="status" aria-label="Loading actions">
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((cell) => (
          <div key={cell} className="m3-card m3-card-outlined p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-1 gap-4 overflow-hidden md:grid-rows-2 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-1">
        <div className="m3-card m3-card-elevated m3-card-lg flex min-h-0 flex-col overflow-hidden">
          <Skeleton className="mx-4 mb-2 mt-4 h-3 w-16" />
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center gap-3 px-4 py-4">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-36 max-w-full" />
                <Skeleton className="mt-2 h-3 w-52 max-w-full" />
                <Skeleton className="mt-2 h-3 w-44 max-w-full" />
              </div>
              <Skeleton className="h-3 w-14 shrink-0" />
            </div>
          ))}
        </div>
        <div className="m3-card m3-card-elevated m3-card-lg hidden min-h-0 p-5 md:block">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-40 max-w-full" />
            </div>
          </div>
          <Skeleton className="mt-6 h-3 w-16" />
          <Skeleton className="mt-3 h-1 w-full" />
          <Skeleton className="mt-5 h-3 w-48 max-w-full" />
          <Skeleton className="mt-3 h-3 w-40 max-w-full" />
          <Skeleton className="mt-6 h-16 w-full" />
          <Skeleton className="mt-3 h-9 w-full" />
        </div>
      </div>
    </div>
  );
}

// The agent page's Overview tab: status, the coming-up tiles, results, and the
// lead finding and outreach panels.
export function AgentOverviewSkeleton() {
  return (
    <div className="app-x flex flex-col gap-4" role="status" aria-label="Loading agent">
      <div className="m3-card m3-card-outlined px-5 py-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-3.5 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((cell) => (
          <div key={cell} className="m3-card m3-card-outlined p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2.5 h-5 w-32" />
            <Skeleton className="mt-2 h-3 w-40 max-w-full" />
          </div>
        ))}
      </div>
      <div className="m3-card m3-card-outlined px-5 py-4 sm:px-6 sm:py-5">
        <Skeleton className="h-5 w-20" />
        <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((cell) => (
            <div key={cell}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-8 w-12" />
              <Skeleton className="mt-2 h-1.5 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((panel) => (
          <div key={panel} className="m3-card m3-card-outlined px-5 py-4 sm:px-6 sm:py-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-5 h-3 w-24" />
            <Skeleton className="mt-2 h-3.5 w-full" />
            <Skeleton className="mt-2 h-3.5 w-4/5" />
            <Skeleton className="mt-5 h-3 w-24" />
            <Skeleton className="mt-2 h-6 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// The agent page's Leads tab: one card listing the agent's leads.
export function AgentLeadsSkeleton() {
  return (
    <div className="app-x" role="status" aria-label="Loading leads">
      <div className="m3-card m3-card-outlined overflow-hidden">
        <div className="px-5 py-3.5">
          <Skeleton className="h-4 w-28" />
        </div>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex items-center gap-3 px-5 py-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-36 max-w-full" />
              <Skeleton className="mt-2 h-3 w-60 max-w-full" />
            </div>
            <Skeleton className="h-5 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Route loading state for /agents/[id]: the page header and tabs, then the
// Overview tab it opens on.
export function AgentPageSkeleton() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden md:mr-0.5 md:pb-3">
      <div className="app-x shrink-0 pt-5 md:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <Skeleton className="h-6 w-64 max-w-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-[17px] w-48 max-w-full" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/agents" className="m3-btn m3-btn-outlined h-8 px-2.5 text-xs">
              Back
            </Link>
            <span className="m3-btn m3-btn-filled h-8 px-2.5 text-xs">Edit</span>
          </div>
        </div>
        <nav aria-hidden="true" className="mt-5 flex gap-6 border-b border-[var(--md-sys-color-outline-variant)]">
          {["Overview", "Actions", "Leads"].map((label, index) => (
            <span
              key={label}
              className={`-mb-px border-b-2 pb-2.5 text-sm font-medium ${
                index === 0
                  ? "border-[var(--md-sys-color-on-surface)] text-[var(--md-sys-color-on-surface)]"
                  : "border-transparent text-[var(--md-sys-color-on-surface-variant)]"
              }`}
            >
              {label}
            </span>
          ))}
        </nav>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden pt-5">
        <AgentOverviewSkeleton />
      </div>
    </div>
  );
}
