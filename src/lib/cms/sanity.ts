import { unstable_cache } from "next/cache";
import { client } from "@/sanity/lib/client";
import {
  blogBySlugQuery,
  blogListQuery,
  blogSlugsQuery,
  guideBySlugQuery,
  guideListQuery,
  guideSlugsQuery,
  helpListQuery,
  legalBySlugQuery,
  legalListQuery,
  seoPageBySlugQuery,
  seoPagesByFamilyQuery,
} from "@/sanity/lib/queries";
import type { SeoFamily } from "@/app/seo-content/types";
import type { HelpPage } from "@/app/help/types";
import {
  mapBlogListItem,
  mapBlogPost,
  mapGuide,
  mapHelpDraft,
  mapLegalPage,
  mapSeoPage,
  withHelpRelated,
} from "./mappers";
import type { CmsBlogPost, CmsGuidePage, CmsLegalPage, CmsSeoPage } from "./types";

function cached<T>(
  key: string[],
  tags: string[],
  load: () => Promise<T>
): Promise<T> {
  return unstable_cache(load, key, { tags, revalidate: 300 })();
}

async function groqFetch<T>(query: string, params: Record<string, string> = {}): Promise<T> {
  return client.fetch<T>(query, params, { stega: false });
}

export async function fetchSeoPages(family: SeoFamily): Promise<CmsSeoPage[]> {
  return cached(["cms-seo-pages", family, "cdn-v2"], ["cms", "cms:seo", `cms:seo:${family}`], async () => {
    const rows = await groqFetch<unknown[]>(seoPagesByFamilyQuery, { family });
    return (rows ?? []).map((row) => mapSeoPage(row, family)).filter((page): page is CmsSeoPage => Boolean(page));
  });
}

export async function fetchSeoPage(family: SeoFamily, slug: string): Promise<CmsSeoPage | undefined> {
  return cached(
    ["cms-seo-page", family, slug, "cdn-v2"],
    ["cms", "cms:seo", `cms:seo:${family}`, `cms:seo:${family}:${slug}`],
    async () => {
      const row = await groqFetch<unknown>(seoPageBySlugQuery, { family, slug });
      return mapSeoPage(row, family) ?? undefined;
    }
  );
}

export async function fetchBlogs(): Promise<Array<Omit<CmsBlogPost, "body" | "faqItems">>> {
  return cached(["cms-blogs", "cdn-v2"], ["cms", "cms:blog"], async () => {
    const rows = await groqFetch<unknown[]>(blogListQuery);
    return (rows ?? [])
      .map(mapBlogListItem)
      .filter((item): item is Omit<CmsBlogPost, "body" | "faqItems"> => Boolean(item));
  });
}

export async function fetchBlog(slug: string): Promise<CmsBlogPost | undefined> {
  return cached(["cms-blog", slug, "cdn-v2"], ["cms", "cms:blog", `cms:blog:${slug}`], async () => {
    const row = await groqFetch<unknown>(blogBySlugQuery, { slug });
    return mapBlogPost(row) ?? undefined;
  });
}

export async function fetchBlogSlugs(): Promise<string[]> {
  return cached(["cms-blog-slugs"], ["cms", "cms:blog"], async () => {
    const rows = await groqFetch<Array<{ slug?: string }>>(blogSlugsQuery);
    return (rows ?? []).map((row) => row.slug).filter((slug): slug is string => Boolean(slug));
  });
}

export async function fetchHelpPages(): Promise<HelpPage[]> {
  return cached(["cms-help"], ["cms", "cms:help"], async () => {
    const rows = await groqFetch<unknown[]>(helpListQuery);
    const drafts = (rows ?? []).map(mapHelpDraft).filter((page): page is NonNullable<typeof page> => Boolean(page));
    return withHelpRelated(drafts);
  });
}

export async function fetchHelpPage(slug: string): Promise<HelpPage | undefined> {
  const pages = await fetchHelpPages();
  return pages.find((page) => page.slug === slug);
}

export async function fetchGuides(): Promise<CmsGuidePage[]> {
  return cached(["cms-guides", "cdn-v2"], ["cms", "cms:guide"], async () => {
    const rows = await groqFetch<unknown[]>(guideListQuery);
    return (rows ?? []).map(mapGuide).filter((page): page is CmsGuidePage => Boolean(page));
  });
}

export async function fetchGuide(slug: string): Promise<CmsGuidePage | undefined> {
  return cached(["cms-guide", slug, "cdn-v2"], ["cms", "cms:guide", `cms:guide:${slug}`], async () => {
    const row = await groqFetch<unknown>(guideBySlugQuery, { slug });
    return mapGuide(row) ?? undefined;
  });
}

export async function fetchGuideSlugs(): Promise<string[]> {
  return cached(["cms-guide-slugs"], ["cms", "cms:guide"], async () => {
    const rows = await groqFetch<Array<{ slug?: string }>>(guideSlugsQuery);
    return (rows ?? []).map((row) => row.slug).filter((slug): slug is string => Boolean(slug));
  });
}

export async function fetchLegalPage(slug: string): Promise<CmsLegalPage | undefined> {
  return cached(["cms-legal", slug], ["cms", "cms:legal", `cms:legal:${slug}`], async () => {
    const row = await groqFetch<unknown>(legalBySlugQuery, { slug });
    return mapLegalPage(row) ?? undefined;
  });
}

export async function fetchLegalPages(): Promise<CmsLegalPage[]> {
  return cached(["cms-legal-list"], ["cms", "cms:legal"], async () => {
    const rows = await groqFetch<unknown[]>(legalListQuery);
    return (rows ?? []).map(mapLegalPage).filter((page): page is CmsLegalPage => Boolean(page));
  });
}
