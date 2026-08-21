import Link from "next/link";

export default function MarketingClosingCta({ className }: { className?: string }) {
  return (
    <section className={className}>
      <h2 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--md-sys-color-on-surface)] md:text-4xl">
        Get started with Omentir
      </h2>
      <div className="m3-btn-pair mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="m3-btn m3-btn-filled m3-btn--hero w-full sm:w-auto"
        >
          Get started
        </Link>
        <Link
          href="/#features"
          className="m3-btn m3-btn-outlined m3-btn--hero w-full sm:w-auto"
        >
          See how it works
        </Link>
      </div>
    </section>
  );
}
