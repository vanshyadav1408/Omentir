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
  /** CDN hero / Open Graph image from Sanity. */
  ogImage?: {
    url: string;
    width: number;
    height: number;
    alt: string;
  };
};

export function getGuide(pages: readonly GuidePage[], slug: string) {
  return pages.find((page) => page.slug === slug);
}
