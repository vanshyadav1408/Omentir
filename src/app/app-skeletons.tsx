// Shared loading skeletons for the app views. Pages render their real chrome
// (headers, tabs, buttons) immediately; these blocks stand in only for the
// data regions that are still being fetched from the backend or external
// services (Firestore, Unipile).
//
// Material 3 structural placeholder rules (globals.css `.skeleton`):
// - Structural parity: mirror final height/width/margin/padding/radius
// - Surface tonality: soft 4–8% neutral overlay (light) / white shimmer (dark)
// - Soft horizontal shimmer (~1400ms, cubic-bezier(0.4, 0, 0.6, 1) pulse)
// - On resolve: wrap loaded content in ContentReveal for a 350ms fade-in

import type { ReactNode } from "react";

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

// Matches the agent/campaign outreach card: title row with status pill and
// pause toggle, a 4-column stat grid, and a footer row with an action button.
function OutreachCardSkeleton() {
  return (
    <li className="m3-card m3-card-elevated m3-card-lg min-w-0 px-4 pb-5 pt-5 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8 rounded-full" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-y-5 sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-14" />
            <Skeleton className="mt-3 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
        <Skeleton className="h-3 w-64 max-w-full" />
        <Skeleton className="h-9 w-20" />
      </div>
    </li>
  );
}

export function OutreachListSkeleton({ label }: { label: string }) {
  return (
    <ul className="flex flex-col gap-3" aria-label={label} role="status">
      {[0, 1, 2].map((item) => (
        <OutreachCardSkeleton key={item} />
      ))}
    </ul>
  );
}

// Matches the leads split: contact list on the left, outreach preview on the right.
export function LeadsTableSkeleton() {
  return (
    <div
      className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(22rem,2fr)_minmax(0,3fr)]"
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
      className="grid min-h-[460px] flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[320px_1fr]"
      aria-label="Loading conversations"
      role="status"
    >
      <aside className="flex min-h-0 flex-col border-b border-zinc-200 lg:border-b-0 lg:border-r">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-4 py-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-start gap-3 border-b border-zinc-100 px-4 py-3.5">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="mt-1.5 h-3 w-40" />
                <Skeleton className="mt-1.5 h-3 w-48 max-w-full" />
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
          <Skeleton className="h-10 w-full" />
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
const PAGE_FRAME_CLASS = "app-x flex h-full min-h-0 min-w-0 flex-col gap-3 md:ml-4 md:mr-0.5 md:pb-3";

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

        <div className="m3-card m3-card-outlined mt-5 flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="mt-1.5 h-3 w-72 max-w-full" />
          </div>
          <Skeleton className="h-7 w-16 shrink-0" />
        </div>

        <div className="m3-card m3-card-outlined mt-5 min-w-0 px-5 py-4 sm:px-6 sm:py-5">
          <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">Outreach</p>
          <Skeleton className="mt-2 h-8 w-24" />
          <Skeleton className="mt-4 h-28 w-full" />
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
    <div className={PAGE_FRAME_CLASS}>
      <PageHeaderSkeleton title="Leads">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-7 w-56" />
      </PageHeaderSkeleton>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative z-10 -mb-px flex min-w-0 shrink-0 items-end gap-1 overflow-hidden px-2">
          <div className="flex shrink-0 items-center rounded-t-lg border border-zinc-200 border-b-transparent bg-white text-zinc-950">
            <span className="py-2 px-3.5 text-[13px] font-semibold">
              <span className="block translate-y-px whitespace-nowrap">All contacts</span>
            </span>
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

export function MessagesPageSkeleton() {
  return (
    <div className={PAGE_FRAME_CLASS}>
      <PageHeaderSkeleton title="Messages">
        <Skeleton className="h-7 w-52" />
      </PageHeaderSkeleton>
      <div className="flex shrink-0 items-center gap-6 overflow-hidden border-b border-zinc-200 pt-4 md:pt-0">
        {MESSAGE_TABS.map((label, index) => (
          <span
            key={label}
            className={`relative -mb-px flex shrink-0 items-center gap-1.5 pb-2.5 text-[13px] font-semibold ${
              index === 0 ? "text-zinc-950" : "text-zinc-600"
            }`}
          >
            {label}
            <Skeleton className="h-4 w-5 rounded-full" />
            {index === 0 ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-950" /> : null}
          </span>
        ))}
      </div>
      <section className="m3-card m3-card-elevated m3-card-lg flex min-h-0 flex-1 overflow-hidden">
        <MessagesInboxSkeleton />
      </section>
    </div>
  );
}

export function AgentsPageSkeleton() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 md:ml-4 md:pb-3">
      <div className="app-x hidden md:block">
        <PageHeaderSkeleton title="AI Agents">
          <Skeleton className="h-8 w-32" />
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

// Settings, Workspace, and API share one frame: header, optional tab row,
// then a max-w-5xl form column that opens with a SectionHeader.
function FormSectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-5">
      <h2 style={{ fontFamily: "var(--font-varta)" }} className="text-xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h2>
      <span className="mt-1.5 block h-0.5 w-8 rounded-full bg-[#ba3871]/60" aria-hidden />
      <Skeleton className="mt-2 h-3.5 w-80 max-w-full" />
    </div>
  );
}

function FieldGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
      {Array.from({ length: count }, (_, item) => (
        <div key={item}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

function FormPageSkeleton({
  title,
  headerLead,
  action = true,
  tabs,
  children,
}: {
  title: string;
  headerLead?: ReactNode;
  action?: boolean;
  tabs?: string[];
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 md:ml-4 md:mr-0.5" role="status" aria-label={`Loading ${title}`}>
      <div className="app-x hidden shrink-0 items-center justify-between gap-3 pt-6 md:flex">
        <div className="flex min-w-0 items-center gap-2.5">
          {headerLead}
          <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
        </div>
        {action ? <Skeleton className="h-8 w-28" /> : null}
      </div>
      {tabs ? (
        <div className="app-x shrink-0">
          <div className="flex items-center gap-6 overflow-hidden border-b border-zinc-200 pt-4 md:pt-0">
            {tabs.map((label, index) => (
              <span
                key={label}
                className={`relative -mb-px shrink-0 pb-2.5 text-[14px] font-semibold ${
                  index === 0 ? "text-zinc-950" : "text-zinc-600"
                }`}
              >
                {label}
                {index === 0 ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-950" /> : null}
              </span>
            ))}
          </div>
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

export function SettingsPageSkeleton() {
  return (
    <FormPageSkeleton title="Settings" tabs={["Profile", "Connected Accounts", "Subscription"]}>
      <FormSectionHeader title="Profile" />
      <div className="m3-card m3-card-outlined flex min-w-0 items-center gap-3 p-3">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="mt-1.5 h-3 w-52 max-w-full" />
        </div>
      </div>
      <div className="mt-6">
        <FieldGridSkeleton count={3} />
      </div>
      <div className="my-8 h-px bg-zinc-200" />
      <FormSectionHeader title="Automation limits" />
      <FieldGridSkeleton count={3} />
    </FormPageSkeleton>
  );
}

export function WorkspacePageSkeleton() {
  return (
    <FormPageSkeleton title="Workspace" headerLead={<Skeleton className="h-7 w-7 shrink-0 rounded-md" />}>
      <div className="mb-8">
        <h2 style={{ fontFamily: "var(--font-varta)" }} className="text-xl font-semibold tracking-tight text-zinc-950">
          Company Information
        </h2>
        <span className="mt-1.5 block h-0.5 w-8 rounded-full bg-[#ba3871]/60" aria-hidden />
        <Skeleton className="mt-2 h-3.5 w-96 max-w-full" />
      </div>
      <FieldGridSkeleton count={2} />
      <div className="mt-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2 h-28 w-full" />
      </div>
      <div className="mt-6">
        <FieldGridSkeleton count={2} />
      </div>
    </FormPageSkeleton>
  );
}

export function ApiKeysPageSkeleton() {
  return (
    <FormPageSkeleton title="API" action={false}>
      <FormSectionHeader title="API keys" />
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <div>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="mt-4 rounded-md border border-zinc-200 bg-white">
        <ApiKeyRowsSkeleton />
      </div>
    </FormPageSkeleton>
  );
}

// Fallback for routes without a bespoke skeleton (agent editor, agent detail):
// title row plus one content card.
export function GenericPageSkeleton() {
  return (
    <div className={PAGE_FRAME_CLASS} role="status" aria-label="Loading page">
      <div className="hidden shrink-0 items-center justify-between gap-3 pt-6 md:flex">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="m3-card m3-card-outlined m3-card-lg flex min-h-0 flex-1 flex-col gap-4 bg-white p-5">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-40 max-w-full" />
              <Skeleton className="mt-2 h-3 w-64 max-w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
