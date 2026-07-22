"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AiLoadingOverlay from "./ai-loading-overlay";
import { continueWithProductProfileAction } from "./actions";
import { TextAreaField, TextField } from "./ui/text-field";

type WebsiteAnalysis = {
  websiteUrl: string;
  productOverview: string;
  targetBuyers: string[];
  buyerTitles: string[];
  industries: string[];
  companySizes: string[];
  painPoints: string[];
  keywords: string[];
};

type FetchState =
  | { status: "idle" }
  | { status: "fetching" }
  | { status: "writing"; data: WebsiteAnalysis }
  | { status: "ready"; data: WebsiteAnalysis }
  | { status: "manual" }
  | { status: "error"; message: string };

type ProductDraft = {
  productOverview: string;
};

function normalizeWebsite(website: string) {
  return website.trim();
}

export default function WebsiteFetchPanel({
  website,
  isSignedIn,
}: {
  website?: string;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState(() => website?.trim() || "");
  const [state, setState] = useState<FetchState>({ status: "idle" });
  const [productDraft, setProductDraft] = useState<ProductDraft>({
    productOverview: "",
  });
  const overviewRef = useRef<HTMLTextAreaElement>(null);
  const writingData = state.status === "writing" ? state.data : null;
  const isWorking = state.status === "fetching" || state.status === "writing";

  useEffect(() => {
    const el = overviewRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 120)}px`;
  }, [productDraft.productOverview, state.status]);

  useEffect(() => {
    if (!writingData) return;

    const timeout = window.setTimeout(() => {
      setProductDraft({
        productOverview: writingData.productOverview,
      });
      setState({ status: "ready", data: writingData });
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [writingData]);

  async function handleFetch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const normalized = normalizeWebsite(websiteUrl);
    if (!normalized) {
      setState({ status: "error", message: "Enter a website URL to continue." });
      return;
    }

    setProductDraft({ productOverview: "" });
    setState({ status: "fetching" });

    try {
      const response = await fetch("/api/website-analysis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ websiteUrl: normalized }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not fetch this website.");
      }

      setState({
        status: "writing",
        data: {
          websiteUrl: normalized,
          productOverview: String(payload.productOverview || ""),
          targetBuyers: Array.isArray(payload.targetBuyers) ? payload.targetBuyers : [],
          buyerTitles: Array.isArray(payload.buyerTitles) ? payload.buyerTitles : [],
          industries: Array.isArray(payload.industries) ? payload.industries : [],
          companySizes: Array.isArray(payload.companySizes) ? payload.companySizes : [],
          painPoints: Array.isArray(payload.painPoints) ? payload.painPoints : [],
          keywords: Array.isArray(payload.keywords) ? payload.keywords : [],
        },
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not fetch this website.",
      });
    }
  }

  function handleManual() {
    setProductDraft({ productOverview: "" });
    setState({ status: "manual" });
  }

  function handleSignedOutContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(continueHref);
  }

  const readyData = state.status === "ready" ? state.data : null;
  const showForm = state.status === "ready" || state.status === "manual";
  const formWebsiteUrl = readyData?.websiteUrl || websiteUrl;

  const continueHref =
    showForm && !isSignedIn
      ? `/signup?website=${encodeURIComponent(formWebsiteUrl)}&from=fetching`
      : "/upgrade";

  useEffect(() => {
    if (!showForm) return;
    router.prefetch(continueHref);
  }, [continueHref, router, showForm]);

  return (
    <div className="w-full">
      <AiLoadingOverlay
        open={isWorking}
        title="Fetching your product information with AI"
        note="Usually takes 20 seconds"
        transparent={false}
      />
      <form
        onSubmit={(event) => void handleFetch(event)}
        className="mx-auto flex w-full items-end justify-center gap-2"
        style={{ width: "calc(100% - 16px)" }}
      >
        <div className="min-w-0 flex-1">
          <TextField
            name="websiteUrl"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            label="Website link"
            placeholder="https://yourcompany.com"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            required
            variant="outlined"
          />
        </div>
        <button
          type="submit"
          disabled={isWorking || !websiteUrl.trim()}
          className="m3-btn m3-btn-filled inline-flex h-14 shrink-0 cursor-pointer items-center justify-center gap-1 px-5 text-sm font-medium leading-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === "fetching" ? (
            "fetching..."
          ) : state.status === "writing" ? (
            "writing..."
          ) : (
            <span className="inline-flex items-center justify-center gap-1">
              <span>Fetch</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[13px] w-[13px]"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          )}
        </button>
      </form>

      {showForm ? (
        <section className="mt-8 w-full text-left">
          <h2 className="text-xl font-semibold tracking-tight">Product Overview</h2>

          <form
            {...(isSignedIn
              ? { action: continueWithProductProfileAction }
              : { onSubmit: handleSignedOutContinue })}
            className="mt-3 flex flex-col gap-3"
          >
            <input type="hidden" name="websiteUrl" value={formWebsiteUrl} />

            <TextAreaField
              ref={overviewRef}
              name="description"
              label="Product Overview"
              value={productDraft.productOverview}
              onChange={(event) =>
                setProductDraft((current) => ({
                  ...current,
                  productOverview: event.target.value,
                }))
              }
              rows={3}
              placeholder={
                state.status === "manual"
                  ? "Describe your product in a few sentences."
                  : undefined
              }
              required={state.status === "manual"}
            />

            <button
              type="submit"
              className={`inline-flex h-10 cursor-pointer items-center rounded-md bg-[#ba3871] px-5 pt-[3px] text-sm font-semibold text-white transition hover:brightness-[0.98] ${
                isSignedIn ? "self-end" : "self-start"
              }`}
            >
              {isSignedIn ? "Find leads" : "Continue"}
            </button>
          </form>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="mt-5 w-full rounded-xl border border-[#ba3871] bg-white p-5 shadow-[0_18px_70px_rgba(15,23,42,0.06)]">
          <p className="text-sm leading-7 text-red-600">{state.message}</p>
          <button
            type="button"
            onClick={handleManual}
            className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#ba3871] px-4 text-sm font-semibold leading-none text-white transition hover:brightness-[0.98]"
          >
            <span className="translate-y-[1.5px]">Type manually</span>
            <span
              aria-hidden="true"
              className="material-symbols-outlined"
              style={{ fontSize: "18px", lineHeight: 1 }}
            >
              chat_paste_go
            </span>
          </button>
        </section>
      ) : null}
    </div>
  );
}
