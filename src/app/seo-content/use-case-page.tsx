import {
  HighlightStrip,
  TimelineWeeks,
  VerdictBanner,
} from "./layouts";
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
} from "./shared";
import { seoHeroImage, type SeoContentPage } from "./types";

export default function UseCasePageView({ page }: { page: SeoContentPage }) {
  const primary = page.primaryCta ?? { label: "Start this motion", href: "/signup" };
  const secondary = page.secondaryCta ?? { label: "See pricing", href: "/pricing" };
  const banner = seoHeroImage("use-cases", page.slug);
  const bannerNode = banner ? (
    <SeoBanner src={banner.src} alt={banner.alt} width={banner.width} height={banner.height} />
  ) : null;

  return (
    <SeoPageChrome
      jsonLdId={`seo-use-cases-${page.slug}-jsonld`}
      jsonLd={pageJsonLd("use-cases", page)}
    >
      <SeoHero
        title={page.title}
        description={page.description}
        compact
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Use cases", href: "/use-cases" },
          { label: page.title },
        ]}
        actions={<HeroActions primary={primary} secondary={secondary} />}
      />
      <SeoArticle>
        {bannerNode}
        {page.highlights ? <HighlightStrip items={page.highlights} /> : null}
        <VerdictBanner page={page} />
        {page.phases ? (
          <section id="first-weeks">
            <h2
              style={{ fontFamily: "var(--font-varta)" }}
              className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
            >
              First weeks
            </h2>
            <div className="mt-6">
              <TimelineWeeks phases={page.phases} />
            </div>
          </section>
        ) : null}
        <SectionProse page={page} />
        {page.relatedLinks ? <RelatedLinks links={page.relatedLinks} /> : null}
        <FaqBlock page={page} />
        <CtaBlock
          page={page}
          title={page.ctaTitle ?? "Run this motion on one LinkedIn account"}
          body={
            page.ctaBody ??
            "Connect LinkedIn, fill My Product, and measure replies before you add volume."
          }
        />
      </SeoArticle>
    </SeoPageChrome>
  );
}
