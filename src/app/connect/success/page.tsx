import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import {
  getLinkedInAccount,
  getWorkspace,
  listLinkedInAccounts,
  saveLinkedInAccount,
} from "@/lib/server/data";
import { isLocalMode } from "@/lib/runtime-mode";
import { findSingleRecentlyCreatedAccount } from "@/lib/linkedin-connect-recovery";
import { listUnipileLinkedInAccounts, retrieveOwnLinkedInProfile } from "@/lib/server/unipile";

// Unipile redirects here after LinkedIn connects. Overview sends unfinished
// onboarding back, and shows the setup checklist until subscription, LinkedIn,
// booking, and an agent are in place.
export default async function ConnectSuccessPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const workspace = await getWorkspace(userId);
  const [linkedInAccount, linkedInAccounts] = await Promise.all([
    getLinkedInAccount(workspace.id),
    listLinkedInAccounts(workspace.id),
  ]);

  // A provider cannot POST its notify callback to localhost. Recover only the
  // single account created moments before this authenticated browser redirect;
  // ambiguous provider state stays disconnected instead of guessing.
  if (!linkedInAccount && isLocalMode()) {
    const recent = findSingleRecentlyCreatedAccount(
      await listUnipileLinkedInAccounts(),
      undefined,
      new Set(linkedInAccounts.map((account) => account.accountId)),
    );
    if (recent) {
      const profile = await retrieveOwnLinkedInProfile(recent.id).catch(() => null);
      await saveLinkedInAccount(workspace.id, {
        accountId: recent.id,
        displayName: profile?.displayName || recent.name,
        ...(profile?.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
        status: "connected",
      });
    }
  }

  redirect("/overview");
}
