import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import ApiKeysView from "./api-keys-view";
import { createAgentApiKeyAction, revokeAgentApiKeyAction } from "@/app/actions";
import { getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { requireWorkspaceSetup } from "@/lib/server/workspace-setup";
import { planHasApiAccess } from "@/lib/plan-limits";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "API - Omentir",
  description: "Create API keys for AI agents and scripts, and explore the Omentir agent API.",
  path: "/api-keys",
  noIndex: true,
});

export default async function ApiKeysPage() {
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }

  const workspace = await getWorkspace(userId);
  if (!hasActiveSubscription(workspace)) {
    redirect("/upgrade");
  }
  await requireWorkspaceSetup(userId);

  // Plans without API access see the page rather than a redirect: the keys
  // section renders locked behind an upgrade prompt so the feature is visible
  // instead of silently missing. createAgentApiKey still refuses on the server.
  return (
    <ApiKeysView
      agentApiKeys={[]}
      locked={!planHasApiAccess(workspace.billing?.plan)}
      createAgentApiKeyAction={createAgentApiKeyAction}
      revokeAgentApiKeyAction={revokeAgentApiKeyAction}
    />
  );
}
