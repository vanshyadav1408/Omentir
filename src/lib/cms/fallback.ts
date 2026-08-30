import { ALL_ALTERNATIVES } from "@/app/alternatives/alternative-data";
import { ALL_BLOGS, type BlogItem } from "@/app/blogs/blog-data";
import { ALL_COMPARISONS } from "@/app/comparisons/comparison-data";
import { ALL_FEATURES } from "@/app/features/feature-data";
import { ALL_GUIDES } from "@/app/guides/guide-data";
import { ALL_HELP_PAGES } from "@/app/help/help-data";
import { ALL_INTEGRATIONS } from "@/app/integrations/integration-data";
import { integrationConnect } from "@/app/integrations/integration-connect";
import { ALL_USE_CASES } from "@/app/use-cases/use-case-data";
import { whoForUseCase } from "@/app/use-cases/use-case-who";
import type { SeoFamily } from "@/app/seo-content/types";
import type { HelpPage } from "@/app/help/types";
import { LOCAL_LEGAL_PAGES } from "./local-legal";
import { blogFromSource } from "./blog-from-source";
import type { CmsBlogPost, CmsGuidePage, CmsLegalPage, CmsSeoPage } from "./types";

const HIGH_INTENT = new Set([
  "instantly-alternatives-autonomous-ai-salesman",
  "gojiberry-vs-omentir-ai-sales-agent-comparison",
  "apollo-alternatives-programmatic-lead-sourcing",
  "11x-ai-alice-alternatives-autonomous-sales-agents",
  "clay-vs-apollo-data-sourcing-comparison",
  "lusha-vs-omentir-database-vs-active-outreach",
  "artisan-ai-alternatives-multi-channel-sales-agents",
  "smartlead-alternatives-multi-inbox-scaling",
  "instantly-vs-smartlead-vs-omentir-outreach-faceoff",
  "finding-the-right-ai-salesman-2026-buyers-guide",
  "10-linkedin-cold-message-templates-that-actually-book-demos",
  "the-b2b-outreach-copywriting-framework-that-gets-replies",
  "ai-linkedin-prospecting",
  "ai-sdr-linkedin-playbook",
  "agent-api-outreach",
  "agent-led-sales-outreach",
  "b2b-lead-gen-with-ai",
  "chatgpt-linkedin-leads",
  "grok-bot-linkedin-sales",
  "automate-cold-messaging-with-grok-bot",
  "grok-bot-for-sales",
  "grok-bot-vs-chatgpt-for-outbound",
  "grok-bot-vs-claude-for-outbound",
  "grok-bot-linkedin-prompts",
  "claude-code-linkedin-outreach",
  "claude-code-vs-cursor-for-outbound",
  "cursor-linkedin-outreach",
  "codex-linkedin-outreach",
  "chatgpt-connector-linkedin-outreach",
  "claude-chat-linkedin-outreach",
  "grok-com-linkedin-outreach",
  "kimi-linkedin-drafts",
  "gemini-linkedin-drafts",
  "deepseek-linkedin-scoring",
  "qwen-linkedin-drafts",
  "mistral-le-chat-linkedin-drafts",
  "sarvam-linkedin-drafts",
  "hermes-linkedin-drafts",
  "cold-linkedin-outreach",
  "high-intent-linkedin-leads",
  "icp-based-lead-discovery",
  "linkedin-demo-booking",
  "linkedin-lead-scoring",
  "linkedin-outreach-compliance-2026",
  "mcp-linkedin-outreach",
  "mcp-outreach-tools",
  "openclaw-vs-chatgpt-sales",
  "outbound-sales-with-ai",
  "sales-leads-from-linkedin",
  "sales-outreach-automation",
  "setup-autonomous-prospecting-agent",
]);

