import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { analyzeWebsiteAction, saveProductProfileAction } from "@/app/actions";
import { getProductProfile, getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import ProductView from "./product-view";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "My Product - Omentir",
  description: "Edit the product profile Omentir uses to find buyers and generate outreach.",
  path: "/my-product",
  noIndex: true,
});

export default async function MyProductPage() {
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }
  // Workspace docs are keyed by owner userId, so both reads run in parallel.
  const [workspace, profile] = await Promise.all([
    getWorkspace(userId),
    getProductProfile(userId),
  ]);
  if (!hasActiveSubscription(workspace)) {
    redirect("/upgrade");
  }

  return (
    <ProductView
      profile={profile ?? undefined}
      saveAction={saveProductProfileAction}
      analyzeAction={analyzeWebsiteAction}
    />
  );
}
