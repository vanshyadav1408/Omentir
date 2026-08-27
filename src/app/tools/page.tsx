import Link from "next/link";
import JsonLd from "../json-ld";
import {
  ArticleCrumbs,
  articlePathCrumbs,
  HeroGridBackdrop,
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
import { ALL_TOOLS, TOOLS_INDEX } from "./tools-data";

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
      <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
        <MarketingHeader transparentAtTop />
        <div className="relative">
          <HeroGridBackdrop height="h-[60vh]" />
          <div className="omentir-secondary-width relative z-10 min-w-0 pb-16 pt-28 md:pb-24 md:pt-32">
            <ArticleCrumbs crumbs={articlePathCrumbs("tools")} />
            <h1
              style={{ fontFamily: "var(--font-varta)" }}
              className="hero-display-sentence max-w-3xl text-2xl font-semibold leading-snug tracking-tight text-[var(--md-sys-color-on-surface)] md:text-4xl md:leading-snug"
            >
              {TOOLS_INDEX.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--md-sys-color-on-surface-variant)]">
              {TOOLS_INDEX.lede}
            </p>

            <ul className="mt-12 space-y-4">
              {ALL_TOOLS.map((tool, index) => (
                <li key={tool.slug}>
                  <Link
                    href={tool.href}
                    className="group flex h-full items-start gap-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container)] sm:p-6"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--md-sys-color-outline-variant)] text-sm font-semibold tabular-nums">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h2
                        style={{ fontFamily: "var(--font-varta)" }}
                        className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
                      >
                        {tool.title}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
                        {tool.summary}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <MarkdownTwinLink path={TOOLS_INDEX.path} title={TOOLS_INDEX.title} />
          </div>
        </div>
        <MarketingFooter />
      </main>
    </>
  );
}
