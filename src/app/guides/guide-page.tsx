import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import FaqSplitSection from "../faq-split-section";
import { PromptCopyBox } from "../grok-bot-setup-block";
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
import { LandingSection, RelatedCards } from "./landing-kit";
import { type GuidePage } from "./types";

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

export default function GuidePageView({ page }: { page: GuidePage }) {
  const path = `/${page.slug}`;
  const pageUrl = `${siteUrl}${path}`;
  const banner = page.ogImage
    ? {
        src: page.ogImage.url,
        alt: page.ogImage.alt,
        width: page.ogImage.width,
        height: page.ogImage.height,
      }
    : null;
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

        <DefaultGuideBody page={page} />

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
