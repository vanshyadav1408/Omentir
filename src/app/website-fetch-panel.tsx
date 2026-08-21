"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import AiLoadingOverlay from "./ai-loading-overlay";
import { continueWithProductProfileAction } from "./actions";
import { AuthField, AuthTextArea } from "./auth-ui";

type WebsiteAnalysis = {
  websiteUrl: string;
  productOverview: string;
  pricingDetails: string;
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

// Saving the profile and landing on step 2 is a server round trip, so the press
// has to be acknowledged immediately or the button reads as dead. useFormStatus
// only reports the form it is rendered inside, hence the separate component;
// the signed-out branch navigates client-side and passes its own pending flag.
function ContinueButton({
  label,
  pendingLabel,
  isPending = false,
  className,
}: {
  label: string;
  pendingLabel: string;
  isPending?: boolean;
  className: string;
}) {
  const { pending } = useFormStatus();
  const busy = pending || isPending;

  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy}
      className={`${className} disabled:cursor-wait disabled:opacity-70`}
    >
      {busy ? pendingLabel : label}
    </button>
  );
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
  const [isNavigating, startNavigating] = useTransition();
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
          pricingDetails: String(payload.pricingDetails || ""),
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
    startNavigating(() => router.push(continueHref));
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
        note="Usually takes 10 seconds"
        transparent={false}
      />
      <form
        onSubmit={(event) => void handleFetch(event)}
        className="flex w-full items-end gap-2"
      >
        <div className="min-w-0 flex-1">
          <AuthField
            name="websiteUrl"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            label="Website"
            placeholder="https://yourcompany.com"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.currentTarget.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isWorking || !websiteUrl.trim()}
          className="auth-btn auth-btn-fit shrink-0"
        >
          {state.status === "fetching"
            ? "Fetching..."
            : state.status === "writing"
              ? "Writing..."
              : "Fetch"}
        </button>
      </form>

      {showForm ? (
        <section className="mt-8 w-full">
          <form
            {...(isSignedIn
              ? { action: continueWithProductProfileAction }
              : { onSubmit: handleSignedOutContinue })}
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="websiteUrl" value={formWebsiteUrl} />
            {readyData ? (
              <input type="hidden" name="pricingDetails" value={readyData.pricingDetails} />
            ) : null}

            <AuthTextArea
              ref={overviewRef}
              name="description"
              label="Product overview"
              value={productDraft.productOverview}
              onChange={(event) =>
                setProductDraft((current) => ({
                  ...current,
                  productOverview: event.currentTarget.value,
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

            <ContinueButton
              label={isSignedIn ? "Find leads" : "Continue"}
              pendingLabel={isSignedIn ? "Finding leads..." : "Continuing..."}
              isPending={isNavigating}
              className="auth-btn"
            />
          </form>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="mt-5 w-full">
          <p className="auth-error text-sm leading-6">{state.message}</p>
          <button
            type="button"
            onClick={handleManual}
            className="auth-btn mt-4"
          >
            Type manually
          </button>
        </section>
      ) : null}
    </div>
  );
}
