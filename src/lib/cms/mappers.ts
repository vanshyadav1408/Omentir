import type { PortableTextBlock } from "@portabletext/types";
import { HELP_CLUSTER_ORDER, type HelpCluster, type HelpPage } from "@/app/help/types";
import type { GuideCluster } from "@/app/guides/types";
import type {
  SeoComparisonTable,
  SeoFamily,
  SeoLayout,
  SeoPhase,
  SeoRelatedLink,
  SeoRoundupItem,
  SeoSection,
  SeoSetupStep,
  SeoThreadLine,
} from "@/app/seo-content/types";
import {
  bool,
  optionalText,
  strings,
  text,
  type CmsBlogPost,
  type CmsGuidePage,
  type CmsLegalPage,
  type CmsSeoPage,
  type SeoConnect,
} from "./types";
import { sanityImageUrl } from "@/sanity/lib/image";

const FAMILIES = new Set<SeoFamily>([
  "features",
  "comparisons",
  "integrations",
  "use-cases",
  "alternatives",
]);

const LAYOUTS = new Set<SeoLayout>([
  "split",
  "faceoff",
  "timeline",
  "roundup",
  "thread",
  "phases",
  "article",
]);

const HELP_CLUSTERS = new Set<HelpCluster>(HELP_CLUSTER_ORDER);
const GUIDE_CLUSTERS = new Set<GuideCluster>(["linkedin", "b2b", "email", "general"]);

function cmsRemoteSrc(source: unknown, url: unknown, width?: number) {
  return sanityImageUrl(source, width) || sanityImageUrl(url, width) || "";
}

function mapOgImage(source: unknown, url: unknown, alt: unknown, title: string) {
  const src = cmsRemoteSrc(source, url, 1536);
  if (!src) return undefined;
  return {
    url: src,
    width: 1536,
    height: 1024,
    alt: text(alt, title),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function mapFaq(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const question = text(row.question);
      const answer = text(row.answer);
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is { question: string; answer: string } => Boolean(item));
}

function mapRelated(value: unknown): SeoRelatedLink[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const links = value
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const label = text(row.label);
      const href = text(row.href);
      if (!label || !href) return null;
      const link: SeoRelatedLink = { label, href };
      const description = optionalText(row.description);
      if (description) link.description = description;
      return link;
    })
    .filter((item): item is SeoRelatedLink => item !== null);
  return links.length ? links : undefined;
}

function mapSections(value: unknown): SeoSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const heading = text(row.heading);
      const paragraphs = strings(row.paragraphs);
      if (!heading || paragraphs.length === 0) return null;
      const bullets = strings(row.bullets);
      const section: SeoSection = {
        id: text(row.id, heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
        heading,
        paragraphs,
      };
      if (bullets.length) section.bullets = bullets;
      const code = optionalText(row.code);
      if (code) section.code = code;
      return section;
    })
    .filter((item): item is SeoSection => item !== null);
}

function mapSetup(value: unknown): SeoSetupStep[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const steps = value
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const title = text(row.title);
      const description = text(row.description);
      if (!title || !description) return null;
      return { title, description };
    })
    .filter((item): item is SeoSetupStep => Boolean(item));
  return steps.length ? steps : undefined;
}

function mapTable(value: unknown): SeoComparisonTable | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const headers = strings(row.headers);
  if (!headers.length || !Array.isArray(row.rows)) return undefined;
  const rows = row.rows
    .map((item) => {
      const cell = asRecord(item);
      if (!cell) return null;
      const dimension = text(cell.dimension);
      const cells = strings(cell.cells);
      if (!dimension || cells.length === 0) return null;
      return { dimension, cells };
    })
    .filter((item): item is { dimension: string; cells: string[] } => Boolean(item));
  if (!rows.length) return undefined;
  return { headers, rows };
}

function mapRoundup(value: unknown): SeoRoundupItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const name = text(row.name);
      const bestFor = text(row.bestFor);
      const watchFor = text(row.watchFor);
      if (!name || !bestFor || !watchFor) return null;
      const entry: SeoRoundupItem = { name, bestFor, watchFor };
      const href = optionalText(row.href);
      if (href) entry.href = href;
      return entry;
    })
    .filter((item): item is SeoRoundupItem => item !== null);
  return items.length ? items : undefined;
}

