import { createClient } from "@sanity/client";
import { ALL_ALTERNATIVES } from "../src/app/alternatives/alternative-data";
import { ALL_BLOGS } from "../src/app/blogs/blog-data";
import { ALL_COMPARISONS } from "../src/app/comparisons/comparison-data";
import { ALL_FEATURES } from "../src/app/features/feature-data";
import { ALL_GUIDES } from "../src/app/guides/guide-data";
import { ALL_HELP_PAGES } from "../src/app/help/help-data";
import type { HelpPageDraft } from "../src/app/help/types";
import { ALL_INTEGRATIONS } from "../src/app/integrations/integration-data";
import { integrationConnect } from "../src/app/integrations/integration-connect";
import { ALL_USE_CASES } from "../src/app/use-cases/use-case-data";
import { whoForUseCase } from "../src/app/use-cases/use-case-who";
import { LOCAL_LEGAL_PAGES } from "../src/lib/cms/local-legal";
import { localBlogs } from "../src/lib/cms/fallback";
import { blogFromSource } from "../src/lib/cms/blog-from-source";
import type { SeoContentPage } from "../src/app/seo-content/types";

const LANDING_VARIANT: Record<string, string> = {
  "grok-bot-sales-outreach": "sales",
  "grok-bot-cold-messages": "cold",
  "grok-bot-linkedin-automation": "automation",
  "overnight-outbound-with-grok-bot": "overnight",
  "grok-bot-lead-generation": "lead-gen",
  "grok-bot-follow-up-messages": "follow-up",
  "claude-code-sales-outreach": "claude-code",
  "cursor-sales-outreach": "cursor",
  "codex-sales-outreach": "codex",
};

const dryRun = process.argv.includes("--dry-run");
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN || "";

if (!dryRun && (!projectId || !token)) {
  console.error(
    "Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN before migrating, or pass --dry-run."
  );
  process.exit(1);
}

function slugValue(current: string) {
  return { _type: "slug" as const, current };
}

function seoDoc(family: string, page: SeoContentPage) {
  const connect =
    family === "integrations"
      ? (() => {
          try {
            return integrationConnect(page.slug);
          } catch {
            return undefined;
          }
        })()
      : undefined;
  const who =
    family === "use-cases"
      ? (() => {
          try {
            return whoForUseCase(page.slug).who;
          } catch {
            return undefined;
          }
        })()
      : undefined;
  return {
    _id: `seo.${family}.${page.slug}`,
    _type: "seoPage",
    family,
    slug: slugValue(page.slug),
    title: page.title,
    description: page.description,
    summary: page.summary,
    publishedDate: page.publishedDate,
    updatedDate: page.updatedDate,
    keywords: page.keywords,
    layout: page.layout,
    verdict: page.verdict,
    highlights: page.highlights,
    who,
    connect,
    sections: page.sections,
    faqItems: page.faqItems,
    relatedLinks: page.relatedLinks,
    setupSteps: page.setupSteps,
    comparisonTable: page.comparisonTable,
    roundupItems: page.roundupItems,
    phases: page.phases,
    thread: page.thread,
    ctaTitle: page.ctaTitle,
    ctaBody: page.ctaBody,
    primaryCta: page.primaryCta,
    secondaryCta: page.secondaryCta,
  };
}

