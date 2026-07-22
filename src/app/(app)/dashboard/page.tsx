import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import {
  getProductProfile,
  listAgents,
  listCampaigns,
  listLinkedInAccounts,
  getWorkspace,
} from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import DashboardView from "./dashboard-view";
import { createPageMetadata } from "@/app/seo";
import { isLocalMode } from "@/lib/runtime-mode";

export const metadata = createPageMetadata({
  title: "Dashboard - Omentir",
  description: "View your Omentir workspace performance, leads, campaigns, conversations, and account setup.",
  path: "/dashboard",
  noIndex: true,
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SessionClaimsProfile = { first_name?: string; full_name?: string };

async function DashboardContent({
  workspace,
  userName,
  averageTicketSize,
}: {
  workspace: { id: string; name: string };
  userName: string;
  averageTicketSize?: number;
}) {
  return (
    <DashboardView
      agents={[]}
      leads={[]}
      enrollments={[]}
      conversations={[]}
      linkedInThreads={[]}
      workspace={workspace}
      userName={userName}
      averageTicketSize={averageTicketSize}
    />
  );
}

export default async function HomePage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }
  const userProfile = (sessionClaims || {}) as SessionClaimsProfile;
  const userName = userProfile.first_name || userProfile.full_name?.split(" ")[0] || "there";

  // Workspace docs are keyed by owner userId (see ensureWorkspace), so all
  // three reads can run in parallel instead of chaining on the workspace doc.
  const [workspace, productProfile, linkedInAccounts] = await Promise.all([
    getWorkspace(userId),
    getProductProfile(userId),
    listLinkedInAccounts(userId),
  ]);

  if (!productProfile) {
    redirect("/onboarding");
  }

  if (!workspace.onboarding) {
    redirect("/onboarding");
  }

  if (!hasActiveSubscription(workspace)) {
    redirect("/upgrade");
  }

  if (!linkedInAccounts.length) {
    redirect("/connect");
  }

  if (isLocalMode()) {
    const [agents, campaigns] = await Promise.all([
      listAgents(workspace.id),
      listCampaigns(workspace.id),
    ]);
    if (!agents.length && !campaigns.length) {
      redirect("/setup");
    }
  }

  return (
    <DashboardContent
      workspace={{ id: workspace.id, name: workspace.name }}
      userName={userName}
      averageTicketSize={productProfile.averageTicketSize}
    />
  );
}
