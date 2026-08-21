"use client";

import Link from "next/link";
import { pricingPlans as plans, type PricingPlan } from "@/app/pricing-plans";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="h-6 w-3.5 shrink-0 text-[var(--md-sys-color-on-surface)]"
    >
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlanPrice({ price, cadence }: { price: string; cadence: string }) {
  const monthly = price.match(/^(\$\d+)(\/month)$/);
  if (monthly) {
    return (
      <div className="mt-3 flex items-baseline gap-0.5">
        <span className="text-4xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-5xl">
          {monthly[1]}
        </span>
        <span className="text-base font-medium text-[var(--md-sys-color-on-surface-variant)] md:text-lg">
          {monthly[2]}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-baseline gap-1">
      <span className="text-4xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-5xl">
        {price}
      </span>
      {cadence ? (
        <span className="text-base font-medium text-[var(--md-sys-color-on-surface-variant)]">
          {cadence}
        </span>
      ) : null}
    </div>
  );
}

type CurrentPlan = "solo" | "lifetime" | "enterprise";
type PlanKey = "solo" | "enterprise";

function planKeyFromHref(href: string): PlanKey {
  return href.includes("plan=solo") ? "solo" : "enterprise";
}

function PricingCard({
  plan,
  currentPlan,
  subscribeCta,
}: {
  plan: PricingPlan;
  currentPlan?: CurrentPlan;
  subscribeCta?: string;
}) {
  const planKey = planKeyFromHref(plan.href);
  const cta = planKey === "solo" && subscribeCta ? subscribeCta : plan.cta;
  const isCurrent = currentPlan === planKey;
  // Legacy lifetime members remain covered by the Pro feature set, so the
  // card must never offer them a redundant monthly subscription.
  const isCoveredByLegacyPlan = currentPlan === "lifetime" && planKey === "solo";
  const ctaClass = `m3-btn h-11 w-full cursor-pointer text-sm ${
    plan.featured ? "m3-btn-filled" : "m3-btn-outlined"
  }`;

  return (
    <article className="flex h-full w-full flex-col rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-5 text-left text-[var(--md-sys-color-on-surface)] md:p-7">
      <h2 className="text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-xl">
        {plan.name}
      </h2>

      <PlanPrice price={plan.price} cadence={plan.cadence} />

      {planKey === "solo" ? (
        <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
          Get 3 bookings weekly or receive a full refund.
        </p>
      ) : (
        <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
          Get managed campaigns with bookings guarantees.
        </p>
      )}

      {plan.includes ? (
        <p className="mb-4 mt-8 text-sm font-medium text-[var(--md-sys-color-on-surface)]">
          {plan.includes}
        </p>
      ) : (
        <div className="mt-8" />
      )}

      <ul className="space-y-3">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]"
          >
            <CheckIcon />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        {isCurrent || isCoveredByLegacyPlan ? (
          <span className="m3-btn m3-btn-outlined h-11 w-full cursor-default border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-high)] text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Your current plan
          </span>
        ) : plan.href.startsWith("http") ? (
          <a href={plan.href} target="_blank" rel="noopener noreferrer" className={ctaClass}>
            {cta}
          </a>
        ) : (
          <Link href={plan.href} className={ctaClass}>
            {cta}
          </Link>
        )}
      </div>
    </article>
  );
}

export default function PricingCards({
  className = "",
  currentPlan,
  subscribeCta,
}: {
  className?: string;
  currentPlan?: CurrentPlan;
  subscribeCta?: string;
}) {
  return (
    <div className={className}>
      <div className="grid w-full grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5">
        {plans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} currentPlan={currentPlan} subscribeCta={subscribeCta} />
        ))}
      </div>
    </div>
  );
}
