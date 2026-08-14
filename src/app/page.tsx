import Image from "next/image";
import Link from "next/link";
import FaqAccordion from "./faq-accordion";
import HeroCopy from "./hero-copy";
import HeroCta from "./hero-cta";
import {
  AgenticPromptIllustration,
  BookDemosIllustration,
  DeveloperApiIllustration,
  FindBuyersIllustration,
  FounderGrowthIllustration,
  PaperPlaneIllustration,
  PersonalizeIllustration,
} from "./landing-illustrations";
import { HeroGridBackdrop, MarketingFooter, MarketingHeader } from "./marketing-shell";
import CustomerLogoWall from "./customer-logo-wall";
import FindUsOn from "./find-us-on";
import JsonLd from "./json-ld";
import { LogoGlyph } from "./logo-mark";
import { ProductHomeLink } from "./seo-content/product-links";
import {
  MarketingTable,
  MarketingTd,
  MarketingTh,
  MarketingThead,
  MarketingTr,
} from "./marketing-table";
import PlanAwarePricingCards from "./plan-aware-pricing-cards";
import Reveal from "./scroll-reveal";
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
    "Omentir converts LinkedIn users into your customers: it finds potential customers, contacts them with personalized LinkedIn outreach, and helps turn interested replies into booked demos.",
  keywords: [
    "convert LinkedIn users into customers",
    "AI LinkedIn outreach tool",
    "AI customer discovery",
    "book more demos",
  ],
});

const steps = [
  {
    number: "1.",
    title: "Connect LinkedIn",
    description:
      "Securely connect your LinkedIn account so Omentir can send outreach from your own profile.",
    image: "/connect-linkedin.avif",
    alt: "Connect LinkedIn screen in Omentir",
  },
  {
    number: "2.",
    title: "Define your ICP",
    description:
      "Tell Omentir the roles, industries, locations, and signals that make someone a strong fit.",
    image: "/define-your-icp.avif",
    alt: "Ideal customer profile setup screen in Omentir",
  },
  {
    number: "3.",
    title: "Set up your campaign",
    description:
      "Choose the lead group, outreach mode, and campaign goal before you start reaching prospects.",
    image: "/set-up-your-campaign.avif",
    alt: "Campaign builder screen in Omentir",
  },
  {
    number: "4.",
    title: "See customers kicking in",
    description:
      "Watch real conversations and interested replies show up as outreach starts creating traction.",
    image: "/see-customers-kicking-in.avif",
    alt: "Customer replies from manual outreach",
  },
  {
    number: "5.",
    title: "Review leads for manual outreach",
    description:
      "Review scored leads, pick the best-fit prospects, and decide who should get your manual follow-up.",
    image: "/review-leads-for-manual-outreach.avif",
    alt: "Lead review table in Omentir",
  },
];

const features = [
  {
    art: <FindBuyersIllustration />,
    title: "Find qualified buyers",
    description:
      "Identify companies and contacts that match your ideal customer profile.",
  },
  {
    art: <PersonalizeIllustration />,
    title: "Personalize outreach",
    description:
      "Write timely, relevant messages using account context and clear intent.",
  },
  {
    art: <BookDemosIllustration />,
    title: "Book more demos",
    description:
      "Track replies, handle follow-ups, and move interested buyers to a call.",
  },
];

const audiences = [
  {
    art: <FounderGrowthIllustration />,
    title: "Founders & Sales Teams",
    description:
      "Run your whole outbound motion from one dashboard - Omentir finds ICP-fit buyers, writes the outreach, and turns warm replies into demos.",
    href: "/signup",
    linkLabel: "Start now",
  },
  {
    art: <AgenticPromptIllustration />,
    title: "Agents",
    description:
      "Prompt Omentir from Claude, ChatGPT, or any MCP agent to configure lead finders, search scored buyers, inspect exact lead context, and monitor results.",
    href: "/mcp-server",
    linkLabel: "MCP server",
  },
  {
    art: <DeveloperApiIllustration />,
    title: "Developers",
    description:
      "Build on the Omentir Agent API so Cursor, Claude Code, OpenClaw, and your own clients can configure lead discovery, retrieve qualified leads, and work with replies over REST.",
    href: "/for-agents",
    linkLabel: "Agent API",
  },
];

