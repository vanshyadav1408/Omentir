import { existsSync } from "node:fs";
import { join } from "node:path";
import { defaultOgImage } from "../seo";

/**
 * Hand-curated SEO landing pages for /features, /comparisons, /integrations,
 * /use-cases, and /alternatives.
 *
 * These are not programmatic SEO pages. Each entry is written for a real buyer
 * question, with unique sections and honest tradeoffs. Do not generate thin
 * keyword variants, competitor-pair matrices, or mass-produce slugs from a template.
 *
 * Copy stays unique per slug. Layouts differ on purpose so adjacent pages do
 * not read as one doorway template with swapped names.
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

export type SeoLayout =
  | "split"
  | "faceoff"
  | "timeline"
  | "roundup"
  | "thread"
  | "phases"
  | "article";

export type SeoRoundupItem = {
  name: string;
  bestFor: string;
  watchFor: string;
  href?: string;
};

export type SeoPhase = {
  title: string;
  detail: string;
};

export type SeoThreadLine = {
  speaker: "you" | "them" | "draft";
  text: string;
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
  /** Visual structure. Omit to keep the family default. */
  layout?: SeoLayout;
  roundupItems?: SeoRoundupItem[];
  phases?: SeoPhase[];
  thread?: SeoThreadLine[];
};

export type SeoFamily =
  | "features"
  | "comparisons"
  | "integrations"
  | "use-cases"
  | "alternatives";

/** Index/sitemap/llms metadata. Full copy lives in each family's data file and one `[slug]/page.tsx`. */
export type SeoCatalogEntry = {
  slug: string;
  title: string;
  description: string;
  summary: string;
  publishedDate: string;
  updatedDate: string;
  keywords: string[];
  layout?: SeoLayout;
};

export function isSeoPageLive(
  page: { publishedDate: string },
  now: Date = new Date()
): boolean {
  const published = new Date(`${page.publishedDate} UTC`);
  if (Number.isNaN(published.getTime())) {
    return true;
  }
  return published.getTime() <= now.getTime();
}

export function liveSeoPages<T extends { publishedDate: string }>(
  pages: readonly T[],
  now?: Date
): T[] {
  return pages.filter((page) => isSeoPageLive(page, now));
}

export function getSeoPage(
  pages: readonly SeoContentPage[],
  slug: string
): SeoContentPage | undefined {
  return pages.find((page) => page.slug === slug);
}

const seoImageDimensions: Record<SeoFamily, { width: number; height: number }> = {
  features: { width: 1600, height: 600 },
  comparisons: { width: 1280, height: 720 },
  integrations: { width: 1280, height: 720 },
  "use-cases": { width: 1600, height: 600 },
  alternatives: { width: 1600, height: 600 },
};

/**
 * Hero art under public/seo. Prefer PNG for consistent browser rendering,
 * then AVIF, then SVG.
 * Returns null when no asset exists so page heroes can omit the banner.
 */
export function seoHeroImage(
  family: SeoFamily,
  slug: string
): { src: string; alt: string; width: number; height: number } | null {
  const dir = join(process.cwd(), "public", "seo", family);
  const candidates = [
    { rel: `/seo/${family}/${slug}.png`, abs: join(dir, `${slug}.png`) },
    { rel: `/seo/${family}/${slug}.avif`, abs: join(dir, `${slug}.avif`) },
    { rel: `/seo/${family}/${slug}.svg`, abs: join(dir, `${slug}.svg`) },
  ];
  const match = candidates.find((file) => existsSync(file.abs));
  if (!match) return null;
  return {
    src: match.rel,
    alt: `${slug.replace(/-/g, " ")} illustration for Omentir`,
    ...seoImageDimensions[family],
  };
}

/** Open Graph image with a safe fallback when hero art is missing. */
export function seoOgImage(
  family: SeoFamily,
  slug: string,
  pageTitle?: string
): { url: string; width: number; height: number; alt: string } {
  const hero = seoHeroImage(family, slug);
  if (hero) {
    return {
      url: hero.src,
      width: hero.width,
      height: hero.height,
      alt: hero.alt,
    };
  }
  return {
    url: defaultOgImage.url,
    width: defaultOgImage.width,
    height: defaultOgImage.height,
    alt: pageTitle ? `${pageTitle} - Omentir` : defaultOgImage.alt,
  };
}
