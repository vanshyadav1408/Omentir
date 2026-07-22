import Link from "next/link";
import LogoMark from "./logo-mark";

// Branded top header for the onboarding / auth pages. Matches marketing
// header metrics; surface + on-surface tokens keep light and dark aligned.
export default function OnboardingHeader() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 w-full bg-[var(--md-sys-color-surface-container)]/90 backdrop-blur-xl">
      <header className="mx-auto flex h-16 w-full min-w-0 max-w-7xl items-center px-4 py-2 md:px-8">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 select-none items-center gap-1.5 text-base font-medium tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-lg"
        >
          <LogoMark className="h-8 w-8 text-[var(--md-sys-color-on-surface)]" />
          Omentir
        </Link>
      </header>
    </div>
  );
}
