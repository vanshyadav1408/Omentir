import { HighlightStrip, PhaseCalendar, ThreadPreview } from "./layouts";
import {
  CtaBlock,
  FaqBlock,
  HeroActions,
  pageJsonLd,
  RelatedLinks,
  SectionProse,
  SeoArticle,
  SeoBanner,
  SeoHero,
  SeoPageChrome,
  SetupSteps,
} from "./shared";
import { seoHeroImage, type SeoContentPage } from "./types";

export default function FeaturePageView({ page }: { page: SeoContentPage }) {
  const primary = page.primaryCta ?? { label: "Try this in Omentir", href: "/signup" };
  const secondary = page.secondaryCta ?? { label: "See pricing", href: "/pricing" };
  const banner = seoHeroImage("features", page.slug);
  const bannerNode = banner ? (
    <SeoBanner src={banner.src} alt={banner.alt} width={banner.width} height={banner.height} />
  ) : null;

  return (
    <SeoPageChrome
      jsonLdId={`seo-features-${page.slug}-jsonld`}
      jsonLd={pageJsonLd("features", page)}
    >
      <SeoHero
        title={page.title}
        description={page.description}
        fullHeight
        sentence
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Features", href: "/features" },
          { label: page.title },
        ]}
        actions={<HeroActions primary={primary} secondary={secondary} />}
        media={bannerNode}
      />
      <SeoArticle>
        {banner ? <div className="lg:hidden">{bannerNode}</div> : null}
        {page.layout && page.highlights ? <HighlightStrip items={page.highlights} /> : null}
        {page.thread ? <ThreadPreview lines={page.thread} /> : null}
        {page.phases ? <PhaseCalendar phases={page.phases} /> : null}
        {page.setupSteps ? <SetupSteps steps={page.setupSteps} /> : null}
        <SectionProse page={page} />
        {page.relatedLinks ? <RelatedLinks links={page.relatedLinks} /> : null}
        <FaqBlock page={page} />
        <CtaBlock
          page={page}
          title="Run this on the LinkedIn account you already use"
          body="Connect LinkedIn, fill My Product, and try the motion in one workspace."
        />
      </SeoArticle>
    </SeoPageChrome>
  );
}
