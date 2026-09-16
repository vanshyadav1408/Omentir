import { auth, currentUser } from "@/lib/server/auth";
import { NextRequest, NextResponse } from "next/server";
import { createLinkedInSeatCheckout } from "@/lib/server/whop";
import { isLocalMode } from "@/lib/runtime-mode";
import { getAppBaseUrl } from "@/lib/server/runtime-config";
import { attributionFromCookieHeader, attributionMetadata, attributionProperties } from "@/lib/referral-attribution";
import { capturePostHogEvent } from "@/lib/posthog-server";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { commercialPlanLimits } from "@/lib/plan-limits";
import { extraLinkedInSeatsCount, parseExtraLinkedInSeatCount } from "@/lib/linkedin-seat-pricing";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (isLocalMode()) return new NextResponse(null, { status: 404 });
  const { userId } = await auth();
  const appUrl = getAppBaseUrl();
  const settingsUrl = new URL("/settings", appUrl);

  if (!userId) {
    return NextResponse.redirect(new URL("/signup", appUrl));
  }

  try {
    const extraSeats = parseExtraLinkedInSeatCount(request.nextUrl.searchParams.get("count"));
    if (!extraSeats) {
      return NextResponse.redirect(settingsUrl);
    }

    const workspace = await resolveActiveWorkspace(userId);
    if (!hasActiveSubscription(workspace)) {
      return NextResponse.redirect(new URL("/upgrade", appUrl));
    }
    if (!Number.isFinite(commercialPlanLimits(workspace.billing?.plan).linkedInAccounts)) {
      return NextResponse.redirect(settingsUrl);
    }
    if (extraLinkedInSeatsCount(workspace.billing?.extraLinkedInSeats) === extraSeats) {
      return NextResponse.redirect(settingsUrl);
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    const attribution = attributionFromCookieHeader(request.headers.get("cookie"));
    const { purchaseUrl, checkoutId, monthlyTotal } = await createLinkedInSeatCheckout({
      extraSeats,
      workspaceId: workspace.ownerId || userId,
      email,
      redirectUrl: settingsUrl.toString(),
      metadata: attributionMetadata(attribution),
    });

    await capturePostHogEvent({
      event: "checkout_started",
      distinctId: userId,
      insertId: `checkout_started_seats:${checkoutId || userId}:${extraSeats}`,
      properties: {
        plan: "linkedin_seats",
        extraSeats,
        revenue: monthlyTotal,
        email,
        ...(attribution ? attributionProperties(attribution) : {}),
      },
    });

    const checkoutUrl = new URL(purchaseUrl, "https://whop.com");
    if (email) {
      checkoutUrl.searchParams.set("email", email);
    }

    return NextResponse.redirect(checkoutUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Whop seat checkout failed.";
    console.error("[checkout/seats] Whop checkout configuration failed:", message);
    return NextResponse.json({ error: "Checkout failed to start." }, { status: 502 });
  }
}
