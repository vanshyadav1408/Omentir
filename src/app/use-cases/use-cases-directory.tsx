import Link from "next/link";
import type { SeoContentPage } from "../seo-content/types";
import { whoForUseCase } from "./use-case-who";

export default function UseCasesDirectory({
  pages,
}: {
  pages: readonly SeoContentPage[];
}) {
  return (
    <div className="space-y-14">
      <section aria-label="Use case list">
        <ul className="divide-y divide-[var(--md-sys-color-outline-variant)] border-y border-[var(--md-sys-color-outline-variant)]">
          {pages.map((page) => {
            const highlights = page.highlights ?? [];
            return (
              <li key={page.slug}>
                <Link
                  href={`/use-cases/${page.slug}`}
                  className="group flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-10 sm:py-6"
                >
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
                  {highlights.length > 0 ? (
                    <p className="shrink-0 text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:max-w-xs sm:pt-1 sm:text-right">
                      {highlights.join(" · ")}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Who each page is for">
        <h2
          style={{ fontFamily: "var(--font-varta)" }}
          className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
        >
          Who it's for
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
          If the motion is not yours this week, skip the page.
        </p>
        <dl className="mt-6 divide-y divide-[var(--md-sys-color-outline-variant)] border-y border-[var(--md-sys-color-outline-variant)]">
          {pages.map((page) => {
            const row = whoForUseCase(page.slug);
            return (
              <div
                key={page.slug}
                className="grid gap-2 py-5 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-10 sm:py-6"
              >
                <dt>
                  <Link
                    href={`/use-cases/${page.slug}`}
                    className="font-semibold text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)]"
                  >
                    {page.title}
                  </Link>
                </dt>
                <dd className="text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
                  {row.who}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </div>
  );
}
