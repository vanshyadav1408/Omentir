import { BrandLogo } from "../comparisons/brand-logo";
import { comparisonBrandFromSlug } from "../comparisons/comparison-logos";
import {
  MarketingTable,
  MarketingTd,
  MarketingTh,
  MarketingThead,
  MarketingTr,
} from "../marketing-table";
import {
  ArticleSection,
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
import { ProductHomeLink } from "./product-links";
import { seoHeroImage, type SeoContentPage } from "./types";

export default function ComparisonPageView({ page }: { page: SeoContentPage }) {
  const primary = page.primaryCta ?? { label: "Try Omentir", href: "/signup" };
  const secondary = page.secondaryCta ?? { label: "Pricing", href: "/pricing" };
  const competitor = comparisonBrandFromSlug(page.slug);
  const banner = seoHeroImage("comparisons", page.slug);

  const table = page.comparisonTable
    ? {
        headers: page.comparisonTable.headers.slice(0, 2),
        rows: page.comparisonTable.rows.map((row) => ({
          dimension: row.dimension,
          cells: row.cells.slice(0, 2),
        })),
      }
    : null;

  const chooseUs = page.sections.find(
    (s) =>
      s.id.includes("omentir") ||
      s.id.includes("choose-omentir") ||
      s.heading.toLowerCase().includes("choose omentir") ||
      s.heading.toLowerCase().includes("when omentir") ||
      s.heading.toLowerCase().includes("omentir when") ||
      s.heading.toLowerCase().includes("omentir is") ||
      s.heading.toLowerCase().includes("omentir's case") ||
      s.heading.toLowerCase().includes("omentir fits") ||
      s.heading.toLowerCase().includes("pick omentir") ||
      s.heading.toLowerCase().includes("where omentir")
  );
  const chooseThem = page.sections.find(
    (s) =>
      s.id !== chooseUs?.id &&
      (s.id.includes("choose-") ||
        s.heading.toLowerCase().includes("look harder") ||
        s.heading.toLowerCase().includes("evaluate") ||
        s.heading.toLowerCase().includes("may still") ||
        s.heading.toLowerCase().includes("when apollo") ||
        s.heading.toLowerCase().includes("when lusha") ||
        s.heading.toLowerCase().includes("pick smartlead") ||
        s.heading.toLowerCase().includes("pick clay") ||
        s.heading.toLowerCase().includes("cognism") ||
        s.heading.toLowerCase().includes("instantly is") ||
        s.heading.toLowerCase().includes("artisan") ||
        s.heading.toLowerCase().includes("keep evaluating") ||
        s.heading.toLowerCase().includes("where instantly"))
  );

  const skipIds = [chooseUs?.id, chooseThem?.id].filter(Boolean) as string[];

  return (
    <SeoPageChrome
      jsonLdId={`seo-comparisons-${page.slug}-jsonld`}
      jsonLd={pageJsonLd("comparisons", page)}
    >
      <SeoHero
        title={page.title}
        description={page.description}
        fullHeight
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Alternatives", href: "/comparisons" },
          { label: page.title },
        ]}
        actions={<HeroActions primary={primary} secondary={secondary} />}
        media={<SeoBanner src={banner.src} alt={banner.alt} width={1280} height={720} />}
      />
      <SeoArticle>
        <div className="lg:hidden">
          <SeoBanner src={banner.src} alt={banner.alt} width={1280} height={720} />
        </div>
        {page.verdict ? (
          <p className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-5 py-4 text-base leading-8 text-[var(--md-sys-color-on-surface)]">
            {page.verdict}
          </p>
        ) : null}

        {table ? (
          <section aria-label="Comparison table">
            <h2
              style={{ fontFamily: "var(--font-varta)" }}
              className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
            >
              {table.headers[0]} and{" "}
              <ProductHomeLink name={table.headers[1]}>{table.headers[1]}</ProductHomeLink>
            </h2>
            <MarketingTable className="mt-6 hidden sm:block" minWidthClass="">
              <MarketingThead>
                <tr>
                  <MarketingTh>Dimension</MarketingTh>
                  {table.headers.map((header) => (
                    <MarketingTh key={header}>
                      <ComparisonBrandLabel name={header} />
                    </MarketingTh>
                  ))}
                </tr>
              </MarketingThead>
              <tbody>
                {table.rows.map((row) => (
                  <MarketingTr key={row.dimension}>
                    <MarketingTh scope="row">{row.dimension}</MarketingTh>
                    {row.cells.map((cell, index) => (
                      <MarketingTd key={`${row.dimension}-${index}`}>
                        {cell}
                      </MarketingTd>
                    ))}
                  </MarketingTr>
                ))}
              </tbody>
            </MarketingTable>
            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] sm:hidden">
              {table.rows.map((row, rowIndex) => (
                <div
                  key={row.dimension}
                  className={`px-5 py-4 ${rowIndex > 0 ? "border-t border-[var(--md-sys-color-outline-variant)]" : ""}`}
                >
                  <h3 className="font-semibold text-[var(--md-sys-color-on-surface)]">
                    {row.dimension}
                  </h3>
                  <dl className="mt-3 space-y-3 text-sm leading-6">
                    {row.cells.map((cell, index) => (
                      <div key={`${row.dimension}-mobile-${index}`}>
                        <dt className="text-[var(--md-sys-color-on-surface-variant)]">
                          {table.headers[index] ? (
                            <ComparisonBrandLabel name={table.headers[index]} />
                          ) : null}
                        </dt>
                        <dd className="mt-1 text-[var(--md-sys-color-on-surface)]">{cell}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
            {competitor ? (
              <p className="mt-3 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
                This page compares Omentir with{" "}
                <ProductHomeLink name={competitor.name}>{competitor.name}</ProductHomeLink> only. Feature
                sets change. Confirm current packaging on each product site before you buy.
              </p>
            ) : null}
          </section>
        ) : null}

        {chooseUs || chooseThem ? (
          <div className="space-y-12">
            {chooseUs ? (
              <ArticleSection
                id={chooseUs.id}
                heading={chooseUs.heading}
                paragraphs={chooseUs.paragraphs}
                bullets={chooseUs.bullets}
              />
            ) : null}
            {chooseThem ? (
              <ArticleSection
                id={chooseThem.id}
                heading={chooseThem.heading}
                paragraphs={chooseThem.paragraphs}
                bullets={chooseThem.bullets}
              />
            ) : null}
          </div>
        ) : null}

        <SectionProse page={page} skipIds={skipIds} />
        {page.relatedLinks ? <RelatedLinks links={page.relatedLinks} /> : null}
        <FaqBlock page={page} />
        <CtaBlock
          page={page}
          title={page.ctaTitle ?? "Ready to test Omentir on your ICP?"}
          body={
            page.ctaBody ??
            "Run one segment for two weeks. Measure replies and meetings, not vanity sends."
          }
        />
      </SeoArticle>
    </SeoPageChrome>
  );
}

function ComparisonBrandLabel({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2 leading-none">
      <BrandLogo brand={name} size="sm" framed={false} />
      <ProductHomeLink
        name={name}
        className="underline-offset-4 hover:text-[var(--md-sys-color-primary)] hover:underline"
      >
        {name}
      </ProductHomeLink>
    </span>
  );
}
