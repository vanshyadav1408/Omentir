import type { ReactNode } from "react";
import FaqSplitSection from "../faq-split-section";
import JsonLd from "../json-ld";
import MarketingClosingCta from "../marketing-closing-cta";
import {
  ArticleCrumbs,
  articlePathCrumbs,
  HeroGridBackdrop,
  MarketingFooter,
  MarketingHeader,
} from "../marketing-shell";
import { MarkdownTwinLink, RelatedLinks } from "../seo-content/shared";
import {
  createBreadcrumbJsonLd,
  createFAQJsonLd,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";
import ToolHowItWorks from "./how-it-works";
import ToolProTips from "./pro-tips";
import type { FreeTool } from "./tools-data";

function createHowToJsonLd(tool: FreeTool, pageUrl: string) {
  const steps = tool.howItWorks ?? [];
  if (steps.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${pageUrl}#howto`,
    name: tool.title,
    description: tool.description,
    url: pageUrl,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.body,
    })),
  };
}

export function ToolPageChrome({
  tool,
  children,
}: {
  tool: FreeTool;
  children: ReactNode;
}) {
  const pageUrl = `${siteUrl}${tool.href}`;
  const howTo = createHowToJsonLd(tool, pageUrl);
  const jsonLd = [
    createWebPageJsonLd({
      name: tool.title,
      description: tool.description,
      url: pageUrl,
      dateModified: tool.updatedDate || tool.publishedDate,
    }),
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${pageUrl}#app`,
      name: tool.title,
      url: pageUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      description: tool.description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "Tools", url: `${siteUrl}/tools` },
      { name: tool.title, url: pageUrl },
    ]),
    createFAQJsonLd(tool.faqItems),
    ...(howTo ? [howTo] : []),
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <JsonLd id={`${tool.slug}-jsonld`} data={jsonLd} />
      <MarketingHeader transparentAtTop />
      <div className="relative">
        <HeroGridBackdrop height="h-[90vh]" />
        <section className="omentir-primary-width relative z-10 min-w-0 pt-28 md:pt-36">
          <ArticleCrumbs
            crumbs={articlePathCrumbs("tools", tool.slug)}
            className="mb-8 justify-center"
          />
          <h1 className="hero-display-sentence mx-auto max-w-4xl text-center text-[var(--md-sys-color-on-surface)]">
            {tool.title}
          </h1>
          <p className="hero-lede mx-auto mt-4 max-w-2xl text-center text-[var(--md-sys-color-on-surface-variant)] md:mt-5">
            {tool.lede}
          </p>
          <div className="mt-10 md:mt-12">{children}</div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
            {tool.disclaimer}
          </p>
        </section>
        {tool.howItWorks ? <ToolHowItWorks steps={tool.howItWorks} /> : null}
        {tool.proTips ? <ToolProTips tips={tool.proTips} /> : null}
        {tool.bodySections?.length ? (
          <div className="omentir-primary-width relative z-10 min-w-0 space-y-12 pt-16 md:space-y-16 md:pt-20">
            {tool.bodySections.map((section) => (
              <section key={section.heading} className="mx-auto max-w-2xl">
                <h2
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-2xl"
                >
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-base leading-8 text-[var(--md-sys-color-on-surface-variant)]"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        ) : null}
        {tool.relatedLinks?.length ? (
          <div className="omentir-primary-width relative z-10 mx-auto max-w-2xl min-w-0 pt-12 md:pt-16">
            <RelatedLinks links={[...tool.relatedLinks]} />
          </div>
        ) : null}
        <div className="relative z-10 pb-16 pt-16 md:pb-24 md:pt-20">
          <FaqSplitSection items={tool.faqItems} />
        </div>
        <MarketingClosingCta className="omentir-primary-width relative z-10 pb-12 text-center md:pb-16" />
        <div className="omentir-primary-width relative z-10 pb-20 md:pb-28">
          <MarkdownTwinLink path={tool.href} title={tool.title} />
        </div>
      </div>
      <MarketingFooter />
    </main>
  );
}
