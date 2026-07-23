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
    "See Omentir pricing for founders, solo operators, small teams, and enterprise sales teams running LinkedIn outbound with AI.",
  path: "/pricing",
  keywords: ["Omentir pricing", "LinkedIn outreach pricing", "AI sales software pricing"],
});

const faqItems = [
  {
    question: "Which Omentir plan should I start with?",
    answer:
      "Start with Basic if you are a solo founder running one LinkedIn account and one campaign. Choose Startup when you need more accounts, more agents, unlimited leads, and unlimited campaigns.",
  },
  {
    question: "What is included in the Basic plan?",
    answer:
      "Basic includes one LinkedIn account, one AI agent, up to 50 leads per day, one campaign, API access, AI automated campaigns, and fast customer support.",
  },
  {
    question: "When should I upgrade to the Startup plan?",
    answer:
      "Upgrade when you want to run multiple LinkedIn accounts, create more AI agents, launch more campaigns, or remove lead and campaign limits from your outbound workflow.",
  },
  {
    question: "What does Enterprise pricing include?",
    answer:
      "Enterprise is custom and built for teams that need unlimited LinkedIn accounts, unlimited AI agents, managed campaigns, SSO, onboarding, and a dedicated support manager.",
  },
  {
    question: "Can I self-host Omentir instead of paying?",
    answer:
      "Yes. Omentir is open source under the MIT license, and the repository ships with a Docker setup for running it on your own infrastructure with your own Firebase, Unipile, and AI provider accounts. The paid plans are the managed version: we run the servers, providers, updates, and support for you.",
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
        description="Start at $29/month as a solo founder. Upgrade when your team needs more LinkedIn accounts, custom workflows, onboarding, or higher support."
        centeredHeader
        heroFullHeight
        contentClassName="max-w-7xl"
        titleClassName="[font-family:var(--font-google-sans)] font-bold"
        heroActions={
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/"
              className="m3-btn m3-btn-filled h-11 w-full px-5 text-sm sm:w-auto"
            >
              Explore
            </Link>
            <Link
              href="#faq"
              className="m3-btn m3-btn-outlined h-11 w-full bg-white/90 px-5 text-sm sm:w-auto"
            >
              FAQs
            </Link>
          </div>
        }
      >
        <PlanAwarePricingCards />

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
