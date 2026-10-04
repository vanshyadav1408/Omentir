"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import {
  LINKEDIN_PROFILE_FIELD_LIMITS,
  normalizeLinkedInProfileDraft,
  parsePublicLinkedInProfileUrl,
  profileScoreLabel,
  readStoredLinkedInProfileDraft,
  storeLinkedInProfileDraft,
  type LinkedInProfileImproveResult,
  type LinkedInProfileRatingResult,
  type LinkedInProfileToolMode,
  type LinkedInProfileToolResponse,
} from "@/lib/linkedin-profile-tool";
import { TOOL_CARD, ToolCta, ToolLoadingRow } from "./tool-ui";

const SCORE_ROWS: Array<{
  key: keyof LinkedInProfileRatingResult["scores"];
  label: string;
}> = [
  { key: "headline", label: "Headline" },
  { key: "about", label: "About" },
  { key: "experience", label: "Experience" },
  { key: "proof", label: "Proof" },
  { key: "outboundFit", label: "Outbound fit" },
];

const HEADING_STYLE = { fontFamily: "var(--font-cal-display)" } as const;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      disabled={!text}
      aria-label={`Copy ${label}`}
      aria-pressed={copied}
      className="cal-filter-pill inline-flex shrink-0 items-center gap-1.5 border border-[var(--site-border)] disabled:opacity-50"
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {copied ? (
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        ) : (
          <>
            <rect x="8" y="8" width="12" height="12" rx="2.5" />
            <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
          </>
        )}
      </svg>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  return (
    <div
      className="grid h-32 w-32 shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--cal-blue) ${clamped * 3.6}deg, var(--cal-blue-soft) 0deg)`,
      }}
      role="img"
      aria-label={`Overall score ${clamped} out of 100`}
    >
      <div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-[var(--cal-surface)]">
        <div className="text-center">
          <div
            style={HEADING_STYLE}
            className="text-4xl font-medium tabular-nums leading-none tracking-tight text-[var(--site-text)]"
          >
            {clamped}
          </div>
          <div className="mt-1 text-xs text-[var(--cal-muted)]">of 100</div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-[var(--site-text)]">{label}</span>
        <span className="tabular-nums text-[var(--cal-muted)]">{score}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--cal-blue-soft)]">
        <div
          className="h-full rounded-full bg-[var(--cal-blue)]"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

function ListCard({
  title,
  marker,
  items,
  ordered = false,
}: {
  title: string;
  marker: ReactNode;
  items: string[];
  ordered?: boolean;
}) {
  const List = ordered ? "ol" : "ul";
  return (
    <div className={`${TOOL_CARD} p-[24px] md:p-[28px]`}>
      <h3 style={HEADING_STYLE} className="text-xl font-medium tracking-tight text-[var(--site-text)]">
        {title}
      </h3>
      <List className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[var(--site-text)]">
            <span
              className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--cal-blue-soft)] text-[11px] font-semibold tabular-nums text-[var(--cal-blue)]"
              aria-hidden="true"
            >
              {ordered ? index + 1 : marker}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </List>
    </div>
  );
}

const CHECK = (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

const BANG = (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M12 6v8M12 18.5v.01" />
  </svg>
);

function RatingResult({ rating }: { rating: LinkedInProfileRatingResult }) {
  return (
    <section className="mt-8 space-y-4" aria-live="polite">
      <div className={`${TOOL_CARD} grid gap-[32px] p-[24px] md:grid-cols-[auto_1fr] md:p-[32px]`}>
        <div className="flex flex-col items-center gap-5 sm:flex-row md:flex-col md:items-start">
          <ScoreRing score={rating.overall} />
          <div className="text-center sm:text-left md:max-w-[13rem]">
            <p style={HEADING_STYLE} className="text-2xl font-medium tracking-tight text-[var(--site-text)]">
              {rating.verdict || profileScoreLabel(rating.overall)}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--cal-muted)]">{rating.summary}</p>
          </div>
        </div>
        <div className="space-y-5 md:border-l md:border-[var(--site-border)] md:pl-8">
          {SCORE_ROWS.map((row) => (
            <ScoreBar key={row.key} label={row.label} score={rating.scores[row.key]} />
          ))}
        </div>
      </div>

      {rating.strengths.length > 0 || rating.gaps.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {rating.strengths.length > 0 ? (
            <ListCard title="What is working" marker={CHECK} items={rating.strengths} />
          ) : null}
          {rating.gaps.length > 0 ? (
            <ListCard title="What to fix" marker={BANG} items={rating.gaps} />
          ) : null}
        </div>
      ) : null}

      {rating.nextFixes.length > 0 ? (
        <ListCard title="Do these next" marker={null} items={rating.nextFixes} ordered />
      ) : null}

      <p className="pt-2 text-center text-sm leading-6 text-[var(--cal-muted)]">
        Want rewrite drafts for the same URL?{" "}
        <Link href="/tools/improve-linkedin-profile" className="font-medium text-[var(--cal-blue)] underline underline-offset-4">
          Improve this LinkedIn profile
        </Link>
        .
      </p>
      <ToolCta slug="linkedin-profile-rating" />
    </section>
  );
}

