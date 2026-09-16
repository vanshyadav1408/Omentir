import { auth } from "@/lib/server/auth";
import {
  analyzeWebsiteAction,
  deleteWorkspaceAction,
  saveProductProfileAction,
} from "@/app/actions";
import { getProductProfile } from "@/lib/server/data";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import ProductView from "@/app/(app)/my-product/product-view";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "Workspace - Omentir",
  description: "Edit the workspace profile Omentir uses to find buyers and generate outreach.",
  path: "/workspace",
  noIndex: true,
});

export default async function WorkspacePage() {
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }
  const workspace = await resolveActiveWorkspace(userId);
  const profile = await getProductProfile(workspace.id);

  return (
    <ProductView
      profile={profile ?? undefined}
      workspace={workspace}
      faviconUrl={workspace.faviconUrl}
      workspaceName={workspace.name}
      saveAction={saveProductProfileAction}
      analyzeAction={analyzeWebsiteAction}
      deleteAction={deleteWorkspaceAction}
    />
  );
}
