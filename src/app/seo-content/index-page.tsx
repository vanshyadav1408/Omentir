import Link from "next/link";
import {
  createBreadcrumbJsonLd,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";
import AlternativesDirectory from "../alternatives/alternatives-directory";
import ComparisonsDirectory from "../comparisons/comparisons-directory";
import IntegrationsDirectory from "../integrations/integrations-directory";
import UseCasesDirectory from "../use-cases/use-cases-directory";
import type { SeoContentPage, SeoFamily } from "./types";
import { liveSeoPages } from "./types";
import {
  familyCrumbs,
  familyLabels,
  familyPaths,
  SeoDocLayout,
  SeoHero,
  SeoPageChrome,
  SeoTitleList,
} from "./shared";

const QUIET_FAMILIES: ReadonlySet<SeoFamily> = new Set([
  "features",
  "integrations",
  "alternatives",
  "use-cases",
  "comparisons",
]);

type SeoIndexPageViewProps = {
  family: SeoFamily;
  title: string;
  description: string;
  pages: readonly SeoContentPage[];
  compactHero?: boolean;
};

export default function SeoIndexPageView({
  family,
  title,
  description,
  pages,
  compactHero = false,
}: SeoIndexPageViewProps) {
  const path = familyPaths[family];
  const pageUrl = `${siteUrl}${path}`;
  const familyLabel = familyLabels[family];
  const published = liveSeoPages(pages);
  const quiet = QUIET_FAMILIES.has(family);

  const jsonLd = [
    createWebPageJsonLd({
      name: title,
      description,
      url: pageUrl,
    }),
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
        numberOfItems: published.length,
        itemListElement: published.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${siteUrl}${path}/${page.slug}`,
          name: page.title,
        })),
      },
    },
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: familyLabel, url: pageUrl },
    ]),
  ];

  const directory =
    family === "integrations" ? (
      <IntegrationsDirectory pages={published} />
    ) : family === "alternatives" ? (
      <AlternativesDirectory pages={published} />
    ) : family === "use-cases" ? (
      <UseCasesDirectory pages={published} />
    ) : family === "comparisons" ? (
      <ComparisonsDirectory pages={published} />
    ) : quiet ? (
      <section>
        <h2
          style={{ fontFamily: "var(--font-varta)" }}
          className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
        >
          {familyLabel}
        </h2>
        <SeoTitleList
          items={published.map((page) => ({
            href: `${path}/${page.slug}`,
            label: page.title,
          }))}
        />
      </section>
    ) : (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {published.map((page) => (
          <li key={page.slug} className="min-w-0">
            <Link
              href={`${path}/${page.slug}`}
              className="group flex h-full items-start gap-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container)] sm:p-6"
            >
              <div className="min-w-0">
                <h2
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] transition-colors group-hover:text-[var(--md-sys-color-primary)]"
                >
                  {page.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
                  {page.summary}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    );

  if (quiet) {
    return (
      <SeoPageChrome jsonLdId={`seo-${family}-index-jsonld`} jsonLd={jsonLd}>
        <SeoDocLayout
          crumbs={familyCrumbs(family)}
          title={title}
          description={description}
        >
          {directory}
        </SeoDocLayout>
      </SeoPageChrome>
    );
  }

  return (
    <SeoPageChrome jsonLdId={`seo-${family}-index-jsonld`} jsonLd={jsonLd}>
      <SeoHero
        title={title}
        description={description}
        compact={compactHero}
        crumbs={familyCrumbs(family)}
      />
      <section className="relative z-0 mx-auto w-full max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
        {directory}
      </section>
    </SeoPageChrome>
  );
}
