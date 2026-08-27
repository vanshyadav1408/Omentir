import type { ReactNode } from "react";

function StepIcon({ children }: { children: ReactNode }) {
  return (
    <span className="mx-auto grid h-10 w-10 place-items-center text-[var(--md-sys-color-on-surface)]">
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  );
}

const ICONS = [
  <StepIcon key="analyse">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    <circle cx="12" cy="12" r="4" />
    <path d="m15.5 8.5 2-2M8.5 15.5l-2 2" />
  </StepIcon>,
  <StepIcon key="search">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 4.5 4.5" />
  </StepIcon>,
  <StepIcon key="filter">
    <path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5Z" />
  </StepIcon>,
] as const;

export default function ToolHowItWorks({
  steps,
}: {
  steps: ReadonlyArray<{ title: string; body: string }>;
}) {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="omentir-primary-width relative z-10 min-w-0 pt-16 md:pt-20"
    >
      <h2 id="how-it-works-heading" className="faq-section-heading text-center">
        How it works
      </h2>
      <ol className="mt-8 grid gap-4 md:mt-10 md:grid-cols-3 md:gap-5">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] px-6 py-8 text-center md:px-7 md:py-9"
          >
            {ICONS[index] ?? null}
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--md-sys-color-on-surface-variant)]">
              Step {index + 1}
            </p>
            <h3
              style={{ fontFamily: "var(--font-varta)" }}
              className="mt-2 text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
            >
              {step.title}
            </h3>
            <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
