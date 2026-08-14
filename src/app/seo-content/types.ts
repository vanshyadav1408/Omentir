import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Hand-curated SEO landing pages for /features, /comparisons, and /integrations.
 *
 * These are not programmatic SEO pages. Each entry is written for a real buyer
 * question, with unique sections and honest tradeoffs. Do not generate thin
 * keyword variants or mass-produce slugs from a template.
 *
 * Copy stays unique per slug. Page chrome is shared so these read as ordinary
 * Omentir marketing pages, not three different landing-page templates.
 */

export type SeoFaqItem = {
  question: string;
  answer: string;
};

export type SeoRelatedLink = {
  label: string;
  href: string;
  description?: string;
};

export type SeoSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type SeoComparisonRow = {
  dimension: string;
  cells: string[];
};

export type SeoComparisonTable = {
  headers: string[];
  rows: SeoComparisonRow[];
};

export type SeoSetupStep = {
  title: string;
  description: string;
};

export type SeoContentPage = {
  slug: string;
  /** Page H1 and base for the document title. */
  title: string;
  /** Meta description and hero lede. */
  description: string;
  /** Short card blurb on the family index. */
  summary: string;
  /**
   * Calendar day this page became publicly readable. Feeds JSON-LD
   * dateModified, sitemap lastmod, and any visible "Updated" line.
   */
  publishedDate: string;
  updatedDate: string;
  keywords: string[];
  sections: SeoSection[];
  faqItems: SeoFaqItem[];
  relatedLinks?: SeoRelatedLink[];
  comparisonTable?: SeoComparisonTable;
  /** Optional setup steps (integrations / features). */
  setupSteps?: SeoSetupStep[];
  /** Short chips under the feature hero. */
  highlights?: string[];
  /** One-line verdict for comparisons. */
  verdict?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Comparison pages only. Keep the closing CTA specific to that matchup. */
  ctaTitle?: string;
  ctaBody?: string;
};

export type SeoFamily = "features" | "comparisons" | "integrations";

export function isSeoPageLive(
  page: SeoContentPage,
  now: Date = new Date()
): boolean {
  const published = new Date(`${page.publishedDate} UTC`);
  if (Number.isNaN(published.getTime())) {
    return true;
  }
  return published.getTime() <= now.getTime();
}

export function liveSeoPages(
  pages: readonly SeoContentPage[],
  now?: Date
): SeoContentPage[] {
  return pages.filter((page) => isSeoPageLive(page, now));
}

export function getSeoPage(
  pages: readonly SeoContentPage[],
  slug: string
): SeoContentPage | undefined {
  return pages.find((page) => page.slug === slug);
}

/**
 * Hero art under public/seo. Prefer AVIF, then PNG, then SVG.
 * Safe to call from server components.
 */
export function seoHeroImage(
  family: SeoFamily,
  slug: string
): { src: string; alt: string } {
  const dir = join(process.cwd(), "public", "seo", family);
  const candidates = [
    { rel: `/seo/${family}/${slug}.avif`, abs: join(dir, `${slug}.avif`) },
    { rel: `/seo/${family}/${slug}.png`, abs: join(dir, `${slug}.png`) },
    { rel: `/seo/${family}/${slug}.svg`, abs: join(dir, `${slug}.svg`) },
  ];
  const match = candidates.find((file) => existsSync(file.abs));
  return {
    src: match?.rel ?? candidates[0].rel,
    alt: `${slug.replace(/-/g, " ")} illustration for Omentir`,
  };
}