function WhoItsFor() {
  return (
    <div className="mx-auto w-full max-w-7xl min-w-0">
      <Reveal>
        <h2 className="text-center text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--md-sys-color-on-surface)] md:text-4xl lg:text-5xl">
          Who is <span className="text-gradient-brand">Omentir</span> for?
        </h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-4 md:mt-16 md:gap-6 lg:grid-cols-3">
        {audiences.map((audience, index) => (
          <Reveal key={audience.title} delay={index * 120}>
            <article className="flex h-full w-full flex-col rounded-2xl border-2 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] p-4 md:p-8 lg:p-10">
              <div className="flex h-28 items-center justify-center md:h-36">
                {audience.art}
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] md:mt-6 md:text-2xl">
                {audience.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)] md:mt-3 md:text-base md:leading-7">
                {audience.description}
              </p>
              <div className="mt-auto pt-6 md:pt-10">
                <Link
                  href={audience.href}
                  className="m3-btn m3-btn-filled-secondary h-10 cursor-pointer gap-1.5 px-5 text-sm"
                >
                  {audience.linkLabel}
                  <svg
                    viewBox="0 0 10 16"
                    aria-hidden="true"
                    className="h-4 w-2.5"
                    fill="none"
                  >
                    <path
                      d="M1 8h7M5 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="mx-auto w-full max-w-5xl min-w-0">
      <Reveal className="mx-auto max-w-3xl text-center">
        <h2
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--md-sys-color-on-surface)] md:text-3xl lg:text-4xl"
        >
          Get started in a <span className="text-gradient-brand">few steps</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)] md:mt-4 md:max-w-3xl md:text-base">
          After you sign up, you&apos;ll be taken into the dashboard, where you can
          connect your account, share your ideal customer profile and outreach
          method.
        </p>
      </Reveal>
      <OutreachSteps items={steps} />
    </div>
  );
}

function OutreachSteps({ items }: { items: typeof steps }) {
  return (
    <div className="mt-10 space-y-16 md:mt-16 md:space-y-24">
      {items.map((step, index) => {
          const imageFirst = index % 2 === 0;
          return (
            <Reveal
              key={step.title}
              className="grid w-full grid-cols-1 items-center gap-8 md:gap-10 lg:grid-cols-2 lg:gap-12"
            >
              {/* Text first on mobile so description → gap → image reads cleanly */}
              <div className={`min-w-0 ${imageFirst ? "lg:order-2" : "lg:order-1"}`}>
                <div className="mx-auto w-full max-w-md text-center lg:max-w-sm lg:text-left">
                  <h3
                    style={{ fontFamily: "var(--font-varta)" }}
                    className="text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-2xl"
                  >
                    {step.number} {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)] md:mt-3 md:text-base md:leading-7">
                    {step.description}
                  </p>
                </div>
              </div>
              <div
                className={`mx-auto h-auto w-full max-w-md overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] shadow-[0_18px_60px_rgba(15,23,42,0.08)] ${
                  imageFirst ? "lg:order-1" : "lg:order-2"
                }`}
              >
                <Image
                  src={step.image}
                  alt={step.alt}
                  width={1448}
                  height={1086}
                  className="h-auto w-full"
                />
              </div>
            </Reveal>
          );
        })}
    </div>
  );
}

const comparisonColumns = ["Omentir", "Cognism", "Gojiberry", "Lusha", "Artisan"];

