import type { MetadataRoute } from "next";
import { ALL_BLOGS, isBlogLive, liveBlogs } from "./blogs/blog-data";
import { ALL_COMPARISONS } from "./comparisons/comparison-data";
import { ALL_FEATURES } from "./features/feature-data";
import { ALL_INTEGRATIONS } from "./integrations/integration-data";
import { liveSeoPages, type SeoContentPage } from "./seo-content/types";
import { markdownPathFromHtmlPath } from "@/lib/public-page-markdown";
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
  { path: "/", changeFrequency: "weekly", priority: 1.0, lastModified: "2026-07-18" },
  { path: "/blogs", changeFrequency: "weekly", priority: 0.9 },
  { path: "/comparisons", changeFrequency: "monthly", priority: 0.85 },
  { path: "/integrations", changeFrequency: "monthly", priority: 0.85 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-07-16" },
  { path: "/minimum-booking-guarantee", changeFrequency: "monthly", priority: 0.5, lastModified: "2026-08-09" },
  { path: "/for-agents", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-07-22" },
  { path: "/mcp-server", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-07-22" },
  { path: "/about", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-07-17" },
  { path: "/llms.txt", changeFrequency: "weekly", priority: 0.4 },
  { path: "/llms-full.txt", changeFrequency: "weekly", priority: 0.4 },
  { path: "/agents.md", changeFrequency: "monthly", priority: 0.4, lastModified: "2026-07-22" },
  { path: "/agent.json", changeFrequency: "monthly", priority: 0.4, lastModified: "2026-08-12" },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-07-06" },
  { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-07-06" },
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

function seoPageDate(page: SeoContentPage) {
  return new Date(`${page.updatedDate || page.publishedDate} UTC`);
}

// Released posts only: a scheduled post carries a future date, and advertising
// that as the index's lastmod claims a change that has not happened yet.
function latestBlogDate() {
  return ALL_BLOGS.filter((blog) => isBlogLive(blog)).reduce((newest, blog) => {
    const date = blogDate(blog);
    return date > newest ? date : newest;
  }, new Date(0));
}

function latestSeoFamilyDate(pages: readonly SeoContentPage[]) {
  return liveSeoPages(pages).reduce((newest, page) => {
    const date = seoPageDate(page);
    return date > newest ? date : newest;
  }, new Date(0));
}

function seoFamilyRoutes(
  basePath: "/features" | "/comparisons" | "/integrations",
  pages: readonly SeoContentPage[],
  priority: number
): MetadataRoute.Sitemap {
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
  const llmsIndexDate = [
    blogsIndexDate,
    featuresIndexDate,
    comparisonsIndexDate,
    integrationsIndexDate,
  ].reduce((newest, date) => (date > newest ? date : newest), new Date(0));

  const derivedIndexDates: Record<string, Date> = {
    "/blogs": blogsIndexDate,
    "/llms.txt": llmsIndexDate,
    "/llms-full.txt": llmsIndexDate,
    "/comparisons": comparisonsIndexDate,
    "/integrations": integrationsIndexDate,
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
  const comparisonRoutes = seoFamilyRoutes("/comparisons", ALL_COMPARISONS, 0.7);
  const integrationRoutes = seoFamilyRoutes("/integrations", ALL_INTEGRATIONS, 0.7);

  const htmlRoutes = [
    ...mainRoutes,
    ...blogRoutes,
    ...featureRoutes,
    ...comparisonRoutes,
    ...integrationRoutes,
  ];

  // Markdown twins are how AI agents read the same public pages without
  // scraping HTML. Same lastmod as the HTML source: the text is derived.
  const markdownRoutes = htmlRoutes.flatMap((route) => {
    const path = new URL(route.url).pathname;
    const markdownPath = markdownPathFromHtmlPath(path === "/" ? "/" : path);
    if (!markdownPath) return [];
    return [
      {
        url: absoluteUrl(markdownPath),
        lastModified: route.lastModified,
        changeFrequency: route.changeFrequency,
        priority: Math.max(0.2, Number((route.priority * 0.5).toFixed(2))),
      },
    ];
  });

  return [...htmlRoutes, ...markdownRoutes];
}
