import type { SeoContentPage } from "../seo-content/types";
import { SeoTitleList } from "../seo-content/shared";

export default function ComparisonsDirectory({
  pages,
}: {
  pages: readonly SeoContentPage[];
}) {
  return (
    <section aria-label="Comparison list">
      <h2
        style={{ fontFamily: "var(--font-varta)" }}
        className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
      >
        Comparisons
      </h2>
      <SeoTitleList
        items={pages.map((page) => ({
          href: `/comparisons/${page.slug}`,
          label: page.title,
        }))}
      />
    </section>
  );
}
