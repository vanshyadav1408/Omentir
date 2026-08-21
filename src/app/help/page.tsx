import Link from "next/link";
import JsonLd from "../json-ld";
import {
  ArticleCrumbs,
  articlePathCrumbs,
  HeroGridBackdrop,
  MarketingFooter,
  MarketingHeader,
} from "../marketing-shell";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";
import { ALL_HELP_PAGES, groupedHelpPages } from "./help-data";
import { HELP_CLUSTER_LABELS } from "./types";

const title = "LinkedIn outreach help";
const description =
  "Short answers to the LinkedIn outreach, cold messaging, cold email, and B2B sales questions people actually ask.";

export const metadata = createPageMetadata({
  title,
  description,
  path: "/help",
  keywords: [
    "LinkedIn outreach help",
    "LinkedIn connection request limits",
    "cold email reply rate",
    "LinkedIn InMail",
    "B2B sales questions",
  ],
});

export default function HelpIndexPage() {
  const pageUrl = `${siteUrl}/help`;
  const groups = groupedHelpPages();
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
        numberOfItems: ALL_HELP_PAGES.length,
        itemListElement: ALL_HELP_PAGES.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${siteUrl}/help/${page.slug}`,
          name: page.question,
        })),
      },
    },
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "Help", url: pageUrl },
    ]),
  ];

  return (
    <>
      <JsonLd id="help-index-jsonld" data={jsonLd} />
      <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
        <MarketingHeader transparentAtTop />
        <div className="relative">
          <HeroGridBackdrop height="h-[60vh]" />
          <div className="omentir-secondary-width relative z-10 min-w-0 pb-16 pt-28 md:pb-24 md:pt-32">
            <ArticleCrumbs crumbs={articlePathCrumbs("help")} />

            <h1
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-2xl font-semibold leading-snug tracking-tight text-[var(--md-sys-color-on-surface)] md:text-3xl"
            >
              {title}
            </h1>
            <p className="mt-12 max-w-2xl text-base font-medium leading-8 text-[var(--md-sys-color-on-surface)] md:mt-16">
              {description} Each page is one question. The extra detail sits in the FAQ
              under the answer.
            </p>

            <div className="mt-16 space-y-14 md:mt-20">
              {groups.map((group) => (
                <section key={group.cluster}>
                  <h2
                    style={{ fontFamily: "var(--font-varta)" }}
                    className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
                  >
                    {HELP_CLUSTER_LABELS[group.cluster]}
                  </h2>
                  <ul className="divide-y divide-[var(--md-sys-color-outline-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
                    {group.pages.map((page) => (
                      <li key={page.slug}>
                        <Link
                          href={`/help/${page.slug}`}
                          className="group block py-4 text-[var(--md-sys-color-on-surface)] transition-colors hover:text-[var(--md-sys-color-primary)]"
                        >
                          {page.question}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
        <MarketingFooter />
      </main>
    </>
  );
}
