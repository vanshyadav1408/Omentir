import Link from "next/link";
import type { SeoContentPage } from "../seo-content/types";
import { SeoTitleList } from "../seo-content/shared";
import { whoForUseCase } from "./use-case-who";

export default function UseCasesDirectory({
  pages,
}: {
  pages: readonly SeoContentPage[];
}) {
  return (
    <div className="space-y-14">
      <section aria-label="Use case list">
        <h2
          style={{ fontFamily: "var(--font-varta)" }}
          className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
        >
          Use cases
        </h2>
        <SeoTitleList
          items={pages.map((page) => ({
            href: `/use-cases/${page.slug}`,
            label: page.title,
          }))}
        />
      </section>

      <section aria-label="Who each page is for">
        <h2
          style={{ fontFamily: "var(--font-varta)" }}
          className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
        >
          Who it's for
        </h2>
        <ul className="divide-y divide-[var(--md-sys-color-outline-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
          {pages.map((page) => {
            const who =
              page.who ??
              (() => {
                try {
                  return whoForUseCase(page.slug).who;
                } catch {
                  return page.summary;
                }
              })();
            return (
              <li key={page.slug}>
                <Link href={`/use-cases/${page.slug}`} className="group block py-4">
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)] transition-colors group-hover:text-[var(--md-sys-color-primary)]">
                    {page.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
                    {who}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
