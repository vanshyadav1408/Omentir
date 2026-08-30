import { isSanityConfigured } from "@/sanity/env";
import { isBlogLive, type BlogItem } from "@/app/blogs/blog-data";
import { HELP_CLUSTER_ORDER, type HelpCluster, type HelpPage } from "@/app/help/types";
import { liveSeoPages, type SeoFamily } from "@/app/seo-content/types";
import {
  localBlog,
  localBlogs,
  localGuide,
  localGuides,
  localHelpPage,
  localHelpPages,
  localLegalPage,
  localSeoPage,
  localSeoPages,
  LOCAL_LEGAL,
} from "./fallback";
import {
  fetchBlog,
  fetchBlogSlugs,
  fetchBlogs,
  fetchGuide,
  fetchGuideSlugs,
  fetchGuides,
  fetchHelpPage,
  fetchHelpPages,
  fetchLegalPage,
  fetchLegalPages,
  fetchSeoPage,
  fetchSeoPages,
} from "./sanity";
import type { CmsBlogPost, CmsGuidePage, CmsLegalPage, CmsSeoPage } from "./types";

export { isSanityConfigured };
export type { CmsBlogPost, CmsGuidePage, CmsLegalPage, CmsSeoPage };

async function fromSanity<T>(load: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!isSanityConfigured()) return fallback();
  try {
    return await load();
  } catch (error) {
    console.error("Sanity CMS fetch failed, using in-code content", error);
    return fallback();
  }
}

export async function getSeoPages(family: SeoFamily): Promise<CmsSeoPage[]> {
  return fromSanity(() => fetchSeoPages(family), () => localSeoPages(family));
}

export async function getSeoPage(family: SeoFamily, slug: string): Promise<CmsSeoPage | undefined> {
  return fromSanity(
    () => fetchSeoPage(family, slug),
    () => localSeoPage(family, slug)
  );
}

export async function getSeoSlugs(family: SeoFamily): Promise<string[]> {
  const pages = await getSeoPages(family);
  return pages.map((page) => page.slug);
}

export async function getBlogs(): Promise<Array<Omit<CmsBlogPost, "body" | "faqItems">>> {
  return fromSanity(() => fetchBlogs(), () => localBlogs());
}

export async function getLiveBlogs(now?: Date) {
  const blogs = await getBlogs();
  return blogs.filter((blog) => isBlogLive(blog, now));
}

export async function getBlog(slug: string): Promise<CmsBlogPost | undefined> {
  if (!isSanityConfigured()) return localBlog(slug);
  try {
    const post = await fetchBlog(slug);
    if (post && post.body.length > 0) return post;
    return undefined;
  } catch (error) {
    console.error("Sanity blog fetch failed", error);
    return localBlog(slug);
  }
}

export async function getBlogSlugs(): Promise<string[]> {
  return fromSanity(
    () => fetchBlogSlugs(),
    () => localBlogs().map((blog) => blog.slug)
  );
}

export async function getHelpPages(): Promise<HelpPage[]> {
  return fromSanity(() => fetchHelpPages(), () => localHelpPages());
}

export async function getHelpPage(slug: string): Promise<HelpPage | undefined> {
  return fromSanity(
    () => fetchHelpPage(slug),
    () => localHelpPage(slug)
  );
}

export async function getHelpSlugs(): Promise<string[]> {
  const pages = await getHelpPages();
  return pages.map((page) => page.slug);
}

export function groupedHelp(pages: HelpPage[]) {
  return HELP_CLUSTER_ORDER.map((cluster) => ({
    cluster,
    pages: pages.filter((page) => page.cluster === cluster),
  })).filter((group) => group.pages.length > 0);
}

export async function getGuides(): Promise<CmsGuidePage[]> {
  return fromSanity(() => fetchGuides(), () => localGuides());
}

export async function getGuide(slug: string): Promise<CmsGuidePage | undefined> {
  return fromSanity(
    () => fetchGuide(slug),
    () => localGuide(slug)
  );
}

export async function getGuideSlugs(): Promise<string[]> {
  return fromSanity(
    () => fetchGuideSlugs(),
    () => localGuides().map((page) => page.slug)
  );
}

export async function getLegalPage(slug: string): Promise<CmsLegalPage | undefined> {
  return fromSanity(
    () => fetchLegalPage(slug),
    () => localLegalPage(slug)
  );
}

export async function getLegalPages(): Promise<CmsLegalPage[]> {
  return fromSanity(() => fetchLegalPages(), () => LOCAL_LEGAL);
}

export { isBlogLive, liveSeoPages };
export type { BlogItem, HelpCluster, SeoFamily };
