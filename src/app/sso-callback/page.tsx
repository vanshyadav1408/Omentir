"use client";

import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/nextjs";

/**
 * OAuth return URL. Wait for Clerk to finish loading before mounting the
 * callback UI so Turbopack / slow networks don't hit the 10s renderer timeout.
 */
export default function SsoCallbackPage() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)]">
        <p className="text-sm font-medium">Completing sign-in…</p>
      </main>
    );
  }

  return <AuthenticateWithRedirectCallback />;
}
