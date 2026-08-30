import Link from "next/link";
import type { ReactNode } from "react";
import type { GuideRelated } from "./types";

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

export function RelatedCards({
  links,
  heading = "Related",
}: {
  links: readonly GuideRelated[];
  heading?: string;
}) {
  if (!links.length) return null;
  return (
    <section className="omentir-moderate-width min-w-0 py-12 md:py-16">
      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{heading}</p>
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
