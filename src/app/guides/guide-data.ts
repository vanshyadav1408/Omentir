import { B2B_GUIDES_A } from "./b2b-guides-a";
import { B2B_GUIDES_B } from "./b2b-guides-b";
import { EMAIL_GUIDES_A } from "./email-guides-a";
import { EMAIL_GUIDES_B } from "./email-guides-b";
import { LINKEDIN_GUIDES } from "./linkedin-guides";
import type { GuidePage } from "./types";

/** Keep the article a short read. Extra closing paragraphs are dropped first. */
const BODY_WORD_CAP = 500;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function bodyWords(page: Pick<GuidePage, "sections">) {
  return page.sections.reduce((total, section) => {
    const paragraphs = section.paragraphs.reduce((sum, paragraph) => sum + wordCount(paragraph), 0);
    const bullets = section.bullets?.reduce((sum, item) => sum + wordCount(item), 0) ?? 0;
    return total + wordCount(section.heading) + paragraphs + bullets;
  }, 0);
}

function tightenGuide(page: GuidePage): GuidePage {
  if (bodyWords(page) <= BODY_WORD_CAP) return page;
  const sections = page.sections.map((section) => ({
    ...section,
    paragraphs: [...section.paragraphs],
  }));
  let total = bodyWords({ sections });
  for (let index = sections.length - 1; index >= 0 && total > BODY_WORD_CAP; index -= 1) {
    while (sections[index].paragraphs.length > 1 && total > BODY_WORD_CAP) {
      const removed = sections[index].paragraphs.pop();
      if (removed) total -= wordCount(removed);
    }
  }
  return { ...page, sections };
}

function withRelated(pages: GuidePage[]): GuidePage[] {
  return pages.map((page) => {
    if (page.related?.length) return page;
    const pool = pages.filter((item) => item.cluster === page.cluster && item.slug !== page.slug);
    if (pool.length === 0) return page;
    const start = page.slug.length % pool.length;
    const related = [0, 1, 2]
      .map((offset) => pool[(start + offset * 5) % pool.length])
      .filter((item, index, arr) => arr.findIndex((row) => row.slug === item.slug) === index)
      .slice(0, 3)
      .map((item) => ({ label: item.title, href: `/${item.slug}` }));
    return { ...page, related };
  });
}

export const ALL_GUIDES: GuidePage[] = withRelated(
  [...LINKEDIN_GUIDES, ...B2B_GUIDES_A, ...B2B_GUIDES_B, ...EMAIL_GUIDES_A, ...EMAIL_GUIDES_B].map(
    tightenGuide
  )
);

export function getGuidePage(slug: string) {
  return ALL_GUIDES.find((page) => page.slug === slug);
}
