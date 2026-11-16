import "server-only";

import { randomBytes } from "node:crypto";
import {
  getLinkedInAccountByAccountIdAnyStatus,
  completeLinkedInAccountRetirement,
  listWorkspaceIdsSharingLinkedIn,
  saveLinkedInAccount,
} from "../data";
import { endpoints } from "./endpoints";
import { isOwnLinkedInId, ownAccountIdForMember } from "./ids";
import type { LinkedInAccount } from "../types";
import { mapMeResponse } from "./mappers";
import { keptProxyIdentity } from "./proxy-pool";
import { getOwnSessionRecord } from "./session-store";
import { parseCookieHeader, proxyIdentityOf, requireSessionCookies, voyagerRequest, type OwnSession, type ProxyIdentity } from "./transport";
import type { VoyagerResponse } from "./voyager";

export class LinkedInConnectError extends Error {}

// Connects a LinkedIn account to a workspace from the cookies of a browser
// that is already logged in (the input a browser extension or a pasted cookie
// would provide). Nothing is saved unless every check passes.
export async function connectOwnLinkedInAccount(input: {
  workspaceId: string;
  cookieHeader: string;
  userAgent: string;
  timezone?: string;
  replaceAccountId?: string;
  // The proxy a password sign-in already used (or the one reserved for
  // this connect), so the session keeps the IP it was created from.
  proxySessionId?: string;
  proxyPort?: number;
  proxyHost?: string;
  proxyCountry?: string;
}) {
  const userAgent = input.userAgent.trim();
  if (!/Mozilla\/5\.0/.test(userAgent)) {
    // The session is bound to the browser that created it; a mismatched or
    // missing user agent is one of the fastest ways to get it revoked.
    throw new LinkedInConnectError("Pass the user agent of the browser these cookies came from.");
  }
  const cookies = parseCookieHeader(input.cookieHeader);
  try {
    requireSessionCookies(cookies);
  } catch (error) {
    throw new LinkedInConnectError(error instanceof Error ? error.message : "LinkedIn cookies are incomplete.");
  }

  // 1. Who is this? One /me read through the same transport real calls use.
  const fresh: ProxyIdentity = input.proxySessionId && /^[a-f0-9]{16}$/.test(input.proxySessionId)
    ? proxyIdentityOf({ ...input, proxySessionId: input.proxySessionId })
    : { proxySessionId: randomBytes(8).toString("hex"), ...(input.proxyCountry ? { proxyCountry: input.proxyCountry } : {}) };
  const probeThrough = (proxy: ProxyIdentity): OwnSession => ({
    accountId: `connect-${fresh.proxySessionId}`,
    memberId: "",
    cookies,
    userAgent,
    ...proxy,
    ...(input.timezone ? { timezone: input.timezone } : {}),
  });
  let probe = probeThrough(fresh);
  const me = mapMeResponse((await voyagerRequest(probe, { path: endpoints.me() })) as VoyagerResponse);
  if (!me?.provider_id) throw new LinkedInConnectError("LinkedIn did not accept these cookies.");
  const accountId = ownAccountIdForMember(me.provider_id);

  // 2. Ownership: this person must not belong to someone else's workspace.
  // Checked before the stored session is touched, so a refused connect can
  // never overwrite another workspace's cookies.
  const allowedWorkspaceIds = await listWorkspaceIdsSharingLinkedIn(input.workspaceId);
  const existing = await getLinkedInAccountByAccountIdAnyStatus(accountId);
  if (existing && !allowedWorkspaceIds.includes(existing.workspaceId)) {
    throw new LinkedInConnectError("This LinkedIn account is already connected to another workspace.");
  }

  // 3. Replacing an account from the old Unipile integration keeps its
  // record id, campaigns and stored conversations. Those old accounts can no
  // longer be read, so the owner's choice in the form decides which one.
  let replacement: LinkedInAccount | undefined;
  if (input.replaceAccountId) {
    const candidate = await getLinkedInAccountByAccountIdAnyStatus(input.replaceAccountId);
    if (!candidate || !allowedWorkspaceIds.includes(candidate.workspaceId) || isOwnLinkedInId(candidate.accountId)) {
      throw new LinkedInConnectError("The LinkedIn account to replace is not available in this workspace.");
    }
    replacement = candidate;
  }

  const stored = await getOwnSessionRecord(accountId);
  const kept = keptProxyIdentity(stored || undefined, fresh) || fresh;
  if (kept.proxySessionId !== fresh.proxySessionId) {
    probe = probeThrough(kept);
    const verified = mapMeResponse((await voyagerRequest(probe, { path: endpoints.me() })) as VoyagerResponse);
    if (verified?.provider_id !== me.provider_id) throw new LinkedInConnectError("LinkedIn could not verify this session. Please sign in again.");
  }
  // Ownership, account and encrypted credentials commit together. A losing
  // connection never writes or deletes the winning workspace's session.
  try {
    const account = await saveLinkedInAccount(input.workspaceId, {
      accountId,
      displayName: me.name || "LinkedIn",
      ...(me.profile_picture_url ? { avatarUrl: me.profile_picture_url } : {}),
      status: "connected",
      ownSession: { ...probe, accountId, memberId: me.provider_id, ...(replacement ? { legacyAccountId: replacement.accountId } : {}) },
      ...(replacement ? { replaceAccountId: replacement.accountId } : {}),
    });
    // Old Unipile ids have nothing left to delete; clear their markers.
    for (const retiredId of account.retiredUnipileAccountIds || []) {
      try {
        await completeLinkedInAccountRetirement(account.id, retiredId);
        account.retiredUnipileAccountIds = account.retiredUnipileAccountIds?.filter((id) => id !== retiredId);
      } catch {
        // The own account is already committed; verification retries this.
      }
    }
    return account;
  } catch (error) {
    if (error instanceof Error && /^(?:Your current plan|This LinkedIn|The LinkedIn|LinkedIn message|Outreach is)/.test(error.message)) {
      throw new LinkedInConnectError(error.message);
    }
    throw error;
  }
}
