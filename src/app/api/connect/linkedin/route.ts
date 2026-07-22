import { auth } from "@/lib/server/auth";
import { NextRequest, NextResponse } from "next/server";
import { createLinkedInAuthLink } from "@/lib/server/unipile";
import { getAppBaseUrl } from "@/lib/server/runtime-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const appUrl = getAppBaseUrl();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  // Existing users reconnect via flow=reconnect so Unipile returns to the
  // standalone reconnect pages instead of the new-user onboarding success step.
  const isReconnect = request.nextUrl.searchParams.get("flow") === "reconnect";
  const failurePath = isReconnect ? "/reconnect?error=1" : "/connect?error=1";

  try {
    const callbackSecret =
      process.env.UNIPILE_CONNECT_CALLBACK_SECRET || process.env.UNIPILE_WEBHOOK_SECRET;
    if (!callbackSecret) {
      throw new Error("UNIPILE_CONNECT_CALLBACK_SECRET is required.");
    }
    const notifyUrl = new URL(`${appUrl}/api/connect/callback`);
    notifyUrl.searchParams.set("secret", callbackSecret);
    const url = await createLinkedInAuthLink({
      workspaceId: userId,
      successRedirectUrl: `${appUrl}${isReconnect ? "/reconnect/success" : "/connect/success"}`,
      failureRedirectUrl: `${appUrl}${failurePath}`,
      notifyUrl: notifyUrl.toString(),
    });

    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "LinkedIn auth link failed.";
    console.error("[connect/linkedin] failed to create Unipile auth link:", message);
    return NextResponse.redirect(new URL(failurePath, appUrl));
  }
}
