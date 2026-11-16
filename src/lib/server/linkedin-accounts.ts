import "server-only";

import {
  disconnectLinkedInAccount,
  completeLinkedInAccountRetirement,
  hasOtherLinkedInConnection,
  listAllLinkedInAccounts,
  listConnectedLinkedInAccountsEverywhere,
  listLinkedInAccounts,
  markLinkedInAccountDisconnected,
  saveLinkedInAccount,
  workspaceForLinkedInAccountCap,
} from "./data";
import { deleteLinkedInAccount, retrieveOwnLinkedInProfile } from "./linkedin";
import { isOwnLinkedInId } from "./linkedin-own/ids";
import { listOwnSessionStatuses } from "./linkedin-own/session-store";
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
    // The stored session record is the source of truth (marked expired when
    // LinkedIn signs the session out). Accounts from the old Unipile
    // integration have no session and need to be reconnected.
    const ownAccounts = accounts.filter((account) => isOwnLinkedInId(account.accountId));
    const ownStatuses = await listOwnSessionStatuses(ownAccounts.map((account) => account.accountId));
    const usableAccountIds = new Set(
      ownAccounts
        .filter((account) => ownStatuses.get(account.accountId) === "active")
        .map((account) => account.accountId),
    );
    const activeAccounts = accounts.filter((account) => usableAccountIds.has(account.accountId));
    const staleAccounts = accounts.filter((account) => !usableAccountIds.has(account.accountId));

    if (staleAccounts.length) {
      await Promise.all(
        staleAccounts.map((account) => disconnectLinkedInAccount(workspaceId, account.id)),
      );
    }

    // Old Unipile ids left over from a replacement have nothing to delete.
    for (const account of activeAccounts) {
      for (const retiredId of account.retiredUnipileAccountIds || []) {
        await completeLinkedInAccountRetirement(account.id, retiredId).catch(() => {});
      }
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

// Accounts left from the Unipile integration can never send again. Opening
// the app marks them disconnected (above), but an owner who stayed away left
// the tick treating them as connected: invites failed and used up retries,
// messages were drafted that could not go out, and the acceptance sweep
// logged an error every few minutes. The tick calls this so their outreach
// parks until the owner reconnects.
export async function disconnectLegacyLinkedInAccounts() {
  const legacy = (await listConnectedLinkedInAccountsEverywhere()).filter(
    (account) => !isOwnLinkedInId(account.accountId),
  );
  for (const account of legacy) {
    await markLinkedInAccountDisconnected(account.workspaceId, account.id);
  }
  return legacy.length;
}

// One LinkedIn account can be connected under several Omentir logins, all on
// the one stored session. Leaving from one login must not sign the others
// out, so the session is forgotten only when nothing else is connected to it.
export async function forgetLinkedInSession(account: Pick<LinkedInAccount, "id" | "accountId">) {
  if (await hasOtherLinkedInConnection(account)) return;
  await deleteLinkedInAccount(account.accountId);
}

export async function getVerifiedLinkedInAccount(workspaceId: string) {
  const result = await listVerifiedLinkedInAccounts(workspaceId);
  return result.accounts[0] || null;
}

export async function purgeWorkspaceLinkedInAccounts(workspaceId: string) {
  const accounts = await listAllLinkedInAccounts(workspaceId);
  let deleted = 0;
  let failed = 0;
  for (const account of accounts) {
    if (!account.accountId) continue;
    try {
      for (const retiredId of account.retiredUnipileAccountIds || []) {
        await completeLinkedInAccountRetirement(account.id, retiredId);
      }
      await forgetLinkedInSession(account);
      deleted += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `[linkedin] failed to delete account ${account.accountId} for workspace ${workspaceId}:`,
        error instanceof Error ? error.message : error,
      );
    }
    await markLinkedInAccountDisconnected(workspaceId, account.id);
  }
  return { considered: accounts.length, deleted, failed };
}

// After extra seats drop, keep the oldest accounts that fit the paid cap and
// disconnect the rest.
export async function enforceLinkedInAccountCap(workspaceId: string) {
  const workspace = await workspaceForLinkedInAccountCap(workspaceId);
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
        for (const retiredId of account.retiredUnipileAccountIds || []) {
          await completeLinkedInAccountRetirement(account.id, retiredId);
        }
        await forgetLinkedInSession(account);
      } catch (error) {
        console.error(
          `[linkedin] failed to delete extra account ${account.accountId} after seat cap dropped:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
    await markLinkedInAccountDisconnected(workspaceId, account.id);
    removed += 1;
  }
  return { kept: cap, removed };
}
