import { RoundupList, VerdictBanner } from "./layouts";
import {
  CtaBlock,
  familyCrumbs,
  FaqBlock,
  pageJsonLd,
  RelatedLinks,
  SectionProse,
  SeoBanner,
  SeoDocLayout,
  SeoPageChrome,
} from "./shared";
import { seoHeroImage, type SeoContentPage } from "./types";

export default function AlternativePageView({ page }: { page: SeoContentPage }) {
  const banner = seoHeroImage("alternatives", page.slug);
  const bannerNode = banner ? (
    <div className="mt-8">
      <SeoBanner src={banner.src} alt={banner.alt} width={banner.width} height={banner.height} />
    </div>
  ) : null;

  return (
    <SeoPageChrome
      jsonLdId={`seo-alternatives-${page.slug}-jsonld`}
      jsonLd={pageJsonLd("alternatives", page)}
    >
      <SeoDocLayout
        as="article"
        crumbs={familyCrumbs("alternatives", page.slug)}
        title={page.title}
        afterTitle={bannerNode}
      >
        <VerdictBanner page={page} />
        {page.roundupItems ? (
          <section id="shortlist">
            <h2
              style={{ fontFamily: "var(--font-varta)" }}
              className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
            >
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
