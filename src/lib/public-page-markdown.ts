import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_BLOGS, liveBlogs, type BlogItem } from "@/app/blogs/blog-data";
import { ALL_COMPARISONS } from "@/app/comparisons/comparison-data";
import { ALL_FEATURES } from "@/app/features/feature-data";
import { FEATURE_NAV_ITEMS } from "@/app/feature-nav";
import { ALL_INTEGRATIONS } from "@/app/integrations/integration-data";
import { integrationConnect } from "@/app/integrations/integration-connect";
import { pricingPlans } from "@/app/pricing-plans";
import { brandTagline, defaultDescription, siteUrl } from "@/app/seo";
import { liveSeoPages, type SeoContentPage } from "@/app/seo-content/types";
import {
  collapseMarkdown,
  extractTsxScope,
  faqItemsFromSource,
  jsxChildrenToMarkdown,
  sourceFileToMarkdown,
  type TsxValue,
} from "@/lib/tsx-to-markdown";

export type PublicMarkdownPage = {
  htmlPath: string;
  markdownPath: string;
  kind: "home" | "marketing" | "blog" | "seo" | "index";
};

const MARKETING_PAGES = [
  { htmlPath: "/", title: "Home" },
  { htmlPath: "/about", title: "About" },
  { htmlPath: "/pricing", title: "Pricing" },
  { htmlPath: "/for-agents", title: "For AI Agents" },
  { htmlPath: "/mcp-server", title: "MCP Server" },
  { htmlPath: "/minimum-booking-guarantee", title: "Minimum Booking Guarantee" },
  { htmlPath: "/privacy-policy", title: "Privacy Policy" },
  { htmlPath: "/terms-of-service", title: "Terms of Service" },
  { htmlPath: "/blogs", title: "Blogs" },
  { htmlPath: "/comparisons", title: "Alternatives" },
  { htmlPath: "/integrations", title: "Integrations" },
] as const;

function appPath(...parts: string[]) {
  return join(process.cwd(), "src", "app", ...parts);
}

