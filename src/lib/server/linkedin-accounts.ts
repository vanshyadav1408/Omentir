import "server-only";

import { isUnipileAccountUsable } from "@/lib/unipile-account-status";
import {
  disconnectLinkedInAccount,
  getWorkspace,
  listAllLinkedInAccounts,
  listLinkedInAccounts,
  markLinkedInAccountDisconnected,
  saveLinkedInAccount,
} from "./data";
import { deleteLinkedInAccount, listUnipileLinkedInAccounts, retrieveOwnLinkedInProfile } from "./unipile";
import { entitlementsFor } from "./entitlements";
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
    const usableAccountIds = new Set(
      providerAccounts
        .filter((account) => isUnipileAccountUsable(account.status))
        .map((account) => account.id),
    );
    const activeAccounts = accounts.filter((account) => usableAccountIds.has(account.accountId));
    const staleAccounts = accounts.filter((account) => !usableAccountIds.has(account.accountId));

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

export async function purgeWorkspaceUnipileAccounts(workspaceId: string) {
  const accounts = await listAllLinkedInAccounts(workspaceId);
  let deleted = 0;
  let failed = 0;
  for (const account of accounts) {
    if (!account.accountId) continue;
    try {
      await deleteLinkedInAccount(account.accountId);
      deleted += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `[unipile] failed to delete account ${account.accountId} for workspace ${workspaceId}:`,
        error instanceof Error ? error.message : error,
      );
    }
    await markLinkedInAccountDisconnected(workspaceId, account.id);
  }
  return { considered: accounts.length, deleted, failed };
}

// After extra seats drop, Unipile still bills every connected account. Keep
// the oldest accounts that fit the paid cap and delete the rest on Unipile.
export async function enforceLinkedInAccountCap(workspaceId: string) {
  const workspace = await getWorkspace(workspaceId);
  const cap = entitlementsFor(workspace).limits.linkedInAccounts;
  if (!Number.isFinite(cap)) return { kept: 0, removed: 0 };

  const accounts = [...(await listLinkedInAccounts(workspaceId))].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
  if (accounts.length <= cap) return { kept: accounts.length, removed: 0 };

  const extra = accounts.slice(cap);
  let removed = 0;
  for (const account of extra) {
    if (account.accountId) {
      try {
        await deleteLinkedInAccount(account.accountId);
      } catch (error) {
        console.error(
          `[unipile] failed to delete extra account ${account.accountId} after seat cap dropped:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
    await markLinkedInAccountDisconnected(workspaceId, account.id);
    removed += 1;
  }
  return { kept: cap, removed };
}
