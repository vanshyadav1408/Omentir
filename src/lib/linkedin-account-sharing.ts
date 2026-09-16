// LinkedIn connections belong to the owner, not a single workspace. A new
// workspace should keep using the Unipile account already connected elsewhere
// instead of looking empty and asking the user to log in again.

export function canonicalLinkedInAccountsByProvider<
  T extends { accountId: string; createdAt: string },
>(accounts: T[]): T[] {
  const byProviderId = new Map<string, T>();
  for (const account of accounts) {
    const existing = byProviderId.get(account.accountId);
    if (!existing || account.createdAt.localeCompare(existing.createdAt) < 0) {
      byProviderId.set(account.accountId, account);
    }
  }
  return [...byProviderId.values()].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
}

export function linkedInAccountIsOnOwnedWorkspace(
  accountWorkspaceId: string,
  ownedWorkspaceIds: readonly string[],
) {
  return ownedWorkspaceIds.includes(accountWorkspaceId);
}
