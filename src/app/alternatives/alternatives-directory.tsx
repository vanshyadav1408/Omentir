import Link from "next/link";
import type { SeoContentPage } from "../seo-content/types";
import { alternativePick } from "./alternative-pick";

export default function AlternativesDirectory({
  pages,
}: {
  pages: readonly SeoContentPage[];
}) {
  return (
    <div className="space-y-14">
      <section>
        <h2
          style={{ fontFamily: "var(--font-varta)" }}
          className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
        >
          By category
        </h2>
        <ul className="mt-4">
          {pages.map((page) => {
            const names = (page.roundupItems ?? []).map((item) => item.name);
            return (
              <li key={page.slug}>
                <Link
                  href={`/alternatives/${page.slug}`}
                  className="group flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-10 sm:py-6"
                >
                  <div className="min-w-0">
                    <h3
                      style={{ fontFamily: "var(--font-varta)" }}
                      className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] transition-colors group-hover:text-[var(--md-sys-color-primary)]"
                    >
                      {page.title}
                    </h3>
                    <p className="mt-1 max-w-3xl text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
                      {page.summary}
                    </p>
                  </div>
                  {names.length > 0 ? (
                    <p className="shrink-0 text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:max-w-xs sm:pt-1 sm:text-right">
                      {names.join(" · ")}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Pick by job">
        <h2
          style={{ fontFamily: "var(--font-varta)" }}
          className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
        >
          Pick by job
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
          Open the roundup that matches the job you are already shopping.
        </p>
        <dl className="mt-6">
          {pages.map((page) => {
            const row = alternativePick(page.slug);
            return (
              <div
                key={page.slug}
                className="grid gap-2 py-5 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-10 sm:py-6"
              >
                <dt>
                  <Link
                    href={`/alternatives/${page.slug}`}
                    className="font-semibold text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)]"
                  >
                    {page.title}
                  </Link>
                </dt>
                <dd className="text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
                  {row.openIf}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </div>
  );
}
