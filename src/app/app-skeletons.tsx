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
  return <div className={`skeleton rounded-md ${className}`} aria-hidden="true" />;
}

/** Fade content in after a skeleton unmounts (300–400ms M3 standard curve). */
export function ContentReveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`skeleton-content-enter ${className}`}>{children}</div>;
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

// Matches the leads table body: stacked cards on mobile, the five-column
// grid (checkbox / lead / signal / score / added) on desktop.
export function LeadsTableSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-label="Loading leads" role="status">
      {/* Mobile card list */}
      <div className="m3-table-grid min-h-0 flex-1 overflow-hidden md:hidden">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="m3-table-grid-row !h-auto min-h-[52px] p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="mt-3 h-3.5 w-3.5" />
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="mt-2 h-3 w-24" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </div>
              <div className="shrink-0">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="mt-1.5 h-3 w-10" />
              </div>
            </div>
            <Skeleton className="mt-3 h-10 w-full" />
          </div>
        ))}
      </div>
      {/* Desktop table — M3 header 56px / rows 52px */}
      <div className="m3-table-grid-header hidden shrink-0 grid-cols-[40px_minmax(300px,1.45fr)_minmax(340px,2fr)_120px_120px] items-center gap-3 md:grid">
        {[0, 1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-3 w-20 max-w-full" />
        ))}
      </div>
      <div className="m3-table-grid hidden min-h-0 flex-1 overflow-hidden md:block">
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="m3-table-grid-row grid grid-cols-[40px_minmax(300px,1.45fr)_minmax(340px,2fr)_120px_120px] items-center gap-3"
          >
            <Skeleton className="h-4 w-4" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-48" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-72 max-w-full" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
            <Skeleton className="m3-table-num h-4 w-16" />
            <Skeleton className="m3-table-num h-4 w-16" />
          </div>
        ))}
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
      <div className="flex flex-col items-start gap-4 rounded-md border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
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
