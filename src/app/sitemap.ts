import type { MetadataRoute } from "next";
import { ALL_BLOGS, isBlogLive, liveBlogs } from "./blogs/blog-data";
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
const publicRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1.0, lastModified: "2026-07-18" },
  { path: "/blogs", changeFrequency: "weekly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-07-16" },
  { path: "/for-agents", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-07-22" },
  { path: "/mcp-server", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-07-22" },
  { path: "/about", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-07-17" },
  { path: "/llms.txt", changeFrequency: "weekly", priority: 0.4 },
  { path: "/agents.md", changeFrequency: "monthly", priority: 0.4, lastModified: "2026-07-22" },
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

// Released posts only: a scheduled post carries a future date, and advertising
// that as the index's lastmod claims a change that has not happened yet.
function latestBlogDate() {
  return ALL_BLOGS.filter((blog) => isBlogLive(blog)).reduce((newest, blog) => {
    const date = blogDate(blog);
    return date > newest ? date : newest;
  }, new Date(0));
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

export default function sitemap(): MetadataRoute.Sitemap {
  const blogsIndexDate = latestBlogDate();

  const mainRoutes = publicRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified:
      route.path === "/blogs" || route.path === "/llms.txt"
        ? blogsIndexDate
        : new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Scheduled posts are deliberately absent: listing a page as noindex in the
  // sitemap asks a crawler to fetch what it is then told to ignore.
  const blogRoutes = liveBlogs().map((blog) => ({
    url: `${siteUrl}/blogs/${blog.slug}`,
    lastModified: blogDate(blog),
    images: [`${siteUrl}${blog.bannerSrc}`],
    changeFrequency: "monthly" as const,
    priority: highIntentBlogSlugs.has(blog.slug) ? 0.75 : 0.6,
  }));

  return [...mainRoutes, ...blogRoutes];
}
