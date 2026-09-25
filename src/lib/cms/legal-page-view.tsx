import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "@/app/json-ld";
import { MarketingFooter, MarketingHeader } from "@/app/marketing-shell";
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
        <a key={index} href={href} target="_blank" rel="noopener">
          {match[1]}
        </a>
      );
    }
    return (
      <Link key={index} href={href}>
        {match[1]}
      </Link>
    );
  });
}

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

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
      {/* Laid out like cursor.com's legal pages: document list on the left,
          one plain reading column, no hero or sign-up box. */}
      <main className="site-theme min-h-screen overflow-x-hidden">
        <MarketingHeader />
        <div className="omentir-primary-width grid min-w-0 gap-10 pb-20 pt-28 md:grid-cols-[12rem_minmax(0,40rem)] md:gap-16 md:pb-28 md:pt-32 lg:grid-cols-[14rem_minmax(0,40rem)] lg:gap-24">
          <nav aria-label="Legal" className="md:sticky md:top-28 md:self-start">
            <ul className="flex gap-4 text-sm md:flex-col md:gap-1.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={link.href === path ? "page" : undefined}
                    className={
                      link.href === path
                        ? "text-[var(--site-text)]"
                        : "text-[var(--site-text-2)] transition-colors hover:text-[var(--site-text)]"
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <article className="site-legal-body min-w-0">
            <h1 className="text-[1.75rem] font-normal leading-tight tracking-[-0.0125em] md:text-[2rem]">
              {page.title}
            </h1>
            {page.updatedDate ? (
              <p className="mt-2 text-sm text-[var(--site-text-2)]">Last updated {page.updatedDate}</p>
            ) : null}
            {page.lede || page.description ? (
              <p className="mt-8">{page.lede || page.description}</p>
            ) : null}
            {page.sections.map((section) => (
              <section key={section.title} className="mt-8">
                <h2>{section.title}</h2>
                <p className="mt-3">{renderInline(section.body)}</p>
              </section>
            ))}
          </article>
        </div>
        <MarketingFooter />
      </main>
    </>
  );
}
