import { auth } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { getWorkspace } from "@/lib/server/data";
import { syncWorkspaceBillingIfInactive } from "@/lib/server/billing-sync";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { isLocalMode } from "@/lib/runtime-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isLocalMode()) return new NextResponse(null, { status: 404 });
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ active: false }, { status: 401 });
  }

  const workspace = await syncWorkspaceBillingIfInactive(await getWorkspace(userId));
  const active = hasActiveSubscription(workspace);

  return NextResponse.json({
    active,
    status: workspace.billing?.status ?? null,
    nextPath: active ? "/overview" : null,
  });
}
