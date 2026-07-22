import { auth, currentUser } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { getWorkspace } from "@/lib/server/data";
import { findActiveWhopMembershipByEmail } from "@/lib/server/whop";
import { whopManageDestination } from "@/lib/whop-billing-url";
import { isLocalMode } from "@/lib/runtime-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isLocalMode()) return new NextResponse(null, { status: 404 });
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect("https://whop.com/@me/settings/memberships");
  }

  try {
    const workspace = await getWorkspace(userId);
    const user = await currentUser();
    const email =
      workspace.billing?.payerEmail || user?.primaryEmailAddress?.emailAddress || "";
    const membership = email ? await findActiveWhopMembershipByEmail(email) : null;
    return NextResponse.redirect(
      whopManageDestination(membership?.manageUrl, membership?.memberId),
    );
  } catch (error) {
    console.error(
      "[billing manage] Whop membership lookup failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.redirect(whopManageDestination());
  }
}