function mapPhases(value: unknown): SeoPhase[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const title = text(row.title);
      const detail = text(row.detail);
      if (!title || !detail) return null;
      return { title, detail };
    })
    .filter((item): item is SeoPhase => Boolean(item));
  return items.length ? items : undefined;
}

function mapThread(value: unknown): SeoThreadLine[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const speaker = text(row.speaker);
      const line = text(row.text);
      if ((speaker !== "you" && speaker !== "them" && speaker !== "draft") || !line) {
        return null;
      }
      return { speaker, text: line };
    })
    .filter((item): item is SeoThreadLine => Boolean(item));
  return items.length ? items : undefined;
}

function mapCta(value: unknown) {
  const row = asRecord(value);
  if (!row) return undefined;
  const label = text(row.label);
  const href = text(row.href);
  if (!label || !href) return undefined;
  return { label, href };
}

function mapConnect(value: unknown): SeoConnect | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const surface = text(row.surface);
  const auth = text(row.auth);
  const bestFor = text(row.bestFor);
  if (!surface || !auth || !bestFor) return undefined;
  return { surface, auth, bestFor };
}

export function mapSeoPage(value: unknown, family: SeoFamily): CmsSeoPage | null {
  const row = asRecord(value);
  if (!row) return null;
  const slug = text(row.slug);
  const title = text(row.title);
  const description = text(row.description);
  const summary = text(row.summary);
  const publishedDate = text(row.publishedDate);
  const updatedDate = text(row.updatedDate, publishedDate);
  const sections = mapSections(row.sections);
  if (!slug || !title || !description || !summary || !publishedDate || sections.length === 0) {
    return null;
  }
  const layout = text(row.layout);
  const page: CmsSeoPage = {
    slug,
    title,
    description,
    summary,
    publishedDate,
    updatedDate,
    keywords: strings(row.keywords),
    sections,
    faqItems: mapFaq(row.faqItems),
    relatedLinks: mapRelated(row.relatedLinks),
    comparisonTable: mapTable(row.comparisonTable),
    setupSteps: mapSetup(row.setupSteps),
    highlights: strings(row.highlights).length ? strings(row.highlights) : undefined,
    verdict: optionalText(row.verdict),
    primaryCta: mapCta(row.primaryCta),
    secondaryCta: mapCta(row.secondaryCta),
    ctaTitle: optionalText(row.ctaTitle),
    ctaBody: optionalText(row.ctaBody),
    layout: LAYOUTS.has(layout as SeoLayout) ? (layout as SeoLayout) : undefined,
    roundupItems: mapRoundup(row.roundupItems),
    phases: mapPhases(row.phases),
    thread: mapThread(row.thread),
    who: optionalText(row.who),
    connect: mapConnect(row.connect),
    ogImage: mapOgImage(row.ogImage, row.ogUrl, row.ogAlt, title),
  };
  void family;
  return page;
}

export function isSeoFamily(value: string): value is SeoFamily {
  return FAMILIES.has(value as SeoFamily);
}

export function mapBlogListItem(value: unknown): Omit<CmsBlogPost, "body" | "faqItems"> | null {
  const row = asRecord(value);
  if (!row) return null;
  const slug = text(row.slug);
  const title = text(row.title);
  const description = text(row.description);
  const publishedDate = text(row.publishedDate);
  if (!slug || !title || !description || !publishedDate) return null;
  const banner = asRecord(row.banner);
  return {
    slug,
    title,
    description,
    publishedDate,
    updatedDate: text(row.updatedDate, publishedDate),
    category: text(row.category, "Playbooks"),
    readTime: text(row.readTime, "7 min read"),
    bannerSrc: cmsRemoteSrc(row.banner, row.bannerUrl, 1600) || "",
    bannerAlt: text(row.bannerHotspotAlt) || text(banner?.alt) || text(row.bannerAlt, title),
    keywords: strings(row.keywords),
    featuredInLlms: bool(row.featuredInLlms),
    highIntent: bool(row.highIntent),
  };
}

export function mapBlogPost(value: unknown): CmsBlogPost | null {
  const item = mapBlogListItem(value);
  if (!item) return null;
  const row = asRecord(value);
  return {
    ...item,
    body: Array.isArray(row?.body) ? (row.body as PortableTextBlock[]) : [],
    faqItems: mapFaq(row?.faqItems),
  };
}

