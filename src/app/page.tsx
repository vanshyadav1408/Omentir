import FaqSplitSection from "./faq-split-section";
import HeroCopy from "./hero-copy";
import HeroCta from "./hero-cta";
import HeroProductStage from "./hero-product-stage";
import HomeCapabilitySlides from "./home-capability-slides";
import MarketingClosingCta from "./marketing-closing-cta";
import { HeroGridBackdrop, MarketingFooter, MarketingHeader } from "./marketing-shell";
import CustomerLogoWall from "./customer-logo-wall";
import JsonLd from "./json-ld";
import {
  createFAQJsonLd,
  createPageMetadata,
  defaultTitle,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "./seo";

export const metadata = createPageMetadata({
  title: defaultTitle,
  description:
    "Omentir finds ICP-fit buyers, drafts LinkedIn outreach from your profile, and helps turn interested replies into booked demos.",
  keywords: [
    "convert LinkedIn users into customers",
    "AI LinkedIn outreach tool",
    "AI customer discovery",
    "book more demos",
  ],
});

const faqItems = [
  {
    question: "What does Omentir actually do?",
    answer:
      "Omentir is an AI sales agent for LinkedIn. It finds buyers that match your ideal customer profile, sends personalized connection requests and messages from your own LinkedIn account, follows up automatically, and collects every reply in one unified inbox sorted by intent.",
  },
  {
    question: "What exactly do I get?",
    answer:
      "Everything you need to run LinkedIn outbound from one place: AI agents that find and score leads against your ideal customer profile, campaigns that send personalized connection requests, messages, and follow-ups from your account, message drafts you can edit or approve, a unified inbox for every reply, and daily sending limits that help protect your account.",
  },
  {
    question: "Is it safe for my LinkedIn account?",
    answer:
      "Omentir enforces daily invite and message limits and sends from your profile at a human pace. Those controls reduce sudden volume spikes, but you still own compliance with LinkedIn's rules.",
  },
  {
    question: "How much does Omentir cost?",
    answer:
      "Pro is $49/month and includes one user, one LinkedIn account, unlimited AI agents, unlimited leads, unlimited campaigns, and API access. Enterprise includes unlimited users, unlimited LinkedIn accounts, and all Pro features, plus SSO, dedicated onboarding, and priority support.",
  },
  {
    question: "Is Omentir worth paying for?",
    answer:
      "Omentir is $49/month, with a minimum of three bookings per week or you pay nothing. If an eligible weekly guarantee is not met, you can apply for a full refund. If one customer is worth more than that to your business, a single conversion can cover the cost. Omentir is for founders who want a consistent LinkedIn outbound pipeline without paying separately for lead databases, sequencing tools, and an SDR team.",
  },
  {
    question: "How long does it take to get started?",
    answer:
      "Minutes. You connect your LinkedIn account, drop in your website or describe your ideal customer, and launch your first campaign. There is no onboarding call or sales process required.",
  },
  {
    question: "Who is Omentir built for?",
    answer:
      "Founders, solo operators, and small B2B sales teams that want a predictable outbound pipeline on LinkedIn without hiring SDRs or stitching together databases, sequencers, and inboxes.",
  },
];

export default function Home() {
  const jsonLd = [
    organizationJsonLd,
    websiteJsonLd,
    softwareApplicationJsonLd,
    createFAQJsonLd(faqItems),
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <JsonLd id="home-jsonld" data={jsonLd} />
      <MarketingHeader transparentAtTop />

      <div className="relative">
        <HeroGridBackdrop height="h-[130vh]" />
        <section className="relative z-10">
          <div className="omentir-primary-width pt-28 pb-8 md:pt-36 md:pb-10 lg:pt-44">
            <div className="flex w-full max-w-3xl min-w-0 flex-col items-start">
              <HeroCopy>
                <HeroCta />
              </HeroCopy>
            </div>
            <HeroProductStage />
          </div>
        </section>

        <div className="relative z-10">
          <CustomerLogoWall />
        </div>
      </div>

      <HomeCapabilitySlides />

      <FaqSplitSection items={faqItems} className="py-12 md:py-20" />

      <MarketingClosingCta className="omentir-primary-width min-w-0 py-24 text-center md:py-32" />

      <MarketingFooter />
    </main>
  );
}
