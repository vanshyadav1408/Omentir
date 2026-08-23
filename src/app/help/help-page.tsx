import Link from "next/link";
import type { ReactNode } from "react";
import FaqAccordion from "../faq-accordion";
import JsonLd from "../json-ld";
import {
  ArticleCrumbs,
  articlePathCrumbs,
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
import GrokBotSetupBlock from "../grok-bot-setup-block";
import { MarkdownTwinLink } from "../seo-content/shared";
import { type HelpPage } from "./types";

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

export default function HelpArticle({ page }: { page: HelpPage }) {
  const path = `/help/${page.slug}`;
  const pageUrl = `${siteUrl}${path}`;
  const jsonLd = [
    createWebPageJsonLd({
      name: page.question,
      description: page.description,
      url: pageUrl,
      dateModified: page.updatedDate || page.publishedDate,
    }),
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "Help", url: `${siteUrl}/help` },
      { name: page.question, url: pageUrl },
    ]),
    ...(page.faqItems.length > 0 ? [createFAQJsonLd(page.faqItems)] : []),
  ];

  return (
    <>
      <JsonLd id={`help-${page.slug}-jsonld`} data={jsonLd} />
      <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
        <MarketingHeader transparentAtTop />
        <div className="relative">
          <HeroGridBackdrop height="h-[60vh]" />
          <article className="omentir-secondary-width relative z-10 min-w-0 pb-16 pt-28 md:pb-24 md:pt-32">
            <ArticleCrumbs crumbs={articlePathCrumbs("help", page.slug)} />

            <h1
              style={{ fontFamily: "var(--font-varta)" }}
              className="max-w-2xl text-2xl font-semibold leading-snug tracking-tight text-[var(--md-sys-color-on-surface)] md:text-3xl md:leading-snug"
            >
              {page.question}
            </h1>

            <div className="mt-12 space-y-6 text-base font-medium leading-8 text-[var(--md-sys-color-on-surface)] md:mt-16">
              {page.paragraphs.map((paragraph, index) => (
                <p key={index}>{renderInline(paragraph)}</p>
              ))}
            </div>

            {page.prompt ? (
              <section id="paste-prompt" className="mt-12 md:mt-16">
                <h2
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
                >
                  Paste this into Grok Bot
                </h2>
                <GrokBotSetupBlock prompt={page.prompt} />
              </section>
            ) : null}

            {page.faqItems.length > 0 ? (
              <section id="faq" className="mt-16 md:mt-20">
                <h2
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--md-sys-color-on-surface)] md:text-3xl"
                >
                  Frequently asked <span className="text-gradient-brand">questions</span>
                </h2>
                <div className="mt-6 md:mt-8">
                  <FaqAccordion
                    items={page.faqItems.map((item) => ({
                      question: item.question,
                      answer: renderInline(item.answer),
                    }))}
                  />
                </div>
              </section>
            ) : null}

            {page.related.length > 0 ? (
              <section id="related" className="mt-16 md:mt-20">
                <h2
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
                >
                  Related questions
                </h2>
                <ul className="divide-y divide-[var(--md-sys-color-outline-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
                  {page.related.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="group block py-4">
                        <span className="font-semibold text-[var(--md-sys-color-on-surface)] transition-colors group-hover:text-[var(--md-sys-color-primary)]">
                          {link.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <MarkdownTwinLink path={path} title={page.question} />

            <div className="mt-16 rounded-3xl border-2 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] px-6 py-8 text-center md:mt-20 md:px-10 md:py-10">
              <p className="text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
                Run the outreach from your own LinkedIn account
              </p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
                Omentir finds ICP-fit buyers, drafts connection notes and messages, and keeps
                replies in one inbox. You still choose the daily send limits.
              </p>
              <Link
                href="/signup"
                className="m3-btn m3-btn-filled-secondary mt-6 inline-flex h-11 cursor-pointer px-6 text-sm"
              >
                Try Omentir
              </Link>
            </div>
          </article>
        </div>
        <MarketingFooter />
      </main>
    </>
  );
}