function readAppFile(...parts: string[]) {
  const filePath = appPath(...parts);
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

export function absoluteUrl(path: string) {
  return path === "/" ? siteUrl : `${siteUrl}${path}`;
}

const STATIC_ASSET = /\.(?:avif|png|jpe?g|gif|svg|webp|ico|woff2?|css|js|map)$/i;

export function markdownPathFromHtmlPath(htmlPath: string): string | null {
  if (
    htmlPath === "/agents.md" ||
    htmlPath.endsWith(".txt") ||
    htmlPath.endsWith(".json") ||
    htmlPath.endsWith(".xml") ||
    htmlPath.endsWith(".md") ||
    STATIC_ASSET.test(htmlPath)
  ) {
    return null;
  }
  return htmlPath === "/" ? "/index.md" : `${htmlPath}.md`;
}

export function htmlPathFromMarkdownPath(markdownPath: string): string | null {
  if (!markdownPath.endsWith(".md")) return null;
  if (markdownPath === "/agents.md") return "/agents.md";
  const withoutExt = markdownPath.slice(0, -3);
  if (withoutExt === "/index" || withoutExt === "") return "/";
  return withoutExt;
}

export function internalMarkdownHref(href: string) {
  if (!href) return href;
  if (href.startsWith("#")) return href;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return href;
  if (href.startsWith("http://") || href.startsWith("https://")) {
    if (!href.startsWith(siteUrl)) return href;
    const path = href.slice(siteUrl.length) || "/";
    const md = markdownPathFromHtmlPath(path);
    return md ? absoluteUrl(md) : href;
  }
  if (href.startsWith("/")) {
    const md = markdownPathFromHtmlPath(href);
    return absoluteUrl(md ?? href);
  }
  return href;
}

function pageHeader(title: string, description: string, htmlPath: string) {
  const md = markdownPathFromHtmlPath(htmlPath);
  return [
    `# ${title}`,
    ``,
    `> ${description}`,
    ``,
    `- HTML: ${absoluteUrl(htmlPath)}`,
    md ? `- Markdown: ${absoluteUrl(md)}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function linkList(
  items: ReadonlyArray<{ title: string; href: string; note?: string }>
) {
  return items
    .map((item) =>
      item.note
        ? `- [${item.title}](${internalMarkdownHref(item.href)}): ${item.note}`
        : `- [${item.title}](${internalMarkdownHref(item.href)})`
    )
    .join("\n");
}

function objectString(value: TsxValue | undefined) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function objectRows(value: TsxValue | undefined) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is { [key: string]: TsxValue } =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item)
      )
    : [];
}

export function seoPageToMarkdown(basePath: string, page: SeoContentPage) {
  const htmlPath = `${basePath}/${page.slug}`;
  const sections = page.sections
    .map((section) => {
      const body = section.paragraphs.join("\n\n");
      const bullets = section.bullets?.length
        ? "\n\n" + section.bullets.map((item) => `- ${item}`).join("\n")
        : "";
      return `## ${section.heading}\n\n${body}${bullets}`;
    })
    .join("\n\n");
  const highlights = page.highlights?.length
    ? `## Highlights\n\n${page.highlights.map((item) => `- ${item}`).join("\n")}`
    : "";
  const setup = page.setupSteps?.length
    ? `## Setup\n\n${page.setupSteps
        .map((step, index) => `${index + 1}. **${step.title}.** ${step.description}`)
        .join("\n")}`
    : "";
  const table = page.comparisonTable
    ? [
        `## Comparison`,
        ``,
        `| Dimension | ${page.comparisonTable.headers.join(" | ")} |`,
        `| --- | ${page.comparisonTable.headers.map(() => "---").join(" | ")} |`,
        ...page.comparisonTable.rows.map(
          (row) => `| ${row.dimension} | ${row.cells.join(" | ")} |`
        ),
      ].join("\n")
    : "";
  const related = page.relatedLinks?.length
    ? `## Related\n\n${linkList(
        page.relatedLinks.map((link) => ({
          title: link.label,
          href: link.href,
          note: link.description,
        }))
      )}`
    : "";
  const faqs = page.faqItems.length
    ? `## Frequently asked questions\n\n${page.faqItems
        .map((item) => `**${item.question}**\n\n${item.answer}`)
        .join("\n\n")}`
    : "";
  const cta = page.ctaTitle
    ? `## ${page.ctaTitle}\n\n${page.ctaBody ?? ""}`.trim()
    : "";

  return collapseMarkdown(
    [
      pageHeader(page.title, page.description, htmlPath),
      page.verdict ? `**Verdict:** ${page.verdict}` : "",
      page.summary,
      highlights,
      setup,
      sections,
      table,
      related,
      faqs,
      cta,
    ].join("\n\n")
  );
}

function familyIndexMarkdown(
  htmlPath: "/comparisons" | "/integrations" | "/blogs",
  title: string,
  description: string,
  items: ReadonlyArray<{ title: string; href: string; note: string }>
) {
  return collapseMarkdown(
    `${pageHeader(title, description, htmlPath)}\n\n${linkList(items)}`
  );
}

