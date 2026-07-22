import Link from "next/link";
import HeaderAuth from "./header-auth";
import LogoMark from "./logo-mark";
import { createPageMetadata } from "./seo";

export const metadata = createPageMetadata({
  title: "Page not found - Omentir",
  description: "The page you are looking for does not exist or has moved.",
  noIndex: true,
});

export default function NotFound() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      {/* Minimal header: logo + auth only, no marketing nav links. */}
      <header className="w-full shrink-0 bg-[var(--md-sys-color-surface-container)]">
        <div className="mx-auto flex h-16 w-full max-w-7xl min-w-0 items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8">
          <Link
            href="/"
            className="flex min-w-0 shrink-0 select-none items-center gap-2 text-[22px] font-medium leading-none tracking-tight text-[var(--md-sys-color-on-surface)]"
          >
            <LogoMark />
            Omentir
          </Link>
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <HeaderAuth />
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 pb-14 text-center sm:px-8">
        <p
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-gradient-brand text-[5rem] font-semibold leading-none tracking-tight sm:text-[8rem]"
        >
          404
        </p>
        <h1
          style={{ fontFamily: "var(--font-varta)" }}
          className="mt-4 text-3xl font-semibold tracking-tight text-black sm:text-4xl"
        >
          This page wandered off.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-8 text-zinc-600 sm:text-lg">
          The page you are looking for does not exist, may have moved, or the link
          was mistyped. Let&apos;s get you back to finding customers.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="m3-btn m3-btn-filled h-12 px-8 text-base"
          >
            Back to home
          </Link>
          <Link
            href="/blogs"
            className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-300 bg-white/90 px-8 text-base font-medium text-zinc-950 transition-colors hover:border-zinc-900"
          >
            Read the blog
          </Link>
        </div>
      </section>
    </main>
  );
}
