import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import ApiKeysView from "./api-keys-view";
import { createAgentApiKeyAction, revokeAgentApiKeyAction } from "@/app/actions";
import { getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
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

  return (
    <ApiKeysView
      agentApiKeys={[]}
      createAgentApiKeyAction={createAgentApiKeyAction}
      revokeAgentApiKeyAction={revokeAgentApiKeyAction}
    />
  );
}