const comparisonRows: { dimension: string; cells: string[] }[] = [
  {
    dimension: "Lead sourcing",
    cells: [
      "AI agents search LinkedIn daily and score every lead against your ICP",
      "Static contact database, enterprise-focused",
      "Prompt-based directory search",
      "Manual database filters with credit-based unlocks",
      "Internal B2B contact database",
    ],
  },
  {
    dimension: "LinkedIn outreach",
    cells: [
      "Built in - connection requests, messages, and follow-ups run on autopilot",
      "None - requires external sequencers",
      "Lead discovery first; sequences need external connections",
      "None - export CSVs to other tools",
      "Email-first, with limited LinkedIn",
    ],
  },
  {
    dimension: "AI messages & replies",
    cells: [
      "Context-aware drafts, and AI handles replies until you take over",
      "No copywriting layer",
      "Reply notifications only",
      "Manual templates and merge tags",
      "AI email sequences",
    ],
  },
  {
    dimension: "Account safety",
    cells: [
      "Daily invite and message limits enforced automatically",
      "Not applicable (data only)",
      "User-managed",
      "No built-in throttling",
      "Email deliverability focus",
    ],
  },
  {
    dimension: "Open source",
    cells: [
      "Fully open source - MIT licensed, self-hostable, every line public on GitHub",
      "Closed source",
      "Closed source",
      "Closed source",
      "Closed source",
    ],
  },
  {
    dimension: "Pricing & setup",
    cells: [
      "$49/month, live in minutes",
      "Enterprise contracts and seat provisioning",
      "Extra tools needed for the full workflow",
      "Credit-based pricing",
      "High annual commitments, weeks-long onboarding",
    ],
  },
];

function ComparisonTable() {
  return (
    <div className="mx-auto w-full max-w-7xl min-w-0">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--md-sys-color-on-surface)] md:text-4xl lg:text-5xl">
          How <span className="text-gradient-brand">Omentir</span> compares
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)] md:mt-4 md:text-base">
          Data tools hand you a list. Omentir finds your buyers, runs the
          outreach, and handles replies - all in one place.
        </p>
      </Reveal>

      <Reveal delay={120} className="mt-10 md:mt-16">
        <MarketingTable minWidthClass="min-w-[56rem]">
          <MarketingThead>
            <tr>
              <MarketingTh>Dimension</MarketingTh>
              {comparisonColumns.map((column, index) => (
                <MarketingTh key={column}>
                  {index === 0 ? (
                    <span className="inline-flex items-center gap-2">
                      <LogoGlyph className="h-5 w-5 shrink-0" />
                      {column}
                    </span>
                  ) : (
                    <ProductHomeLink
                      name={column}
                      className="underline-offset-4 hover:text-[var(--md-sys-color-primary)] hover:underline"
                    >
                      {column}
                    </ProductHomeLink>
                  )}
                </MarketingTh>
              ))}
            </tr>
          </MarketingThead>
          <tbody>
            {comparisonRows.map((row) => (
              <MarketingTr key={row.dimension}>
                <MarketingTh scope="row">{row.dimension}</MarketingTh>
                {row.cells.map((cell, index) => (
                  <MarketingTd key={`${row.dimension}-${index}`}>
                    {cell}
                  </MarketingTd>
                ))}
              </MarketingTr>
            ))}
          </tbody>
        </MarketingTable>
      </Reveal>
    </div>
  );
}

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
      "Yes. Omentir enforces daily invite and message limits automatically and sends everything from your own profile at a human pace, so your account stays within LinkedIn's safety boundaries without you having to manage quotas yourself.",
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

