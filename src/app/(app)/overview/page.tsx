import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { getWorkspaceSetup } from "@/lib/server/workspace-setup";
import OverviewSetup from "./overview-setup";
import OverviewView from "./overview-view";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "Overview - Omentir",
  description: "View your Omentir workspace performance, leads, campaigns, conversations, and account setup.",
  path: "/overview",
  noIndex: true,
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SessionClaimsProfile = { first_name?: string; full_name?: string };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ linkedin?: string | string[] }>;
}) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }
  const userProfile = (sessionClaims || {}) as SessionClaimsProfile;
  const userName = userProfile.first_name || userProfile.full_name?.split(" ")[0] || "there";
  const params = await searchParams;
  const linkedinParam = Array.isArray(params.linkedin) ? params.linkedin[0] : params.linkedin;

  const [workspace, setup] = await Promise.all([
    getWorkspace(userId),
    getWorkspaceSetup(userId),
  ]);

  if (!setup.productProfile) {
    redirect("/onboarding");
  }

  if (!workspace.onboarding) {
    redirect("/onboarding");
  }

  const hasSubscription = hasActiveSubscription(workspace);

  if (!hasSubscription || !setup.setupDone) {
    return (
      <OverviewSetup
        hasSubscription={hasSubscription}
        linkedInConnected={setup.linkedInConnected}
        linkedInError={linkedinParam === "error"}
        hasBookingLink={setup.hasBookingLink}
        hasAgent={setup.hasAgent}
      />
    );
  }

  return (
    <>
      {/* The reads behind this view are started before hydration from the root
          layout's early-fetch script (see sidebar-early-fetch). */}
      <OverviewView
        agents={[]}
        leads={[]}
        enrollments={[]}
        conversations={[]}
        linkedInThreads={[]}
        workspace={{ id: workspace.id, name: workspace.name }}
        userName={userName}
        averageTicketSize={setup.productProfile.averageTicketSize}
      />
    </>
  );
}
