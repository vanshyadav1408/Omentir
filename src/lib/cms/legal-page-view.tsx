import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "@/app/json-ld";
import { MarketingArticle } from "@/app/marketing-shell";
import {
  createBreadcrumbJsonLd,
  createWebPageJsonLd,
  siteUrl,
} from "@/app/seo";
import type { CmsLegalPage } from "@/lib/cms/types";

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
          className="font-medium text-[var(--md-sys-color-primary)] underline underline-offset-4"
        >
          {match[1]}
        </a>
      );
    }
    return (
      <Link
        key={index}
        href={href}
        className="font-medium text-[var(--md-sys-color-primary)] underline underline-offset-4"
      >
        {match[1]}
      </Link>
    );
  });
}

export function LegalPageView({ page }: { page: CmsLegalPage }) {
  const path = `/${page.slug}`;
  const jsonLd = [
    createWebPageJsonLd({
      name: page.title,
      description: page.lede || page.description,
      url: `${siteUrl}${path}`,
      dateModified: page.updatedDate,
    }),
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: page.title, url: `${siteUrl}${path}` },
    ]),
  ];

  return (
    <>
      <JsonLd id={`${page.slug}-jsonld`} data={jsonLd} />
      <MarketingArticle
        path={page.slug}
        title={page.title}
        description={page.lede || page.description}
        updated={page.updatedDate}
      >
        <div className="space-y-10">
          {page.sections.map((section) => (
            <section key={section.title}>
              <h2
                style={{ fontFamily: "var(--font-varta)" }}
                className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
              >
                {section.title}
              </h2>
              <p className="mt-4 text-base font-medium leading-8 text-[var(--md-sys-color-on-surface)]">
                {renderInline(section.body)}
              </p>
            </section>
          ))}
        </div>
      </MarketingArticle>
    </>
  );
}
