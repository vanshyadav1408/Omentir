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

// Retired cards, kept for a future re-tiering rather than deleted.
//
// The $59 Startup tier: its feature set moved down to the $29 Monthly plan, so
// there is nothing left to sell above it. Existing subscribers keep the plan.
//
// {
//   name: "For Startups",
//   price: "$59/month",
//   cadence: "",
//   description:
//     "For founders and operators who want unlimited agents, leads, and campaigns on one LinkedIn account.",
//   cta: "Start Now",
//   href: "/checkout?plan=startup",
//   featured: false,
//   includes: "Includes everything in Basic plan and",
//   features: [
//     linkedInAccountFeatureLine("startup"),
//     ...limitUpgradeFeatureLines("startup", "solo"),
//     "API access",
//   ],
// },
//
// The Enterprise card, hidden until there is a team offer to sell again:
//
// {
//   name: "For Enterprises",
//   price: "Custom",
//   cadence: "",
//   description:
//     "For teams that need onboarding, custom workflows, higher limits, and multiple sender accounts.",
//   cta: "Book a Demo",
//   href: "https://calendly.com/vanshyadav-1408/30min",
//   featured: false,
//   includes: "Includes everything in Startups plan and",
//   features: [
//     ...limitUpgradeFeatureLines("enterprise", "startup"),
//     "Managed campaigns",
//     "SSO auth",
//   ],
// },
