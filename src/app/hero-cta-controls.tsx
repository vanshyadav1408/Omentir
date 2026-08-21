"use client";

import Link from "next/link";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3">
      <path
        d="M2 6h7M6 3l3 3-3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HeroCtaControls({ isSignedIn }: { isSignedIn: boolean }) {
  if (isSignedIn) {
    return (
      <div className="m3-btn-pair mt-4 flex flex-wrap gap-3 md:mt-5">
        <Link href="/overview" className="m3-btn m3-btn-filled m3-btn--hero">
          Overview
        </Link>
        <Link
          href="#features"
          className="m3-btn m3-btn-outlined m3-btn--hero hero-cta-secondary gap-1.5"
        >
          See how it works
          <ArrowIcon />
        </Link>
      </div>
    );
  }

  return (
    <div className="hero-enter hero-enter-delay-1 m3-btn-pair mt-4 flex flex-wrap gap-3 md:mt-5">
      <Link href="/signup" className="m3-btn m3-btn-filled m3-btn--hero">
        Get started
      </Link>
      <Link
        href="#features"
        className="m3-btn m3-btn-outlined m3-btn--hero hero-cta-secondary gap-1.5"
      >
        See how it works
        <ArrowIcon />
      </Link>
    </div>
  );
}
