import Link from "next/link";
import FaqSplitSection from "./faq-split-section";
import HomeInfo from "./home-info";
import HomeScrollActs from "./home-scroll-acts";
import HomeStory from "./home-story";
import { MarketingFooter, MarketingHeader } from "./marketing-shell";
import JsonLd from "./json-ld";
import PlanAwarePricingCards from "./plan-aware-pricing-cards";
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
    <main className="site-theme nx-home min-h-screen">
      <JsonLd id="home-jsonld" data={jsonLd} />
      <MarketingHeader transparentAtTop />
      <HomeScrollActs />

      <HomeStory />
      <HomeInfo />

      <section id="pricing" aria-labelledby="home-pricing-heading" className="nx-info min-w-0">
        <h2 id="home-pricing-heading">
          Pricing with a <em>booking guarantee</em>
        </h2>
        <PlanAwarePricingCards site className="mx-auto mt-12 w-full max-w-4xl" />
      </section>

      <FaqSplitSection items={faqItems} className="nx-faq" widthClass="nx-info" />

      <section aria-labelledby="nx-end-heading" className="nx-end">
        <div>
          <h2 id="nx-end-heading">
            Book meetings. Build your <mark>revenue pipeline</mark>.
          </h2>
          <div className="nx-cta">
            <Link href="/signup" className="site-btn site-btn-primary">
              Get started
            </Link>
            <Link href="/demo" className="site-btn site-btn-outline">
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