function helpDrafts(): HelpPageDraft[] {
  return ALL_HELP_PAGES.map((page) => ({
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
    relatedSlugs: page.related.map((item) => item.href.replace(/^\/help\//, "")),
  }));
}

function buildDocuments() {
  const docs: Array<Record<string, unknown>> = [];

  for (const page of ALL_FEATURES) docs.push(seoDoc("features", page));
  for (const page of ALL_COMPARISONS) docs.push(seoDoc("comparisons", page));
  for (const page of ALL_INTEGRATIONS) docs.push(seoDoc("integrations", page));
  for (const page of ALL_USE_CASES) docs.push(seoDoc("use-cases", page));
  for (const page of ALL_ALTERNATIVES) docs.push(seoDoc("alternatives", page));

  for (const page of helpDrafts()) {
    docs.push({
      _id: `help.${page.slug}`,
      _type: "helpArticle",
      slug: slugValue(page.slug),
      question: page.question,
      description: page.description,
      keywords: page.keywords,
      cluster: page.cluster,
      publishedDate: page.publishedDate,
      updatedDate: page.updatedDate,
      paragraphs: page.paragraphs,
      prompt: page.prompt,
      faqItems: page.faqItems,
      relatedSlugs: page.relatedSlugs,
    });
  }

  for (const page of ALL_GUIDES) {
    docs.push({
      _id: `guide.${page.slug}`,
      _type: "guide",
      slug: slugValue(page.slug),
      title: page.title,
      description: page.description,
      query: page.query,
      kicker: page.kicker,
      cluster: page.cluster,
      landingVariant: LANDING_VARIANT[page.slug] || "",
      publishedDate: page.publishedDate,
      updatedDate: page.updatedDate,
      keywords: page.keywords,
      sections: page.sections,
      faqItems: page.faqItems,
      related: page.related,
      relatedHeading: page.relatedHeading,
    });
  }

  for (const page of LOCAL_LEGAL_PAGES) {
    docs.push({
      _id: `legal.${page.slug}`,
      _type: "legalPage",
      slug: page.slug,
      title: page.title,
      description: page.description,
      lede: page.lede,
      keywords: page.keywords,
      updatedDate: page.updatedDate,
      sections: page.sections,
    });
  }

  const blogMeta = localBlogs();
  for (const blog of ALL_BLOGS) {
    const extracted = blogFromSource(blog.slug);
    const meta = blogMeta.find((item) => item.slug === blog.slug);
    docs.push({
      _id: `blog.${blog.slug}`,
      _type: "blogPost",
      slug: slugValue(blog.slug),
      title: blog.title,
      description: blog.description,
      publishedDate: blog.publishedDate,
      updatedDate: blog.updatedDate,
      category: blog.category,
      readTime: blog.readTime,
      bannerSrc: blog.bannerSrc,
      bannerAlt: blog.bannerAlt,
      keywords: extracted?.keywords ?? [],
      body: extracted?.body ?? [],
      faqItems: extracted?.faqItems ?? [],
      featuredInLlms: meta?.featuredInLlms ?? false,
      highIntent: meta?.highIntent ?? false,
    });
  }

  return docs;
}

function assertReady(docs: Array<Record<string, unknown>>) {
  const emptyBlogs = docs.filter(
    (doc) => doc._type === "blogPost" && (!Array.isArray(doc.body) || doc.body.length === 0)
  );
  const emptySeo = docs.filter(
    (doc) => doc._type === "seoPage" && (!Array.isArray(doc.sections) || doc.sections.length === 0)
  );
  const emptyHelp = docs.filter(
    (doc) =>
      doc._type === "helpArticle" && (!Array.isArray(doc.paragraphs) || doc.paragraphs.length === 0)
  );
  const emptyLegal = docs.filter(
    (doc) => doc._type === "legalPage" && (!Array.isArray(doc.sections) || doc.sections.length === 0)
  );
  const problems = [
    ...emptyBlogs.map((doc) => `empty blog body: ${doc._id}`),
    ...emptySeo.map((doc) => `empty seo sections: ${doc._id}`),
    ...emptyHelp.map((doc) => `empty help paragraphs: ${doc._id}`),
    ...emptyLegal.map((doc) => `empty legal sections: ${doc._id}`),
  ];
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
}

function countByType(docs: Array<Record<string, unknown>>) {
  const counts = new Map<string, number>();
  for (const doc of docs) {
    const type = String(doc._type);
    const family = typeof doc.family === "string" ? `${type}:${doc.family}` : type;
    counts.set(family, (counts.get(family) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
}

async function migrate() {
  const docs = buildDocuments();
  assertReady(docs);
  for (const [label, count] of countByType(docs)) {
    console.log(`${label}: ${count}`);
  }
  console.log(`total: ${docs.length}`);

  if (dryRun) {
    console.log("Dry run complete. No documents were written.");
    return;
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-08-30",
    token,
    useCdn: false,
  });

  console.log(`Migrating ${docs.length} documents to ${projectId}/${dataset}`);
  const batchSize = 50;
  for (let index = 0; index < docs.length; index += batchSize) {
    const slice = docs.slice(index, index + batchSize);
    const tx = client.transaction();
    for (const doc of slice) tx.createOrReplace(doc as never);
    await tx.commit({ autoGenerateArrayKeys: true, visibility: "async" });
    console.log(`Committed ${Math.min(index + batchSize, docs.length)} / ${docs.length}`);
  }
  console.log("Sanity migration complete.");
}

await migrate();
