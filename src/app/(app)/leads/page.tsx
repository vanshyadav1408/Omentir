import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import LeadsView from "./leads-view";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "Leads - Omentir",
  description: "Review leads discovered by Omentir and organize outreach opportunities.",
  path: "/leads",
  noIndex: true,
});

async function LeadsContent() {
  return <LeadsView groups={[]} leads={[]} />;
}

export default async function LeadsPage() {
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }
  const workspace = await getWorkspace(userId);
  if (!hasActiveSubscription(workspace)) {
    redirect("/upgrade");
  }

  return <LeadsContent />;
}
