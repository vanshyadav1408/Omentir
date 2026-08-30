import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import FaqSplitSection from "../faq-split-section";
import { CHATGPT_FIRST_JOB_PROMPT } from "../chatgpt-setup";
import { CLAUDE_CHAT_FIRST_JOB_PROMPT } from "../claude-chat-setup";
import { CLAUDE_CODE_FIRST_JOB_PROMPT } from "../claude-code-setup";
import { CODEX_FIRST_JOB_PROMPT } from "../codex-setup";
import { CURSOR_FIRST_JOB_PROMPT } from "../cursor-setup";
import { GROK_CHAT_FIRST_JOB_PROMPT } from "../grok-chat-setup";
import { OPENCLAW_FIRST_JOB_PROMPT } from "../openclaw-setup";
import {
  GROK_BOT_COLD_DM_PROMPT,
  GROK_BOT_FIRST_JOB_PROMPT,
  GROK_BOT_FOLLOW_UP_PROMPT,
  GROK_BOT_LEAD_GEN_PROMPT,
} from "../grok-bot-setup";
import { PromptCopyBox, PromptCopyButton } from "../grok-bot-setup-block";
import JsonLd from "../json-ld";
import MarketingClosingCta from "../marketing-closing-cta";
import {
  HeroGridBackdrop,
  MarketingFooter,
  MarketingHeader,
} from "../marketing-shell";
import {
  createBreadcrumbJsonLd,
  createFAQJsonLd,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";
import LinkedinAutomationLanding from "./landing-automation";
import ClaudeCodeLanding from "./landing-claude-code";
import CodexLanding from "./landing-codex";
import ColdMessagesLanding from "./landing-cold";
import CursorLanding from "./landing-cursor";
import FollowUpLanding from "./landing-follow-up";
import { LandingSection, RelatedCards } from "./landing-kit";
import LeadGenerationLanding from "./landing-lead-gen";
import OvernightOutboundLanding from "./landing-overnight";
import SalesOutreachLanding from "./landing-sales";
import { guideHeroImage, type GuidePage } from "./types";

function promptForGuide(slug: string): string | null {
  if (slug === "grok-bot-cold-messages") return GROK_BOT_COLD_DM_PROMPT;
  if (slug === "grok-bot-follow-up-messages") return GROK_BOT_FOLLOW_UP_PROMPT;
  if (slug === "grok-bot-lead-generation") return GROK_BOT_LEAD_GEN_PROMPT;
  if (slug === "claude-code-sales-outreach") return CLAUDE_CODE_FIRST_JOB_PROMPT;
  if (slug === "cursor-sales-outreach") return CURSOR_FIRST_JOB_PROMPT;
  if (slug === "codex-sales-outreach") return CODEX_FIRST_JOB_PROMPT;
  if (slug === "chatgpt-sales-outreach") return CHATGPT_FIRST_JOB_PROMPT;
  if (slug === "claude-chat-sales-outreach") return CLAUDE_CHAT_FIRST_JOB_PROMPT;
  if (slug === "grok-chat-sales-outreach") return GROK_CHAT_FIRST_JOB_PROMPT;
  if (slug === "openclaw-sales-outreach") return OPENCLAW_FIRST_JOB_PROMPT;
  if (slug.startsWith("grok-bot") || slug === "overnight-outbound-with-grok-bot") {
    return GROK_BOT_FIRST_JOB_PROMPT;
  }
  return null;
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) return <span key={index}>{part}</span>;
    const href = match[2];
    const external = href.startsWith("http://") || href.startsWith("https://");
    if (external) {
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener"
          className="font-medium text-[var(--md-sys-color-primary)] underline decoration-[var(--md-sys-color-primary)]/30 underline-offset-4 hover:text-[var(--md-sys-color-on-surface)]"
        >
          {match[1]}
        </a>
      );
    }
    return (
      <Link
        key={index}
        href={href}
        className="font-medium text-[var(--md-sys-color-primary)] underline decoration-[var(--md-sys-color-primary)]/30 underline-offset-4 hover:text-[var(--md-sys-color-on-surface)]"
      >
        {match[1]}
      </Link>
    );
  });
}

function pasteLabelFor(slug: string) {
  if (slug.startsWith("claude-code")) return "Paste into Claude Code";
  if (slug.startsWith("claude-chat")) return "Paste into Claude";
  if (slug.startsWith("cursor")) return "Paste into Cursor";
  if (slug.startsWith("codex")) return "Paste into Codex";
  if (slug.startsWith("chatgpt")) return "Paste into ChatGPT";
  if (slug.startsWith("grok-chat")) return "Paste into grok.com";
  if (slug.startsWith("openclaw")) return "Paste into OpenClaw";
  if (slug.startsWith("grok-bot") || slug === "overnight-outbound-with-grok-bot") {
    return "Paste into Grok Bot";
  }
  return "Paste this job";
}

