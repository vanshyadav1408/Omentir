import {
  HighlightStrip,
  TimelineWeeks,
  VerdictBanner,
} from "./layouts";
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
import { cmsHeroBanner, type SeoContentPage } from "./types";

export default function UseCasePageView({ page }: { page: SeoContentPage }) {
  const banner = cmsHeroBanner(page);
  const bannerNode = banner ? (
    <div className="mt-8">
      <SeoBanner src={banner.src} alt={banner.alt} width={banner.width} height={banner.height} />
    </div>
  ) : null;

  return (
    <SeoPageChrome
      jsonLdId={`seo-use-cases-${page.slug}-jsonld`}
      jsonLd={pageJsonLd("use-cases", page)}
    >
      <SeoDocLayout
        as="article"
        crumbs={familyCrumbs("use-cases", page.slug)}
        title={page.title}
        afterTitle={bannerNode}
        path={`/use-cases/${page.slug}`}
      >
        {page.highlights ? <HighlightStrip items={page.highlights} /> : null}
        <VerdictBanner page={page} />
        {page.phases ? (
          <section id="first-weeks">
            <h2
              style={{ fontFamily: "var(--font-varta)" }}
              className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
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
        <FaqBlock page={page} branded />
        <CtaBlock
          page={page}
          boxed
          title={page.ctaTitle ?? "Run this motion on one LinkedIn account"}
          body={
            page.ctaBody ??
            "Connect LinkedIn, fill My Product, and measure replies before you add volume."
          }
        />
      </SeoDocLayout>
    </SeoPageChrome>
  );
}
