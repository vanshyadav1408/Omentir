import { HELP_PAGES_A } from "./help-pages-a";
import { HELP_PAGES_B } from "./help-pages-b";
import { HELP_PAGES_C } from "./help-pages-c";
import { HELP_PAGES_D } from "./help-pages-d";
import { HELP_PAGES_E } from "./help-pages-e";
import { HELP_PAGES_F } from "./help-pages-f";
import { HELP_PAGES_G } from "./help-pages-g";
import { HELP_PAGES_H } from "./help-pages-h";
import { HELP_PAGES_I } from "./help-pages-i";
import { HELP_PAGES_J } from "./help-pages-j";
import { HELP_PAGES_K } from "./help-pages-k";
import { HELP_PAGES_L } from "./help-pages-l";
import { HELP_PAGES_M } from "./help-pages-m";
import { HELP_PAGES_N } from "./help-pages-n";
import { HELP_PAGES_O } from "./help-pages-o";
import {
  HELP_CLUSTER_ORDER,
  type HelpCluster,
  type HelpPage,
  type HelpPageDraft,
} from "./types";

const drafts: HelpPageDraft[] = [
  ...HELP_PAGES_A,
  ...HELP_PAGES_B,
  ...HELP_PAGES_C,
  ...HELP_PAGES_D,
  ...HELP_PAGES_E,
  ...HELP_PAGES_F,
  ...HELP_PAGES_G,
  ...HELP_PAGES_H,
  ...HELP_PAGES_I,
  ...HELP_PAGES_J,
  ...HELP_PAGES_K,
  ...HELP_PAGES_L,
  ...HELP_PAGES_M,
  ...HELP_PAGES_N,
  ...HELP_PAGES_O,
];

const bySlug = new Map(drafts.map((page) => [page.slug, page]));

function withRelated(pages: HelpPageDraft[]): HelpPage[] {
  return pages.map((page) => {
    const related = page.relatedSlugs
      .map((slug) => bySlug.get(slug))
      .filter((item): item is HelpPageDraft => Boolean(item))
      .map((item) => ({
        label: item.question,
        href: `/help/${item.slug}`,
      }));
    return {
      slug: page.slug,
      question: page.question,
      description: page.description,
      keywords: page.keywords,
      cluster: page.cluster,
      publishedDate: page.publishedDate,
      updatedDate: page.updatedDate,
      paragraphs: page.paragraphs,
      prompt: page.prompt,
      faqItems: page.faqItems,
      related,
    };
  });
}

if (drafts.length !== 147) {
  throw new Error(`Expected 147 help pages, got ${drafts.length}`);
}
if (bySlug.size !== drafts.length) {
  throw new Error("Duplicate help slugs");
}
for (const page of drafts) {
  for (const slug of page.relatedSlugs) {
    if (!bySlug.has(slug)) {
      throw new Error(`Missing related help slug "${slug}" on "${page.slug}"`);
    }
  }
}

export const ALL_HELP_PAGES: HelpPage[] = withRelated(drafts);

export function getHelpPage(slug: string) {
  return ALL_HELP_PAGES.find((page) => page.slug === slug);
}

export function helpPagesByCluster(cluster: HelpCluster) {
  return ALL_HELP_PAGES.filter((page) => page.cluster === cluster);
}

export function groupedHelpPages() {
  return HELP_CLUSTER_ORDER.map((cluster) => ({
    cluster,
    pages: helpPagesByCluster(cluster),
  })).filter((group) => group.pages.length > 0);
}
