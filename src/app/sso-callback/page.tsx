"use client";

import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { AuthHeading } from "../auth-ui";

/**
 * OAuth return URL. Handle the redirect with the Clerk JS API only, no
 * prebuilt UI host, so Turbopack / slow networks never hit the
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
        signInFallbackRedirectUrl: "/overview",
        signUpFallbackRedirectUrl: "/onboarding",
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Could not complete sign-in.";
        setError(message);
      });
  }, [isLoaded, clerk]);

  return (
    <div className="w-full">
      {error ? (
        <>
          <AuthHeading title="Could not complete sign-in" subtitle={error} />
          <Link href="/login" className="auth-btn">
            Back to login
          </Link>
        </>
      ) : (
        <AuthHeading title="Welcome to Omentir" subtitle="Completing sign-in..." />
      )}
    </div>
  );
}
