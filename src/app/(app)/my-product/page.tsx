import { auth } from "@/lib/server/auth";
import { analyzeWebsiteAction, saveProductProfileAction } from "@/app/actions";
import { getProductProfile } from "@/lib/server/data";
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
  const profile = await getProductProfile(userId);

  return (
    <ProductView
      profile={profile ?? undefined}
      saveAction={saveProductProfileAction}
      analyzeAction={analyzeWebsiteAction}
    />
  );
}
