"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import AiLoadingOverlay from "../ai-loading-overlay";
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
import { ALL_TOOLS } from "./tools-data";

const FIELD_CLASS =
  "mt-2 w-full rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] px-4 py-3 text-base leading-6 text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:border-[var(--md-sys-color-outline)]";

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
      className="rounded-full border border-[var(--md-sys-color-outline-variant)] px-3 py-1.5 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:border-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] disabled:opacity-50"
    >
      {copied ? "Copied" : `Copy ${label}`}
    </button>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-[var(--md-sys-color-on-surface)]">{label}</span>
        <span className="tabular-nums text-[var(--md-sys-color-on-surface-variant)]">{score}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--md-sys-color-surface-container-high)]">
        <div
          className="h-full rounded-full bg-[var(--md-sys-color-primary)]"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

function ToolCta({ mode }: { mode: LinkedInProfileToolMode }) {
  const tool = ALL_TOOLS.find((item) =>
    mode === "rating"
      ? item.slug === "linkedin-profile-rating"
      : item.slug === "improve-linkedin-profile",
  );
  if (!tool) return null;
  return (
    <div className="mt-8 rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] px-6 py-7 text-center">
      <p className="text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
        {tool.ctaTitle}
      </p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
        {tool.ctaBody}
      </p>
      <Link
        href="/signup"
        className="m3-btn m3-btn-filled-secondary mt-5 inline-flex h-11 cursor-pointer px-6 text-sm"
      >
        Create a free account
      </Link>
    </div>
  );
}

function RatingResult({ rating }: { rating: LinkedInProfileRatingResult }) {
  return (
    <section className="mt-10" aria-live="polite">
      <div className="flex flex-col gap-6 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full border-2 border-[var(--md-sys-color-outline)]">
          <div className="text-center">
            <div className="text-4xl font-semibold tabular-nums leading-none tracking-tight">
              {rating.overall}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)]">
              / 100
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
            {rating.verdict || profileScoreLabel(rating.overall)}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
            {rating.summary}
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {SCORE_ROWS.map((row) => (
          <ScoreBar key={row.key} label={row.label} score={rating.scores[row.key]} />
        ))}
      </div>

      {rating.strengths.length > 0 ? (
        <div className="mt-8">
          <h3
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-xl font-semibold tracking-tight"
          >
            What is working
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
            {rating.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {rating.gaps.length > 0 ? (
        <div className="mt-8">
          <h3
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-xl font-semibold tracking-tight"
          >
            What to fix
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
            {rating.gaps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {rating.nextFixes.length > 0 ? (
        <div className="mt-8">
          <h3
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-xl font-semibold tracking-tight"
          >
            Do these next
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
            {rating.nextFixes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      ) : null}

      <p className="mt-8 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
        Want rewrite drafts for the same URL?{" "}
        <Link href="/tools/improve-linkedin-profile" className="font-medium underline underline-offset-4">
          Improve this LinkedIn profile
        </Link>
        .
      </p>
      <ToolCta mode="rating" />
    </section>
  );
}

function ImproveResult({ improve }: { improve: LinkedInProfileImproveResult }) {
  return (
    <section className="mt-10 space-y-8" aria-live="polite">
      {improve.headline ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-xl font-semibold tracking-tight"
            >
              Suggested headline
            </h3>
            <CopyButton text={improve.headline} label="headline" />
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--md-sys-color-on-surface)]">
            {improve.headline}
          </p>
        </div>
      ) : null}

      {improve.about ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-xl font-semibold tracking-tight"
            >
              Suggested About
            </h3>
            <CopyButton text={improve.about} label="About" />
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--md-sys-color-on-surface)]">
            {improve.about}
          </p>
        </div>
      ) : null}

      {improve.experience ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-xl font-semibold tracking-tight"
            >
              Suggested experience
            </h3>
            <CopyButton text={improve.experience} label="experience" />
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--md-sys-color-on-surface)]">
            {improve.experience}
          </p>
        </div>
      ) : null}

      {improve.skills ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-xl font-semibold tracking-tight"
            >
              Suggested skills line
            </h3>
            <CopyButton text={improve.skills} label="skills" />
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--md-sys-color-on-surface)]">
            {improve.skills}
          </p>
        </div>
      ) : null}

      {improve.changes.length > 0 ? (
        <div>
          <h3
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-xl font-semibold tracking-tight"
          >
            What changed
          </h3>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
            {improve.changes.map((change) => (
              <li key={`${change.area}-${change.why}`}>
                <span className="font-medium text-[var(--md-sys-color-on-surface)]">{change.area}.</span>{" "}
                {change.why}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
        Want a score for the same URL first?{" "}
        <Link href="/tools/linkedin-profile-rating" className="font-medium underline underline-offset-4">
          Rate this LinkedIn profile
        </Link>
        .
      </p>
      <ToolCta mode="improve" />
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
      <AiLoadingOverlay
        open={busy}
        title={pendingLabel}
        note="Usually takes 10 to 20 seconds."
      />
      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-4 md:p-6"
      >
        <label className="block">
          <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
            LinkedIn profile URL
          </span>
          <input
            value={profileUrl}
            onChange={(event) => writeUrl(event.target.value)}
            maxLength={LINKEDIN_PROFILE_FIELD_LIMITS.profileUrl}
            placeholder="https://www.linkedin.com/in/your-name"
            autoComplete="off"
            inputMode="url"
            className={FIELD_CLASS}
          />
        </label>
        {error ? (
          <p className="mt-4 text-sm leading-6 text-[var(--md-sys-color-on-surface)]" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="m3-btn m3-btn-filled mt-5 h-11 w-full cursor-pointer px-6 text-sm disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        >
          {busy ? pendingLabel : submitLabel}
        </button>
      </form>

      {rating ? <RatingResult rating={rating} /> : null}
      {improve ? <ImproveResult improve={improve} /> : null}
    </div>
  );
}
