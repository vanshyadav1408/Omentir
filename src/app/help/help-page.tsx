import Link from "next/link";
import type { ReactNode } from "react";
import FaqAccordion from "../faq-accordion";
import JsonLd from "../json-ld";
import {
  articlePathCrumbs,
  CalCtaPanel,
  CalLinkCards,
  CalPageHero,
  MarketingFooter,
  MarketingHeader,
} from "../marketing-shell";
import {
  createBreadcrumbJsonLd,
  createFAQJsonLd,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";
import { agentPasteTarget } from "../agent-paste-target";
import GrokBotSetupBlock, { PromptCopyBox } from "../grok-bot-setup-block";
import { MarkdownTwinLink } from "../seo-content/shared";
import SquircleIcon from "../squircle-icon";
import { CLUSTER_ICON, HELP_CLUSTER_LABELS, type HelpPage } from "./types";

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
        <CalPageHero
          crumbs={articlePathCrumbs("help", page.slug)}
          leading={
            <>
            <Link href={`/help#${page.cluster}`} className="cal-post-tag cal-post-tag-link mb-5">
              <SquircleIcon icon={CLUSTER_ICON[page.cluster][0]} tone={CLUSTER_ICON[page.cluster][1]} size={18} />
              {HELP_CLUSTER_LABELS[page.cluster]}
            </Link>
            </>
          }
          title={page.question}
        />
        <article className="cal-read cal-read-moderate">
          {/* The first paragraph is the direct answer: set apart as a card so
              the answer is the first thing you see. */}
          {page.paragraphs[0] ? (
            <p className="cal-answer">{renderInline(page.paragraphs[0])}</p>
          ) : null}
          <div className="mt-8 space-y-5 text-[1.0625rem] leading-8 text-[var(--site-text)]">
            {page.paragraphs.slice(1).map((paragraph, index) => (
              <p key={index}>{renderInline(paragraph)}</p>
            ))}
          </div>

          {page.prompt ? (
            <section id="paste-prompt" className="mt-12 md:mt-16">
              <h2 className="cal-read-h2">
                Paste this into {agentPasteTarget(page.slug) ?? "Grok Bot"}
              </h2>
              {agentPasteTarget(page.slug) ? (
                <PromptCopyBox
                  prompt={page.prompt}
                  label={`Paste into ${agentPasteTarget(page.slug)}`}
                />
              ) : (
                <GrokBotSetupBlock prompt={page.prompt} />
              )}
            </section>
          ) : null}

          {page.faqItems.length > 0 ? (
            <section id="faq" className="mt-16 md:mt-20">
              <h2 className="cal-read-h2">Frequently asked questions</h2>
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
              <h2 className="cal-read-h2">Related questions</h2>
              <div className="mt-6">
                <CalLinkCards links={page.related} />
              </div>
            </section>
          ) : null}

          <MarkdownTwinLink path={path} title={page.question} />

          <CalCtaPanel />
        </article>
        <MarketingFooter />
      </main>
    </>
  );
}
