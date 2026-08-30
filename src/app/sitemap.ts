import type { MetadataRoute } from "next";
import { ALL_TOOLS } from "./tools/tools-data";
import { liveSeoPages } from "./seo-content/types";
import { siteUrl } from "./seo";
import {
  getBlogs,
  getGuides,
  getHelpPages,
  getLegalPages,
  getSeoPages,
  isBlogLive,
} from "@/lib/cms";

export const revalidate = 86400;

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

function blogDate(blog: { publishedDate: string; updatedDate: string }) {
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

function latestFrom(
  pages: readonly { publishedDate: string; updatedDate: string }[],
  live = true
) {
  const list = live ? liveSeoPages(pages) : pages;
  return list.reduce((newest, page) => {
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

function absoluteUrl(path: string) {
  return path === "/" ? siteUrl : `${siteUrl}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    blogs,
    features,
    comparisons,
    integrations,
    useCases,
    alternatives,
    helpPages,
    guides,
    legalPages,
  ] = await Promise.all([
    getBlogs(),
    getSeoPages("features"),
    getSeoPages("comparisons"),
    getSeoPages("integrations"),
    getSeoPages("use-cases"),
    getSeoPages("alternatives"),
    getHelpPages(),
    getGuides(),
    getLegalPages(),
  ]);

  const liveBlogList = blogs.filter((blog) => isBlogLive(blog));
  const blogsIndexDate = liveBlogList.reduce((newest, blog) => {
    const date = blogDate(blog);
    return date > newest ? date : newest;
  }, new Date(0));
  const featuresIndexDate = latestFrom(features);
  const comparisonsIndexDate = latestFrom(comparisons);
  const integrationsIndexDate = latestFrom(integrations);
  const useCasesIndexDate = latestFrom(useCases);
  const alternativesIndexDate = latestFrom(alternatives);
  const helpIndexDate = latestFrom(helpPages, false);
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

  const legalDates: Record<string, Date> = {};
  for (const page of legalPages) {
    legalDates[`/${page.slug}`] = new Date(`${page.updatedDate} UTC`);
  }

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
    ...legalDates,
  };

  const mainRoutes = publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified:
      derivedIndexDates[route.path] ??
      new Date("lastModified" in route ? route.lastModified : "1970-01-01"),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const blogRoutes = liveBlogList.map((blog) => ({
    url: absoluteUrl(`/blogs/${blog.slug}`),
    lastModified: blogDate(blog),
    images: [`${siteUrl}${blog.bannerSrc}`],
    changeFrequency: "monthly" as const,
    priority: blog.highIntent ? 0.75 : 0.6,
  }));

  const featureRoutes = seoFamilyRoutes("/features", features, 0.7);
  const comparisonRoutes = seoFamilyRoutes("/comparisons", comparisons, 0.75);
  const integrationRoutes = seoFamilyRoutes("/integrations", integrations, 0.7);
  const useCaseRoutes = seoFamilyRoutes("/use-cases", useCases, 0.75);
  const alternativeRoutes = seoFamilyRoutes("/alternatives", alternatives, 0.75);

  const guideRoutes = guides.map((page) => ({
    url: absoluteUrl(`/${page.slug}`),
    lastModified: new Date(`${page.updatedDate || page.publishedDate} UTC`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const helpRoutes = helpPages.map((page) => ({
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
