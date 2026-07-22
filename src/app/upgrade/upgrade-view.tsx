import Link from "next/link";
import OnboardingHeader from "../onboarding-header";
import PricingCards from "../pricing-cards";

// Plan page for already-subscribed users. Unsubscribed users never see this:
// /upgrade sends them to the onboarding paywall step instead.
export default function UpgradeView({ currentPlan }: { currentPlan?: "solo" | "startup" }) {
  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--md-sys-color-surface)] px-4 pb-10 pt-14 text-[var(--md-sys-color-on-surface)] sm:px-5">
      <OnboardingHeader />

      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Upgrade your plan
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600">
            Pick the plan that fits your sender setup. Your workspace, agents, and
            leads stay exactly as they are.
          </p>
        </div>

        <div className="w-full text-left">
          <PricingCards
            currentPlan={currentPlan}
            className="mx-auto mt-10 w-full max-w-7xl pb-12 sm:pb-[3.75rem]"
          />
        </div>

        <Link
          href="/dashboard"
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-sm font-semibold text-zinc-700 underline underline-offset-2 hover:text-zinc-950"
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
