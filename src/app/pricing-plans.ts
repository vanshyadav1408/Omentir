// Single source of truth for plan cards. Rendered on the public pricing page
// (pricing-cards.tsx) and the onboarding paywall (onboarding/step-upgrade.tsx),
// so prices, limits, and checkout links can never drift between the two.
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
      "1 LinkedIn account",
      "1 AI agent",
      "50 leads per day",
      "1 campaign",
      "API access",
      "AI automated campaigns",
      "Email customer support",
    ],
  },
  {
    name: "For Startups",
    price: "$59/month",
    cadence: "",
    description:
      "For founders, solo operators, and small teams that want LinkedIn outbound running quickly.",
    cta: "Start Now",
    href: "/checkout?plan=startup",
    featured: false,
    includes: "Includes everything in Basic plan and",
    features: [
      "Up to 3 LinkedIn accounts",
      "3 AI agents",
      "Unlimited leads",
      "Unlimited campaigns",
      "Slack customer support",
    ],
  },
  {
    name: "For Enterprises",
    price: "Custom",
    cadence: "",
    description:
      "For teams that need onboarding, custom workflows, higher support, and multiple sender accounts.",
    cta: "Book a Demo",
    href: "https://calendly.com/vanshyadav-1408/30min",
    featured: false,
    includes: "Includes everything in Startups plan and",
    features: [
      "Unlimited LinkedIn accounts",
      "Unlimited AI agents",
      "Managed campaigns",
      "SSO auth",
      "Dedicated customer support",
    ],
  },
];
