import type { MetadataRoute } from "next";
import { ALL_ALTERNATIVES } from "./alternatives/alternative-data";
import { ALL_BLOGS, isBlogLive, liveBlogs } from "./blogs/blog-data";
import { ALL_COMPARISONS } from "./comparisons/comparison-data";
import { ALL_FEATURES } from "./features/feature-data";
import { ALL_GUIDES } from "./guides/guide-data";
import { ALL_HELP_PAGES } from "./help/help-data";
import { ALL_INTEGRATIONS } from "./integrations/integration-data";
import { ALL_TOOLS } from "./tools/tools-data";
import { ALL_USE_CASES } from "./use-cases/use-case-data";
import { liveSeoPages } from "./seo-content/types";
import { siteUrl } from "./seo";

// Blog visibility and modification dates come from blog-data. Rebuild daily so
// the sitemap and its machine-readable blog directory stay aligned with it.
export const revalidate = 86400;

// `lastModified` is hardcoded per route rather than set to build time on
// purpose: stamping `new Date()` would tell crawlers every page changed on
// every deploy, and Google discounts a lastmod signal it finds inaccurate.
// Bump a route's date when that page's content meaningfully changes.
// `/blogs` and `/llms.txt` are exceptions: both are derived below from the
// newest post, which is genuinely when those generated indexes last changed.
// Comparison and integration indexes use the newest live child page.
const publicRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1.0, lastModified: "2026-08-17" },
  { path: "/blogs", changeFrequency: "weekly", priority: 0.9 },
  { path: "/features", changeFrequency: "monthly", priority: 0.85 },
  { path: "/tools", changeFrequency: "monthly", priority: 0.8 },
  { path: "/comparisons", changeFrequency: "monthly", priority: 0.85 },
  { path: "/alternatives", changeFrequency: "monthly", priority: 0.85 },
  { path: "/use-cases", changeFrequency: "monthly", priority: 0.85 },
  { path: "/integrations", changeFrequency: "monthly", priority: 0.85 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-08-12" },
  { path: "/minimum-booking-guarantee", changeFrequency: "monthly", priority: 0.5, lastModified: "2026-08-09" },
  { path: "/about", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-07-17" },
  { path: "/help", changeFrequency: "weekly", priority: 0.7, lastModified: "2026-08-23" },
  { path: "/llms.txt", changeFrequency: "weekly", priority: 0.4 },
  { path: "/llms-full.txt", changeFrequency: "weekly", priority: 0.4 },
  { path: "/agents.md", changeFrequency: "monthly", priority: 0.4, lastModified: "2026-08-22" },
  { path: "/agent.json", changeFrequency: "monthly", priority: 0.4, lastModified: "2026-08-22" },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-07-06" },
  { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-08-09" },
] as const satisfies ReadonlyArray<{
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
  lastModified?: string;
}>;

// Parsed as UTC to match the article JSON-LD; reading these bare calendar days
// as local time makes lastmod disagree with datePublished by a day on any
// server east of UTC.
function blogDate(blog: (typeof ALL_BLOGS)[number]) {
  return new Date(`${blog.updatedDate || blog.publishedDate} UTC`);
}

function seoPageDate(page: { publishedDate: string; updatedDate: string }) {
  return new Date(`${page.updatedDate || page.publishedDate} UTC`);
}

function latestToolDate() {
  return ALL_TOOLS.reduce((newest, tool) => {
    const date = seoPageDate(tool);
    return date > newest ? date : newest;
  }, new Date(0));
}

// Released posts only: a scheduled post carries a future date, and advertising
// that as the index's lastmod claims a change that has not happened yet.
function latestBlogDate() {
  return ALL_BLOGS.filter((blog) => isBlogLive(blog)).reduce((newest, blog) => {
    const date = blogDate(blog);
    return date > newest ? date : newest;
  }, new Date(0));
}

function latestSeoFamilyDate(pages: readonly { publishedDate: string; updatedDate: string }[]) {
  return liveSeoPages(pages).reduce((newest, page) => {
    const date = seoPageDate(page);
    return date > newest ? date : newest;
  }, new Date(0));
}

function seoFamilyRoutes(
  basePath: "/features" | "/comparisons" | "/integrations" | "/use-cases" | "/alternatives",
  pages: readonly { slug: string; publishedDate: string; updatedDate: string }[],
  priority: number
) {
  return liveSeoPages(pages).map((page) => ({
    url: absoluteUrl(`${basePath}/${page.slug}`),
    lastModified: seoPageDate(page),
    changeFrequency: "monthly" as const,
    priority,
  }));
}

const highIntentBlogSlugs = new Set([
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

function absoluteUrl(path: string) {
  // Keep the sitemap's root spelling identical to the canonical root emitted
  // by Next metadata. Every other public path already has one leading slash.
  return path === "/" ? siteUrl : `${siteUrl}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const blogsIndexDate = latestBlogDate();
  const featuresIndexDate = latestSeoFamilyDate(ALL_FEATURES);
  const comparisonsIndexDate = latestSeoFamilyDate(ALL_COMPARISONS);
  const integrationsIndexDate = latestSeoFamilyDate(ALL_INTEGRATIONS);
  const useCasesIndexDate = latestSeoFamilyDate(ALL_USE_CASES);
  const alternativesIndexDate = latestSeoFamilyDate(ALL_ALTERNATIVES);
  const helpIndexDate = ALL_HELP_PAGES.reduce((newest, page) => {
    const date = new Date(`${page.updatedDate || page.publishedDate} UTC`);
    return date > newest ? date : newest;
  }, new Date(0));
  const llmsIndexDate = [
    blogsIndexDate,
    featuresIndexDate,
    comparisonsIndexDate,
    integrationsIndexDate,
    useCasesIndexDate,
    alternativesIndexDate,
    helpIndexDate,
    latestToolDate(),
  ].reduce((newest, date) => (date > newest ? date : newest), new Date(0));

  const derivedIndexDates: Record<string, Date> = {
    "/blogs": blogsIndexDate,
    "/llms.txt": llmsIndexDate,
    "/llms-full.txt": llmsIndexDate,
    "/features": featuresIndexDate,
    "/comparisons": comparisonsIndexDate,
    "/integrations": integrationsIndexDate,
    "/use-cases": useCasesIndexDate,
    "/alternatives": alternativesIndexDate,
    "/help": helpIndexDate,
    "/tools": latestToolDate(),
  };

  const mainRoutes = publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified:
      derivedIndexDates[route.path] ??
      new Date("lastModified" in route ? route.lastModified : "1970-01-01"),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Scheduled posts are deliberately absent: listing a page as noindex in the
  // sitemap asks a crawler to fetch what it is then told to ignore.
  const blogRoutes = liveBlogs().map((blog) => ({
    url: absoluteUrl(`/blogs/${blog.slug}`),
    lastModified: blogDate(blog),
    images: [`${siteUrl}${blog.bannerSrc}`],
    changeFrequency: "monthly" as const,
    priority: highIntentBlogSlugs.has(blog.slug) ? 0.75 : 0.6,
  }));

  // Same live-only rule for hand-curated SEO families (features, comparisons,
  // integrations). Future-dated entries stay out of the sitemap.
  const featureRoutes = seoFamilyRoutes("/features", ALL_FEATURES, 0.7);
  const comparisonRoutes = seoFamilyRoutes("/comparisons", ALL_COMPARISONS, 0.75);
  const integrationRoutes = seoFamilyRoutes("/integrations", ALL_INTEGRATIONS, 0.7);
  const useCaseRoutes = seoFamilyRoutes("/use-cases", ALL_USE_CASES, 0.75);
  const alternativeRoutes = seoFamilyRoutes("/alternatives", ALL_ALTERNATIVES, 0.75);

  const guideRoutes = ALL_GUIDES.map((page) => ({
    url: absoluteUrl(`/${page.slug}`),
    lastModified: new Date(`${page.updatedDate || page.publishedDate} UTC`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const helpRoutes = ALL_HELP_PAGES.map((page) => ({
    url: absoluteUrl(`/help/${page.slug}`),
    lastModified: new Date(`${page.updatedDate || page.publishedDate} UTC`),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  const toolRoutes = ALL_TOOLS.map((tool) => ({
    url: absoluteUrl(tool.href),
    lastModified: seoPageDate(tool),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Canonical HTML and machine indexes only. Google and Bing both treat a
  // sitemap as the list of URLs to index. Markdown twins stay at `.md` URLs
  // for agents, with a canonical back to the HTML page. Listing those twins
  // here would ask both engines to index duplicate URLs. That wastes Google
  // crawl budget and is the pattern Bing often parks as discovered-not-indexed.
  return [
    ...mainRoutes,
    ...blogRoutes,
    ...featureRoutes,
    ...comparisonRoutes,
    ...integrationRoutes,
    ...useCaseRoutes,
    ...alternativeRoutes,
    ...guideRoutes,
    ...helpRoutes,
    ...toolRoutes,
  ];
}
