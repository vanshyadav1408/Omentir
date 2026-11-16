import { RoundupList, VerdictBanner } from "./layouts";
import {
  CtaBlock,
  familyCrumbs,
  FaqBlock,
  pageJsonLd,
  RelatedLinks,
  SectionProse,
  SeoDocLayout,
  SeoPageChrome,
} from "./shared";
import { type SeoContentPage } from "./types";

export default function AlternativePageView({ page }: { page: SeoContentPage }) {

  return (
    <SeoPageChrome
      jsonLdId={`seo-alternatives-${page.slug}-jsonld`}
      jsonLd={pageJsonLd("alternatives", page)}
    >
      <SeoDocLayout
        as="article"
        crumbs={familyCrumbs("alternatives", page.slug)}
        title={page.title}
        path={`/alternatives/${page.slug}`}
        width={page.slug === "grok-bot" ? "primary" : "moderate"}
      >
        <VerdictBanner page={page} />
        {page.roundupItems ? (
          <section id="shortlist">
            <h2 className="cal-read-h2">
              Shortlist
            </h2>
            <div className="mt-6">
              <RoundupList items={page.roundupItems} />
            </div>
          </section>
        ) : null}
        <SectionProse page={page} />
        {page.relatedLinks ? <RelatedLinks links={page.relatedLinks} /> : null}
        <FaqBlock page={page} branded />
        <CtaBlock
          page={page}
          boxed
          title={page.ctaTitle ?? "Pick the job, then pick the tool"}
          body={
            page.ctaBody ??
            "If the job is LinkedIn discovery plus conversations you can inspect, start with one Omentir ICP for two weeks."
          }
        />
      </SeoDocLayout>
    </SeoPageChrome>
  );
}