function Faq() {
  return (
    <div className="mx-auto w-full max-w-5xl min-w-0">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--md-sys-color-on-surface)] md:text-4xl">
          Frequently asked <span className="text-gradient-brand">questions</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)] md:mt-4 md:text-base">
          Everything you need to know before putting your LinkedIn outbound on
          autopilot.
        </p>
      </Reveal>

      <Reveal delay={120} className="mt-10 md:mt-16">
        <FaqAccordion items={faqItems} />
      </Reveal>
    </div>
  );
}

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
        {/* Diamond grid spans the hero and fades out around the
            "Get started in a few steps" heading below. */}
        <HeroGridBackdrop />
        {/* Hero spacing matches /for-agents: full viewport, centered, py-24 clear of fixed header */}
        <section className="relative z-10 w-full">
          <div className="relative mx-auto flex min-h-screen w-full max-w-4xl min-w-0 flex-col items-center justify-center px-4 py-24 text-center md:px-8 md:py-32">
            <div className="mx-auto flex w-full min-w-0 flex-col items-center">
              <HeroCopy>
                <div className="hero-enter hero-enter-delay-2 flex w-full min-w-0 flex-col items-center">
                  <HeroCta />
                </div>
              </HeroCopy>
            </div>
            <div className="mt-[2.4rem] w-full md:hidden">
              <CustomerLogoWall headingId="customer-logo-wall-heading-mobile" />
            </div>
          </div>
        </section>

        <div className="relative z-10 hidden md:block">
          <CustomerLogoWall />
        </div>

        <section
          id="how-it-works"
          className="relative z-10 min-w-0 px-4 py-12 md:px-8 md:py-24"
        >
          <HowItWorks />
        </section>
      </div>

      <section
        id="who-its-for"
        className="mx-auto max-w-7xl min-w-0 px-4 py-12 md:px-8 md:py-24"
      >
        <WhoItsFor />
      </section>

      <section
        id="comparison"
        className="mx-auto max-w-7xl min-w-0 px-4 py-12 md:px-8 md:py-24"
      >
        <ComparisonTable />
      </section>

      <section
        id="features"
        className="mx-auto max-w-7xl min-w-0 px-4 py-12 md:px-8 md:py-24"
      >
        <Reveal>
          <h2 className="text-center text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--md-sys-color-on-surface)] md:text-4xl lg:text-5xl">
            Everything you need to <span className="text-gradient-brand">book more sales</span>
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 md:mt-16 md:gap-6 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 120}>
              <article className="flex h-full w-full flex-col rounded-2xl border-2 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] p-4 md:p-8 lg:p-10">
                <div className="flex h-28 items-center justify-center md:h-36">
                  {feature.art}
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] md:mt-6 md:text-2xl">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface)]/80 md:mt-3 md:text-base md:leading-7">
                  {feature.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="story" className="mx-auto max-w-3xl min-w-0 px-4 py-12 md:px-8 md:py-20">
        <Reveal className="min-w-0 rounded-xl border-2 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] px-4 py-8 shadow-[var(--md-sys-elevation-2)] md:px-12 md:py-14">
          <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--md-sys-color-surface-container)] bg-[var(--md-sys-color-primary)] text-2xl font-bold text-[var(--md-sys-color-on-primary)] shadow-[var(--md-sys-elevation-1)] md:h-24 md:w-24">
            <Image
              src="/founder.jpg"
              alt="Vansh, founder of Omentir"
              width={192}
              height={192}
              className="h-full w-full object-cover"
            />
          </div>

          <h2
            style={{ fontFamily: "var(--font-varta)" }}
            className="mt-5 text-center text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--md-sys-color-on-surface)] md:mt-6 md:text-5xl"
          >
            heyo! it&apos;s{" "}
            <span className="text-[var(--md-sys-color-primary)]">Vansh</span>
          </h2>
          <p className="mt-2 text-center text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]">
            (the guy who built Omentir)
          </p>

          <div className="mx-auto mt-8 max-w-xl space-y-5 text-sm font-medium leading-6 text-[var(--md-sys-color-on-surface)] md:mt-10 md:space-y-6 md:text-base md:leading-8">
            <p>
              After my 15 weeks long solo trip in the mountains out of an
              existential crisis, I dropped my{" "}
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">IITB</span> degree and
              started working on my own app. I shipped an{" "}
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">AI video editor</span>{" "}
              I was convinced people would love. Then reality hit. I couldn&apos;t
              get much users.
            </p>

            <p>
              So one random afternoon, out of pure frustration, I started{" "}
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                manually messaging people on LinkedIn
              </span>
              .
            </p>

            <p>
              Somehow, that day, I{" "}
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">booked 2 deals</span>.
              From <span className="font-semibold">LinkedIn DMs</span>. For a product
              I was about to give up on.
            </p>

            <p>
              Then, I started automating the exact motion that worked: find intent,
              message from your own account, follow up until someone replies.
            </p>

            <p>
              I later killed the video editor. It was never going to work. But I
              kept the automation alive, added some opus 4.5 on top of that and
              this time, I dmed other business owners to try, it kinda worked, they
              were booking 3-4 demos per week on average only because of it.
            </p>

            <p>
              Now, I present a more refined version of the sales tool I built
              for myself, and I call it{" "}
              <span
                style={{ fontFamily: "var(--font-varta)" }}
                className="select-none font-bold text-[var(--md-sys-color-on-surface)]"
              >
                Omentir
              </span>
              {", because in Quenya, it means "}
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">to contact</span>.
            </p>

            <p>
              Oh, and one more thing. Omentir was closed source until recently.
              Now the entire code is{" "}
              <a
                href="https://github.com/vanshyadav1408/Omentir"
                target="_blank"
                rel="noopener"
                className="font-bold text-[var(--md-sys-color-on-surface)] underline underline-offset-4"
              >
                open source on GitHub
              </a>
              , so you can read every line of what runs your outreach.
            </p>

            <p className="pt-2 text-center">
              If you&apos;re where I was a few months ago, you can{" "}
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">Try Omentir</span>{" "}
              from the button below.
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/signup"
              className="m3-btn m3-btn-filled-secondary h-12 cursor-pointer px-7 text-base"
            >
              Try Omentir
            </Link>
          </div>
        </Reveal>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl min-w-0 px-4 py-12 md:px-8 md:py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-[1.75rem] font-semibold leading-tight tracking-tight md:text-4xl">
            <span className="text-gradient-brand">Simple pricing</span> for everyone
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)] md:mt-5 md:text-base md:leading-8">
            Start with Pro at $49/month, with a minimum of three bookings per
            week or you pay nothing. Choose Enterprise for unlimited users,
            unlimited LinkedIn accounts,
            SSO, and dedicated support.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <PlanAwarePricingCards className="mx-auto mt-8 max-w-4xl md:mt-12" />
        </Reveal>
      </section>

      <section id="faq" className="mx-auto max-w-7xl min-w-0 px-4 py-12 md:px-8 md:py-20">
        <Faq />
      </section>

      <FindUsOn />

      <section id="start" className="mx-auto max-w-7xl min-w-0 px-4 py-12 md:px-8 md:py-20">
        <Reveal>
          <div className="marketing-cta relative overflow-hidden rounded-3xl px-4 py-10 text-center m3-elevation-2 md:px-10 md:py-14">
            <div
              aria-hidden
              className="pointer-events-none absolute right-6 top-1/2 hidden h-24 -translate-y-1/2 opacity-90 lg:block"
            >
              <PaperPlaneIllustration />
            </div>
            <h2 className="text-[1.75rem] font-bold leading-tight tracking-tight text-white md:text-4xl">
              Turn Linkedin into a revenue source
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-normal leading-6 text-white/90 md:mt-4 md:text-base md:leading-7">
              Drop in your website. We&apos;ll find the right buyers, write the
              outreach, and book the demos - so you can focus on closing.
            </p>
            <Link
              href="/signup"
              className="m3-btn m3-btn-filled-secondary mt-6 h-11 cursor-pointer px-6 text-sm md:mt-7 md:h-12 md:px-7 md:text-base"
            >
              Start now
            </Link>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
