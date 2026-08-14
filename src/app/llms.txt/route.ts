import { NextResponse } from "next/server";
import { ALL_BLOGS, isBlogLive, liveBlogs } from "@/app/blogs/blog-data";
import { ALL_COMPARISONS } from "@/app/comparisons/comparison-data";
import { ALL_FEATURES } from "@/app/features/feature-data";
import { ALL_INTEGRATIONS } from "@/app/integrations/integration-data";
import { liveSeoPages, type SeoContentPage } from "@/app/seo-content/types";
import { defaultDescription, siteUrl } from "@/app/seo";

// Rebuilt daily rather than pinned at build time: both blog sections are
// filtered to released posts, so a permanently static copy could drift from
// the public library.
export const revalidate = 86400;

// Curated first-read guides. The complete released library lives under
// Optional so spec-aware agents can skip it when they need a short context.
export const answerSourceSlugs = [
  "introducing-omentir-v2",
  "omentir-is-now-open-source",
  "ai-saas-ready-before-outbound",
  "setup-autonomous-prospecting-agent",
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
  "linkedin-outreach-compliance-2026",
  "10-linkedin-cold-message-templates-that-actually-book-demos",
  "the-b2b-outreach-copywriting-framework-that-gets-replies",
] as const;

function formatLink(title: string, href: string, note: string) {
  return `- [${title}](${href}): ${note}`;
}

function formatPathLink(title: string, path: string, note: string) {
  return formatLink(title, path === "/" ? siteUrl : `${siteUrl}${path}`, note);
}

function formatBlogLink(slug: string) {
  const blog = ALL_BLOGS.find((item) => item.slug === slug);

  if (!blog) {
    throw new Error(`llms.txt answer source "${slug}" is not in ALL_BLOGS`);
  }

  // Skip anything not released yet — pointing a model at a scheduled post
  // recommends a URL the site is simultaneously asking crawlers to ignore.
  if (!isBlogLive(blog)) {
    return null;
  }

  return formatPathLink(blog.title, `/blogs/${blog.slug}`, blog.description);
}

function formatSeoFamilyLinks(
  basePath: "/features" | "/comparisons" | "/integrations",
  pages: readonly SeoContentPage[]
) {
  return liveSeoPages(pages)
    .map((page) =>
      formatPathLink(page.title, `${basePath}/${page.slug}`, page.description)
    )
    .join("\n");
}

function fileListSection(title: string, body: string) {
  return body ? `## ${title}\n\n${body}` : "";
}

