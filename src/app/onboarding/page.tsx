import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { getLinkedInAccount, getProductProfile, getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { isLocalMode } from "@/lib/runtime-mode";
import OnboardingHeader from "../onboarding-header";
import { createPageMetadata } from "../seo";
import WebsiteFetchPanel from "../website-fetch-panel";
import OnboardingProgress from "./onboarding-progress";
import StepConnect from "./step-connect";
import StepLinkedInConnected from "./step-linkedin-connected";
import StepLeadPreview from "./step-lead-preview";
import StepQuestions from "./step-questions";
import StepSubscriptionConfirmed from "./step-subscription-confirmed";
import StepUpgrade from "./step-upgrade";

export const metadata = createPageMetadata({
  title: "Onboarding - Omentir",
  description: "Set up your Omentir workspace: analyze your product, confirm your plan, and connect LinkedIn.",
  path: "/onboarding",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{
    website?: string | string[];
    error?: string;
    status?: string;
    step?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const website = Array.isArray(params.website) ? params.website[0] : params.website;
  const hasError = Boolean(params.error);
  const status = typeof params.status === "string" ? params.status : undefined;
  const requestedStep = Number(Array.isArray(params.step) ? params.step[0] : params.step);
  const selfHosted = isLocalMode();
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  // Step is derived purely from real workspace state, so steps can't be
  // skipped. The only URL-driven transition is forward-only: the lead preview
  // (step 2) and the questions (step 3) share the same workspace state, and
  // the preview's Personalise button advances via ?step=3. There is no way to
  // navigate back to an earlier step.
  let step = 1;
  const workspace = await getWorkspace(userId);
  const [profile, linkedInAccount] = await Promise.all([
    getProductProfile(workspace.id),
    getLinkedInAccount(workspace.id),
  ]);
  const billingStatus = workspace.billing?.status;

  const hasProfile = Boolean(profile?.description?.trim());
  const onboardingDone = Boolean(workspace.onboarding);
  const subActive = hasActiveSubscription(workspace);

  if (!hasProfile) step = 1;
  else if (!onboardingDone) step = !selfHosted && requestedStep === 3 ? 3 : 2;
  else if (!subActive) step = 4;
  else if (!linkedInAccount) step = 5;
  else step = 6;

  // Step 2 finds example leads from the saved product profile (written by the
  // website analysis in step 1), so the preview survives reloads and never
  // depends on client-side state.
  const leadPreviewInput = profile
    ? {
        websiteUrl: profile.websiteUrl || "",
        productOverview: profile.description || "",
        targetBuyers: profile.targetBuyers || [],
        buyerTitles: profile.buyerTitles || [],
        industries: profile.industries || [],
        companySizes: profile.companySizes || [],
        painPoints: profile.painPoints || [],
        keywords: profile.keywords || [],
      }
    : null;

  // Confirmation views are reached via the kept slugs that redirect here:
  // /subscription-creation-successful and /connect/success. They render inside
  // the onboarding chrome instead of as standalone pages.
  const showSubscriptionConfirmed = status === "subscription-confirmed" && !subActive;
  const showLinkedInConnected = status === "linkedin-connected";

  // Fully onboarded and not showing the final connected confirmation -> dashboard.
  if (step === 6 && !showLinkedInConnected) {
    redirect("/dashboard");
  }

  const wide = step === 2 || step === 4;
  const progressStep = showSubscriptionConfirmed ? 4 : showLinkedInConnected ? 6 : step;
  // Keyed so the entry animation replays whenever the visible step changes,
  // making the server-recomputed step swap feel like a transition.
  const contentKey = showSubscriptionConfirmed
    ? "subscription-confirmed"
    : showLinkedInConnected
      ? "linkedin-connected"
      : `step-${step}`;

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--md-sys-color-surface)] px-4 pb-10 pt-14 text-[var(--md-sys-color-on-surface)] sm:px-5">
      <OnboardingHeader />

      {/* Break out of main's padding and reuse the header's exact container
          (max-w-7xl + same px) so the progress bar lines up with the logo. */}
      <div className="-mx-4 sm:-mx-5">
        <div className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-8 sm:pt-7">
          <OnboardingProgress current={progressStep} selfHosted={selfHosted} />
        </div>
      </div>

      <section
        className={`mx-auto flex w-full flex-1 flex-col items-center justify-center py-10 ${
          wide ? "max-w-7xl" : "max-w-xl"
        }`}
      >
        <div key={contentKey} className="onboarding-step-enter flex w-full flex-col items-center text-center">
          {showSubscriptionConfirmed ? (
            <StepSubscriptionConfirmed />
          ) : showLinkedInConnected ? (
            <StepLinkedInConnected />
          ) : (
            <>
              {step === 1 ? (
                <>
                  <h1
                    style={{ fontFamily: "var(--font-varta)" }}
                    className="text-4xl font-semibold tracking-tight sm:text-5xl"
                  >
                    Fetch your website
                  </h1>
                  <p className="mx-auto mt-4 max-w-md text-base leading-7 text-zinc-600">
                    Omentir will read your public pages, summarize the product, and
                    prepare the buyer profile before proceeding.
                  </p>
                  <div className="mx-auto mt-8 w-full max-w-md text-left">
                    <WebsiteFetchPanel website={website} isSignedIn />
                  </div>
                </>
              ) : null}

              {step === 2 && leadPreviewInput ? (
                <StepLeadPreview input={leadPreviewInput} selfHosted={selfHosted} />
              ) : null}
              {step === 3 ? <StepQuestions /> : null}
              {step === 4 ? <StepUpgrade status={billingStatus} /> : null}
              {step === 5 ? (
                <StepConnect
                  linkedInAccount={linkedInAccount}
                  hasError={hasError}
                />
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
