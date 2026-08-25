import Link from "next/link";
import type { ReactNode } from "react";
import type { GuideRelated } from "./types";

export type JobSlide = {
  n: string;
  title: string;
  flip: boolean;
  lead: string;
  body: ReactNode;
};

export function JobSlides({ slides }: { slides: readonly JobSlide[] }) {
  return (
    <div className="home-green-panels">
      {slides.map((slide) => (
        <article
          key={slide.n}
          className={`home-green-panel home-slide is-job${slide.flip ? " is-flip" : ""}`}
        >
          <div className="home-slide-copy">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c2d0aa]">
              {slide.n}
            </p>
            <h3>{slide.title}</h3>
          </div>
          <div className="home-slide-rule" aria-hidden="true" />
          <div className="home-slide-draw">
            <div className="job-slide-panel">
              <h4>{slide.lead}</h4>
              <p>{slide.body}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function LandingSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2
        style={{ fontFamily: "var(--font-varta)" }}
        className="max-w-3xl text-[1.65rem] font-semibold leading-tight tracking-tight text-[var(--md-sys-color-on-surface)] md:text-3xl"
      >
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export type RunbookStep = {
  title: string;
  body: ReactNode;
};

export function Runbook({
  title,
  steps,
}: {
  title: string;
  steps: readonly RunbookStep[];
}) {
  return (
    <LandingSection title={title}>
      <ol className="divide-y divide-[var(--md-sys-color-outline-variant)] border-y border-[var(--md-sys-color-outline-variant)]">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="grid gap-3 py-5 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-6"
          >
            <span className="pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--md-sys-color-on-surface-variant)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3
                style={{ fontFamily: "var(--font-varta)" }}
                className="text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
              >
                {step.title}
              </h3>
              <p className="mt-2 max-w-2xl text-base leading-8 text-[var(--md-sys-color-on-surface-variant)]">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </LandingSection>
  );
}

export function SurfaceCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-5 md:p-6 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function IndexMark({ n }: { n: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c2d0aa]">{n}</p>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-2 text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
      {children}
    </h3>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
      {children}
    </p>
  );
}

export function RelatedCards({ links }: { links: readonly GuideRelated[] }) {
  if (!links.length) return null;
  return (
    <section className="omentir-moderate-width min-w-0 py-12 md:py-16">
      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">More on Grok Bot</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-5 transition-colors hover:border-[var(--md-sys-color-outline)]"
          >
            <span className="text-base font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)]">
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
