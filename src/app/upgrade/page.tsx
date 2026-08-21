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

  // People still in onboarding belong on the paywall step. After onboarding,
  // missing or expired subscriptions stay on this page so View plans and the
  // other billing gates can subscribe or change plans without leaving setup.
  if (!hasActiveSubscription(workspace) && !workspace.onboarding) {
    redirect("/onboarding");
  }

  const plan = workspace.billing?.plan;
  const subscribed = hasActiveSubscription(workspace);
  // Legacy Startup and bypassed workspaces have no matching card.
  return (
    <UpgradeView
      currentPlan={
        subscribed && (plan === "solo" || plan === "lifetime" || plan === "enterprise")
          ? plan
          : undefined
      }
      subscribeCta={subscribed ? undefined : "Subscribe"}
    />
  );
}
