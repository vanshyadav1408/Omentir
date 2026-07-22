"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const POLL_SECONDS = 60;

export default function SubscriptionSuccessRedirect() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(POLL_SECONDS);

  useEffect(() => {
    let cancelled = false;

    const checkBilling = async () => {
      try {
        const response = await fetch("/api/billing/status", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          active?: boolean;
          nextPath?: string | null;
        };
        const nextPath = data.nextPath;
        if (!cancelled && data.active && nextPath) {
          router.replace(nextPath);
          window.setTimeout(() => {
            if (!cancelled) {
              window.location.assign(nextPath);
            }
          }, 1200);
        }
      } catch {
        // Keep polling while the Whop webhook catches up.
      }
    };

    void checkBilling();
    const poll = window.setInterval(checkBilling, 2000);
    const countdown = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.clearInterval(countdown);
    };
  }, [router]);

  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm font-medium text-zinc-700">
        Checking your subscription...
      </p>
      {seconds === 0 ? (
        <p className="text-xs leading-5 text-zinc-500">
          This is taking longer than usual. Keep this page open while billing
          finishes syncing.
        </p>
      ) : null}
    </div>
  );
}
