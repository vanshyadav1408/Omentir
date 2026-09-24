import { auth } from "@/lib/server/auth";
import { hasAnyAgent } from "@/lib/server/data";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
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
  const workspace = await resolveActiveWorkspace(userId);
  // Only the agent gate matters here. The full setup check also verifies
  // LinkedIn with Unipile, which put seconds on every visit to this page.
  if (!(await hasAnyAgent(workspace.id))) {
    return (
      <CompleteSetupPrompt icon="identity_platform" message="Start an AI agent on Overview first." />
    );
  }

  return <LeadsContent />;
}
