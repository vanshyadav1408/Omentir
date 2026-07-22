import { auth, currentUser } from "@/lib/server/auth";
import { NextRequest, NextResponse } from "next/server";
import { getWhopCheckoutPlanId, getWhopClient, type BillingPlan } from "@/lib/server/whop";
import { isLocalMode } from "@/lib/runtime-mode";
import { getAppBaseUrl } from "@/lib/server/runtime-config";

export const dynamic = "force-dynamic";

// Behind nginx/PM2, request.url origin is localhost:3000 — never use it for
// browser redirects. Prefer configured public URL, then production host.
export async function GET(request: NextRequest) {
  if (isLocalMode()) return new NextResponse(null, { status: 404 });
  const { userId } = await auth();
  const appUrl = getAppBaseUrl();

  if (!userId) {
    return NextResponse.redirect(new URL("/signup", appUrl));
  }

  try {
    const requestedPlan = request.nextUrl.searchParams.get("plan");
    const plan: BillingPlan = requestedPlan === "startup" ? "startup" : "solo";
    const planId = await getWhopCheckoutPlanId(plan);
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    const successUrl = new URL("/subscription-creation-successful", appUrl);
    const sourceUrl = new URL("/upgrade", appUrl);

    const checkout = await getWhopClient().checkoutConfigurations.create({
      plan_id: planId,
      redirect_url: successUrl.toString(),
      source_url: sourceUrl.toString(),
      metadata: {
        workspaceId: userId,
        clerkUserId: userId,
        email,
        plan,
      },
    });

    // Whop hosted checkout prefills the email field from the `email` query param:
    // https://docs.whop.com/manage-your-business/payment-processing/checkout-branding
    const checkoutUrl = new URL(checkout.purchase_url, "https://whop.com");
    if (email) {
      checkoutUrl.searchParams.set("email", email);
    }

    return NextResponse.redirect(checkoutUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Whop checkout failed.";
    console.error("[checkout] Whop checkout configuration failed:", message);

    return NextResponse.json({ error: "Checkout failed to start." }, { status: 502 });
  }
}
