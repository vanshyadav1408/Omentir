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
          { label: page.title },
        ]}
        actions={<HeroActions primary={primary} secondary={secondary} />}
        media={<SeoBanner src={banner.src} alt={banner.alt} width={1280} height={720} />}
      />
      <SeoArticle>
        <div className="lg:hidden">
          <SeoBanner src={banner.src} alt={banner.alt} width={1280} height={720} />
        </div>
        {page.setupSteps ? <SetupSteps steps={page.setupSteps} /> : null}
        <SectionProse page={page} />
        {page.relatedLinks ? <RelatedLinks links={page.relatedLinks} /> : null}
        <FaqBlock page={page} />
        <CtaBlock
          page={page}
          title="Put this feature to work on your LinkedIn account"
          body="Connect LinkedIn, fill My Product, and run the motion end to end in one workspace."
        />
      </SeoArticle>
    </SeoPageChrome>
  );
}
