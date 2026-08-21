import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { getProductProfile, getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { isLocalMode } from "@/lib/runtime-mode";
import AuthShell from "../auth-shell";
import { AuthHeading } from "../auth-ui";
import { createPageMetadata } from "../seo";
import WebsiteFetchPanel from "../website-fetch-panel";
import OnboardingProgress from "./onboarding-progress";
import StepLeadPreview from "./step-lead-preview";
import StepQuestions from "./step-questions";
import StepSubscriptionConfirmed from "./step-subscription-confirmed";
import StepUpgrade from "./step-upgrade";

export const metadata = createPageMetadata({
  title: "Onboarding - Omentir",
  description: "Set up your Omentir workspace: fetch your site, preview buyers, and pick a plan.",
  path: "/onboarding",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{
    website?: string | string[];
    status?: string;
    step?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const website = Array.isArray(params.website) ? params.website[0] : params.website;
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
  const profile = await getProductProfile(workspace.id);
  const billingStatus = workspace.billing?.status;

  const hasProfile = Boolean(profile?.description?.trim());
  const onboardingDone = Boolean(workspace.onboarding);
  const subActive = hasActiveSubscription(workspace);

  if (!hasProfile) step = 1;
  else if (!onboardingDone) step = !selfHosted && requestedStep === 3 ? 3 : 2;
  else if (!subActive) step = 4;
  else redirect("/overview");

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

  // Confirmation view is reached via the kept slug that redirects here:
  // /subscription-creation-successful. It renders inside the onboarding chrome
  // instead of as a standalone page.
  const showSubscriptionConfirmed = status === "subscription-confirmed" && !subActive;
  const progressStep = showSubscriptionConfirmed ? 4 : step;
  // Keyed so the entry animation replays whenever the visible step changes,
  // making the server-recomputed step swap feel like a transition.
  const contentKey = showSubscriptionConfirmed
    ? "subscription-confirmed"
    : `step-${step}`;

  return (
    <AuthShell
      top={<OnboardingProgress current={progressStep} selfHosted={selfHosted} />}
    >
      <div key={contentKey} className="onboarding-step-enter w-full">
        {showSubscriptionConfirmed ? (
          <div className="mx-auto w-full max-w-[360px]">
            <StepSubscriptionConfirmed />
          </div>
        ) : (
          <>
            {step === 1 ? (
              <div className="mx-auto w-full max-w-[360px]">
                <AuthHeading
                  title="Fetch your website"
                  subtitle="Omentir will read your public pages, summarize the product, and prepare the buyer profile before proceeding."
                />
                <WebsiteFetchPanel website={website} isSignedIn />
              </div>
            ) : null}

            {step === 2 && leadPreviewInput ? (
              <StepLeadPreview input={leadPreviewInput} selfHosted={selfHosted} />
            ) : null}
            {step === 3 ? <StepQuestions /> : null}
            {step === 4 ? <StepUpgrade status={billingStatus} /> : null}
          </>
        )}
      </div>
    </AuthShell>
  );
}
