import "server-only";

import { disconnectLinkedInAccount, listLinkedInAccounts, saveLinkedInAccount } from "./data";
import { listUnipileLinkedInAccounts, retrieveOwnLinkedInProfile } from "./unipile";
import type { LinkedInAccount } from "./types";

type VerifiedLinkedInAccounts = {
  accounts: LinkedInAccount[];
  staleAccounts: LinkedInAccount[];
  verificationError?: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "LinkedIn connection could not be verified.";
}

export async function listVerifiedLinkedInAccounts(
  workspaceId: string,
  options: { refreshProfiles?: boolean } = {},
): Promise<VerifiedLinkedInAccounts> {
  const accounts = await listLinkedInAccounts(workspaceId);
  if (!accounts.length) {
    return { accounts: [], staleAccounts: [] };
  }

  try {
    const providerAccounts = await listUnipileLinkedInAccounts();
    const providerAccountIds = new Set(providerAccounts.map((account) => account.id));
    const activeAccounts = accounts.filter((account) => providerAccountIds.has(account.accountId));
    const staleAccounts = accounts.filter((account) => !providerAccountIds.has(account.accountId));

    if (staleAccounts.length) {
      await Promise.all(
        staleAccounts.map((account) => disconnectLinkedInAccount(workspaceId, account.id)),
      );
    }

    const refreshedAccounts = options.refreshProfiles
      ? await Promise.all(
          activeAccounts.map(async (account) => {
            try {
              const profile = await retrieveOwnLinkedInProfile(account.accountId);
              if (!profile) return account;
              return await saveLinkedInAccount(workspaceId, {
                accountId: account.accountId,
                displayName: profile.displayName || account.displayName,
                ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
                status: "connected",
              });
            } catch {
              // Verification succeeded; stale profile metadata should not hide
              // an otherwise healthy connected account.
              return account;
            }
          }),
        )
      : activeAccounts;

    return { accounts: refreshedAccounts, staleAccounts };
  } catch (error) {
    return { accounts, staleAccounts: [], verificationError: errorMessage(error) };
  }
}

export async function getVerifiedLinkedInAccount(workspaceId: string) {
  const result = await listVerifiedLinkedInAccounts(workspaceId);
  return result.accounts[0] || null;
}
