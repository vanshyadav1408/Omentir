import Link from "next/link";
import {
  MarketingTable,
  MarketingTd,
  MarketingTh,
  MarketingThead,
  MarketingTr,
} from "../marketing-table";
import type { SeoContentPage } from "../seo-content/types";
import { integrationConnect } from "./integration-connect";
import IntegrationLogo, { integrationName } from "./integration-logo";

export default function IntegrationsDirectory({
  pages,
}: {
  pages: readonly SeoContentPage[];
}) {
  return (
    <div className="space-y-14">
      <section aria-label="Integration list">
        <ul>
          {pages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/integrations/${page.slug}`}
                className="group flex items-start gap-4 py-5 sm:py-6"
              >
                <IntegrationLogo slug={page.slug} />
                <div className="min-w-0">
                  <h2
                    style={{ fontFamily: "var(--font-varta)" }}
                    className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] transition-colors group-hover:text-[var(--md-sys-color-primary)]"
                  >
                    {page.title}
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
                    {page.summary}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Connect matrix">
        <h2
          style={{ fontFamily: "var(--font-varta)" }}
          className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
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
              const row = integrationConnect(page.slug);
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
