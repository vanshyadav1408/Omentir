import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { getDb, nowIso } from "../firebase";
import { LinkedInResponseError } from "../linkedin-errors";
import { memberIdFromOwnAccountId } from "./ids";
import { keptProxyIdentity, releaseProxy, reserveProxy } from "./proxy-pool";
import { decryptSessionSecret, encryptSessionSecret } from "./session-crypto";
import { proxyIdentityOf, type OwnSession, type SessionHooks } from "./transport";

// linkedinSessions/{accountId}: one LinkedIn web session per own account.
// Cookies are sealed with LINKEDIN_SESSION_KEY; nothing else in the document
// is secret. Firestore rules already deny all client access.
export type StoredLinkedInSession = {
  accountId: string;
  memberId: string;
  publicIdentifier?: string;
  displayName?: string;
  sealedCookies: string;
  userAgent: string;
  proxySessionId: string;
  proxyPort?: number;
  proxyHost?: string;
  proxyCountry?: string;
  legacyAccountId?: string;
  version?: string;
  cookieRevision?: number;
  timezone?: string;
  status: "active" | "expired";
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
};

const COLLECTION = "linkedinSessions";
const CACHE_TTL_MS = 60_000;
// Rotated tracking cookies (lidc etc.) change constantly; only the cookies
// that carry the session force an immediate write.
const COOKIE_PERSIST_INTERVAL_MS = 10 * 60_000;

const cache = new Map<string, { session: OwnSession; status: StoredLinkedInSession["status"]; loadedAt: number }>();
const lastCookiePersistAt = new Map<string, number>();
// li_at|JSESSIONID as last written, to tell a real session rotation apart from
// tracking-cookie churn. The cached session object is mutated in place by the
// transport, so it cannot serve as the "before" value.
const persistedSessionCookies = new Map<string, string>();

function sessionCookieKey(cookies: Record<string, string>) {
  return `${cookies.li_at || ""}|${cookies.JSESSIONID || ""}`;
}

function sessions() {
  return getDb().collection(COLLECTION) as FirebaseFirestore.CollectionReference<StoredLinkedInSession>;
}

function unavailable(status: number, type: string, message: string) {
  return new LinkedInResponseError(status, message, JSON.stringify({ type, detail: message }));
}

export function ownSessionDocument(input: {
  accountId: string;
  memberId: string;
  publicIdentifier?: string;
  displayName?: string;
  cookies: Record<string, string>;
  userAgent: string;
  // The proxy the connect probe already used, so a new account's first and
  // later requests come from the same IP.
  proxySessionId?: string;
  proxyPort?: number;
  proxyHost?: string;
  proxyCountry?: string;
  timezone?: string;
  legacyAccountId?: string;
}, existing?: StoredLinkedInSession) {
  const timestamp = nowIso();
  // Keep the same proxy across reconnects: a person whose IP jumps on every
  // reconnect looks like a stolen session to LinkedIn.
  const proxy = keptProxyIdentity(existing, input.proxySessionId ? { ...input, proxySessionId: input.proxySessionId } : undefined)
    || { proxySessionId: randomBytes(8).toString("hex") };
  const stored: StoredLinkedInSession = {
    accountId: input.accountId,
    memberId: input.memberId,
    ...(input.publicIdentifier ? { publicIdentifier: input.publicIdentifier } : {}),
    ...(input.displayName ? { displayName: input.displayName } : {}),
    sealedCookies: encryptSessionSecret(JSON.stringify(input.cookies)),
    userAgent: input.userAgent,
    ...proxy,
    ...(input.legacyAccountId || existing?.legacyAccountId ? { legacyAccountId: input.legacyAccountId || existing?.legacyAccountId } : {}),
    ...(input.timezone ? { timezone: input.timezone } : {}),
    status: "active",
    version: randomUUID(),
    cookieRevision: 0,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  };
  return stored;
}

export function invalidateOwnSession(accountId: string) {
  cache.delete(accountId);
  lastCookiePersistAt.delete(accountId);
  persistedSessionCookies.delete(accountId);
}