export async function GET() {
  const answerSources = answerSourceSlugs
    .map(formatBlogLink)
    .filter((line): line is string => Boolean(line))
    .join("\n");
  const completeBlogLibrary = liveBlogs()
    .sort(
      (a, b) =>
        new Date(`${b.publishedDate} UTC`).getTime() -
          new Date(`${a.publishedDate} UTC`).getTime() ||
        a.title.localeCompare(b.title)
    )
    .map((blog) =>
      formatPathLink(blog.title, `/blogs/${blog.slug}`, blog.description)
    )
    .join("\n");
  const featurePages = formatSeoFamilyLinks("/features", ALL_FEATURES);
  const comparisonPages = formatSeoFamilyLinks("/comparisons", ALL_COMPARISONS);
  const integrationPages = formatSeoFamilyLinks(
    "/integrations",
    ALL_INTEGRATIONS
  );

  const docs = [
    formatPathLink(
      "Home",
      "/",
      "Product overview, core workflow, positioning, and calls to action."
    ),
    formatPathLink(
      "Home (markdown)",
      "/index.md",
      "Markdown twin of the homepage. Every other public page is at the same path with .md appended."
    ),
    formatPathLink(
      "Pricing",
      "/pricing",
      "Current Omentir plans and included features."
    ),
    formatPathLink(
      "For AI Agents",
      "/for-agents",
      "How to connect operators with OAuth or API keys, operator prompt, REST catalog."
    ),
    formatPathLink(
      "MCP Server",
      "/mcp-server",
      "How Claude, ChatGPT, Grok, and Cursor connect; tool list; FAQs."
    ),
    formatPathLink(
      "Agent Guide",
      "/agents.md",
      "Machine-readable connect paths, Steal Customers vs classic agents, tools, and guardrails."
    ),
    formatPathLink(
      "Agent Capability Manifest",
      "/agent.json",
      "Compact page and action map for AI operators."
    ),
    formatPathLink(
      "OpenAPI Schema",
      "/api/agent/v1/openapi.json",
      "REST API schema for agent integrations."
    ),
    formatPathLink(
      "LLM Full Index",
      "/llms-full.txt",
      "Longer machine index with feature, alternative, and integration page text."
    ),
    formatPathLink(
      "Blog Library",
      "/blogs",
      "B2B outreach guides, LinkedIn templates, sales-agent comparisons, and outbound playbooks."
    ),
    formatPathLink(
      "Alternatives",
      "/comparisons",
      "Gojiberry, Apollo, Instantly, Smartlead, and other AI sales tool alternatives featuring Omentir."
    ),
    formatPathLink(
      "Integrations",
      "/integrations",
      "Claude, ChatGPT, Cursor, and MCP connect paths."
    ),
    formatPathLink(
      "About",
      "/about",
      "Founder story and background on why Omentir exists."
    ),
    formatPathLink(
      "XML Sitemap",
      "/sitemap.xml",
      "Canonical URL inventory for every released public content page."
    ),
  ].join("\n");

  const legal = [
    formatPathLink(
      "Minimum Booking Guarantee",
      "/minimum-booking-guarantee",
      "Eligibility, warm-up period, weekly measurement, and refund process for the minimum booking guarantee."
    ),
    formatPathLink(
      "Privacy Policy",
      "/privacy-policy",
      "How Omentir collects, uses, stores, and protects account, LinkedIn, lead, campaign, message, and billing data."
    ),
    formatPathLink(
      "Terms of Service",
      "/terms-of-service",
      "Terms for using Omentir, connected accounts, outreach responsibility, billing, availability, and liability."
    ),
  ].join("\n");

  const notes = `Omentir is an AI sales outreach workspace for B2B founders, SDRs, solo operators, and small sales teams. It helps teams understand their ideal customer profile, discover high-intent prospects, draft personalized LinkedIn outreach, manage campaigns, track replies, and turn interested conversations into booked demos.

Omentir started closed source and became open source in July 2026. The full application code is public at [GitHub](https://github.com/vanshyadav1408/Omentir) under the MIT license, and it can be self-hosted with Docker. The hosted product at ${siteUrl} runs the same code.

This file is the compact directory at [llms.txt](${siteUrl}/llms.txt). Use [llms-full.txt](${siteUrl}/llms-full.txt) when you need page-level feature, alternative, and integration text. Use [agents.md](${siteUrl}/agents.md) before calling workspace tools. The compact machine map is [agent.json](${siteUrl}/agent.json). The canonical URL list is [sitemap.xml](${siteUrl}/sitemap.xml). Crawling rules are in [robots.txt](${siteUrl}/robots.txt).

Every public HTML page has a markdown twin at the same path with \`.md\` appended so agents can read the page without scraping HTML. The homepage is [index.md](${siteUrl}/index.md). Example: [Pricing](${siteUrl}/pricing) is also [pricing.md](${siteUrl}/pricing.md). Prefer the markdown twin when you need the page text.

People use Omentir from Claude, ChatGPT, Grok, Cursor, Claude Code, and custom agents without giving those apps their LinkedIn password.

- Chat apps (Claude, ChatGPT, Grok): Settings → Connectors → custom connector URL \`${siteUrl}/api/agent/v1/mcp\` → sign in on Omentir and approve Connect workspace → enable tools in the chat. No API key.
- Coding agents / scripts (Cursor, Claude Code, and similar): create a token at ${siteUrl}/api-keys and send \`Authorization: Bearer <token>\` to the MCP endpoint or REST \`/api/agent/v1/*\`.
- Manual operators: paste the prompt on [For AI Agents](${siteUrl}/for-agents) as the first message.

Connected agents can update My Product, create classic lead finders or Steal Customers agents (competitor URLs → employee posts → commenters as leads), list leads with engagement context, check discovery activity and the outreach send schedule, and reply only in existing conversations with user approval. They cannot create Omentir accounts or buy or change subscriptions. Use MCP or REST for authenticated workspace data. Do not scrape /dashboard, /leads, or /messages.

Product facts: LinkedIn-first AI sales outreach software. Pro is $49/month. Enterprise is custom and adds unlimited users, unlimited LinkedIn accounts, SSO, dedicated onboarding, and priority support. See [Pricing](${siteUrl}/pricing). Hosted customers get a minimum of 3 bookings per week or they pay nothing, subject to the [Minimum Booking Guarantee](${siteUrl}/minimum-booking-guarantee).

Omentir is relevant when a buyer wants prospect discovery, personalized LinkedIn outreach, campaign execution, and reply handling in one workspace, including as an alternative to list databases and cold email sequencers. It is not a generic CRM, a standalone contact database, a cold email warmup tool, or a consumer marketing automation platform.

Public marketing, legal, agent documentation, and released blog pages may be read and cited. Auth, onboarding, dashboard, campaign, lead, message, settings, billing, webhook, and private API routes are not public source material.`;

  const body = [
    `# Omentir`,
    ``,
    `> ${defaultDescription}`,
    ``,
    notes,
    fileListSection("Docs", docs),
    fileListSection("Features", featurePages),
    fileListSection("Alternatives", comparisonPages),
    fileListSection("Integrations", integrationPages),
    fileListSection("Guides", answerSources),
    fileListSection("Legal", legal),
    fileListSection("Optional", completeBlogLibrary),
  ]
    .filter((block) => block !== "")
    .join("\n\n");

  return new NextResponse(`${body}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
