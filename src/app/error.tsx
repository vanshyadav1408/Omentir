"use client";

import Link from "next/link";
import { useEffect } from "react";
import LogoMark from "./logo-mark";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <header className="w-full shrink-0 bg-[var(--md-sys-color-surface-container)]">
        <div className="mx-auto flex h-16 w-full max-w-7xl min-w-0 items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8">
          <Link
            href="/"
            className="flex min-w-0 shrink-0 select-none items-center gap-2 text-[22px] font-medium leading-none tracking-tight text-[var(--md-sys-color-on-surface)]"
          >
            <LogoMark />
            Omentir
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 pb-14 text-center sm:px-8">
        <p
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-gradient-brand text-[4rem] font-semibold leading-none tracking-tight sm:text-[5rem]"
        >
          Oops
        </p>
        <h1
          style={{ fontFamily: "var(--font-varta)" }}
          className="mt-4 text-3xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-4xl"
        >
          Something went wrong.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-8 text-[var(--md-sys-color-on-surface-variant)] sm:text-lg">
          We hit an unexpected error loading this page. You can try again, or head
          back home.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="m3-btn m3-btn-filled h-12 cursor-pointer px-8 text-base"
          >
            Try again
          </button>
          <Link href="/" className="m3-btn m3-btn-outlined h-12 px-8 text-base">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
