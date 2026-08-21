"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import AiLoadingOverlay from "../ai-loading-overlay";
import { completeSelfHostedOnboardingAction } from "../actions";
import { AuthHeading } from "../auth-ui";

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
  // Starts idle: the search costs up to a minute of the user's time, so it runs
  // only when they ask for it rather than the moment step 2 renders.
  | { status: "idle" }
  | { status: "loading" }
  // `upgrading` means the fast draft is on screen while the grounded search is
  // still running; its results replace these when they land.
  | { status: "ready"; leads: PreviewLead[]; upgrading: boolean }
  | { status: "error"; message: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** "Co-Founder & CEO @Surfe (Paris, France)" — parts dropped when absent. */
function roleLine(lead: PreviewLead) {
  const role = [lead.title, lead.company ? `@${lead.company}` : ""].filter(Boolean).join(" ");
  if (!lead.location) return role || "-";
  return role ? `${role} (${lead.location})` : lead.location;
}

function LeadIdentity({ lead }: { lead: PreviewLead }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#2a2a2a] text-[12px] font-semibold text-white">
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
          className="flex min-w-0 items-center gap-1.5 text-white hover:underline"
        >
          <span className="truncate text-[13px] font-semibold leading-none">{lead.name}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/linkedin-in-mark.svg" alt="LinkedIn profile" className="h-3 w-3 shrink-0" />
        </a>
        <p className="auth-muted mt-1 text-[12px] leading-4">{roleLine(lead)}</p>
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

/** The overlay's indicator at label size, for the background upgrade pass. */
function InlineSpinner() {
  return (
    <svg
      className="m3-ai-loading-indicator m3-ai-loading-indicator--inline"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <circle className="m3-ai-loading-indicator__track" cx="24" cy="24" r="20" pathLength={100} />
      <circle className="m3-ai-loading-indicator__active" cx="24" cy="24" r="20" pathLength={100} />
    </svg>
  );
}

function FitScore({ score }: { score: number }) {
  return (
    <span
      className="shrink-0 text-[15px] font-semibold leading-none tabular-nums text-white"
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

    // One request per pass. `fast` is a plain model call that lands in ~10s;
    // `search` is grounded in live web results, so it is slower but returns
    // people who currently hold the job. Anything that can only fail on the
    // server (quota, timeout) answers with a message worth showing.
    const fetchLeads = async (mode: "fast" | "search", timeoutMs: number) => {
      const response = await fetch("/api/onboarding/lead-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...JSON.parse(inputJson), mode }),
        // Without a deadline a hung proxy keeps the loading overlay up forever
        // with no way forward; failing surfaces the retry UI.
        signal: AbortSignal.timeout(timeoutMs),
      });
      // A proxy timeout or crash answers with an HTML body, so parsing must not
      // be what reports the failure - otherwise the user is shown a raw
      // "Unexpected token '<'" instead of something actionable.
      const payload = (await response
        .json()
        .catch(() => ({}))) as { leads?: PreviewLead[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not find potential customers.");
      if (!payload.leads?.length) throw new Error("Could not find potential customers.");
      return payload.leads;
    };

    const findLeads = async () => {
      setState({ status: "loading" });
      // Both passes start together, and each renders the moment it lands, so
      // neither one waits on the other. The grounded pass always wins: it is
      // the one with real, current people in it.
      let groundedLanded = false;

      const searchTask = fetchLeads("search", 75_000).then(
        (leads) => {
          groundedLanded = true;
          if (!cancelled) setState({ status: "ready", leads, upgrading: false });
          return null;
        },
        // Kept rather than rethrown: whether this failure is worth showing
        // depends on what the fast pass managed to produce.
        (error: Error) => error,
      );

      const fastTask = fetchLeads("fast", 45_000).then(
        (leads) => {
          if (!cancelled && !groundedLanded) {
            setState({ status: "ready", leads, upgrading: true });
          }
        },
        () => {
          // A failed draft is not worth reporting on its own - the grounded pass
          // is the one whose result the user actually sees.
        },
      );

      await fastTask;
      const searchError = await searchTask;
      if (cancelled || !searchError) return;

      // Keep whatever the fast pass produced rather than replacing real leads
      // with an error screen; only a total miss shows the retry UI.
      setState((current) =>
        current.status === "ready"
          ? { ...current, upgrading: false }
          : {
              status: "error",
              message:
                searchError instanceof DOMException && searchError.name === "TimeoutError"
                  ? "This is taking longer than expected. Please try again."
                  : searchError.message || "Could not find potential customers.",
            },
      );
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
  const wide = state.status === "ready";

  return (
    <div className={wide ? "w-full text-left" : "mx-auto w-full max-w-[360px] text-left"}>
      <AiLoadingOverlay
        open={state.status === "loading"}
        title="Finding potential customers"
        note="Usually takes about 10 seconds"
        transparent={false}
      />

      <AuthHeading
        className="text-center"
        title="Find example leads"
        subtitle={
          state.status === "ready"
            ? "Check if these jobs and companies look right."
            : "A few people whose jobs match what you sell."
        }
      />

      {state.status === "idle" ? (
        <div>
          <button
            type="button"
            onClick={() => setRunToken((token) => token + 1)}
            className="auth-btn mx-auto max-w-[280px]"
          >
            Find example leads
          </button>
          <p className="mt-6 text-center text-[13px]">
            <AdvanceAction {...advance} label="Skip" className="auth-link underline underline-offset-4" />
          </p>
        </div>
      ) : null}

      {state.status === "ready" ? (
        <>
          {state.upgrading ? (
            <p className="mb-4 flex items-center gap-2 text-xs text-[#8f8f8f]">
              <InlineSpinner />
              Checking the web for people who hold these jobs right now
            </p>
          ) : null}
          <div className="divide-y divide-[#2e2e2e] overflow-hidden rounded-lg border border-[#2e2e2e]">
            {visibleLeads.map((lead) => (
              <div key={`${lead.name}-${lead.company}`} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <LeadIdentity lead={lead} />
                  <FitScore score={lead.fitScore || 0} />
                </div>
                <p className="mt-2 text-[13px] leading-5 text-[#c8c8c8]">{lead.reason}</p>
              </div>
            ))}
          </div>
          <AdvanceAction {...advance} label="Continue" className="auth-btn mt-6" />
        </>
      ) : null}

      {state.status === "error" ? (
        <div className="rounded-lg border border-[#3a2222] bg-[#1a1010] p-4 text-center text-sm text-[#e8b4b4]">
          <p>{state.message}</p>
          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={() => setRunToken((token) => token + 1)}
              className="auth-btn"
            >
              Try again
            </button>
            <AdvanceAction
              {...advance}
              label="Continue anyway"
              className="auth-link mx-auto text-[13px] underline underline-offset-4"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
