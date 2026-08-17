import { RoundupList, VerdictBanner } from "./layouts";
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

export default function AlternativePageView({ page }: { page: SeoContentPage }) {
  const primary = page.primaryCta ?? { label: "Try Omentir", href: "/signup" };
  const secondary = page.secondaryCta ?? { label: "All matchups", href: "/comparisons" };
  const banner = seoHeroImage("alternatives", page.slug);
  const bannerNode = banner ? (
    <SeoBanner src={banner.src} alt={banner.alt} width={banner.width} height={banner.height} />
  ) : null;

  return (
    <SeoPageChrome
      jsonLdId={`seo-alternatives-${page.slug}-jsonld`}
      jsonLd={pageJsonLd("alternatives", page)}
    >
      <SeoHero
        title={page.title}
        description={page.description}
        fullHeight
        sentence
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Tool roundups", href: "/alternatives" },
          { label: page.title },
        ]}
        actions={<HeroActions primary={primary} secondary={secondary} />}
        media={bannerNode}
      />
      <SeoArticle>
        {banner ? <div className="lg:hidden">{bannerNode}</div> : null}
        <VerdictBanner page={page} />
        {page.roundupItems ? (
          <section id="shortlist">
            <h2
              style={{ fontFamily: "var(--font-varta)" }}
              className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
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
        <FaqBlock page={page} />
        <CtaBlock
          page={page}
          title={page.ctaTitle ?? "Pick the job, then pick the tool"}
          body={
            page.ctaBody ??
            "If the job is LinkedIn discovery plus conversations you can inspect, start with one Omentir ICP for two weeks."
          }
        />
      </SeoArticle>
    </SeoPageChrome>
  );
}
