import Link from "next/link";
import AuthShell from "../auth-shell";
import PricingCards from "../pricing-cards";

// Plan page for subscribed users changing plans, and for onboarded users whose
// subscription is missing or expired. People still in onboarding never reach
// this view: /upgrade sends them to the paywall step.
export default function UpgradeView({
  currentPlan,
  subscribeCta,
}: {
  currentPlan?: "solo" | "lifetime" | "enterprise";
  subscribeCta?: string;
}) {
  return (
    <AuthShell wide>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-medium tracking-tight text-white">
          {currentPlan ? "Upgrade your plan" : "Choose a plan"}
        </h1>
        <p className="auth-muted mt-1.5 text-[15px] leading-6">
          Pick the plan that fits your sender setup. Your workspace, agents, and
          leads stay exactly as they are.
        </p>
      </div>

      <div className="w-full text-left">
        <PricingCards
          currentPlan={currentPlan}
          subscribeCta={subscribeCta}
          className="mx-auto mt-10 w-full pb-12 sm:pb-[3.75rem]"
        />
      </div>

      <Link href="/overview" className="auth-link mx-auto mt-2 text-sm">
        Back to overview
      </Link>
    </AuthShell>
  );
}
