"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";

// Catches a failed app page inside the app shell. Without it the root
// error.tsx replaced the whole app, sidebar included, with the marketing-site
// error screen and a "Back to home" link to the public homepage.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[app/(app)/error]", error);
  }, [error]);

  function retry() {
    // refresh re-runs the server part of the page; reset re-renders the client part.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div className="grid h-full min-h-0 place-items-center px-6">
      <div className="max-w-md text-center" role="alert">
        <p className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
          This page didn&apos;t load.
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
          Your agents and scheduled outreach keep running. Try loading the page again.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={retry}
            className="m3-btn m3-btn-filled inline-flex h-8 cursor-pointer px-3 text-xs"
          >
            Try again
          </button>
          <Link href="/overview" className="m3-btn m3-btn-outlined inline-flex h-8 px-3 text-xs">
            Go to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
