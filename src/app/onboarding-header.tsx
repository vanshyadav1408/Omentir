import Link from "next/link";
import LogoMark from "./logo-mark";

// Same mark, type, and left edge as MarketingHeader. Auth stays on black, so
// the wordmark is white instead of the landing on-surface token.
export default function OnboardingHeader() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-50 h-16">
      <div className="omentir-primary-width pointer-events-auto flex h-16 min-w-0 items-center">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 select-none items-center gap-1.5 text-[20px] font-medium leading-none tracking-tight text-white md:gap-2 md:text-[24px]"
        >
          <LogoMark className="h-6 w-6 md:h-7 md:w-7" />
          <span className="truncate">Omentir</span>
        </Link>
      </div>
    </header>
  );
}
