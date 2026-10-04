import type { ReactNode } from "react";

function StepIcon({ children }: { children: ReactNode }) {
  return (
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--cal-blue-soft)] text-[var(--cal-blue)]">
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
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
            className="rounded-[20px] bg-[var(--cal-surface)] px-6 py-8 text-center shadow-[var(--cal-shadow)] md:px-7 md:py-9"
          >
            {ICONS[index] ?? null}
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cal-muted)]">
              Step {index + 1}
            </p>
            <h3
              style={{ fontFamily: "var(--font-cal-display)" }}
              className="mt-2 text-xl font-medium tracking-tight text-[var(--site-text)]"
            >
              {step.title}
            </h3>
            <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-6 text-[var(--cal-muted)]">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
