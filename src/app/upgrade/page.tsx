import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/server/data";
import { createPageMetadata } from "@/app/seo";
import { hasActiveSubscription } from "@/lib/server/subscription";
import UpgradeView from "./upgrade-view";

export const metadata = createPageMetadata({
  title: "Upgrade - Omentir",
  description: "Upgrade your Omentir plan.",
  path: "/upgrade",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const workspace = await getWorkspace(userId);

  // Subscription gates all over the app point here. Users without an active
  // subscription belong on the onboarding paywall step, as before; subscribed
  // users get a real plan page instead of bouncing off onboarding into the
  // dashboard.
  if (!hasActiveSubscription(workspace)) {
    redirect("/onboarding");
  }

  const plan = workspace.billing?.plan;
  // Enterprise (and legacy/bypassed) workspaces have no matching card to mark.
  return <UpgradeView currentPlan={plan === "solo" || plan === "startup" ? plan : undefined} />;
}
