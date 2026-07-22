"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import PricingCards from "./pricing-cards";

// Public pages (landing, /pricing) render statically for signed-out visitors,
// so the viewer's plan is resolved client-side: signed-out users never fetch
// and keep the default CTAs; signed-in subscribers get their plan card marked
// and upgrade/downgrade labels on the others.
export default function PlanAwarePricingCards({ className }: { className?: string }) {
  const { isSignedIn } = useUser();
  const [plan, setPlan] = useState<"solo" | "startup" | undefined>(undefined);

  useEffect(() => {
    if (!isSignedIn) return;

    let ignore = false;
    fetch("/api/billing/plan")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (ignore) return;
        if (payload?.plan === "solo" || payload?.plan === "startup") setPlan(payload.plan);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [isSignedIn]);

  return <PricingCards className={className} currentPlan={plan} />;
}
