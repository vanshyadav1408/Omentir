import Image from "next/image";

export type BodyArt = {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
};

export function BodyFigure({ art }: { art: BodyArt }) {
  return (
    <figure className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
      <Image
        src={art.src}
        alt={art.alt}
        width={art.width ?? 1600}
        height={art.height ?? 900}
        className="h-auto w-full"
        sizes="(min-width: 1024px) 720px, calc(100vw - 32px)"
      />
      <figcaption className="border-t border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
        {art.caption}
      </figcaption>
    </figure>
  );
}

export function FlowStrip({
  title,
  steps,
}: {
  title: string;
  steps: ReadonlyArray<{ label: string; detail: string }>;
}) {
  return (
    <aside className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
      <p className="border-b border-[var(--md-sys-color-outline-variant)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--md-sys-color-on-surface-variant)]">
        {title}
      </p>
      <ol
        className={`grid gap-0 ${
          steps.length >= 4 ? "sm:grid-cols-4" : steps.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
        }`}
      >
        {steps.map((step, index) => (
          <li
            key={step.label}
            className={`px-5 py-5 ${index > 0 ? "border-t border-[var(--md-sys-color-outline-variant)] sm:border-t-0 sm:border-l" : ""}`}
          >
            <div className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-[var(--md-sys-color-primary)] text-sm font-semibold text-[var(--md-sys-color-on-primary)]">
              {index + 1}
            </div>
            <p className="font-semibold text-[var(--md-sys-color-on-surface)]">{step.label}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
              {step.detail}
            </p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
