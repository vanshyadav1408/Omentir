import "server-only";

import { randomBytes } from "node:crypto";
import { completeLinkedInAccountRetirement, saveLinkedInAccount } from "../data";
import { endpoints } from "./endpoints";
import { ownAccountIdForMember } from "./ids";
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

  // 2. The same LinkedIn member may already be connected, here or under
  // another Omentir login. Whoever just signed in is that member, so every
  // one of those connections moves onto this session and keeps the IP the
  // account already had.
  const stored = await getOwnSessionRecord(accountId);
  const kept = keptProxyIdentity(stored || undefined, fresh) || fresh;
  if (kept.proxySessionId !== fresh.proxySessionId) {
    probe = probeThrough(kept);
    const verified = mapMeResponse((await voyagerRequest(probe, { path: endpoints.me() })) as VoyagerResponse);
    if (verified?.provider_id !== me.provider_id) throw new LinkedInConnectError("LinkedIn could not verify this session. Please sign in again.");
  }
  // Account and encrypted credentials commit together.
  try {
    const account = await saveLinkedInAccount(input.workspaceId, {
      accountId,
      displayName: me.name || "LinkedIn",
      ...(me.profile_picture_url ? { avatarUrl: me.profile_picture_url } : {}),
      status: "connected",
      ownSession: { ...probe, accountId, memberId: me.provider_id },
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
    if (error instanceof Error && /^(?:Your current plan|This LinkedIn|LinkedIn message)/.test(error.message)) {
      throw new LinkedInConnectError(error.message);
    }
    throw error;
  }
}
