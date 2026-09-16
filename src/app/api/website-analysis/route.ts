import { auth, currentUser } from "@/lib/server/auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getProductProfile,
  updateWorkspaceIdentity,
  updateWorkspaceNotificationEmail,
  upsertProductProfile,
} from "@/lib/server/data";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { resolveWebsiteFavicon } from "@/lib/server/website-favicon";
import { analyzeWebsiteOrSearch } from "@/lib/server/gemini";
import { rateLimitRequestShared } from "@/lib/request-rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/request-body";

export const dynamic = "force-dynamic";

async function getSignedInWorkspaceId(userId: string) {
  const workspace = await resolveActiveWorkspace(userId);
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
      pricingDetails: analysis.pricingDetails,
      schedulingLink: existing?.schedulingLink || "",
      keyFeatures: analysis.keyFeatures,
      socialProof: analysis.socialProof,
      linkedInCompanyPage: existing?.linkedInCompanyPage || "",
      useCases: analysis.useCases,
      targetBuyers: analysis.targetBuyers,
      buyerTitles: analysis.buyerTitles,
      roleVocabulary: analysis.roleVocabulary,
      industries: analysis.industries,
      companySizes: analysis.companySizes,
      painPoints: analysis.painPoints,
      keywords: analysis.keywords,
      preferredLocations: analysis.preferredLocations,
      averageTicketSize: existing?.averageTicketSize,
    });

    after(async () => {
      try {
        const faviconUrl = await resolveWebsiteFavicon(websiteUrl);
        await updateWorkspaceIdentity(workspaceId, {
          name: analysis.companyName,
          faviconUrl: faviconUrl || undefined,
        });
      } catch (error) {
        console.error("Failed to refresh workspace favicon", error);
      }
    });

    revalidatePath("/workspace");
    revalidatePath("/my-product");
    revalidatePath("/overview");

    return NextResponse.json({
      productOverview: analysis.productOverview,
      companyName: analysis.companyName,
      industry: analysis.industry,
      companySize: analysis.companySize,
      painPointsText: analysis.painPointsText,
      pricingDetails: analysis.pricingDetails,
      keyFeatures: analysis.keyFeatures,
      socialProof: analysis.socialProof,
      useCases: analysis.useCases,
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
