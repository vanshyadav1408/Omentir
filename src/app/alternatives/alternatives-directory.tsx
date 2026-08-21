import Link from "next/link";
import type { SeoContentPage } from "../seo-content/types";
import { SeoTitleList } from "../seo-content/shared";
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
          className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
        >
          By category
        </h2>
        <SeoTitleList
          items={pages.map((page) => ({
            href: `/alternatives/${page.slug}`,
            label: page.title,
          }))}
        />
      </section>

      <section aria-label="Pick by job">
        <h2
          style={{ fontFamily: "var(--font-varta)" }}
          className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
        >
          Pick by job
        </h2>
        <ul className="divide-y divide-[var(--md-sys-color-outline-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
          {pages.map((page) => {
            const row = alternativePick(page.slug);
            return (
              <li key={page.slug}>
                <Link href={`/alternatives/${page.slug}`} className="group block py-4">
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)] transition-colors group-hover:text-[var(--md-sys-color-primary)]">
                    {page.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
                    {row.openIf}
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
