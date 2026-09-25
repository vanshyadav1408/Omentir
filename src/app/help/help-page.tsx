import Link from "next/link";
import type { ReactNode } from "react";
import FaqAccordion from "../faq-accordion";
import JsonLd from "../json-ld";
import {
  ArticleCrumbs,
  articlePathCrumbs,
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
      <main className="site-theme min-h-screen overflow-x-hidden">
        <MarketingHeader transparentAtTop />
        {/* cursor.com article layout: crumbs in a sticky left column. */}
        <div className="omentir-primary-width grid min-w-0 gap-6 pb-20 pt-28 md:grid-cols-[12rem_minmax(0,42rem)] md:gap-16 md:pb-28 md:pt-32 lg:grid-cols-[14rem_minmax(0,42rem)] lg:gap-24">
          <div className="md:sticky md:top-28 md:self-start">
            <ArticleCrumbs crumbs={articlePathCrumbs("help", page.slug)} className="" />
          </div>
          <article className="min-w-0">
            <h1 className="text-[1.75rem] leading-tight tracking-[-0.0125em] text-[var(--site-text)] md:text-[2rem]">
              {page.question}
            </h1>

            <div className="mt-10 space-y-5 text-base leading-7 text-[var(--site-text)]">
              {page.paragraphs.map((paragraph, index) => (
                <p key={index}>{renderInline(paragraph)}</p>
              ))}
            </div>

            {page.prompt ? (
              <section id="paste-prompt" className="mt-12 md:mt-16">
                <h2 className="text-[1.375rem] leading-tight text-[var(--site-text)]">
                  Paste this into Grok Bot
                </h2>
                <GrokBotSetupBlock prompt={page.prompt} />
              </section>
            ) : null}

            {page.faqItems.length > 0 ? (
              <section id="faq" className="mt-16 md:mt-20">
                <h2 className="text-[1.375rem] leading-tight text-[var(--site-text)]">
                  Frequently asked questions
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
                <h2 className="text-sm text-[var(--site-text-2)]">Related questions</h2>
                <ul className="blog-table mt-4">
                  {page.related.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="block px-4 py-3 text-sm text-[var(--site-text)] transition-colors hover:bg-[var(--site-card-2)]">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <MarkdownTwinLink path={path} title={page.question} />

            <div className="mt-16 rounded-[16px] border border-[var(--site-border)] bg-[var(--site-card)] px-6 py-8 md:px-8">
              <p className="text-lg text-[var(--site-text)]">
                Run the outreach from your own LinkedIn account
              </p>
              <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--site-text-2)]">
                Omentir finds ICP-fit buyers, drafts connection notes and messages, and keeps
                replies in one inbox. You still choose the daily send limits.
              </p>
              <Link href="/signup" className="site-btn site-btn-sm site-btn-primary mt-6">
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
