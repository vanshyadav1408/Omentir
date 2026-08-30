import type { PortableTextBlock } from "@portabletext/types";
import type { GuidePage } from "@/app/guides/types";
import type { HelpCluster, HelpPage } from "@/app/help/types";
import type { SeoContentPage, SeoFamily } from "@/app/seo-content/types";

export type { SeoFamily, SeoContentPage, GuidePage, HelpPage, HelpCluster };

export type BlogItem = {
  slug: string;
  title: string;
  description: string;
  publishedDate: string;
  updatedDate: string;
  category: string;
  readTime: string;
  bannerSrc: string;
  bannerAlt: string;
};

export type SeoConnect = {
  surface: string;
  auth: string;
  bestFor: string;
};

export type CmsSeoPage = SeoContentPage & {
  who?: string;
  connect?: SeoConnect;
};

export type CmsBlogPost = BlogItem & {
  keywords: string[];
  featuredInLlms: boolean;
  highIntent: boolean;
  body: PortableTextBlock[];
  faqItems: Array<{ question: string; answer: string }>;
};

export type CmsGuidePage = GuidePage;

export type CmsLegalPage = {
  slug: string;
  title: string;
  description: string;
  lede: string;
  keywords: string[];
  updatedDate: string;
  sections: Array<{ title: string; body: string }>;
};

export function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function bool(value: unknown): boolean {
  return value === true;
}
