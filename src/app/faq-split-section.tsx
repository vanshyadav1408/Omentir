import FaqAccordion, { type FaqItem } from "./faq-accordion";

export default function FaqSplitSection({
  items,
  className,
}: {
  items: readonly FaqItem[];
  className?: string;
}) {
  return (
    <section
      id="faq"
      className={`omentir-primary-width min-w-0 scroll-mt-24 ${className ?? ""}`}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start lg:gap-24 xl:gap-32">
        <h2 className="faq-section-heading">Frequently asked questions</h2>
        <div className="border-y border-[var(--md-sys-color-outline-variant)]">
          <FaqAccordion items={items} chevron />
        </div>
      </div>
    </section>
  );
}
