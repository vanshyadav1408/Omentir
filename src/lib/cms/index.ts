import { isSanityConfigured } from "@/sanity/env";
import { HELP_CLUSTER_ORDER, type HelpCluster, type HelpPage } from "@/app/help/types";
import { liveSeoPages, type SeoFamily } from "@/app/seo-content/types";
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
import type { BlogItem, CmsBlogPost, CmsGuidePage, CmsLegalPage, CmsSeoPage } from "./types";

export { isSanityConfigured };
export type { CmsBlogPost, CmsGuidePage, CmsLegalPage, CmsSeoPage };

export function isBlogLive(
  blog: Pick<BlogItem, "publishedDate">,
  now: Date = new Date()
): boolean {
  const published = new Date(`${blog.publishedDate} UTC`);
  if (Number.isNaN(published.getTime())) return false;
  return published.getTime() <= now.getTime();
}

async function fromSanity<T>(load: () => Promise<T>, empty: T): Promise<T> {
  if (!isSanityConfigured()) return empty;
  try {
    return await load();
  } catch (error) {
    console.error("Sanity CMS fetch failed", error);
    return empty;
  }
}

export async function getSeoPages(family: SeoFamily): Promise<CmsSeoPage[]> {
  return fromSanity(() => fetchSeoPages(family), []);
}

export async function getSeoPage(family: SeoFamily, slug: string): Promise<CmsSeoPage | undefined> {
  return fromSanity(() => fetchSeoPage(family, slug), undefined);
}

export async function getSeoSlugs(family: SeoFamily): Promise<string[]> {
  const pages = await getSeoPages(family);
  return pages.map((page) => page.slug);
}

export async function getBlogs(): Promise<Array<Omit<CmsBlogPost, "body" | "faqItems">>> {
  return fromSanity(() => fetchBlogs(), []);
}

export async function getLiveBlogs(now?: Date) {
  const blogs = await getBlogs();
  return blogs.filter((blog) => isBlogLive(blog, now));
}

export async function getBlog(slug: string): Promise<CmsBlogPost | undefined> {
  if (!isSanityConfigured()) return undefined;
  try {
    const post = await fetchBlog(slug);
    if (post && post.body.length > 0) return post;
    return undefined;
  } catch (error) {
    console.error("Sanity blog fetch failed", error);
    return undefined;
  }
}

export async function getBlogSlugs(): Promise<string[]> {
  return fromSanity(() => fetchBlogSlugs(), []);
}

export async function getHelpPages(): Promise<HelpPage[]> {
  return fromSanity(() => fetchHelpPages(), []);
}

export async function getHelpPage(slug: string): Promise<HelpPage | undefined> {
  return fromSanity(() => fetchHelpPage(slug), undefined);
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
  return fromSanity(() => fetchGuides(), []);
}

export async function getGuide(slug: string): Promise<CmsGuidePage | undefined> {
  return fromSanity(() => fetchGuide(slug), undefined);
}

export async function getGuideSlugs(): Promise<string[]> {
  return fromSanity(() => fetchGuideSlugs(), []);
}

export async function getLegalPage(slug: string): Promise<CmsLegalPage | undefined> {
  return fromSanity(() => fetchLegalPage(slug), undefined);
}

export async function getLegalPages(): Promise<CmsLegalPage[]> {
  return fromSanity(() => fetchLegalPages(), []);
}

export { liveSeoPages };
export type { BlogItem, HelpCluster, SeoFamily };
