import { BrandLogo } from "../comparisons/brand-logo";
import { linkifyProducts } from "./product-links";
import type { SeoContentPage, SeoPhase, SeoRoundupItem, SeoThreadLine } from "./types";

export function HighlightStrip({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-3 py-1 text-sm text-[var(--md-sys-color-on-surface)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function VerdictBanner({ page }: { page: SeoContentPage }) {
  if (!page.verdict) return null;
  return (
    <p className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-5 py-4 text-base leading-8 text-[var(--md-sys-color-on-surface)]">
      {page.verdict}
    </p>
  );
}

export function TimelineWeeks({ phases }: { phases: SeoPhase[] }) {
  if (phases.length === 0) return null;
  return (
    <ol>
      {phases.map((phase, index) => {
        const last = index === phases.length - 1;
        return (
          <li key={phase.title} className="flex gap-4 sm:gap-6">
            <div className="flex w-7 shrink-0 flex-col items-center">
              <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--md-sys-color-primary)] text-xs font-semibold text-[var(--md-sys-color-on-primary)]">
                {index + 1}
              </span>
              {last ? null : (
                <span
                  className="w-0.5 min-h-4 flex-1 bg-[var(--md-sys-color-primary)]"
                  aria-hidden="true"
                />
              )}
            </div>
            <div className={last ? undefined : "pb-10"}>
              <p
                style={{ fontFamily: "var(--font-varta)" }}
                className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
              >
                {phase.title}
              </p>
              <p className="mt-2 text-base leading-8 text-[var(--md-sys-color-on-surface-variant)]">
                {linkifyProducts(phase.detail)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function RoundupList({ items }: { items: SeoRoundupItem[] }) {
  if (items.length === 0) return null;
  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li
          key={item.name}
          className="grid gap-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-5 sm:grid-cols-[auto_1fr] sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--md-sys-color-primary)] text-sm font-semibold text-[var(--md-sys-color-on-primary)]">
              {index + 1}
            </span>
            <BrandLogo brand={item.name} size="md" decorative={false} />
          </div>
          <div className="min-w-0">
            <p
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
            >
              {item.name}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--md-sys-color-on-surface)]">
              <span className="font-semibold">Best for. </span>
              {item.bestFor}
            </p>
            <p className="mt-1 text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)]">
              <span className="font-semibold text-[var(--md-sys-color-on-surface)]">Watch for. </span>
              {item.watchFor}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ThreadPreview({ lines }: { lines: SeoThreadLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
      <p className="border-b border-[var(--md-sys-color-outline-variant)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--md-sys-color-on-surface-variant)]">
        A reply thread, not a sequence
      </p>
      <ol className="space-y-3 p-5">
        {lines.map((line, index) => {
          const align = line.speaker === "them" ? "items-start" : "items-end";
          const bubble =
            line.speaker === "them"
              ? "rounded-2xl rounded-tl-md bg-[var(--md-sys-color-surface-container-high)]"
              : line.speaker === "draft"
                ? "rounded-2xl rounded-tr-md border border-dashed border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]"
                : "rounded-2xl rounded-tr-md bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]";
          const label =
            line.speaker === "them" ? "Prospect" : line.speaker === "draft" ? "Draft to approve" : "You";
          return (
            <li key={`${line.speaker}-${index}`} className={`flex flex-col ${align}`}>
              <span className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--md-sys-color-on-surface-variant)]">
                {label}
              </span>
              <p className={`max-w-[34rem] px-4 py-3 text-sm leading-7 ${bubble}`}>{line.text}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function PhaseCalendar({ phases }: { phases: SeoPhase[] }) {
  if (phases.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {phases.map((phase, index) => (
        <article
          key={phase.title}
          className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--md-sys-color-on-surface-variant)]">
            Week {index + 1}
          </p>
          <p
            style={{ fontFamily: "var(--font-varta)" }}
            className="mt-2 text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
          >
            {phase.title}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--md-sys-color-on-surface-variant)]">
            {linkifyProducts(phase.detail)}
          </p>
        </article>
      ))}
    </div>
  );
}

export function FaceoffCards({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<{ dimension: string; cells: string[] }>;
}) {
  return (
    <div className={`grid gap-4 ${headers.length >= 3 ? "lg:grid-cols-3" : "sm:grid-cols-2"}`}>
      {headers.map((header, column) => (
        <article
          key={header}
          className="flex flex-col rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-5"
        >
          <div className="flex items-center gap-3">
            <BrandLogo brand={header} size="md" decorative={false} />
            <p
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
            >
              {header}
            </p>
          </div>
          <dl className="mt-5 space-y-4">
            {rows.map((row) => (
              <div key={`${header}-${row.dimension}`}>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--md-sys-color-on-surface-variant)]">
                  {row.dimension}
                </dt>
                <dd className="mt-1 text-sm leading-7 text-[var(--md-sys-color-on-surface)]">
                  {row.cells[column]}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}
