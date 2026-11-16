"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AgentSetupPageSkeleton } from "@/app/app-skeletons";

// Step titles per ?mode=, as agent-setup.tsx lists them. Keep the two in step.
const STEPS: Record<string, string[]> = {
  outreach: ["CSV", "Outreach", "Review"],
  steal: ["Competitors", "Leads", "Outreach", "Review"],
  leads: ["ICP", "Leads"],
};
const DEFAULT_STEPS = ["ICP", "Leads", "Outreach", "Review"];

function SetupSkeletonForUrl() {
  const params = useSearchParams();
  // An edit (?id=) takes its type and name from the saved agent.
  if (params.get("id")) return <AgentSetupPageSkeleton />;
  const mode = params.get("mode") ?? "";
  const steps = STEPS[mode] ?? DEFAULT_STEPS;
  return (
    <AgentSetupPageSkeleton
      title={mode === "steal" ? "Steal Customers" : "New Agent"}
      steps={steps}
      icpFirst={steps[0] === "ICP"}
    />
  );
}

export default function Loading() {
  return (
    <Suspense fallback={<AgentSetupPageSkeleton />}>
      <SetupSkeletonForUrl />
    </Suspense>
  );
}
