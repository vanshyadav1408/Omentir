import { existsSync } from "node:fs";
import { join } from "node:path";

export type GuideCluster = "linkedin" | "b2b" | "email" | "general";

export type GuideFaq = {
  question: string;
  answer: string;
};

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  /** Paste-ready prompt or other monospaced job spec. */
  code?: string;
};

export type GuideRelated = {
  label: string;
  href: string;
};

export type GuidePage = {
  slug: string;
  title: string;
  description: string;
  query: string;
  kicker: string;
  cluster: GuideCluster;
  publishedDate: string;
  updatedDate: string;
  keywords: string[];
  sections: GuideSection[];
  faqItems: GuideFaq[];
  related?: GuideRelated[];
  relatedHeading?: string;
};

export function getGuide(pages: readonly GuidePage[], slug: string) {
  return pages.find((page) => page.slug === slug);
}

export function guideHeroImage(slug: string): {
  src: string;
  alt: string;
  width: number;
  height: number;
} | null {
  const dir = join(process.cwd(), "public", "seo", "guides");
  const candidates = [
    { rel: `/seo/guides/${slug}.avif`, abs: join(dir, `${slug}.avif`) },
  ];
  const match = candidates.find((file) => existsSync(file.abs));
  if (!match) return null;
  return {
    src: match.rel,
    alt: `${slug.replace(/-/g, " ")} illustration`,
    width: 1536,
    height: 1024,
  };
}