function DefaultGuideBody({ page }: { page: GuidePage }) {
  return (
    <div className="omentir-moderate-width min-w-0 space-y-16 pb-8 md:space-y-24 md:pb-12">
      {page.sections.map((section) => (
        <LandingSection key={section.heading} title={section.heading}>
          <div className="space-y-5">
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="max-w-2xl text-base leading-8 text-[var(--md-sys-color-on-surface-variant)]"
              >
                {renderInline(paragraph)}
              </p>
            ))}
          </div>
          {section.bullets?.length ? (
            <ul className="mt-6 max-w-2xl list-disc space-y-2 pl-5 text-base leading-8 text-[var(--md-sys-color-on-surface-variant)]">
              {section.bullets.map((item) => (
                <li key={item}>{renderInline(item)}</li>
              ))}
            </ul>
          ) : null}
          {section.code ? (
            <PromptCopyBox prompt={section.code} label={pasteLabelFor(page.slug)} />
          ) : null}
        </LandingSection>
      ))}
    </div>
  );
}

function LandingBody({ page }: { page: GuidePage }) {
  const variant = page.landingVariant;
  if (variant === "sales" || page.slug === "grok-bot-sales-outreach") return <SalesOutreachLanding />;
  if (variant === "cold" || page.slug === "grok-bot-cold-messages") return <ColdMessagesLanding />;
  if (variant === "automation" || page.slug === "grok-bot-linkedin-automation") {
    return <LinkedinAutomationLanding />;
  }
  if (variant === "overnight" || page.slug === "overnight-outbound-with-grok-bot") {
    return <OvernightOutboundLanding />;
  }
  if (variant === "lead-gen" || page.slug === "grok-bot-lead-generation") {
    return <LeadGenerationLanding />;
  }
  if (variant === "follow-up" || page.slug === "grok-bot-follow-up-messages") {
    return <FollowUpLanding />;
  }
  if (variant === "claude-code" || page.slug === "claude-code-sales-outreach") {
    return <ClaudeCodeLanding />;
  }
  if (variant === "cursor" || page.slug === "cursor-sales-outreach") return <CursorLanding />;
  if (variant === "codex" || page.slug === "codex-sales-outreach") return <CodexLanding />;
  return <DefaultGuideBody page={page} />;
}

export default function GuidePageView({ page }: { page: GuidePage }) {
  const path = `/${page.slug}`;
  const pageUrl = `${siteUrl}${path}`;
  const banner = guideHeroImage(page.slug);
  const showFaq = page.faqItems.length > 0;
  const jsonLd = [
    createWebPageJsonLd({
      name: page.title,
      description: page.description,
      url: pageUrl,
      dateModified: page.updatedDate || page.publishedDate,
    }),
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: page.title, url: pageUrl },
    ]),
    ...(showFaq ? [createFAQJsonLd(page.faqItems)] : []),
  ];

  return (
    <>
      <JsonLd id={`guide-${page.slug}-jsonld`} data={jsonLd} />
      <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
        <MarketingHeader transparentAtTop />
        <div className="relative">
          <HeroGridBackdrop height="h-[80vh]" />
          <section className="omentir-moderate-width relative z-10 min-w-0 pb-12 pt-36 text-center md:pb-16 md:pt-48">
            <h1
              style={{ fontFamily: "var(--font-varta)" }}
              className="mx-auto max-w-3xl text-3xl font-semibold leading-[1.15] tracking-tight text-[var(--md-sys-color-on-surface)] md:text-5xl"
            >
              {page.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--md-sys-color-on-surface-variant)] md:text-lg">
              {page.description}
            </p>
            <div className="m3-btn-pair mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="m3-btn m3-btn-filled m3-btn--hero w-full sm:w-auto">
                Get started
              </Link>
              {promptForGuide(page.slug) ? (
                <PromptCopyButton
                  prompt={promptForGuide(page.slug)!}
                  className="m3-btn m3-btn-outlined m3-btn--hero w-full sm:w-auto"
                />
              ) : null}
            </div>
            {banner ? (
              <figure className="relative mt-10 aspect-[3/2] overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] md:mt-12">
                <Image
                  src={banner.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 960px, calc(100vw - 2rem)"
                  className="object-cover object-center"
                  priority
                />
              </figure>
            ) : null}
          </section>
        </div>

        <LandingBody page={page} />

        {showFaq ? (
          <FaqSplitSection
            className="py-12 md:py-20"
            widthClass="omentir-moderate-width"
            items={page.faqItems.map((item) => ({
              question: item.question,
              answer: renderInline(item.answer),
            }))}
          />
        ) : null}

        {page.related?.length ? (
          <RelatedCards links={page.related} heading={page.relatedHeading} />
        ) : null}

        <MarketingClosingCta className="omentir-moderate-width min-w-0 py-24 text-center md:py-32" />

        <p className="omentir-moderate-width min-w-0 pb-10 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
          Prefer markdown?{" "}
          <a
            href={`${path}.md`}
            className="font-medium text-[var(--md-sys-color-primary)] underline-offset-4 hover:underline"
          >
            {page.title}.md
          </a>
        </p>
        <MarketingFooter />
      </main>
    </>
  );
}
