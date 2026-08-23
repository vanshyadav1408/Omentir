import { HighlightStrip, PhaseCalendar, ThreadPreview } from "./layouts";
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
  SetupSteps,
} from "./shared";
import { seoHeroImage, type SeoContentPage } from "./types";

export default function FeaturePageView({ page }: { page: SeoContentPage }) {
  const banner = seoHeroImage("features", page.slug);
  const bannerNode = banner ? (
    <div className="mt-8">
      <SeoBanner src={banner.src} alt={banner.alt} width={banner.width} height={banner.height} />
    </div>
  ) : null;

  return (
    <SeoPageChrome
      jsonLdId={`seo-features-${page.slug}-jsonld`}
      jsonLd={pageJsonLd("features", page)}
    >
      <SeoDocLayout
        as="article"
        crumbs={familyCrumbs("features", page.slug)}
        title={page.title}
        afterTitle={bannerNode}
        path={`/features/${page.slug}`}
      >
        {page.layout && page.highlights ? <HighlightStrip items={page.highlights} /> : null}
        {page.thread ? <ThreadPreview lines={page.thread} /> : null}
        {page.phases ? <PhaseCalendar phases={page.phases} /> : null}
        {page.setupSteps ? <SetupSteps steps={page.setupSteps} /> : null}
        <SectionProse page={page} />
        {page.relatedLinks ? <RelatedLinks links={page.relatedLinks} /> : null}
        <FaqBlock page={page} branded />
        <CtaBlock
          page={page}
          boxed
          title="Run this on the LinkedIn account you already use"
          body="Connect LinkedIn, fill My Product, and try the motion in one workspace."
        />
      </SeoDocLayout>
    </SeoPageChrome>
  );
}
