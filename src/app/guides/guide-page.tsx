import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import FaqAccordion from "../faq-accordion";
import JsonLd from "../json-ld";
import {
  ArticleCrumbs,
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
import { guideMedia } from "./guide-media";
import { guideHeroImage, type GuideCluster, type GuidePage } from "./types";
import { GuideTable, GuideVisual } from "./visuals";

const CLUSTER_CRUMB: Record<GuideCluster, string> = {
  linkedin: "linkedin",
  b2b: "b2b",
  email: "email",
  general: "guides",
};

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

function sectionId(heading: string) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function GuidePageView({ page }: { page: GuidePage }) {
  const path = `/${page.slug}`;
  const pageUrl = `${siteUrl}${path}`;
  const banner = guideHeroImage(page.slug);
  const media = guideMedia(page.slug);
  const showFaq = media.faq !== false && page.faqItems.length > 0;
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

  function insertsAfter(index: number) {
    return media.inserts.filter((item) => item.afterIndex === index);
  }

  function renderInserts(index: number) {
    return insertsAfter(index).map((item, insertIndex) => (
      <div key={`${index}-${insertIndex}`}>
        {item.visual && item.caption ? (
          <GuideVisual kind={item.visual} caption={item.caption} />
        ) : null}
        {item.table ? (
          <GuideTable
            caption={item.table.caption}
            headers={item.table.headers}
            rows={item.table.rows}
          />
        ) : null}
      </div>
    ));
  }

  return (
    <>
      <JsonLd id={`guide-${page.slug}-jsonld`} data={jsonLd} />
      <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
        <MarketingHeader transparentAtTop />
        <div className="relative">
          <HeroGridBackdrop height="h-[60vh]" />
          <article className="omentir-secondary-width relative z-10 min-w-0 pb-16 pt-28 md:pb-24 md:pt-32">
            <ArticleCrumbs
              crumbs={[
                { label: "home", href: "/" },
                { label: CLUSTER_CRUMB[page.cluster] },
                { label: page.slug },
              ]}
            />

            <h1
              style={{ fontFamily: "var(--font-varta)" }}
              className="max-w-2xl text-2xl font-semibold leading-snug tracking-tight text-[var(--md-sys-color-on-surface)] md:text-3xl md:leading-snug"
            >
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--md-sys-color-on-surface-variant)]">
              {page.description}
            </p>

            {banner ? (
              <figure className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] md:mt-10">
                <Image
                  src={banner.src}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 768px, calc(100vw - 2rem)"
                  className="object-cover object-center"
                  priority
                />
              </figure>
            ) : null}

            {renderInserts(-1)}

            <div className="mt-12 space-y-10 md:mt-16">
              {page.sections.map((section, sectionIndex) => (
                <section key={section.heading} id={sectionId(section.heading)} className="scroll-mt-28">
                  <h2
                    style={{ fontFamily: "var(--font-varta)" }}
                    className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
                  >
                    {section.heading}
                  </h2>
                  <div className="mt-4 space-y-5 text-base font-medium leading-8 text-[var(--md-sys-color-on-surface)]">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={`${section.heading}-${index}`}>{renderInline(paragraph)}</p>
                    ))}
                    {section.bullets?.length ? (
                      <ul className="list-disc space-y-2 pl-5 font-medium text-[var(--md-sys-color-on-surface)]">
                        {section.bullets.map((item) => (
                          <li key={item} className="leading-7">
                            {renderInline(item)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {renderInserts(sectionIndex)}
                </section>
              ))}
            </div>

            {showFaq ? (
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

            {page.related?.length ? (
              <section id="related" className="mt-16 md:mt-20">
                <h2
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
                >
                  Related
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

            <p className="mt-10 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
              Prefer markdown?{" "}
              <a
                href={`${path}.md`}
                className="font-medium text-[var(--md-sys-color-primary)] underline-offset-4 hover:underline"
              >
                {page.title}.md
              </a>
            </p>

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
