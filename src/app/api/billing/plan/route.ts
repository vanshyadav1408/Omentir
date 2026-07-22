import { auth } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { isLocalMode } from "@/lib/runtime-mode";

export const dynamic = "force-dynamic";

// Lightweight viewer-plan lookup for plan-aware pricing cards on public
// pages. Unlike /api/billing/status, this never calls Whop: one Firestore
// read, no recovery side effects. Only an ACTIVE plan is reported - a
// cancelled Basic subscriber must see the default "Start Now" CTAs, not
// "Your current plan".
export async function GET() {
  if (isLocalMode()) return new NextResponse(null, { status: 404 });
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ plan: null }, { status: 401 });
  }

  const workspace = await getWorkspace(userId);
  if (!hasActiveSubscription(workspace)) {
    return NextResponse.json({ plan: null });
  }

  const plan = workspace.billing?.plan;
  return NextResponse.json({ plan: plan === "solo" || plan === "startup" ? plan : null });
}
