"use client";

import { useState } from "react";
import type { PublicLead } from "./find-leads/types";
import { TOOL_CARD, ToolCta, ToolLoadingRow } from "./tool-ui";

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

function LeadCard({ lead, index }: { lead: PublicLead; index: number }) {
  const onLinkedIn = /linkedin\.com\//i.test(lead.profileUrl);
  return (
    <li className={`${TOOL_CARD} flex flex-col !rounded-[20px] p-[20px]`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--cal-blue-soft)] text-[13px] font-semibold text-[var(--cal-blue)]">
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
          <p className="truncate font-semibold text-[var(--site-text)]">{lead.name}</p>
          <p className="mt-0.5 text-sm leading-5 text-[var(--cal-muted)]">{roleLine(lead)}</p>
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-[var(--cal-muted)]">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      {lead.reason ? (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--cal-muted)]">{lead.reason}</p>
      ) : null}
      {lead.profileUrl ? (
        <a
          href={lead.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1.5 self-start pt-4 text-sm font-medium text-[var(--cal-blue)] hover:underline"
        >
          {onLinkedIn ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/linkedin-in-mark.svg" alt="" className="h-3.5 w-3.5" />
          ) : null}
          View profile
          <span aria-hidden="true">&rarr;</span>
        </a>
      ) : null}
    </li>
  );
}

function LeadSkeleton() {
  return (
    <li className={`${TOOL_CARD} !rounded-[20px] p-[20px]`} aria-hidden="true">
      <div className="flex animate-pulse items-start gap-3">
        <span className="h-12 w-12 shrink-0 rounded-full bg-[var(--cal-hero)]" />
        <div className="flex-1 space-y-2 pt-1">
          <span className="block h-3.5 w-2/5 rounded-full bg-[var(--cal-hero)]" />
          <span className="block h-3 w-3/4 rounded-full bg-[var(--cal-hero)]" />
        </div>
      </div>
      <div className="mt-5 animate-pulse space-y-2">
        <span className="block h-3 w-full rounded-full bg-[var(--cal-hero)]" />
        <span className="block h-3 w-4/5 rounded-full bg-[var(--cal-hero)]" />
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

  const loading = state.status === "loading";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void search(prompt);
        }}
        className={`${TOOL_CARD} p-[20px] md:p-[28px]`}
      >
        <textarea
          id="find-leads-prompt"
          aria-label="Describe your business and target audience"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          maxLength={1500}
          disabled={loading}
          placeholder="Describe your business and target audience"
          className="site-input w-full resize-y"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="site-btn site-btn-primary w-full disabled:cursor-not-allowed sm:w-auto"
          >
            Find 10 leads
          </button>
        </div>
        {loading ? <ToolLoadingRow label="Searching public profiles" seconds={10} /> : null}
      </form>

      {state.status === "error" ? (
        <p
          className={`${TOOL_CARD} mt-6 !rounded-[20px] px-5 py-4 text-sm leading-6 text-[var(--site-text)]`}
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      {loading ? (
        <ol className="mt-8 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <LeadSkeleton key={index} />
          ))}
        </ol>
      ) : null}

      {state.status === "ready" ? (
        <section className="mt-10" aria-live="polite">
          <h2
            style={{ fontFamily: "var(--font-cal-display)" }}
            className="text-center text-2xl font-medium tracking-tight text-[var(--site-text)]"
          >
            {state.leads.length} people who might buy
          </h2>
          <ol className="mt-6 grid gap-3 md:grid-cols-2">
            {state.leads.map((lead, index) => (
              <LeadCard key={`${lead.profileUrl}-${lead.name}`} lead={lead} index={index} />
            ))}
          </ol>
          <ToolCta slug="find-leads" />
        </section>
      ) : null}
    </div>
  );
}
