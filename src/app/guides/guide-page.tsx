import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "../json-ld";
import { MarketingFooter, MarketingHeader } from "../marketing-shell";
import {
  createBreadcrumbJsonLd,
  createFAQJsonLd,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";
import { guideMedia } from "./guide-media";
import { guideHeroImage, type GuidePage } from "./types";
import { GuideTable, GuideVisual } from "./visuals";

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
      <main className="min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
        <MarketingHeader transparentAtTop />
        <article className="relative mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
          <h1
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-4xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-5xl"
          >
            {page.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-[var(--md-sys-color-on-surface-variant)]">{page.description}</p>
          {banner ? (
            <figure className="mt-10 overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
              <Image
                src={banner.src}
                alt={banner.alt}
                width={banner.width}
                height={banner.height}
                sizes="(min-width: 768px) 768px, calc(100vw - 2rem)"
                className="h-auto w-full"
                priority
              />
            </figure>
          ) : null}
          {renderInserts(-1)}
          <div className="mt-12 space-y-10">
            {page.sections.map((section, sectionIndex) => (
              <section key={section.heading}>
                <h2
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight"
                >
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p
                    key={`${section.heading}-${index}`}
                    className="mt-4 text-[17px] leading-8 text-[var(--md-sys-color-on-surface-variant)]"
                  >
                    {renderInline(paragraph)}
                  </p>
                ))}
                {section.bullets?.length ? (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-[17px] leading-8 text-[var(--md-sys-color-on-surface-variant)]">
                    {section.bullets.map((item) => (
                      <li key={item}>{renderInline(item)}</li>
                    ))}
                  </ul>
                ) : null}
                {renderInserts(sectionIndex)}
              </section>
            ))}
          </div>
          {showFaq ? (
            <section className="mt-12">
              <h2
                style={{ fontFamily: "var(--font-varta)" }}
                className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight"
              >
                Common questions
              </h2>
              <div className="mt-4 divide-y divide-[var(--md-sys-color-outline-variant)]">
                {page.faqItems.map((item) => (
                  <details key={item.question} className="group py-4">
                    <summary className="cursor-pointer list-none text-left text-base font-semibold text-[var(--md-sys-color-on-surface)]">
                      {item.question}
                    </summary>
                    <p className="mt-2 text-[17px] leading-8 text-[var(--md-sys-color-on-surface-variant)]">
                      {renderInline(item.answer)}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
          {page.related?.length ? (
            <section className="mt-12">
              <h2
                style={{ fontFamily: "var(--font-varta)" }}
                className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight"
              >
                Related
              </h2>
              <ul className="mt-4 space-y-2">
                {page.related.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-medium text-[var(--md-sys-color-primary)] underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <p className="mt-14 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
            Prefer markdown?{" "}
            <a
              href={`${path}.md`}
              className="font-medium text-[var(--md-sys-color-primary)] underline-offset-4 hover:underline"
            >
              {page.title}.md
            </a>
          </p>
        </article>
        <MarketingFooter />
      </main>
    </>
  );
}