export async function getOwnSessionRecord(accountId: string) {
  return (await sessions().doc(accountId).get()).data() || null;
}

export async function deleteOwnSession(accountId: string) {
  invalidateOwnSession(accountId);
  const stored = await getOwnSessionRecord(accountId);
  await sessions().doc(accountId).delete();
  // The static IP rests, then goes to the next account. If this write
  // fails the IP is still free (no saved session uses it), it just skips
  // the rest.
  if (stored?.proxyPort) {
    await releaseProxy(stored.proxySessionId, { rest: true }).catch((error) => {
      console.error("[linkedin-own] failed to release proxy IP", accountId, error instanceof Error ? error.message : error);
    });
  }
}

export async function markOwnSessionExpired(accountId: string, reason: string, version?: string) {
  await getDb().runTransaction(async (transaction) => {
    const ref = sessions().doc(accountId);
    const stored = (await transaction.get(ref)).data();
    if (!stored || stored.version !== version) return;
    // The account rows go with the session. Left "connected", automation kept
    // sending into a dead session (every lead failing and retrying, errors
    // every few minutes) and nothing showed "reconnect" until the owner
    // happened to open the app. Same transaction as the session, so a
    // reconnect that already replaced this session version is never undone.
    const accounts = await transaction.get(
      getDb().collection("linkedinAccounts").where("accountId", "==", accountId).where("status", "==", "connected"),
    );
    const timestamp = nowIso();
    transaction.set(ref, { status: "expired", statusReason: reason.slice(0, 300), updatedAt: timestamp }, { merge: true });
    for (const account of accounts.docs) {
      transaction.set(account.ref, { status: "disconnected", updatedAt: timestamp }, { merge: true });
    }
  });
  const cached = cache.get(accountId);
  if (cached && cached.session.version === version) cached.status = "expired";
}

// Every account with a live own-client session. Own accounts get no
// provider webhook, so the automation provider sync enumerates these to
// give each one the polling reply sync and acceptance sweep instead.
export async function listActiveOwnSessionAccountIds() {
  const snap = await sessions().where("status", "==", "active").get();
  return snap.docs.map((doc) => doc.id);
}

// Status for many accounts at once, without decrypting anything.
export async function listOwnSessionStatuses(accountIds: string[]) {
  const statuses = new Map<string, StoredLinkedInSession["status"]>();
  if (!accountIds.length) return statuses;
  const snaps = await getDb().getAll(...accountIds.map((id) => sessions().doc(id)));
  for (const snap of snaps) {
    const data = snap.data() as StoredLinkedInSession | undefined;
    if (data) statuses.set(snap.id, data.status);
  }
  return statuses;
}

// Accounts saved before the static IP pool existed sit on a residential IP
// that changes every day. Once a pool is configured they move onto a static
// IP the next time they load: one change, then the same IP for good. If the
// pool is full they stay where they are and the pool logs it.
async function moveOntoStaticIp(accountId: string, stored: StoredLinkedInSession): Promise<StoredLinkedInSession> {
  if (stored.proxyPort || stored.status !== "active" || !process.env.LINKEDIN_ISP_PROXY_URL?.trim()) return stored;
  try {
    const proxy = await reserveProxy(stored.proxySessionId, stored.proxyCountry);
    if (!proxy?.proxyPort) return stored;
    const moved = {
      proxyPort: proxy.proxyPort,
      ...(proxy.proxyHost ? { proxyHost: proxy.proxyHost } : {}),
      ...(proxy.proxyCountry ? { proxyCountry: proxy.proxyCountry } : {}),
    };
    // Only onto the session the IP was reserved for: a reconnect that just
    // replaced it keeps its own proxy, and this IP frees itself.
    const applied = await getDb().runTransaction(async (transaction) => {
      const ref = sessions().doc(accountId);
      const current = (await transaction.get(ref)).data();
      if (current?.proxySessionId !== stored.proxySessionId) return undefined;
      // Another server moved it first (onto the same reserved IP).
      if (current.proxyPort) return proxyIdentityOf(current);
      transaction.set(ref, { ...moved, updatedAt: nowIso() }, { merge: true });
      return moved;
    });
    return applied ? { ...stored, ...applied } : stored;
  } catch (error) {
    console.error("[linkedin-own] could not move account onto a static IP", accountId, error instanceof Error ? error.message : error);
    return stored;
  }
}

