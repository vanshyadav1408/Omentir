"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicLead } from "./find-leads/types";

const EXAMPLES = [
  {
    label: "SaaS for dentists",
    prompt:
      "We help dental practices get more Google reviews. Sell to practice owners and office managers at independent clinics in the United States.",
  },
  {
    label: "Agency buyers",
    prompt:
      "Webflow design studio looking for founders of B2B SaaS companies in New York and London who just raised a seed round.",
  },
  {
    label: "Payroll for construction",
    prompt:
      "Payroll software for construction companies with 20 to 200 employees in Texas and Florida. Buyers are owners and operations managers.",
  },
] as const;

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; leads: PublicLead[] }
  | { status: "error"; message: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function roleLine(lead: PublicLead) {
  const role = [lead.title, lead.company ? `@${lead.company}` : ""].filter(Boolean).join(" ");
  if (!lead.location) return role || "Public profile";
  return role ? `${role} (${lead.location})` : lead.location;
}

function LeadCard({ lead }: { lead: PublicLead }) {
  return (
    <li className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[12px] font-semibold text-[var(--md-sys-color-on-surface)]">
          {initials(lead.name)}
          {lead.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lead.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          {lead.profileUrl ? (
            <a
              href={lead.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-1.5 font-semibold text-[var(--md-sys-color-on-surface)] hover:underline"
            >
              <span className="truncate">{lead.name}</span>
              {/linkedin\.com\//i.test(lead.profileUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/linkedin-in-mark.svg" alt="" className="h-3 w-3 shrink-0" />
              ) : null}
            </a>
          ) : (
            <p className="truncate font-semibold text-[var(--md-sys-color-on-surface)]">{lead.name}</p>
          )}
          <p className="mt-1 text-sm leading-5 text-[var(--md-sys-color-on-surface-variant)]">
            {roleLine(lead)}
          </p>
          {lead.reason ? (
            <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface)]">{lead.reason}</p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function FindLeadsForm() {
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });

  async function search(nextPrompt: string) {
    const trimmed = nextPrompt.trim();
    setPrompt(trimmed);
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/tools/find-leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        leads?: PublicLead[];
        error?: string;
      };
      if (!response.ok) {
        setState({
          status: "error",
          message: payload.error || "Lead search failed. Try again in a minute.",
        });
        return;
      }
      const leads = Array.isArray(payload.leads) ? payload.leads : [];
      if (leads.length === 0) {
        setState({
          status: "error",
          message: "No matching profiles right now. Try a clearer buyer: role, company type, and location.",
        });
        return;
      }
      setState({ status: "ready", leads });
    } catch {
      setState({
        status: "error",
        message: "Lead search failed. Check your connection and try again.",
      });
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void search(prompt);
        }}
        className="rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-4 md:p-6"
      >
        <label className="block">
          <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Your business</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={6}
            maxLength={1500}
            placeholder="Example: We sell payroll software to construction companies in the US with 20 to 200 people. Buyers are owners and ops managers."
            className="mt-2 w-full resize-y rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] px-4 py-3 text-base leading-6 text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:border-[var(--md-sys-color-outline)]"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => setPrompt(example.prompt)}
              className="rounded-full border border-[var(--md-sys-color-outline-variant)] px-3 py-1.5 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:border-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)]"
            >
              {example.label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={state.status === "loading" || prompt.trim().length < 20}
          className="m3-btn m3-btn-filled mt-5 h-11 w-full cursor-pointer px-6 text-sm disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        >
          {state.status === "loading" ? "Searching public profiles..." : "Find 10 leads"}
        </button>
      </form>

      {state.status === "error" ? (
        <p className="mt-6 text-sm leading-6 text-[var(--md-sys-color-on-surface)]" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === "ready" ? (
        <section className="mt-10" aria-live="polite">
          <h2
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
          >
            10 people who might buy
          </h2>
          <ol className="mt-4 grid gap-3">
            {state.leads.map((lead) => (
              <LeadCard key={`${lead.profileUrl}-${lead.name}`} lead={lead} />
            ))}
          </ol>
          <div className="mt-8 rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] px-6 py-7 text-center">
            <p className="text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
              Want them messaged from your LinkedIn?
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
              Omentir finds buyers every day from your connected account, drafts the notes, and sends at the pace you set. This free search only shows a sample.
            </p>
            <Link
              href="/signup"
              className="m3-btn m3-btn-filled-secondary mt-5 inline-flex h-11 cursor-pointer px-6 text-sm"
            >
              Create a free account
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
