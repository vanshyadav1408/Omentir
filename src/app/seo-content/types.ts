/**
 * Sanity-backed SEO landing pages for /features, /comparisons, /integrations,
 * /use-cases, and /alternatives.
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
  /** Paste-ready prompt or other monospaced job spec. */
  code?: string;
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
  /** Use-case directory line. */
  who?: string;
  /** Integration connect matrix. */
  connect?: { surface: string; auth: string; bestFor: string };
  /** CDN hero / Open Graph image from Sanity. */
  ogImage?: {
    url: string;
    width: number;
    height: number;
    alt: string;
  };
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
    return false;
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

export function cmsHeroBanner(page: {
  title: string;
  ogImage?: { url: string; width: number; height: number; alt: string };
}): { src: string; alt: string; width: number; height: number } | null {
  if (!page.ogImage?.url) return null;
  return {
    src: page.ogImage.url,
    alt: page.ogImage.alt || page.title,
    width: page.ogImage.width,
    height: page.ogImage.height,
  };
}