function SuggestionCard({
  title,
  copyLabel,
  text,
}: {
  title: string;
  copyLabel: string;
  text: string;
}) {
  return (
    <div className={`${TOOL_CARD} p-[24px] md:p-[28px]`}>
      <div className="flex items-center justify-between gap-3">
        <h3 style={HEADING_STYLE} className="text-xl font-medium tracking-tight text-[var(--site-text)]">
          {title}
        </h3>
        <CopyButton text={text} label={copyLabel} />
      </div>
      <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-[var(--cal-hero)] px-5 py-4 text-[15px] leading-7 text-[var(--site-text)]">
        {text}
      </p>
    </div>
  );
}

function ImproveResult({ improve }: { improve: LinkedInProfileImproveResult }) {
  return (
    <section className="mt-8 space-y-4" aria-live="polite">
      {improve.headline ? (
        <SuggestionCard title="Suggested headline" copyLabel="headline" text={improve.headline} />
      ) : null}
      {improve.about ? (
        <SuggestionCard title="Suggested About" copyLabel="About" text={improve.about} />
      ) : null}
      {improve.experience ? (
        <SuggestionCard title="Suggested experience" copyLabel="experience" text={improve.experience} />
      ) : null}
      {improve.skills ? (
        <SuggestionCard title="Suggested skills line" copyLabel="skills" text={improve.skills} />
      ) : null}

      {improve.changes.length > 0 ? (
        <div className={`${TOOL_CARD} p-[24px] md:p-[28px]`}>
          <h3 style={HEADING_STYLE} className="text-xl font-medium tracking-tight text-[var(--site-text)]">
            What changed
          </h3>
          <ul className="mt-4 divide-y divide-[var(--site-border)]">
            {improve.changes.map((change) => (
              <li
                key={`${change.area}-${change.why}`}
                className="grid gap-1 py-3 text-sm leading-6 first:pt-0 last:pb-0 sm:grid-cols-[9rem_1fr] sm:gap-4"
              >
                <span className="font-medium text-[var(--site-text)]">{change.area}</span>
                <span className="text-[var(--cal-muted)]">{change.why}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="pt-2 text-center text-sm leading-6 text-[var(--cal-muted)]">
        Want a score for the same URL first?{" "}
        <Link href="/tools/linkedin-profile-rating" className="font-medium text-[var(--cal-blue)] underline underline-offset-4">
          Rate this LinkedIn profile
        </Link>
        .
      </p>
      <ToolCta slug="improve-linkedin-profile" />
    </section>
  );
}

const DRAFT_EVENT = "omentir-linkedin-profile-draft";

function subscribeDraft(onChange: () => void) {
  window.addEventListener(DRAFT_EVENT, onChange);
  return () => window.removeEventListener(DRAFT_EVENT, onChange);
}

function urlSnapshot() {
  return readStoredLinkedInProfileDraft().profileUrl;
}

function writeUrl(profileUrl: string) {
  const current = readStoredLinkedInProfileDraft();
  storeLinkedInProfileDraft(normalizeLinkedInProfileDraft({ ...current, profileUrl }));
  window.dispatchEvent(new Event(DRAFT_EVENT));
}

export default function LinkedInProfileTool({ mode }: { mode: LinkedInProfileToolMode }) {
  const profileUrl = useSyncExternalStore(subscribeDraft, urlSnapshot, () => "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState<LinkedInProfileRatingResult | null>(null);
  const [improve, setImprove] = useState<LinkedInProfileImproveResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!parsePublicLinkedInProfileUrl(profileUrl)) {
      setError("Paste a public linkedin.com/in URL.");
      return;
    }

    setBusy(true);
    setRating(null);
    setImprove(null);

    try {
      const response = await fetch("/api/tools/linkedin-profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, profileUrl }),
      });
      const payload = (await response.json()) as LinkedInProfileToolResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Could not review this profile.");
      }
      if (payload.mode === "rating") {
        setRating(payload.rating);
      } else if (payload.mode === "improve") {
        setImprove(payload.improve);
      } else {
        throw new Error("Could not review this profile.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not review this profile.");
    } finally {
      setBusy(false);
    }
  }

  const submitLabel = mode === "rating" ? "Rate my profile" : "Suggest changes";
  const pendingLabel = mode === "rating" ? "Scoring the profile" : "Rewriting the profile";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form onSubmit={onSubmit} className={`${TOOL_CARD} p-[20px] md:p-[28px]`}>
        <label htmlFor={`${mode}-profile-url`} className="block text-sm font-medium text-[var(--site-text)]">
          LinkedIn profile URL
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            id={`${mode}-profile-url`}
            value={profileUrl}
            onChange={(event) => writeUrl(event.target.value)}
            maxLength={LINKEDIN_PROFILE_FIELD_LIMITS.profileUrl}
            placeholder="https://www.linkedin.com/in/your-name"
            autoComplete="off"
            inputMode="url"
            disabled={busy}
            aria-invalid={error ? true : undefined}
            className="site-input min-w-0 flex-1"
          />
          <button
            type="submit"
            disabled={busy}
            className="site-btn site-btn-primary shrink-0 disabled:cursor-wait"
          >
            {submitLabel}
          </button>
        </div>
        {busy ? <ToolLoadingRow label={pendingLabel} seconds={20} /> : null}
        {error ? (
          <p className="mt-4 text-sm leading-6 text-[var(--site-text)]" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {rating ? <RatingResult rating={rating} /> : null}
      {improve ? <ImproveResult improve={improve} /> : null}
    </div>
  );
}
