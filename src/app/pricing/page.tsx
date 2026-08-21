import CustomerLogoWall from "../customer-logo-wall";
import FaqSplitSection from "../faq-split-section";
import JsonLd from "../json-ld";
import MarketingClosingCta from "../marketing-closing-cta";
import { HeroGridBackdrop, MarketingFooter, MarketingHeader } from "../marketing-shell";
import PlanAwarePricingCards from "../plan-aware-pricing-cards";
import {
  createBreadcrumbJsonLd,
  createFAQJsonLd,
  createPageMetadata,
  siteUrl,
  softwareApplicationJsonLd,
} from "../seo";

export const metadata = createPageMetadata({
  title: "Pricing - Omentir",
  description:
    "Omentir pricing for founders and sales teams running LinkedIn outbound with AI: Pro at $49 per month, plus Enterprise support for teams that need SSO.",
  path: "/pricing",
  keywords: ["Omentir pricing", "LinkedIn outreach pricing", "AI sales software pricing"],
});

const faqItems = [
  {
    question: "Which Omentir plan should I start with?",
    answer:
      "Choose Pro at $49/month when you want to start right away. Choose Enterprise when your team needs SSO, dedicated onboarding, or priority support.",
  },
  {
    question: "What is included in each plan?",
    answer:
      "Pro includes one user, one LinkedIn account, unlimited AI agents, unlimited leads per day, unlimited campaigns, AI automated campaigns, API access, and email customer support. Enterprise includes unlimited users, unlimited LinkedIn accounts, all Pro features, plus SSO, dedicated onboarding, and priority support.",
  },
  {
    question: "What is the booking guarantee?",
    answer:
      "You get a minimum of three bookings per week or you pay nothing. If an eligible weekly guarantee is not met, you can apply for a full refund.",
  },
  {
    question: "How do I get Enterprise?",
    answer:
      "Book a call to discuss your team's SSO, onboarding, and support needs.",
  },
  {
    question: "Can I self-host Omentir instead of paying?",
    answer:
      "Yes. Omentir is open source under the MIT license, and the repository ships with a Docker setup for running it on your own infrastructure with your own Firebase, Unipile, and AI provider accounts. The paid plans are the managed version: we run the servers, providers, updates, and support for you.",
  },
  {
    question: "Is Omentir worth paying for?",
    answer:
      "Omentir is $49/month, with a minimum of three bookings per week or you pay nothing. It is for founders who want a consistent LinkedIn outbound pipeline without paying separately for lead databases, sequencing tools, and an SDR team.",
  },
  {
    question: "Can I control sending limits?",
    answer:
      "Yes. Omentir is built around safe, human-paced outreach. Users can control sending limits from Settings, and campaigns still respect LinkedIn provider, billing, and infrastructure limits.",
  },
] as const;

export default function PricingPage() {
  const jsonLd = [
    softwareApplicationJsonLd,
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "Pricing", url: `${siteUrl}/pricing` },
    ]),
    createFAQJsonLd(faqItems),
  ];

  return (
    <>
      <JsonLd id="pricing-jsonld" data={jsonLd} />
      <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
        <MarketingHeader transparentAtTop />
        <div className="relative">
          <HeroGridBackdrop height="h-[90vh]" />

          <section className="omentir-primary-width relative z-10 min-w-0 pt-28 md:pt-36">
            <h1 className="hero-display text-center text-[var(--md-sys-color-on-surface)]">
              Pricing
            </h1>
            <PlanAwarePricingCards className="mx-auto mt-12 max-w-4xl md:mt-16" />
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm font-normal leading-6 text-zinc-500 md:mt-10">
              LinkedIn provider, billing, and infrastructure limits may apply. Users
              control sending limits from Settings.
            </p>
          </section>

          <div className="relative z-10 pt-16 md:pt-24">
            <CustomerLogoWall headingId="pricing-customer-logo-wall" />
          </div>

          <FaqSplitSection
            items={faqItems}
            className="relative z-10 mt-16 md:mt-24"
          />

          <MarketingClosingCta className="relative z-10 mx-auto w-full max-w-4xl min-w-0 px-4 py-24 text-center md:px-8 md:py-32" />
        </div>
        <MarketingFooter />
      </main>
    </>
  );
}
