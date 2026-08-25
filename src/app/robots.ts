import type { MetadataRoute } from "next";
import { siteUrl } from "./seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Everything public is crawlable by default. Keep the OpenAPI contract
        // and agent indexes reachable while excluding operational APIs and
        // private survey pages. A more specific Allow wins over /api/.
        allow: [
          "/",
          "/use-cases/",
          "/alternatives/",
          "/features/",
          "/comparisons/",
          "/integrations/",
          "/blogs/",
          "/help/",
          "/*.md$",
          "/agent.json",
          "/llms.txt",
          "/llms-full.txt",
          "/agents.md",
          "/api/agent/v1/openapi.json",
        ],
        disallow: ["/api/", "/surveys/", "/page-markdown", "/page-markdown/"],
      },
      {
        // Bingbot matches this group and ignores the * group. If we Allow
        // /*.md$ here, Bing spends crawl budget on 300+ noindex copies and
        // often parks the host as discovered-not-indexed. Google still uses *.
        userAgent: ["bingbot", "msnbot", "BingPreview"],
        allow: [
          "/",
          "/use-cases/",
          "/alternatives/",
          "/features/",
          "/comparisons/",
          "/integrations/",
          "/blogs/",
          "/help/",
          "/agent.json",
          "/llms.txt",
          "/llms-full.txt",
          "/api/agent/v1/openapi.json",
        ],
        disallow: ["/api/", "/surveys/", "/page-markdown", "/page-markdown/", "/*.md$"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "anthropic-ai",
          "Google-Extended",
          "PerplexityBot",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: [
          "/",
          "/use-cases/",
          "/alternatives/",
          "/features/",
          "/comparisons/",
          "/integrations/",
          "/blogs/",
          "/help/",
          "/*.md$",
          "/llms.txt",
          "/llms-full.txt",
          "/agents.md",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    // Bing reads Host as a hostname. Google ignores this line.
    host: new URL(siteUrl).host,
  };
}
