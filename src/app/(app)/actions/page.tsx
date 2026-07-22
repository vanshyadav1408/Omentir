import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { createPageMetadata } from "@/app/seo";
import { getWorkspace } from "@/lib/server/data";
import { listScheduledActions } from "@/lib/server/scheduled-actions";
import { hasActiveSubscription } from "@/lib/server/subscription";
import ActivityDashboard from "./activity-dashboard";

export const metadata = createPageMetadata({
  title: "Actions - Omentir",
  description: "Review every action scheduled across your Omentir workspace.",
  path: "/actions",
  noIndex: true,
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ActivityPage() {
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }

  // Workspace docs are keyed by owner userId, so both reads run in parallel.
  const [workspace, items] = await Promise.all([
    getWorkspace(userId),
    listScheduledActions(userId),
  ]);
  if (!hasActiveSubscription(workspace)) {
    redirect("/upgrade");
  }
  const serverNow = new Date().getTime();
  return (
    <ActivityDashboard
      items={items}
      title="Actions"
      serverNow={serverNow}
      timezone={workspace.timezone}
      mobileCaption="Actions scheduled for Future are:"
    />
  );
}
