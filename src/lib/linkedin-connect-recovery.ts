export type RecentlyCreatedProviderAccount = {
  id: string;
  name: string;
  createdAt?: string;
};

export function findSingleRecentlyCreatedAccount(
  accounts: RecentlyCreatedProviderAccount[],
  now = Date.now(),
  ignoredAccountIds: ReadonlySet<string> = new Set(),
) {
  const earliest = now - 30 * 60 * 1000;
  const latest = now + 5 * 60 * 1000;
  const recent = accounts.filter((account) => {
    if (ignoredAccountIds.has(account.id)) return false;
    const createdAt = Date.parse(account.createdAt || "");
    return Number.isFinite(createdAt) && createdAt >= earliest && createdAt <= latest;
  });
  return recent.length === 1 ? recent[0] : null;
}