const LLMS_FEATURED = new Set([
  "introducing-omentir-v2",
  "omentir-is-now-open-source",
  "ai-saas-ready-before-outbound",
  "setup-autonomous-prospecting-agent",
  "how-to-make-the-best-of-your-omentir-subscription",
  "instantly-alternatives-autonomous-ai-salesman",
  "apollo-alternatives-programmatic-lead-sourcing",
  "11x-ai-alice-alternatives-autonomous-sales-agents",
  "artisan-ai-alternatives-multi-channel-sales-agents",
  "smartlead-alternatives-multi-inbox-scaling",
  "gojiberry-vs-omentir-ai-sales-agent-comparison",
  "lusha-vs-omentir-database-vs-active-outreach",
  "clay-vs-apollo-data-sourcing-comparison",
  "instantly-vs-smartlead-vs-omentir-outreach-faceoff",
  "finding-the-right-ai-salesman-2026-buyers-guide",
  "agent-api-outreach",
  "agent-led-sales-outreach",
  "ai-linkedin-prospecting",
  "ai-sdr-linkedin-playbook",
  "b2b-lead-gen-with-ai",
  "high-intent-linkedin-leads",
  "icp-based-lead-discovery",
  "mcp-linkedin-outreach",
  "mcp-outreach-tools",
  "grok-bot-linkedin-sales",
  "automate-cold-messaging-with-grok-bot",
  "grok-bot-for-sales",
  "grok-bot-vs-chatgpt-for-outbound",
  "grok-bot-vs-claude-for-outbound",
  "grok-bot-linkedin-prompts",
  "claude-code-linkedin-outreach",
  "claude-code-vs-cursor-for-outbound",
  "cursor-linkedin-outreach",
  "codex-linkedin-outreach",
  "chatgpt-connector-linkedin-outreach",
  "claude-chat-linkedin-outreach",
  "grok-com-linkedin-outreach",
  "linkedin-outreach-compliance-2026",
  "10-linkedin-cold-message-templates-that-actually-book-demos",
  "the-b2b-outreach-copywriting-framework-that-gets-replies",
]);

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

function withFamilyExtras(family: SeoFamily, pages: readonly CmsSeoPage[]): CmsSeoPage[] {
  return pages.map((page) => {
    if (family === "use-cases" && !page.who) {
      try {
        return { ...page, who: whoForUseCase(page.slug).who };
      } catch {
        return page;
      }
    }
    if (family === "integrations" && !page.connect) {
      try {
        return { ...page, connect: integrationConnect(page.slug) };
      } catch {
        return page;
      }
    }
    return page;
  });
}

const SEO: Record<SeoFamily, readonly CmsSeoPage[]> = {
  features: ALL_FEATURES,
  comparisons: ALL_COMPARISONS,
  integrations: ALL_INTEGRATIONS,
  "use-cases": ALL_USE_CASES,
  alternatives: ALL_ALTERNATIVES,
};

export function localSeoPages(family: SeoFamily): CmsSeoPage[] {
  return withFamilyExtras(family, SEO[family]);
}

export function localSeoPage(family: SeoFamily, slug: string): CmsSeoPage | undefined {
  return localSeoPages(family).find((page) => page.slug === slug);
}

export function localBlogs(): Array<Omit<CmsBlogPost, "body" | "faqItems">> {
  return ALL_BLOGS.map((blog) => ({
    ...blog,
    keywords: [],
    featuredInLlms: LLMS_FEATURED.has(blog.slug),
    highIntent: HIGH_INTENT.has(blog.slug),
  }));
}

export function localBlogMeta(slug: string): Omit<CmsBlogPost, "body" | "faqItems"> | undefined {
  return localBlogs().find((blog) => blog.slug === slug);
}

export function localBlog(slug: string): CmsBlogPost | undefined {
  const meta = localBlogMeta(slug);
  if (!meta) return undefined;
  const extracted = blogFromSource(slug);
  if (!extracted) return undefined;
  return {
    ...meta,
    keywords: extracted.keywords.length ? extracted.keywords : meta.keywords,
    body: extracted.body,
    faqItems: extracted.faqItems,
  };
}

export function localHelpPages(): HelpPage[] {
  return ALL_HELP_PAGES;
}

export function localHelpPage(slug: string): HelpPage | undefined {
  return ALL_HELP_PAGES.find((page) => page.slug === slug);
}

export function localGuides(): CmsGuidePage[] {
  return ALL_GUIDES.map((page) => ({
    ...page,
    landingVariant: LANDING_VARIANT[page.slug],
  }));
}

export function localGuide(slug: string): CmsGuidePage | undefined {
  return localGuides().find((page) => page.slug === slug);
}

export const LOCAL_LEGAL: CmsLegalPage[] = LOCAL_LEGAL_PAGES;

export function localLegalPage(slug: string): CmsLegalPage | undefined {
  return LOCAL_LEGAL_PAGES.find((page) => page.slug === slug);
}

export type { BlogItem };
