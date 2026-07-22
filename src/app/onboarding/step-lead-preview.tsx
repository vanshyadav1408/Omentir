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

function FlameScore({ score }: { score: number }) {
  const filled = score >= 80 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0;
  return (
    <span className="inline-flex items-center gap-0.5 text-base leading-none" aria-label={`Fit score ${score}`}>
      {[1, 2, 3].map((flame) => (
        <span key={flame} className={filled >= flame ? "" : "grayscale opacity-30"}>🔥</span>
      ))}
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
  const [state, setState] = useState<State>({ status: "loading" });
  const [retryToken, setRetryToken] = useState(0);
  const [isCompleting, startCompleting] = useTransition();
  const router = useRouter();
  // The input comes from the saved product profile, so it is stable for the
  // lifetime of this page render; serialized once so the effect never re-runs
  // on a referentially-new but identical prop object.
  const [inputJson] = useState(() => JSON.stringify(input));

  useEffect(() => {
    let cancelled = false;
    const findLeads = async () => {
      setState({ status: "loading" });
      try {
        const response = await fetch("/api/onboarding/lead-preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: inputJson,
        });
        const payload = (await response.json()) as { leads?: PreviewLead[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Could not find potential customers.");
        if (!cancelled) setState({ status: "ready", leads: payload.leads || [] });
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Could not find potential customers.",
          });
        }
      }
    };

    void findLeads();
    return () => {
      cancelled = true;
    };
  }, [inputJson, retryToken]);

  const completeSelfHostedOnboarding = () => {
    startCompleting(async () => {
      await completeSelfHostedOnboardingAction();
      router.replace("/onboarding");
      router.refresh();
    });
  };

  return (
    <div className="w-full max-w-3xl text-left">
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
          Potential customers for your business
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-600">
          Here are a few example leads matched to your product. On a full Omentir
          plan, leads like these are found in bulk and contacted for you on
          autopilot.
        </p>
      </div>

      {state.status === "ready" ? (
        <section className="m3-card m3-card-elevated mx-auto mt-8 max-w-xl overflow-hidden">
          <header className="flex items-center justify-between bg-[var(--md-sys-color-surface-container)] px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                Best matches
              </h2>
              <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Three example profiles selected for you
              </p>
            </div>
            <span className="rounded-full bg-[var(--md-sys-color-primary-container)] px-3 py-1 text-xs font-semibold text-[var(--md-sys-color-on-primary-container)]">
              {Math.min(state.leads.length, 3)} leads
            </span>
          </header>

          <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]">
            {state.leads.slice(0, 3).map((lead) => (
              <li key={`${lead.name}-${lead.company}`} className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--md-sys-color-primary)] text-xs font-semibold text-[var(--md-sys-color-on-primary)]">
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

                  <div className="min-w-0 flex-1">
                    <a
                      href={lead.linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1.5 text-[#0a66c2] hover:underline"
                    >
                      <span className="truncate text-sm font-semibold">{lead.name}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/linkedin-in-mark.svg" alt="LinkedIn profile" className="h-3 w-3 shrink-0" />
                    </a>
                    <p className="mt-1 truncate text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                      {lead.title || "-"}
                    </p>
                    <p className="mt-1 truncate text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                      @{lead.company}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <FlameScore score={lead.fitScore || 0} />
                    <p className="mt-1 text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                      {lead.fitScore || 0}% fit
                    </p>
                  </div>
                </div>

                <div className="mt-4 sm:pl-[60px]">
                  {lead.location ? (
                    <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                      {lead.location}
                    </p>
                  ) : null}
                  <div className="mt-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] p-4">
                    <p className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                      Why this lead fits
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface)]">
                      {lead.reason}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <div className="mx-auto mt-6 flex w-full max-w-xl justify-end">
          {selfHosted ? (
            <button
              type="button"
              onClick={completeSelfHostedOnboarding}
              disabled={isCompleting}
              className="inline-flex h-10 cursor-pointer items-center rounded-md bg-[#ba3871] px-5 pt-[3px] text-sm font-semibold text-white transition hover:brightness-[0.98] disabled:cursor-wait disabled:opacity-70"
            >
              {isCompleting ? "Continuing..." : "Continue"}
            </button>
          ) : (
            <Link
              href="/onboarding?step=3"
              className="inline-flex h-10 cursor-pointer items-center rounded-md bg-[#ba3871] px-5 pt-[3px] text-sm font-semibold text-white transition hover:brightness-[0.98]"
            >
              Continue
            </Link>
          )}
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="mt-8 rounded-xl bg-[var(--md-sys-color-error-container)] p-5 text-center text-sm text-[var(--md-sys-color-on-error-container)]">
          <p>{state.message}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setRetryToken((token) => token + 1)}
              className="inline-flex h-10 cursor-pointer items-center rounded-md bg-[var(--md-sys-color-primary)] px-5 font-semibold text-[var(--md-sys-color-on-primary)]"
            >
              Try again
            </button>
            {selfHosted ? (
              <button
                type="button"
                onClick={completeSelfHostedOnboarding}
                disabled={isCompleting}
                className="inline-flex h-10 cursor-pointer items-center rounded-md px-5 font-semibold text-[var(--md-sys-color-on-error-container)] underline underline-offset-4 disabled:cursor-wait disabled:opacity-70"
              >
                {isCompleting ? "Continuing..." : "Continue anyway"}
              </button>
            ) : (
              <Link
                href="/onboarding?step=3"
                className="inline-flex h-10 items-center rounded-md px-5 font-semibold text-[var(--md-sys-color-on-error-container)] underline underline-offset-4"
              >
                Continue anyway
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
