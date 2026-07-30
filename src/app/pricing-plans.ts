// Single source of truth for plan cards. Rendered on the public pricing page
// (pricing-cards.tsx) and the onboarding paywall (onboarding/step-upgrade.tsx),
// so prices, limits, and checkout links can never drift between the two.
//
// Limit rows (accounts, agents, leads, campaigns) are derived from
// commercialPlanLimits in plan-limits.ts so marketing and enforcement stay aligned.
import {
  limitFeatureLines,
  limitUpgradeFeatureLines,
  linkedInAccountFeatureLine,
} from "@/lib/plan-limits";

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

// Basic: full list for the entry tier (from commercialPlanLimits("solo")).
const basicLimitFeatures = limitFeatureLines("solo");
// Startup: limit upgrades over Basic, plus the LinkedIn-account row restated.
// The upgrade helper drops that row because Startup and Basic both allow one,
// but the card lists it deliberately so the included account reads as a benefit
// rather than being invisible on the tier.
const startupLimitUpgrades = limitUpgradeFeatureLines("startup", "solo");
// Enterprise: only limit upgrades over Startup (multi-account, etc.).
const enterpriseLimitUpgrades = limitUpgradeFeatureLines("enterprise", "startup");

export const pricingPlans: PricingPlan[] = [
  {
    name: "Basic",
    price: "$29/month",
    cadence: "",
    description:
      "For solo founders validating outbound with one agent, one campaign, and a focused daily lead flow.",
    cta: "Start Now",
    href: "/checkout?plan=solo",
    featured: true,
    includes: "What's included",
    features: [
      ...basicLimitFeatures,
      "AI automated campaigns",
      "Email customer support",
    ],
  },
  {
    name: "For Startups",
    price: "$59/month",
    cadence: "",
    description:
      "For founders and operators who want unlimited agents, leads, and campaigns on one LinkedIn account.",
    cta: "Start Now",
    href: "/checkout?plan=startup",
    featured: false,
    includes: "Includes everything in Basic plan and",
    // LinkedIn account first (same order as Basic / Enterprise). Upgrade rows
    // follow; API is Startup+ only (planHasApiAccess). Basic never lists it.
    features: [
      linkedInAccountFeatureLine("startup"),
      ...startupLimitUpgrades,
      "API access",
    ],
  },
  {
    name: "For Enterprises",
    price: "Custom",
    cadence: "",
    description:
      "For teams that need onboarding, custom workflows, higher limits, and multiple sender accounts.",
    cta: "Book a Demo",
    href: "https://calendly.com/vanshyadav-1408/30min",
    featured: false,
    includes: "Includes everything in Startups plan and",
    features: [
      ...enterpriseLimitUpgrades,
      "Managed campaigns",
      "SSO auth",
    ],
  },
];
