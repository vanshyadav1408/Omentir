import { auth } from "@/lib/server/auth";
import { getWorkspaceSetup } from "@/lib/server/workspace-setup";
import CompleteSetupPrompt from "@/app/(app)/complete-setup-prompt";
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
  const setup = await getWorkspaceSetup(userId);
  if (!setup.hasAgent) {
    return (
      <CompleteSetupPrompt emoji="👤" message="Start an AI agent on Overview first." />
    );
  }

  return <LeadsContent />;
}
