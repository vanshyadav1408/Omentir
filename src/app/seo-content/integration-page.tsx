import Link from "next/link";
import Compose from "../compose";
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

export default function IntegrationPageView({ page }: { page: SeoContentPage }) {
  const compose = page.slug === "claude-code";
  const banner = seoHeroImage("integrations", page.slug);
  const bannerNode = banner ? (
    <div className="mt-8">
      <SeoBanner src={banner.src} alt={banner.alt} width={banner.width} height={banner.height} />
    </div>
  ) : null;

  return (
    <SeoPageChrome
      jsonLdId={`seo-integrations-${page.slug}-jsonld`}
      jsonLd={pageJsonLd("integrations", page)}
    >
      <Compose enabled={compose}>
        <SeoDocLayout
          as="article"
          crumbs={familyCrumbs("integrations", page.slug)}
          title={page.title}
          afterTitle={bannerNode}
        >
          <section>
            <h2
              style={{ fontFamily: "var(--font-varta)" }}
              className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
            >
              Endpoints
            </h2>
            <dl className="mt-5 space-y-4 font-mono text-sm leading-6">
              <div>
                <dt className="text-[var(--md-sys-color-on-surface-variant)]">MCP</dt>
                <dd className="mt-1 break-all">https://omentir.com/api/agent/v1/mcp</dd>
              </div>
              <div>
                <dt className="text-[var(--md-sys-color-on-surface-variant)]">REST</dt>
                <dd className="mt-1 break-all">https://omentir.com/api/agent/v1/*</dd>
              </div>
              <div>
                <dt className="text-[var(--md-sys-color-on-surface-variant)]">Guide</dt>
                <dd className="mt-1">
                  <Link
                    href="/agents.md"
                    className="text-[var(--md-sys-color-primary)] underline-offset-2 hover:underline"
                  >
                    /agents.md
                  </Link>
                </dd>
              </div>
            </dl>
          </section>

          {page.setupSteps ? <SetupSteps steps={page.setupSteps} /> : null}
          <SectionProse page={page} />
          {page.relatedLinks ? <RelatedLinks links={page.relatedLinks} /> : null}
          <FaqBlock page={page} branded />
          <CtaBlock
            page={page}
            boxed
            title="Connect your operator to a real sales workspace"
            body="Omentir holds the LinkedIn connection and safety limits. Your AI configures agents and inspects results."
          />
        </SeoDocLayout>
      </Compose>
    </SeoPageChrome>
  );
}
