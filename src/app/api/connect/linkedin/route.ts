import { auth } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { createLinkedInAuthLink, listUnipileLinkedInAccounts } from "@/lib/server/unipile";
import { getAppBaseUrl } from "@/lib/server/runtime-config";
import { createLinkedInConnectToken, getLatestLinkedInAccount } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  const appUrl = getAppBaseUrl();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  // New and returning users both land back on Overview after Unipile.
  // The setup checklist is the reconnect screen for everyone.
  const failurePath = "/overview?linkedin=error";

  try {
    const [callbackToken, latestAccount] = await Promise.all([
      createLinkedInConnectToken(userId),
      getLatestLinkedInAccount(userId),
    ]);
    let reconnectAccountId: string | undefined = latestAccount?.accountId;
    if (reconnectAccountId) {
      try {
        const providerAccounts = await listUnipileLinkedInAccounts();
        if (!providerAccounts.some((account) => account.id === reconnectAccountId)) {
          reconnectAccountId = undefined;
        }
      } catch {
        // Unipile list failed. Still try reconnect with the stored id.
      }
    }

    const url = await createLinkedInAuthLink({
      callbackToken,
      successRedirectUrl: `${appUrl}/connect/success`,
      failureRedirectUrl: `${appUrl}${failurePath}`,
      notifyUrl: `${appUrl}/api/connect/callback`,
      reconnectAccountId,
    });

    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "LinkedIn auth link failed.";
    console.error("[connect/linkedin] failed to create Unipile auth link:", message);
    return NextResponse.redirect(new URL(failurePath, appUrl));
  }
}
