"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

/**
 * OAuth return URL. Handle the redirect with the Clerk JS API only — no
 * prebuilt UI host — so Turbopack / slow networks never hit the
 * "[Clerk UI] Component renderer did not mount within 10s" path that
 * AuthenticateWithRedirectCallback can still touch when captcha/tasks load.
 */
export default function SsoCallbackPage() {
  const { isLoaded } = useAuth();
  const clerk = useClerk();
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !clerk.loaded || started.current) return;
    started.current = true;

    void clerk
      .handleRedirectCallback({
        signInFallbackRedirectUrl: "/dashboard",
        signUpFallbackRedirectUrl: "/onboarding",
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Could not complete sign-in.";
        setError(message);
      });
  }, [isLoaded, clerk]);

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--md-sys-color-surface)] px-4 text-center text-[var(--md-sys-color-on-surface-variant)]">
      {error ? (
        <div className="grid max-w-sm gap-3">
          <p className="text-sm font-medium text-[var(--md-sys-color-error)]">{error}</p>
          <a
            href="/login"
            className="text-sm font-semibold text-[var(--md-sys-color-primary)] hover:opacity-90"
          >
            Back to login
          </a>
        </div>
      ) : (
        <p className="text-sm font-medium">Completing sign-in…</p>
      )}
    </main>
  );
}
