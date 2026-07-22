import type { MetadataRoute } from "next";
import { siteUrl } from "./seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/agent/v1/openapi.json"],
      disallow: ["/api/", "/surveys/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
