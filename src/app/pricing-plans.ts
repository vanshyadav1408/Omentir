// Single source of truth for plan cards. Rendered on the public pricing page
// (pricing-cards.tsx) and the onboarding paywall (onboarding/step-upgrade.tsx),
// so prices, limits, and checkout links can never drift between the two.
//
// Limit rows (accounts, agents, leads, campaigns) are derived from
// commercialPlanLimits in plan-limits.ts so marketing and enforcement stay aligned.
import { limitFeatureLines } from "@/lib/plan-limits";

export type PricingPlan = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  cta: string;
  href: string;
  featured: boolean;
  guarantee?: string;
  includes?: string;
  features: string[];
};

// Monthly and Lifetime are the same product on different billing terms, so both
// cards render the identical limit set from commercialPlanLimits("solo").
const planFeatures = [
  ...limitFeatureLines("solo"),
  "AI automated campaigns",
  "API access",
  "Email customer support",
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Monthly",
    price: "$29/month",
    cadence: "",
    description:
      "Everything Omentir does, billed month to month. Cancel whenever you want.",
    cta: "Start Now",
    href: "/checkout?plan=solo",
    featured: true,
    includes: "What's included",
    features: planFeatures,
  },
  {
    name: "Lifetime",
    price: "$99",
    cadence: "one-time",
    description:
      "The same plan, paid once and kept forever. Pays for itself in under four months.",
    cta: "Get Lifetime Access",
    href: "/checkout?plan=lifetime",
    featured: false,
    guarantee: "One payment. No renewals, ever.",
    includes: "Everything in Monthly, forever",
    features: planFeatures,
  },
];
