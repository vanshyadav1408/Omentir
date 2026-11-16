import Link from "next/link";
import CustomerLogoWall from "../customer-logo-wall";
import FaqSplitSection from "../faq-split-section";
import HomeScrollActs from "../home-scroll-acts";
import { MarketingFooter, MarketingHeader } from "../marketing-shell";
import PlanAwarePricingCards from "../plan-aware-pricing-cards";
import { createPageMetadata, defaultTitle } from "../seo";
import { Chores, Features, Hero, Proof, Statement, Tools } from "./landing-sections";
import "./new-landing.css";

/* A remake of the homepage, kept beside it for comparison. It is not indexed
   and its canonical URL is the homepage, so search engines see one landing
   page. */
export const metadata = createPageMetadata({
  title: defaultTitle,
  description:
    "Omentir finds ICP-fit buyers, drafts LinkedIn outreach from your profile, and helps turn interested replies into booked demos.",
  path: "/new-landing",
  canonicalPath: "/",
  noIndex: true,
});

/* Same questions as the homepage (src/app/page.tsx). */
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

export default function NewLanding() {
  return (
    <main className="site-theme nl-home min-h-screen">
      <MarketingHeader transparentAtTop />
      <HomeScrollActs />

      <Hero />
      <CustomerLogoWall />
      <Chores />
      <Statement />
      <Features />
      <Tools />
      <Proof />

      <section id="pricing" aria-labelledby="nl-pricing-heading" className="nl-section">
        <header className="nl-head" data-nx-reveal="">
          <h2 id="nl-pricing-heading">
            Pricing with a <em>booking guarantee</em>
          </h2>
          <p>
            $49/month. Three bookings a week or you pay nothing.{" "}
            <Link href="/minimum-booking-guarantee">Read the refund conditions</Link>
          </p>
        </header>
        <PlanAwarePricingCards site className="nl-pricing w-full" />
      </section>

      <FaqSplitSection items={faqItems} className="nl-faq" widthClass="nl-section" />

      <section aria-labelledby="nl-end-heading" className="nl-end">
        <div className="nl-frame nl-end-frame">
          <div className="nl-sky nl-sky-dusk" aria-hidden="true">
            <i className="nl-cloud nl-cloud-1" />
            <i className="nl-cloud nl-cloud-2" />
          </div>
          <div className="nl-grain" aria-hidden="true" />
          <h2 id="nl-end-heading">
            Book meetings. <span>Build your revenue pipeline.</span>
          </h2>
          <p>$49/month. Three bookings a week or you pay nothing.</p>
          <div className="nl-hero-cta nl-end-cta">
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
