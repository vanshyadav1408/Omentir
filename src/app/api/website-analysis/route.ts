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
import { rateLimitRequestShared } from "@/lib/request-rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/request-body";

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
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !(await rateLimitRequestShared(request, "website-analysis", {
      sourceKey: userId,
      perSource: 20,
      global: 120,
      windowMs: 60 * 60 * 1000,
    }))
  ) {
    return NextResponse.json({ error: "Too many website analysis requests." }, { status: 429 });
  }

  let body: { websiteUrl?: string } | null;
  try {
    body = await readJsonBody<{ websiteUrl?: string }>(request, 8 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    throw error;
  }
  const websiteUrl = body?.websiteUrl?.trim();

  if (!websiteUrl) {
    return NextResponse.json({ error: "Website URL is required." }, { status: 400 });
  }

  const workspaceId = await getSignedInWorkspaceId(userId);

  try {
    const analysis = await analyzeWebsiteOrSearch(websiteUrl);

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
