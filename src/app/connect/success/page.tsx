import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import {
  getLinkedInAccount,
  getWorkspace,
  listAgents,
  listCampaigns,
  listLinkedInAccounts,
  saveLinkedInAccount,
} from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { isLocalMode } from "@/lib/runtime-mode";
import { findSingleRecentlyCreatedAccount } from "@/lib/linkedin-connect-recovery";
import { listUnipileLinkedInAccounts, retrieveOwnLinkedInProfile } from "@/lib/server/unipile";

function isFirstLinkedInConnection(account: NonNullable<Awaited<ReturnType<typeof getLinkedInAccount>>>) {
  return account.createdAt === account.updatedAt;
}

// Unipile redirects here after LinkedIn connects. Send new users into the
// guided first-run experience.
export default async function ConnectSuccessPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const workspace = await getWorkspace(userId);
  const [initialLinkedInAccount, linkedInAccounts, agents, campaigns] = await Promise.all([
    getLinkedInAccount(workspace.id),
    listLinkedInAccounts(workspace.id),
    listAgents(workspace.id),
    listCampaigns(workspace.id),
  ]);
  let linkedInAccount = initialLinkedInAccount;

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
      linkedInAccount = await saveLinkedInAccount(workspace.id, {
        accountId: recent.id,
        displayName: profile?.displayName || recent.name,
        ...(profile?.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
        status: "connected",
      });
    }
  }

  if (!hasActiveSubscription(workspace) || !linkedInAccount) {
    redirect("/onboarding?status=linkedin-connected");
  }

  if (
    agents.length > 0 ||
    campaigns.length > 0 ||
    (!isLocalMode() && !isFirstLinkedInConnection(linkedInAccount))
  ) {
    redirect("/dashboard");
  }

  redirect("/setup");
}
