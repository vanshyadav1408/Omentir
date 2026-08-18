"use client";

import { useState } from "react";
import Link from "next/link";
import type { SeoContentPage } from "../seo-content/types";
import { BrandLogo } from "./brand-logo";
import { comparisonBrandFromSlug } from "./comparison-logos";

const PAGE_SIZE = 8;

export default function ComparisonsDirectory({
  pages,
}: {
  pages: readonly SeoContentPage[];
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const remaining = pages.length - visible;

  return (
    <section aria-label="Comparison list">
      <ul>
        {pages.map((page, index) => {
          const brand = comparisonBrandFromSlug(page.slug);
          const names = page.comparisonTable?.headers ?? [];
          return (
            <li key={page.slug} hidden={index >= visible}>
              <Link
                href={`/comparisons/${page.slug}`}
                className="group flex items-start gap-4 py-5 sm:py-6"
              >
                {brand ? <BrandLogo brand={brand} /> : null}
                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
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
                  {names.length > 0 ? (
                    <p className="shrink-0 text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:max-w-xs sm:pt-1 sm:text-right">
                      {names.join(" · ")}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {remaining > 0 ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-5 text-sm font-semibold text-[var(--md-sys-color-on-surface)] transition hover:bg-[var(--md-sys-state-hover)]"
          >
            See more
          </button>
        </div>
      ) : null}
    </section>
  );
}
