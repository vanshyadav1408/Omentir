import FaqAccordion from "../faq-accordion";
import JsonLd from "../json-ld";
import { MarketingPage } from "../marketing-shell";
import Link from "next/link";
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
      <MarketingPage
        eyebrow="Pricing"
        title="Simple pricing for every size of business."
        description={
          <>
            Start with everything you need for $49/month. Minimum 3 bookings per
            week or you pay nothing. For unlimited users, unlimited LinkedIn
            accounts, SSO, dedicated
            onboarding, and priority support, talk to our Enterprise team.
          </>
        }
        centeredHeader
        heroFullHeight
        contentClassName="max-w-7xl"
        heroActions={
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/"
              className="m3-btn m3-btn-filled m3-btn--hero w-full sm:w-auto"
            >
              Explore
            </Link>
            <Link
              href="#faq"
              className="m3-btn m3-btn-outlined m3-btn--hero w-full bg-white/90 sm:w-auto"
            >
              FAQs
            </Link>
          </div>
        }
      >
        <PlanAwarePricingCards className="mx-auto max-w-4xl" />

        <p className="mx-auto mt-12 max-w-2xl text-center text-sm font-normal leading-6 text-zinc-500">
          LinkedIn provider, billing, and infrastructure limits may apply. Users
          control sending limits from Settings.
        </p>

        <section id="faq" className="mx-auto mt-20 max-w-3xl scroll-mt-24 sm:mt-24">
          <h2
            style={{ fontFamily: "var(--font-google-sans)" }}
            className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-3xl"
          >
            Frequently Asked Questions
          </h2>
          <div className="mt-2">
            <FaqAccordion items={faqItems} />
          </div>
        </section>
      </MarketingPage>
    </>
  );
}
