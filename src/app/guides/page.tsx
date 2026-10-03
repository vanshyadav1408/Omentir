import JsonLd from "../json-ld";
import {
  articlePathCrumbs,
  CalLinkCards,
  CalPageHero,
  MarketingFooter,
  MarketingHeader,
} from "../marketing-shell";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";
import { getGuides, liveSeoPages } from "@/lib/cms";

const title = "Sales guides by AI agent";
const description =
  "How to run LinkedIn outreach with the agent you already use: Grok Bot, Meta Muse, OpenAI Dots, Manus Cue, Claude Code, Cursor and others. Most guides include a prompt to paste in.";

export const metadata = createPageMetadata({
  title,
  description,
  path: "/guides",
  keywords: [
    "AI agent sales outreach",
    "Grok Bot LinkedIn outreach",
    "Meta Muse sales",
    "OpenAI Dots sales",
    "Manus Cue sales",
  ],
});

// Guides live at the site root, so this page is the only list that links
// them all. Groups come from the slug's agent prefix.
const GROUPS = [
  { id: "grok-bot", label: "Grok Bot", match: (slug: string) => slug.includes("grok-bot") },
  { id: "meta-muse", label: "Meta Muse", match: (slug: string) => slug.includes("meta-muse") },
  { id: "openai-dots", label: "OpenAI Dots", match: (slug: string) => slug.includes("openai-dot") },
  { id: "manus", label: "Manus Cue and Manus", match: (slug: string) => slug.startsWith("manus") },
  { id: "other", label: "Coding agents and chat apps", match: () => true },
];

export default async function GuidesIndexPage() {
  const pages = liveSeoPages(await getGuides()).sort((a, b) => a.title.localeCompare(b.title));
  const pageUrl = `${siteUrl}/guides`;
  const remaining = new Set(pages);
  const groups = GROUPS.map((group) => {
    const matched = [...remaining].filter((page) => group.match(page.slug));
    matched.forEach((page) => remaining.delete(page));
    return { ...group, pages: matched };
  }).filter((group) => group.pages.length > 0);

  const jsonLd = [
    createWebPageJsonLd({ name: title, description, url: pageUrl }),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${pageUrl}#collection`,
      name: title,
      description,
      url: pageUrl,
      inLanguage: "en-US",
      isPartOf: { "@id": `${siteUrl}/#website` },
      publisher: { "@id": `${siteUrl}/#organization` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: pages.length,
        itemListElement: pages.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${siteUrl}/${page.slug}`,
          name: page.title,
        })),
      },
    },
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "Guides", url: pageUrl },
    ]),
  ];

  return (
    <>
      <JsonLd id="guides-index-jsonld" data={jsonLd} />
      <main className="site-theme min-h-screen overflow-x-hidden">
        <MarketingHeader transparentAtTop />
        <CalPageHero crumbs={articlePathCrumbs("guides")} title={title} description={description} />
        <div className="cal-read cal-read-wide space-y-14 md:space-y-16">
          {groups.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-28">
              <h2 className="cal-read-h2">{group.label}</h2>
              <div className="mt-6">
                <CalLinkCards
                  links={group.pages.map((page) => ({ href: `/${page.slug}`, label: page.title }))}
                />
              </div>
            </section>
          ))}
        </div>
        <MarketingFooter />
      </main>
    </>
  );
}
