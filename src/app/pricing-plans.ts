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
  cta: string;
  href: string;
  featured: boolean;
  includes?: string;
  features: string[];
};

// The public Pro plan renders its enforceable product limits from
// commercialPlanLimits("solo"). User allowances are part of the public plan
// packaging and are listed explicitly below.
const proLimitFeatures = limitFeatureLines("solo").filter(
  (feature) => feature !== "1 LinkedIn account",
);

const planFeatures = [
  "1 user",
  "1 LinkedIn account",
  ...proLimitFeatures,
  "AI automated campaigns",
  "API access",
  "Email customer support",
];

const enterpriseFeatures = [
  "Unlimited users",
  "Unlimited LinkedIn accounts",
  ...limitFeatureLines("enterprise").filter(
    (feature) => feature !== "Unlimited LinkedIn accounts",
  ),
  "AI automated campaigns",
  "API access",
  "Email customer support",
  "Single sign-on (SSO)",
  "Dedicated onboarding",
  "Priority support",
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Pro",
    price: "$49/month",
    cadence: "",
    cta: "Start Now",
    href: "/checkout?plan=solo",
    featured: true,
    includes: "Everything you need, guaranteed",
    features: planFeatures,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    cta: "Book a call",
    href: "/demo",
    featured: false,
    includes: "Everything in Pro, for your whole team",
    features: enterpriseFeatures,
  },
];