export function mapHelpDraft(value: unknown): (HelpPage & { relatedSlugs: string[] }) | null {
  const row = asRecord(value);
  if (!row) return null;
  const slug = text(row.slug);
  const question = text(row.question);
  const description = text(row.description);
  const cluster = text(row.cluster);
  const publishedDate = text(row.publishedDate);
  const paragraphs = strings(row.paragraphs);
  if (
    !slug ||
    !question ||
    !description ||
    !publishedDate ||
    paragraphs.length === 0 ||
    !HELP_CLUSTERS.has(cluster as HelpCluster)
  ) {
    return null;
  }
  return {
    slug,
    question,
    description,
    keywords: strings(row.keywords),
    cluster: cluster as HelpCluster,
    publishedDate,
    updatedDate: text(row.updatedDate, publishedDate),
    paragraphs,
    prompt: optionalText(row.prompt),
    faqItems: mapFaq(row.faqItems),
    related: [],
    relatedSlugs: strings(row.relatedSlugs),
  };
}

export function withHelpRelated(
  drafts: Array<HelpPage & { relatedSlugs: string[] }>
): HelpPage[] {
  const bySlug = new Map(drafts.map((page) => [page.slug, page]));
  return drafts.map((page) => ({
    slug: page.slug,
    question: page.question,
    description: page.description,
    keywords: page.keywords,
    cluster: page.cluster,
    publishedDate: page.publishedDate,
    updatedDate: page.updatedDate,
    paragraphs: page.paragraphs,
    prompt: page.prompt,
    faqItems: page.faqItems,
    related: page.relatedSlugs
      .map((slug) => bySlug.get(slug))
      .filter((item): item is HelpPage & { relatedSlugs: string[] } => Boolean(item))
      .map((item) => ({ label: item.question, href: `/help/${item.slug}` })),
  }));
}

export function mapGuide(value: unknown): CmsGuidePage | null {
  const row = asRecord(value);
  if (!row) return null;
  const slug = text(row.slug);
  const title = text(row.title);
  const description = text(row.description);
  const cluster = text(row.cluster);
  const publishedDate = text(row.publishedDate);
  if (
    !slug ||
    !title ||
    !description ||
    !publishedDate ||
    !GUIDE_CLUSTERS.has(cluster as GuideCluster)
  ) {
    return null;
  }
  const sections = Array.isArray(row.sections)
    ? row.sections
        .map((item) => {
          const section = asRecord(item);
          if (!section) return null;
          const heading = text(section.heading);
          const paragraphs = strings(section.paragraphs);
          if (!heading || paragraphs.length === 0) return null;
          const bullets = strings(section.bullets);
          return {
            heading,
            paragraphs,
            bullets: bullets.length ? bullets : undefined,
            code: optionalText(section.code),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];
  return {
    slug,
    title,
    description,
    query: text(row.query, title),
    kicker: text(row.kicker, cluster),
    cluster: cluster as GuideCluster,
    publishedDate,
    updatedDate: text(row.updatedDate, publishedDate),
    keywords: strings(row.keywords),
    sections,
    faqItems: mapFaq(row.faqItems),
    related: mapRelated(row.related),
    relatedHeading: optionalText(row.relatedHeading),
    ogImage: mapOgImage(row.ogImage, row.ogUrl, row.ogAlt, title),
  };
}

export function mapLegalPage(value: unknown): CmsLegalPage | null {
  const row = asRecord(value);
  if (!row) return null;
  const slug = text(row.slug);
  const title = text(row.title);
  const description = text(row.description);
  const updatedDate = text(row.updatedDate);
  if (!slug || !title || !description || !updatedDate || !Array.isArray(row.sections)) {
    return null;
  }
  const sections = row.sections
    .map((item) => {
      const section = asRecord(item);
      if (!section) return null;
      const heading = text(section.title);
      const body = text(section.body);
      if (!heading || !body) return null;
      return { title: heading, body };
    })
    .filter((item): item is { title: string; body: string } => Boolean(item));
  if (!sections.length) return null;
  return {
    slug,
    title,
    description,
    lede: text(row.lede, description),
    keywords: strings(row.keywords),
    updatedDate,
    sections,
  };
}
