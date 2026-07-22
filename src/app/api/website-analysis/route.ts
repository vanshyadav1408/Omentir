import { auth, currentUser } from "@/lib/server/auth";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  ensureWorkspace,
  getProductProfile,
  updateWorkspaceNotificationEmail,
  upsertProductProfile,
} from "@/lib/server/data";
import { analyzeWebsiteOrSearch } from "@/lib/server/gemini";

export const dynamic = "force-dynamic";

async function getSignedInWorkspaceId(userId: string) {
  const workspace = await ensureWorkspace(userId);
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress || "";

  await updateWorkspaceNotificationEmail(workspace.id, email);

  return workspace.id;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const body = (await request.json().catch(() => ({}))) as { websiteUrl?: string };
  const websiteUrl = body.websiteUrl?.trim();

  if (!websiteUrl) {
    return NextResponse.json({ error: "Website URL is required." }, { status: 400 });
  }

  const workspaceId = userId ? await getSignedInWorkspaceId(userId) : null;

  try {
    const analysis = await analyzeWebsiteOrSearch(websiteUrl);

    if (workspaceId) {
      const existing = await getProductProfile(workspaceId);
      await upsertProductProfile(workspaceId, {
        websiteUrl,
        description: analysis.productOverview,
        companyName: analysis.companyName,
        industry: analysis.industry,
        companySize: analysis.companySize,
        painPointsText: analysis.painPointsText,
        keyFeatures: analysis.keyFeatures,
        socialProof: analysis.socialProof,
        linkedInCompanyPage: existing?.linkedInCompanyPage || "",
        targetBuyers: analysis.targetBuyers,
        buyerTitles: analysis.buyerTitles,
        industries: analysis.industries,
        companySizes: analysis.companySizes,
        painPoints: analysis.painPoints,
        keywords: analysis.keywords,
        preferredLocations: analysis.preferredLocations,
      });

      revalidatePath("/my-product");
      revalidatePath("/dashboard");
    }

    return NextResponse.json({
      productOverview: analysis.productOverview,
      companyName: analysis.companyName,
      industry: analysis.industry,
      companySize: analysis.companySize,
      painPointsText: analysis.painPointsText,
      keyFeatures: analysis.keyFeatures,
      socialProof: analysis.socialProof,
      targetBuyers: analysis.targetBuyers,
      buyerTitles: analysis.buyerTitles,
      industries: analysis.industries,
      companySizes: analysis.companySizes,
      painPoints: analysis.painPoints,
      keywords: analysis.keywords,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Website analysis failed.";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
