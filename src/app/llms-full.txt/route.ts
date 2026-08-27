import { NextResponse } from "next/server";
import { ALL_ALTERNATIVES } from "@/app/alternatives/alternative-data";
import { liveBlogs } from "@/app/blogs/blog-data";
import { ALL_COMPARISONS } from "@/app/comparisons/comparison-data";
import { ALL_FEATURES } from "@/app/features/feature-data";
import { ALL_GUIDES } from "@/app/guides/guide-data";
import { ALL_HELP_PAGES } from "@/app/help/help-data";
import { ALL_INTEGRATIONS } from "@/app/integrations/integration-data";
import { ALL_TOOLS } from "@/app/tools/tools-data";
import { ALL_USE_CASES } from "@/app/use-cases/use-case-data";
import { liveSeoPages } from "@/app/seo-content/types";
import { guidePageToMarkdown, helpPageToMarkdown, seoPageToMarkdown, toolPageMarkdown } from "@/lib/public-page-markdown";
import { defaultDescription, siteUrl } from "@/app/seo";

export const revalidate = 86400;

export async function GET() {
  const blogs = liveBlogs()
    .sort(
      (a, b) =>
        new Date(`${b.publishedDate} UTC`).getTime() -
          new Date(`${a.publishedDate} UTC`).getTime() ||
        a.title.localeCompare(b.title)
    )
    .map(
      (blog) =>
        `## ${blog.title}

URL: ${siteUrl}/blogs/${blog.slug}
Markdown: ${siteUrl}/blogs/${blog.slug}.md
Category: ${blog.category}
Published: ${blog.publishedDate}

${blog.description}`
    )
    .join("\n\n");

  const features = liveSeoPages(ALL_FEATURES)
    .map((page) => seoPageToMarkdown("/features", page))
    .join("\n\n");
  const useCases = liveSeoPages(ALL_USE_CASES)
    .map((page) => seoPageToMarkdown("/use-cases", page))
    .join("\n\n");
  const comparisons = liveSeoPages(ALL_COMPARISONS)
    .map((page) => seoPageToMarkdown("/comparisons", page))
    .join("\n\n");
  const alternatives = liveSeoPages(ALL_ALTERNATIVES)
    .map((page) => seoPageToMarkdown("/alternatives", page))
    .join("\n\n");
  const integrations = liveSeoPages(ALL_INTEGRATIONS)
    .map((page) => seoPageToMarkdown("/integrations", page))
    .join("\n\n");
  const guides = ALL_GUIDES.map((page) => guidePageToMarkdown(page)).join("\n\n");
  const help = ALL_HELP_PAGES.map((page) => helpPageToMarkdown(page)).join("\n\n");
  const tools = ALL_TOOLS.map((tool) => toolPageMarkdown(tool.href))
    .filter((page): page is string => Boolean(page))
    .join("\n\n");

  const body = `# Omentir

> ${defaultDescription}

This is the long-form machine index for Omentir. Use ${siteUrl}/llms.txt for the compact directory. Use this file when you need page-level facts without scraping HTML. Every public HTML page also has a markdown twin at the same path with .md appended (homepage: ${siteUrl}/index.md). Prefer those twins when citing a page. Each content page ends with a signup link.

Omentir is an AI sales outreach workspace for B2B founders, SDRs, solo operators, and small sales teams. It finds potential customers, personalizes LinkedIn outreach from the user's own account, and helps turn interested replies into booked demos.

The product is open source under the MIT license: https://github.com/vanshyadav1408/Omentir. The hosted product at ${siteUrl} runs the same code.

## How agents should use this site

- Public marketing, legal, and blog pages may be read and cited.
- Authenticated workspace data must go through MCP (${siteUrl}/api/agent/v1/mcp) or REST (${siteUrl}/api/agent/v1/*), never by scraping /overview, /leads, or /messages.
- Compact capability map: ${siteUrl}/agent.json
- Human MCP setup: ${siteUrl}/integrations/mcp
- Per-client setup: ${siteUrl}/integrations
- Tool and guardrail guide: ${siteUrl}/agents.md
- OpenAPI: ${siteUrl}/api/agent/v1/openapi.json
- Canonical URL list: ${siteUrl}/sitemap.xml

Agents cannot create Omentir accounts or buy or change subscriptions.

## Product facts

- Category: AI sales outreach software, LinkedIn-first.
- Audience: B2B founders, SDRs, solo operators, and small sales teams.
- Core motion: product context (My Product) → lead discovery (classic ICP finders or Steal Customers) → human-paced LinkedIn outreach → reply handling.
- Steal Customers: competitor company and employee posts → commenters become leads with engagement context.
- Pricing: Pro is $49/month. Enterprise adds unlimited users, unlimited LinkedIn accounts, SSO, dedicated onboarding, and priority support. See ${siteUrl}/pricing.
- Guarantee: minimum of three bookings per week or you pay nothing, subject to ${siteUrl}/minimum-booking-guarantee.
- License: MIT. Self-host with Docker or use the hosted product.

## Feature pages

${features}

## Use cases

${useCases}

## Alternative pages

${comparisons}

## Tool roundups

${alternatives}

## Integration pages

${integrations}

## Search guides

${guides}

## Free tools

${tools}

## Help

${help}

## Blog library

${blogs}

## Legal

- ${siteUrl}/minimum-booking-guarantee.md
- ${siteUrl}/privacy-policy.md
- ${siteUrl}/terms-of-service.md
`;

  return new NextResponse(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