// The live session for a request. Throws a typed rejection (never a plain
// Error) because nothing was sent: automation may safely retry later.
export async function loadOwnSession(accountId: string): Promise<OwnSession> {
  memberIdFromOwnAccountId(accountId);

  const cached = cache.get(accountId);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    if (cached.status === "expired") {
      throw unavailable(401, "errors/disconnected_account", "LinkedIn session needs to be reconnected.");
    }
    return cached.session;
  }

  // Storage being down or a wrong LINKEDIN_SESSION_KEY is not a lost send.
  // Left as plain errors, automation read them as "may have been sent" and
  // parked each due invite for manual review.
  const record = await getOwnSessionRecord(accountId).catch(() => {
    throw unavailable(503, "errors/session_unavailable", "LinkedIn session could not be loaded. Nothing was sent.");
  });
  if (!record) {
    throw unavailable(401, "errors/disconnected_account", "LinkedIn session not found. Reconnect the account.");
  }
  const stored = await moveOntoStaticIp(accountId, record);
  let cookies: Record<string, string>;
  try {
    cookies = JSON.parse(decryptSessionSecret(stored.sealedCookies)) as Record<string, string>;
  } catch {
    throw unavailable(503, "errors/provider_unconfigured", "Stored LinkedIn session could not be read. Check LINKEDIN_SESSION_KEY.");
  }
  const session: OwnSession = {
    accountId,
    memberId: stored.memberId,
    cookies,
    userAgent: stored.userAgent,
    ...proxyIdentityOf(stored),
    ...(stored.legacyAccountId ? { legacyAccountId: stored.legacyAccountId } : {}),
    version: stored.version,
    cookieRevision: stored.cookieRevision || 0,
    ...(stored.timezone ? { timezone: stored.timezone } : {}),
  };
  cache.set(accountId, { session, status: stored.status, loadedAt: Date.now() });
  persistedSessionCookies.set(accountId, sessionCookieKey(session.cookies));
  if (stored.status === "expired") {
    throw unavailable(401, "errors/disconnected_account", "LinkedIn session needs to be reconnected.");
  }
  return session;
}

export function sessionHooks(accountId: string, version?: string): SessionHooks {
  return {
    onSessionExpired: (reason) => {
      markOwnSessionExpired(accountId, reason, version).catch((error) => {
        console.error("[linkedin-own] failed to mark session expired", accountId, error instanceof Error ? error.message : error);
      });
    },
    onCookiesChanged: (cookies, revision = 1) => {
      const key = sessionCookieKey(cookies);
      const sessionCookieChanged = persistedSessionCookies.get(accountId) !== key;
      const last = lastCookiePersistAt.get(accountId) || 0;
      if (!sessionCookieChanged && Date.now() - last < COOKIE_PERSIST_INTERVAL_MS) return;
      getDb().runTransaction(async (transaction) => {
        const ref = sessions().doc(accountId);
        const stored = (await transaction.get(ref)).data();
        if (!stored || stored.version !== version || (stored.cookieRevision || 0) >= revision) return false;
        transaction.set(ref, { sealedCookies: encryptSessionSecret(JSON.stringify(cookies)), cookieRevision: revision, updatedAt: nowIso() }, { merge: true });
        return true;
      }).then((persisted) => {
        if (!persisted || cache.get(accountId)?.session.version !== version) return;
        lastCookiePersistAt.set(accountId, Date.now());
        persistedSessionCookies.set(accountId, key);
      })
        .catch((error) => {
          console.error("[linkedin-own] failed to persist rotated cookies", accountId, error instanceof Error ? error.message : error);
        });
    },
  };
}