function homeMarkdown() {
  const source = readAppFile("page.tsx");
  const hero = readAppFile("hero-copy.tsx");
  const scope = extractTsxScope(source);
  const steps = objectRows(scope.get("steps")).map((step, index) => {
    const number = objectString(step.number) || `${index + 1}.`;
    return `${number} **${objectString(step.title)}.** ${objectString(step.description)}`;
  });
  const features = objectRows(scope.get("features")).map(
    (feature) => `- **${objectString(feature.title)}.** ${objectString(feature.description)}`
  );
  const audiences = objectRows(scope.get("audiences")).map((audience) => {
    const href = objectString(audience.href);
    const label = objectString(audience.linkLabel);
    const link = href ? ` [${label || href}](${internalMarkdownHref(href)})` : "";
    return `- **${objectString(audience.title)}.** ${objectString(audience.description)}${link}`;
  });
  const columns = Array.isArray(scope.get("comparisonColumns"))
    ? (scope.get("comparisonColumns") as TsxValue[]).map((item) => objectString(item))
    : [];
  const comparisonRows = objectRows(scope.get("comparisonRows"));
  const comparison = columns.length
    ? [
        `| Dimension | ${columns.join(" | ")} |`,
        `| --- | ${columns.map(() => "---").join(" | ")} |`,
        ...comparisonRows.map((row) => {
          const cells = Array.isArray(row.cells)
            ? row.cells.map((cell) => objectString(cell))
            : [];
          return `| ${objectString(row.dimension)} | ${cells.join(" | ")} |`;
        }),
      ].join("\n")
    : "";
  const heroTitle =
    /You get[\s\S]*?pay nothing\./.exec(hero)?.[0]
      ?.replace(/\{["']\s*["']\}/g, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim() ?? brandTagline;
  const heroLede =
    /Omentir automates LinkedIn outreach[\s\S]*?converts\./.exec(hero)?.[0]
      ?.replace(/\s+/g, " ")
      .trim() ?? defaultDescription;
  const story = sourceFileToMarkdown(source, internalMarkdownHref);
  const storyStart = story.indexOf("After my 15 weeks");
  const storyText =
    storyStart >= 0
      ? story
          .slice(storyStart)
          .split("## ")[0]
          ?.replace(/\n##[^\n]*$/g, "")
          .trim()
      : "";

  return collapseMarkdown(
    [
      pageHeader(heroTitle, heroLede, "/"),
      `Omentir is AI sales outreach software for B2B founders, SDRs, solo operators, and small sales teams. ${defaultDescription}`,
      `## How it works`,
      steps.join("\n"),
      `## Who it is for`,
      audiences.join("\n"),
      `## How Omentir compares`,
      comparison,
      `## Product capabilities`,
      features.join("\n"),
      `## Features`,
      linkList(
        FEATURE_NAV_ITEMS.map((item) => ({ title: item.label, href: item.href }))
      ),
      storyText ? `## Founder story\n\n${storyText}` : "",
      faqItemsFromSource(source),
    ].join("\n\n")
  );
}

function pricingMarkdown() {
  const source = readAppFile("pricing", "page.tsx");
  const plans = pricingPlans
    .map((plan) => {
      const features = plan.features.map((feature) => `- ${feature}`).join("\n");
      return `## ${plan.name}\n\n${plan.price}${plan.includes ? `\n\n${plan.includes}` : ""}\n\n${features}\n\n[${plan.cta}](${internalMarkdownHref(plan.href)})`;
    })
    .join("\n\n");
  return collapseMarkdown(
    [
      pageHeader(
        "Simple pricing for every size of business.",
        "Start with everything you need for $49/month. Minimum 3 bookings per week or you pay nothing. Enterprise adds unlimited users, unlimited LinkedIn accounts, SSO, dedicated onboarding, and priority support.",
        "/pricing"
      ),
      plans,
      "LinkedIn provider, billing, and infrastructure limits may apply. Users control sending limits from Settings.",
      faqItemsFromSource(source),
    ].join("\n\n")
  );
}

function aboutMarkdown() {
  const source = readAppFile("about", "page.tsx");
  const body = sourceFileToMarkdown(source, internalMarkdownHref, "MarketingPage");
  return collapseMarkdown(
    `${pageHeader(
      "We are building AI agents for sales & marketing.",
      "Omentir helps founders, SDRs, and small sales teams find potential buyers, organize them into groups, and run LinkedIn campaigns from their own account.",
      "/about"
    )}\n\n${body}`
  );
}

function listValueRows(source: string, name: string) {
  return objectRows(extractTsxScope(source).get(name));
}

function forAgentsMarkdown() {
  const source = readAppFile("for-agents", "page.tsx");
  const scope = extractTsxScope(source);
  const steps = listValueRows(source, "connectSteps")
    .map((step, index) => {
      const number = objectString(step.number) || `${index + 1}.`;
      return `${number} **${objectString(step.title)}.** ${objectString(step.description)}`;
    })
    .join("\n");
  const tools = listValueRows(source, "toolGroups")
    .map((group) => {
      const rows = objectRows(group.tools)
        .map((tool) => `- \`${objectString(tool.name)}\`: ${objectString(tool.description)}`)
        .join("\n");
      return `### ${objectString(group.group)}\n\n${rows}`;
    })
    .join("\n\n");
  const rest = listValueRows(source, "restEndpoints")
    .map(
      (endpoint) =>
        `- \`${objectString(endpoint.method)} /api/agent/v1${objectString(endpoint.path)}\`: ${objectString(endpoint.description)}`
    )
    .join("\n");
  const prompt = objectString(scope.get("operatorPrompt"));
  return collapseMarkdown(
    [
      pageHeader(
        "For AI Agents",
        "Connect Claude, ChatGPT, Grok, Cursor, or any MCP or REST agent to Omentir. Create classic lead finders or Steal Customers agents and inspect LinkedIn leads from chat.",
        "/for-agents"
      ),
      `## Connect`,
      steps,
      prompt ? `## Operator prompt\n\n\`\`\`text\n${prompt}\n\`\`\`` : "",
      `## MCP tools`,
      tools,
      `## REST`,
      rest,
      faqItemsFromSource(source),
    ].join("\n\n")
  );
}

function mcpServerMarkdown() {
  const source = readAppFile("mcp-server", "page.tsx");
  const steps = listValueRows(source, "setupSteps")
    .map((step, index) => {
      const number = objectString(step.number) || `${index + 1}.`;
      const extra = objectString(step.copyUrl)
        ? ` Connector URL: \`${objectString(step.copyUrl)}\`.`
        : "";
      return `${number} **${objectString(step.title)}.** ${objectString(step.description)}${extra}`;
    })
    .join("\n");
  const tools = listValueRows(source, "toolGroups")
    .map((group) => {
      const rows = objectRows(group.tools)
        .map((tool) => `- \`${objectString(tool.name)}\`: ${objectString(tool.description)}`)
        .join("\n");
      return `### ${objectString(group.group)}\n\n${rows}`;
    })
    .join("\n\n");
  return collapseMarkdown(
    [
      pageHeader(
        "MCP Server",
        "Connect Claude, ChatGPT, Grok, Cursor, Claude Code, OpenClaw, or your own assistant to the Omentir MCP server for LinkedIn lead discovery by tool call.",
        "/mcp-server"
      ),
      `MCP endpoint: \`${siteUrl}/api/agent/v1/mcp\``,
      `## Setup`,
      steps,
      `## Tools`,
      tools,
      faqItemsFromSource(source),
    ].join("\n\n")
  );
}

function legalMarkdown(
  htmlPath: "/privacy-policy" | "/terms-of-service",
  title: string,
  description: string,
  updated: string
) {
  const file =
    htmlPath === "/privacy-policy"
      ? readAppFile("privacy-policy", "page.tsx")
      : readAppFile("terms-of-service", "page.tsx");
  const start = file.indexOf("const sections");
  const end = file.indexOf("export default function", start);
  const block = start < 0 ? file : file.slice(start, end < 0 ? undefined : end);
  const sections = block
    .split(/title:\s*"/)
    .slice(1)
    .map((chunk) => {
      const titleEnd = chunk.indexOf('"');
      const heading = titleEnd >= 0 ? chunk.slice(0, titleEnd) : "";
      const afterTitle = titleEnd >= 0 ? chunk.slice(titleEnd + 1) : chunk;
      const stringBody = afterTitle.match(
        /body:\s*("(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/
      );
      if (stringBody) {
        const quoted = stringBody[1]!;
        return `## ${heading}\n\n${quoted.slice(1, -1)}`;
      }
      const jsxStart = afterTitle.indexOf("body:");
      const jsx = jsxStart >= 0 ? afterTitle.slice(jsxStart + 5) : afterTitle;
      const inner =
        /<>\s*([\s\S]*?)\s*<\/>/.exec(jsx)?.[1] ??
        /\(\s*([\s\S]*?)\s*\)/.exec(jsx)?.[1] ??
        "";
      const text = collapseMarkdown(
        jsxChildrenToMarkdown(inner, new Map(), internalMarkdownHref)
      );
      return text ? `## ${heading}\n\n${text}` : heading ? `## ${heading}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
  return collapseMarkdown(
    [
      pageHeader(title, description, htmlPath),
      `Last updated: ${updated}`,
      sections,
    ].join("\n\n")
  );
}

function guaranteeMarkdown() {
  const source = readAppFile("minimum-booking-guarantee", "page.tsx");
  const start = source.indexOf("const policySections");
  const end = source.indexOf("export default function", start);
  const block = start < 0 ? "" : source.slice(start, end < 0 ? undefined : end);
  const chunks = block.split(/title:\s*"/).slice(1);
  const sections = chunks.map((chunk) => {
    const titleEnd = chunk.indexOf('"');
    const title = titleEnd >= 0 ? chunk.slice(0, titleEnd) : "";
    const paragraphs = [...chunk.matchAll(/<>\s*([\s\S]*?)\s*<\/>/g)].map((match) =>
      collapseMarkdown(
        jsxChildrenToMarkdown(match[1]!, new Map(), internalMarkdownHref)
      )
    );
    return title ? `## ${title}\n\n${paragraphs.join("\n\n")}` : paragraphs.join("\n\n");
  });
  return collapseMarkdown(
    [
      pageHeader(
        "Minimum Booking Guarantee",
        "The eligibility, warm-up, weekly measurement, and refund terms behind Omentir's booking guarantee.",
        "/minimum-booking-guarantee"
      ),
      "**Minimum 3 bookings per week or you pay nothing.**",
      `- The two-week warm-up period must be complete.`,
      `- At least one agent must remain active for the full week.`,
      `- If there are fewer than three qualifying bookings, you may apply for a full refund.`,
      `Last updated: August 9, 2026`,
      sections.join("\n\n"),
    ].join("\n\n")
  );
}

function blogIndexMarkdown() {
  return familyIndexMarkdown(
    "/blogs",
    "The Omentir Library",
    "Tactical, zero-fluff guides and frameworks designed for solo founders, B2B sales teams, and modern growth operators to turn LinkedIn outreach into booked demos.",
    liveBlogs()
      .sort(
        (a, b) =>
          new Date(`${b.publishedDate} UTC`).getTime() -
            new Date(`${a.publishedDate} UTC`).getTime() ||
          a.title.localeCompare(b.title)
      )
      .map((blog) => ({
        title: blog.title,
        href: `/blogs/${blog.slug}`,
        note: blog.description,
      }))
  );
}

function blogMarkdown(blog: BlogItem) {
  const source = readAppFile("blogs", blog.slug, "page.tsx");
  const body = sourceFileToMarkdown(source, internalMarkdownHref, "BlogPostTemplate");
  const faqs = body.includes("## Frequently asked questions")
    ? ""
    : faqItemsFromSource(source);
  return collapseMarkdown(
    [
      pageHeader(blog.title, blog.description, `/blogs/${blog.slug}`),
      `- Category: ${blog.category}`,
      `- Published: ${blog.publishedDate}`,
      `- Updated: ${blog.updatedDate}`,
      `- Read time: ${blog.readTime}`,
      body,
      faqs,
    ].join("\n\n")
  );
}

export function listPublicMarkdownPages(): PublicMarkdownPage[] {
  const pages: PublicMarkdownPage[] = MARKETING_PAGES.map((page) => ({
    htmlPath: page.htmlPath,
    markdownPath: markdownPathFromHtmlPath(page.htmlPath)!,
    kind: page.htmlPath === "/" ? "home" : page.htmlPath.split("/").length === 2 ? "marketing" : "index",
  }));

  for (const blog of ALL_BLOGS) {
    pages.push({
      htmlPath: `/blogs/${blog.slug}`,
      markdownPath: `/blogs/${blog.slug}.md`,
      kind: "blog",
    });
  }
  for (const page of ALL_FEATURES) {
    pages.push({
      htmlPath: `/features/${page.slug}`,
      markdownPath: `/features/${page.slug}.md`,
      kind: "seo",
    });
  }
  for (const page of ALL_COMPARISONS) {
    pages.push({
      htmlPath: `/comparisons/${page.slug}`,
      markdownPath: `/comparisons/${page.slug}.md`,
      kind: "seo",
    });
  }
  for (const page of ALL_INTEGRATIONS) {
    pages.push({
      htmlPath: `/integrations/${page.slug}`,
      markdownPath: `/integrations/${page.slug}.md`,
      kind: "seo",
    });
  }
  return pages;
}

export function renderPublicMarkdown(htmlPath: string): string | null {
  if (htmlPath === "/") return homeMarkdown();
  if (htmlPath === "/pricing") return pricingMarkdown();
  if (htmlPath === "/about") return aboutMarkdown();
  if (htmlPath === "/for-agents") return forAgentsMarkdown();
  if (htmlPath === "/mcp-server") return mcpServerMarkdown();
  if (htmlPath === "/privacy-policy") {
    return legalMarkdown(
      "/privacy-policy",
      "Privacy Policy",
      "Read how Omentir collects, uses, stores, and protects account, billing, LinkedIn, lead, campaign, and message data.",
      "May 4, 2026"
    );
  }
  if (htmlPath === "/terms-of-service") {
    return legalMarkdown(
      "/terms-of-service",
      "Terms of Service",
      "Read the terms for using Omentir to analyze products, discover leads, run LinkedIn campaigns, and manage outbound workflows.",
      "August 9, 2026"
    );
  }
  if (htmlPath === "/minimum-booking-guarantee") return guaranteeMarkdown();
  if (htmlPath === "/blogs") return blogIndexMarkdown();
  if (htmlPath === "/comparisons") {
    return familyIndexMarkdown(
      "/comparisons",
      "AI sales tool alternatives",
      "Explore Omentir as an alternative to popular AI sales and outbound tools. Compare channel fit, workflows, and tradeoffs before you choose.",
      liveSeoPages(ALL_COMPARISONS).map((page) => ({
        title: page.title,
        href: `/comparisons/${page.slug}`,
        note: page.summary,
      }))
    );
  }
  if (htmlPath === "/integrations") {
    const connectNote = liveSeoPages(ALL_INTEGRATIONS).map((page) => {
      const row = integrationConnect(page.slug);
      return {
        title: page.title,
        href: `/integrations/${page.slug}`,
        note: `${page.summary} Surface: ${row.surface}. Auth: ${row.auth}. Best for: ${row.bestFor}.`,
      };
    });
    return familyIndexMarkdown(
      "/integrations",
      "Omentir integrations",
      "Concrete connect paths for the AI apps and protocols people actually use to operate Omentir.",
      connectNote
    );
  }

  const blogMatch = htmlPath.match(/^\/blogs\/([^/]+)$/);
  if (blogMatch) {
    const blog = ALL_BLOGS.find((item) => item.slug === blogMatch[1]);
    return blog ? blogMarkdown(blog) : null;
  }

  const feature = htmlPath.match(/^\/features\/([^/]+)$/);
  if (feature) {
    const page = ALL_FEATURES.find((item) => item.slug === feature[1]);
    return page ? seoPageToMarkdown("/features", page) : null;
  }
  const comparison = htmlPath.match(/^\/comparisons\/([^/]+)$/);
  if (comparison) {
    const page = ALL_COMPARISONS.find((item) => item.slug === comparison[1]);
    return page ? seoPageToMarkdown("/comparisons", page) : null;
  }
  const integration = htmlPath.match(/^\/integrations\/([^/]+)$/);
  if (integration) {
    const page = ALL_INTEGRATIONS.find((item) => item.slug === integration[1]);
    return page ? seoPageToMarkdown("/integrations", page) : null;
  }

  return null;
}

export function isPublicMarkdownHtmlPath(htmlPath: string) {
  return listPublicMarkdownPages().some((page) => page.htmlPath === htmlPath);
}
