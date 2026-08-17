import { B2B_GUIDES_A } from "./b2b-guides-a";
import { B2B_GUIDES_B } from "./b2b-guides-b";
import { EMAIL_GUIDES_A } from "./email-guides-a";
import { EMAIL_GUIDES_B } from "./email-guides-b";
import { LINKEDIN_GUIDES } from "./linkedin-guides";
import type { GuidePage } from "./types";

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

export const ALL_GUIDES: GuidePage[] = withRelated([
  ...LINKEDIN_GUIDES,
  ...B2B_GUIDES_A,
  ...B2B_GUIDES_B,
  ...EMAIL_GUIDES_A,
  ...EMAIL_GUIDES_B,
]);

export function getGuidePage(slug: string) {
  return ALL_GUIDES.find((page) => page.slug === slug);
}
