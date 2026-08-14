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
          "/agent.json",
          "/llms.txt",
          "/llms-full.txt",
          "/agents.md",
          "/api/agent/v1/openapi.json",
        ],
        disallow: ["/api/", "/surveys/"],
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
        allow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
