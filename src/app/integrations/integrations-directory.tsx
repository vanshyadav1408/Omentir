import Link from "next/link";
import {
  MarketingTable,
  MarketingTd,
  MarketingTh,
  MarketingThead,
  MarketingTr,
} from "../marketing-table";
import type { SeoContentPage } from "../seo-content/types";
import { SeoTitleList } from "../seo-content/shared";
import IntegrationLogo, { integrationName } from "./integration-logo";

export default function IntegrationsDirectory({
  pages,
}: {
  pages: readonly Pick<SeoContentPage, "slug" | "title" | "summary" | "connect">[];
}) {
  return (
    <div className="space-y-14">
      <section aria-label="Integration list">
        <h2
          style={{ fontFamily: "var(--font-varta)" }}
          className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
        >
          Integrations
        </h2>
        <SeoTitleList
          items={pages.map((page) => ({
            href: `/integrations/${page.slug}`,
            label: page.title,
          }))}
        />
      </section>

      <section aria-label="Connect matrix">
        <h2
          style={{ fontFamily: "var(--font-varta)" }}
          className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
        >
          Connect paths
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
          Chat apps approve the workspace. Coding agents and scripts send a
          revocable API key.
        </p>
        <MarketingTable className="mt-6">
          <MarketingThead>
            <tr>
              <MarketingTh>Integration</MarketingTh>
              <MarketingTh>Surface</MarketingTh>
              <MarketingTh>Auth</MarketingTh>
              <MarketingTh>Best for</MarketingTh>
            </tr>
          </MarketingThead>
          <tbody>
            {pages.map((page) => {
              const row = page.connect;
              if (!row) return null;
              return (
                <MarketingTr key={page.slug}>
                  <MarketingTh scope="row">
                    <Link
                      href={`/integrations/${page.slug}`}
                      className="inline-flex items-center gap-3 hover:text-[var(--md-sys-color-primary)]"
                    >
                      <IntegrationLogo slug={page.slug} size="sm" />
                      {integrationName(page.slug)}
                    </Link>
                  </MarketingTh>
                  <MarketingTd>{row.surface}</MarketingTd>
                  <MarketingTd>{row.auth}</MarketingTd>
                  <MarketingTd>{row.bestFor}</MarketingTd>
                </MarketingTr>
              );
            })}
          </tbody>
        </MarketingTable>
      </section>
    </div>
  );
}
