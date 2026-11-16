import type { ReactNode } from "react";
import FaqSplitSection from "../faq-split-section";
import JsonLd from "../json-ld";
import MarketingClosingCta from "../marketing-closing-cta";
import {
  articlePathCrumbs,
  CalPageHero,
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
    <main className="site-theme min-h-screen overflow-x-hidden">
      <JsonLd id={`${tool.slug}-jsonld`} data={jsonLd} />
      <MarketingHeader transparentAtTop />
      <div className="relative">
        {/* The tool itself sits in the cream hero panel, like the product
            demo on the homepage. */}
        <CalPageHero
          crumbs={articlePathCrumbs("tools", tool.slug)}
          title={tool.title}
          description={tool.lede}
        >
          <div className="mt-10 w-full text-left md:mt-12">{children}</div>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-[var(--cal-muted)]">
            {tool.disclaimer}
          </p>
        </CalPageHero>
        {tool.howItWorks ? <ToolHowItWorks steps={tool.howItWorks} /> : null}
        {tool.proTips ? <ToolProTips tips={tool.proTips} /> : null}
        {tool.bodySections?.length || tool.relatedLinks?.length ? (
          <div className="cal-read cal-read-moderate space-y-14 !pb-0 md:space-y-16">
            {tool.bodySections?.map((section) => (
              <section key={section.heading}>
                <h2 className="cal-read-h2">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-base leading-8 text-[var(--cal-muted)]">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
            {tool.relatedLinks?.length ? <RelatedLinks links={[...tool.relatedLinks]} /> : null}
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
