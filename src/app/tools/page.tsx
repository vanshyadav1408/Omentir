import Link from "next/link";
import JsonLd from "../json-ld";
import {
  articlePathCrumbs,
  CalPageHero,
  MarketingFooter,
  MarketingHeader,
} from "../marketing-shell";
import { MarkdownTwinLink } from "../seo-content/shared";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";
import SquircleIcon, { type SquircleTone } from "../squircle-icon";
import type { FeatureNavIcon } from "../feature-nav";
import { ALL_TOOLS, TOOLS_INDEX, type FreeTool } from "./tools-data";

const TOOL_ICONS: Record<FreeTool["slug"], { icon: FeatureNavIcon; tone: SquircleTone }> = {
  "linkedin-profile-rating": { icon: "target", tone: "blue" },
  "improve-linkedin-profile": { icon: "message", tone: "lavender" },
  "find-leads": { icon: "search", tone: "lime" },
};

export const metadata = createPageMetadata({
  title: `${TOOLS_INDEX.title} - Omentir`,
  description: TOOLS_INDEX.description,
  path: TOOLS_INDEX.path,
  keywords: [
    "free lead finder",
    "free LinkedIn profile tools",
    "LinkedIn profile rating",
    "improve LinkedIn profile",
    "no login LinkedIn review",
  ],
});

export default function ToolsIndexPage() {
  const pageUrl = `${siteUrl}${TOOLS_INDEX.path}`;
  const jsonLd = [
    createWebPageJsonLd({
      name: TOOLS_INDEX.title,
      description: TOOLS_INDEX.description,
      url: pageUrl,
    }),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${pageUrl}#collection`,
      name: TOOLS_INDEX.title,
      description: TOOLS_INDEX.description,
      url: pageUrl,
      inLanguage: "en-US",
      isPartOf: { "@id": `${siteUrl}/#website` },
      publisher: { "@id": `${siteUrl}/#organization` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: ALL_TOOLS.length,
        itemListElement: ALL_TOOLS.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${siteUrl}${tool.href}`,
          name: tool.title,
        })),
      },
    },
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "Tools", url: pageUrl },
    ]),
  ];

  return (
    <>
      <JsonLd id="tools-index-jsonld" data={jsonLd} />
      <main className="site-theme min-h-screen overflow-x-hidden">
        <MarketingHeader transparentAtTop />
        <CalPageHero
          crumbs={articlePathCrumbs("tools")}
          title={TOOLS_INDEX.title}
          description={TOOLS_INDEX.lede}
        />
        <div className="cal-read cal-read-moderate">
          <ul className="grid gap-4 md:grid-cols-3">
            {ALL_TOOLS.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={tool.href}
                  className="cal-link-card !flex-col !items-start !justify-start !gap-0 !p-7"
                >
                  <SquircleIcon icon={TOOL_ICONS[tool.slug].icon} tone={TOOL_ICONS[tool.slug].tone} size={48} />
                  <h2
                    style={{ fontFamily: "var(--font-cal-display)" }}
                    className="mt-6 text-2xl font-medium tracking-tight"
                  >
                    {tool.title}
                  </h2>
                  <small className="!mt-2 flex-1">{tool.summary}</small>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--cal-blue)]">
                    Open tool <span aria-hidden="true">&rarr;</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <MarkdownTwinLink path={TOOLS_INDEX.path} title={TOOLS_INDEX.title} />
          </div>
        </div>
        <MarketingFooter />
      </main>
    </>
  );
}
