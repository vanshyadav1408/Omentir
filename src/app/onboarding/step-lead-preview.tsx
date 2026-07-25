"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import AiLoadingOverlay from "../ai-loading-overlay";
import { completeSelfHostedOnboardingAction } from "../actions";

type PreviewLead = {
  name: string;
  title: string;
  company: string;
  location: string;
  reason: string;
  linkedInUrl: string;
  avatarUrl: string;
  fitScore: number;
};

export type LeadPreviewInput = {
  websiteUrl: string;
  productOverview: string;
  targetBuyers: string[];
  buyerTitles: string[];
  industries: string[];
  companySizes: string[];
  painPoints: string[];
  keywords: string[];
};

type State =
  // Starts idle: the search costs up to ~90s of the user's time, so it runs
  // only when they ask for it rather than the moment step 2 renders.
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; leads: PreviewLead[] }
  | { status: "error"; message: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// Contact / Why this lead / Fit. Mirrors the /leads column recipe, minus the
// checkbox and Imported columns which have no meaning during onboarding.
const TABLE_COLUMNS = "grid-cols-[minmax(220px,1.1fr)_minmax(260px,1.6fr)_64px]";

/** "Co-Founder & CEO @Surfe (Paris, France)" — one line, parts dropped when absent. */
function roleLine(lead: PreviewLead) {
  const role = [lead.title, lead.company ? `@${lead.company}` : ""].filter(Boolean).join(" ");
  if (!lead.location) return role || "-";
  return role ? `${role} (${lead.location})` : lead.location;
}

function LeadIdentity({ lead }: { lead: PreviewLead }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#ba3871] text-[12px] font-semibold text-white">
        {initials(lead.name)}
        {lead.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lead.avatarUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </span>
      <div className="min-w-0">
        <a
          href={lead.linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-1.5 text-[#0a66c2] hover:underline"
        >
          <span className="truncate text-[13px] font-semibold leading-none">{lead.name}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/linkedin-in-mark.svg" alt="LinkedIn profile" className="h-3 w-3 shrink-0" />
        </a>
        <p className="mt-1 truncate text-[11px] font-medium text-zinc-600" title={roleLine(lead)}>
          {roleLine(lead)}
        </p>
      </div>
    </div>
  );
}

// Leaving step 2 is the same action whether the user skipped the search, ran it,
// or hit an error - only the label differs. Self-hosted has no step 3, so it
// finishes onboarding instead of navigating.
function AdvanceAction({
  label,
  className,
  selfHosted,
  isCompleting,
  onComplete,
}: {
  label: string;
  className: string;
  selfHosted: boolean;
  isCompleting: boolean;
  onComplete: () => void;
}) {
  if (!selfHosted) {
    return (
      <Link href="/onboarding?step=3" className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onComplete}
      disabled={isCompleting}
      className={`${className} disabled:cursor-wait disabled:opacity-70`}
    >
      {isCompleting ? "Continuing..." : label}
    </button>
  );
}

function FitScore({ score }: { score: number }) {
  return (
    <span
      className="text-lg font-semibold leading-none tabular-nums text-[var(--md-sys-color-on-surface)]"
      aria-label={`Fit score ${score}`}
    >
      {score}
    </span>
  );
}

export default function StepLeadPreview({
  input,
  selfHosted = false,
}: {
  input: LeadPreviewInput;
  selfHosted?: boolean;
}) {
  const [state, setState] = useState<State>({ status: "idle" });
  // 0 means "not requested yet"; every press of Find/Try again bumps it and
  // re-runs the effect.
  const [runToken, setRunToken] = useState(0);
  const [isCompleting, startCompleting] = useTransition();
  const router = useRouter();
  // The input comes from the saved product profile, so it is stable for the
  // lifetime of this page render; serialized once so the effect never re-runs
  // on a referentially-new but identical prop object.
  const [inputJson] = useState(() => JSON.stringify(input));

  useEffect(() => {
    if (!runToken) return;
    let cancelled = false;
    const findLeads = async () => {
      setState({ status: "loading" });
      try {
        const response = await fetch("/api/onboarding/lead-preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: inputJson,
          // Without a deadline a hung proxy keeps the loading overlay up
          // forever with no way forward; failing surfaces the retry UI.
          signal: AbortSignal.timeout(90_000),
        });
        // A proxy timeout or crash answers with an HTML body, so parsing must
        // not be what reports the failure - otherwise the user is shown a raw
        // "Unexpected token '<'" instead of something actionable.
        const payload = (await response
          .json()
          .catch(() => ({}))) as { leads?: PreviewLead[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Could not find potential customers.");
        if (!payload.leads?.length) throw new Error("Could not find potential customers.");
        if (!cancelled) setState({ status: "ready", leads: payload.leads });
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof DOMException && error.name === "TimeoutError"
                ? "This is taking longer than expected. Please try again."
                : error instanceof Error
                  ? error.message
                  : "Could not find potential customers.",
          });
        }
      }
    };

    void findLeads();
    return () => {
      cancelled = true;
    };
  }, [inputJson, runToken]);

  const completeSelfHostedOnboarding = () => {
    startCompleting(async () => {
      await completeSelfHostedOnboardingAction();
      router.replace("/onboarding");
      router.refresh();
    });
  };

  const advance = { selfHosted, isCompleting, onComplete: completeSelfHostedOnboarding };
  // The server already caps the list at PREVIEW_LEAD_COUNT, so there is no
  // second limit to keep in sync here.
  const visibleLeads = state.status === "ready" ? state.leads : [];

  return (
    <div className="w-full max-w-4xl text-left">
      <AiLoadingOverlay
        open={state.status === "loading"}
        title="Finding potential customers"
        note="Usually takes about a minute"
        transparent={false}
      />

      <div className="text-center">
        <h1
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          Let&apos;s find a few of your buyers
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-600">
          {state.status === "idle"
            ? "We'll show you a few real profiles that match what you sell, just so you know what kind of leads Omentir will find and message."
            : "Here's who we found. These are real profiles, just so you know what kind of leads Omentir will find and message."}
        </p>
      </div>

      {state.status === "idle" ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setRunToken((token) => token + 1)}
            className="inline-flex h-10 cursor-pointer items-center rounded-md bg-[#ba3871] px-5 pt-[3px] text-sm font-semibold text-white transition hover:brightness-[0.98]"
          >
            Find example leads
          </button>
          <AdvanceAction
            {...advance}
            label="Skip"
            className="inline-flex h-10 cursor-pointer items-center rounded-md px-5 pt-[3px] text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] underline underline-offset-4 transition hover:text-[var(--md-sys-color-on-surface)]"
          />
        </div>
      ) : null}

      {state.status === "ready" ? (
        <section className="m3-card m3-card-elevated mt-8 w-full overflow-hidden">
          <header className="flex items-center justify-between bg-[var(--md-sys-color-surface-container)] px-4 py-3 text-left">
            <div>
              <h2 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                Best matches
              </h2>
              <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Example profiles selected for you
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--md-sys-color-primary-container)] px-3 py-1 text-xs font-semibold text-[var(--md-sys-color-on-primary-container)]">
              {visibleLeads.length} leads
            </span>
          </header>

          {/* Same grid table as /leads (m3-table-grid-*), trimmed to the three
              columns this step has data for. */}
          <div
            className={`m3-table-grid-header hidden shrink-0 ${TABLE_COLUMNS} items-center gap-3 md:grid`}
          >
            <span>Contact</span>
            <span>Why this lead</span>
            <span className="m3-table-num">Fit</span>
          </div>

          <div className="m3-table-grid hidden md:block">
            {visibleLeads.map((lead) => (
              <div
                key={`${lead.name}-${lead.company}`}
                className={`m3-table-grid-row grid ${TABLE_COLUMNS} items-center gap-3 text-left`}
              >
                <LeadIdentity lead={lead} />
                <p className="line-clamp-2 min-w-0 text-[12px] font-medium leading-5 text-zinc-800">
                  {lead.reason}
                </p>
                <div className="m3-table-num flex justify-end">
                  <FitScore score={lead.fitScore || 0} />
                </div>
              </div>
            ))}
          </div>

          {/* Below md the three columns can't hold their minimums, so each lead
              stacks instead of forcing a horizontal scroll. */}
          <div className="divide-y divide-[var(--md-sys-color-outline-variant)] md:hidden">
            {visibleLeads.map((lead) => (
              <div key={`${lead.name}-${lead.company}`} className="p-4 text-left">
                <div className="flex items-start justify-between gap-3">
                  <LeadIdentity lead={lead} />
                  <FitScore score={lead.fitScore || 0} />
                </div>
                <p className="mt-2 text-[12px] font-medium leading-5 text-zinc-800">
                  {lead.reason}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Full width, not a narrower centered column: Continue has to land on the
          table's right edge, so it shares the table's container width. */}
      {state.status === "ready" ? (
        <div className="mt-6 flex w-full justify-end">
          <AdvanceAction
            {...advance}
            label="Continue"
            className="inline-flex h-10 cursor-pointer items-center rounded-md bg-[#ba3871] px-5 pt-[3px] text-sm font-semibold text-white transition hover:brightness-[0.98]"
          />
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="mt-8 rounded-xl bg-[var(--md-sys-color-error-container)] p-5 text-center text-sm text-[var(--md-sys-color-on-error-container)]">
          <p>{state.message}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setRunToken((token) => token + 1)}
              className="inline-flex h-10 cursor-pointer items-center rounded-md bg-[var(--md-sys-color-primary)] px-5 font-semibold text-[var(--md-sys-color-on-primary)]"
            >
              Try again
            </button>
            <AdvanceAction
              {...advance}
              label="Continue anyway"
              className="inline-flex h-10 cursor-pointer items-center rounded-md px-5 font-semibold text-[var(--md-sys-color-on-error-container)] underline underline-offset-4"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
