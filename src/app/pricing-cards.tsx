"use client";

import Link from "next/link";
import { useState } from "react";
import { pricingPlans as plans, type PricingPlan } from "@/app/pricing-plans";

function CheckIcon() {
  return (
    <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--md-sys-color-primary)_14%,transparent)] text-[var(--md-sys-color-primary)]">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-2.5 w-2.5">
        <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

// Maps a card to the checkout plan key in its href so /upgrade can mark the
// viewer's current plan without duplicating plan data.
function planKeyFromHref(href: string) {
  if (href.includes("plan=solo")) return "solo";
  if (href.includes("plan=lifetime")) return "lifetime";
  return null;
}

type PurchasablePlan = "solo" | "lifetime";

function PricingCard({
  plan,
  currentPlan,
}: {
  plan: PricingPlan;
  currentPlan?: "solo" | "lifetime";
}) {
  const planKey = planKeyFromHref(plan.href);
  const isCurrent = Boolean(currentPlan) && planKey === currentPlan;
  // A lifetime owner already has the monthly feature set outright, so the
  // monthly card must never offer them a second, redundant subscription.
  const isCoveredByLifetime = currentPlan === "lifetime" && planKey === "solo";
  const cta = currentPlan === "solo" && planKey === "lifetime" ? "Switch to Lifetime" : plan.cta;
  const ctaClass = `m3-btn w-full h-11 cursor-pointer text-sm ${
    plan.featured
      ? "m3-btn-filled-secondary"
      : "m3-btn-filled"
  }`;

  return (
    <article
      className={`h-auto w-full rounded-2xl p-0.5 ${
        plan.featured
          ? "bg-[#ba3871] m3-elevation-3"
          : "bg-black m3-elevation-2"
      }`}
    >
      <div className="flex h-full flex-col rounded-[15px] bg-[var(--md-sys-color-surface-container)] p-4 text-left text-[var(--md-sys-color-on-surface)] md:p-7 lg:p-8">
        <h2 className="text-left text-xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-2xl">
          {plan.name}
        </h2>
        <p className="mt-2 min-h-0 text-left text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)] md:min-h-[6rem]">
          {plan.description}
        </p>

        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-[1.75rem] font-bold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-3xl">
            {plan.price}
          </span>
          {plan.cadence ? (
            <span className="text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]">
              {plan.cadence}
            </span>
          ) : null}
        </div>
        {plan.guarantee ? (
          <p className="mt-2 text-sm font-medium text-orange-500">{plan.guarantee}</p>
        ) : null}

        <div className="my-6 h-px w-full bg-[var(--md-sys-color-outline-variant)]" />

        {plan.includes ? (
          <p className="mb-4 text-sm font-medium text-[var(--md-sys-color-on-surface)]">
            {plan.includes}
          </p>
        ) : null}

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
          {isCurrent || isCoveredByLifetime ? (
            <span className="m3-btn m3-btn-outlined h-11 w-full cursor-default border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-high)] text-sm text-[var(--md-sys-color-on-surface-variant)]">
              {isCurrent ? "Your current plan" : "Included in Lifetime"}
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
      </div>
    </article>
  );
}

export default function PricingCards({
  className = "",
  currentPlan,
}: {
  className?: string;
  currentPlan?: PurchasablePlan;
}) {
  const [selectedPlan, setSelectedPlan] = useState<PurchasablePlan>("solo");
  const mobilePlan = plans.find((plan) => planKeyFromHref(plan.href) === selectedPlan) ?? plans[0];

  return (
    <div className={className}>
      <div className="lg:hidden">
        <label htmlFor="mobile-pricing-plan" className="sr-only">
          Choose a billing option
        </label>
        <div className="relative mb-4">
          <select
            id="mobile-pricing-plan"
            value={selectedPlan}
            onChange={(event) => setSelectedPlan(event.target.value as PurchasablePlan)}
            className="h-11 w-full cursor-pointer appearance-none rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] pl-3 pr-10 text-sm font-semibold text-[var(--md-sys-color-on-surface)] outline-none transition-colors focus:border-[var(--md-sys-color-primary)]"
          >
            {plans.map((plan) => {
              const planKey = planKeyFromHref(plan.href);
              if (!planKey) return null;

              return (
                <option key={planKey} value={planKey}>
                  {plan.name} · {plan.price}{plan.cadence ? ` ${plan.cadence}` : ""}
                </option>
              );
            })}
          </select>
          <span
            className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] leading-none text-[var(--md-sys-color-on-surface-variant)]"
            aria-hidden="true"
          >
            expand_more
          </span>
        </div>
        <PricingCard plan={mobilePlan} currentPlan={currentPlan} />
      </div>

      <div className="hidden w-full items-stretch gap-4 lg:grid lg:grid-cols-2 lg:gap-6 xl:gap-8">
        {plans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} currentPlan={currentPlan} />
        ))}
      </div>
    </div>
  );
}
