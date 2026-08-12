import type { MetadataRoute } from "next";
import { siteUrl } from "./seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Everything is crawlable by default. Keep the public OpenAPI contract
      // reachable while excluding operational APIs and private survey pages.
      allow: ["/api/agent/v1/openapi.json"],
      disallow: ["/api/", "/surveys/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
