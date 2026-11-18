import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "@/app/json-ld";
import { LegalShell } from "@/app/legal-shell";
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
      <LegalShell
        path={path}
        title={page.title}
        updated={page.updatedDate || undefined}
        lede={page.lede || page.description || undefined}
        // CMS titles carry their own "1. " prefix; the shell numbers sections.
        sections={page.sections.map((section) => ({
          title: section.title.replace(/^\d+\.\s*/, ""),
          paragraphs: [renderInline(section.body)],
        }))}
      />
    </>
  );
}
