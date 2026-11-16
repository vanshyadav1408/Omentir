import "server-only";

import { getDb, nowIso } from "../firebase";
import { countryDistanceKm } from "./country-centroids";
import { proxyIdentityOf, type ProxyIdentity } from "./transport";

// linkedinProxyPool/{id}: the static ISP IPs, one document per IP, reached
// through LINKEDIN_ISP_PROXY_URL with the IP's {host} and {port}. Each IP
// belongs to at most one LinkedIn account and stays with it, because
// LinkedIn treats an IP that changes every day as a warning sign. Sticky
// residential IPs change at least daily, so once a pool exists no new
// account goes on one: a person in a country with no free IP gets one from
// the nearest country that has. Bought IPs come from proxy-restock.ts;
// scripts/linkedin-proxy-pool.ts adds others by hand.
export const PROXY_POOL_COLLECTION = "linkedinProxyPool";

export type ProxyPoolEntry = {
  port: number;
  // The IP's own address. Unset for IPs behind one shared gateway host.
  host?: string;
  country: string;
  // The proxy session (linkedinSessions.proxySessionId) holding this IP.
  assignedTo?: string | null;
  assignedAt?: string | null;
  // Where the person who took it connected from. Restocking buys there.
  requestedCountry?: string | null;
  // When the account that last held this IP disconnected.
  releasedAt?: string;
  // Set on IPs bought through the provider's API (proxy-restock.ts). Those
  // are never passed on to another account: a disconnect retires them and
  // the subscription is cancelled at the end of its month.
  provider?: "byteful";
  providerServiceId?: string;
  providerProxyId?: string;
  monthlyCents?: number;
  retiring?: boolean;
  retired?: boolean;
  updatedAt: string;
};

export type ProxyPoolRow = ProxyPoolEntry & { id: string };

// A sign-in holds its IP this long before the account is saved. Longer than
// a pending sign-in can live (10 minutes), so a slow verification code never
// loses its IP to someone else.
const HOLD_MS = 30 * 60_000;
// After a disconnect the IP rests before another account gets it, so
// LinkedIn does not see two different people on it back to back.
const REST_MS = 30 * 24 * 60 * 60_000;

function pool() {
  return getDb().collection(PROXY_POOL_COLLECTION) as FirebaseFirestore.CollectionReference<ProxyPoolEntry>;
}

function sessionsUsing(proxySessionId: string) {
  return getDb().collection("linkedinSessions").where("proxySessionId", "==", proxySessionId).limit(1);
}

// Cloudflare sets CF-IPCountry on every request to omentir.com: where the
// person is connecting from, which is where LinkedIn normally sees them.
// XX (unknown) and T1 (Tor) are not countries.
export function requestCountry(headers: Headers) {
  const value = headers.get("cf-ipcountry")?.trim().toUpperCase();
  return value && /^[A-Z]{2}$/.test(value) && value !== "XX" ? value : undefined;
}

// Which proxy a reconnect keeps. The stored one, so the person's IP does
// not jump, unless only the new sign-in holds a static IP from the pool.
export function keptProxyIdentity(stored: ProxyIdentity | undefined, fresh: ProxyIdentity | undefined): ProxyIdentity | undefined {
  if (!stored?.proxySessionId) return fresh && proxyIdentityOf(fresh);
  if (stored.proxyPort || !fresh?.proxyPort) {
    return proxyIdentityOf({ ...stored, ...(!stored.proxyCountry && fresh?.proxyCountry ? { proxyCountry: fresh.proxyCountry } : {}) });
  }
  return proxyIdentityOf(fresh);
}

function rested(entry: ProxyPoolEntry, now: number) {
  return !entry.retiring && !entry.retired && (!entry.releasedAt || now - Date.parse(entry.releasedAt) >= REST_MS);
}

// An IP ready for the next new account, counted when restocking.
export function isSpareProxy(entry: ProxyPoolEntry, now = Date.now()) {
  return !entry.assignedTo && rested(entry, now);
}

// The IP to hand out: never one a saved account uses or a sign-in still
// holds, never one that is resting after a disconnect or being retired. The
// person's own country first, then the nearest one; within a country, IPs
// nobody has used yet, then the ones that rested longest.
export function pickFreeProxy<T extends ProxyPoolEntry>(entries: T[], inUse: ReadonlySet<string>, now = Date.now(), country?: string) {
  const free = entries.filter((entry) => {
    if (entry.assignedTo) {
      if (inUse.has(entry.assignedTo)) return false;
      if (now - Date.parse(entry.assignedAt || "") < HOLD_MS) return false;
    }
    return rested(entry, now);
  });
  const distance = (entry: ProxyPoolEntry) => (country ? countryDistanceKm(country, entry.country) : 0);
  free.sort((a, b) => {
    const nearer = distance(a) - distance(b);
    if (nearer) return nearer;
    return (a.releasedAt || "").localeCompare(b.releasedAt || "") || a.port - b.port;
  });
  return free[0];
}

function poolCountry(country: string | undefined, env: NodeJS.ProcessEnv) {
  return (country || env.LINKEDIN_PROXY_COUNTRY?.trim() || "").toUpperCase() || undefined;
}

export const NO_FREE_PROXY_MESSAGE = "Omentir has no free IP address for a new LinkedIn account right now. Try again later or contact support.";

// Picks the proxy for a new sign-in. With a static IP pool: a free static IP
// in the person's country, else in the nearest country with one free, and
// null when the pool is full (the connect is refused rather than put on an
// IP that changes daily). Without a pool: the residential session in the
// person's country. Asking again with the same proxySessionId returns the
// same IP.
export async function reserveProxy(proxySessionId: string, country: string | undefined, env: NodeJS.ProcessEnv = process.env): Promise<ProxyIdentity | null> {
  const target = poolCountry(country, env);
  if (!env.LINKEDIN_ISP_PROXY_URL?.trim()) return { proxySessionId, ...(target ? { proxyCountry: target } : {}) };

  const picked = await getDb().runTransaction(async (transaction) => {
    const held = await transaction.get(pool().where("assignedTo", "==", proxySessionId).limit(1));
    if (!held.empty) return held.docs[0].data();
    const entries: ProxyPoolRow[] = (await transaction.get(pool())).docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    // A hold past its time is free again only if no saved account took it.
    const inUse = new Set<string>();
    for (const entry of entries) {
      if (!entry.assignedTo || Date.now() - Date.parse(entry.assignedAt || "") < HOLD_MS) continue;
      if (!(await transaction.get(sessionsUsing(entry.assignedTo))).empty) inUse.add(entry.assignedTo);
    }
    const entry = pickFreeProxy(entries, inUse, Date.now(), target);
    if (!entry) return undefined;
    const timestamp = nowIso();
    transaction.set(pool().doc(entry.id), {
      assignedTo: proxySessionId,
      assignedAt: timestamp,
      requestedCountry: target ?? null,
      updatedAt: timestamp,
    }, { merge: true });
    return entry;
  });
  if (!picked) {
    console.error("[linkedin-proxy] static IP pool is full, connect refused: add IPs", JSON.stringify({ country: target ?? null }));
    return null;
  }
  if (target && picked.country !== target) {
    console.warn("[linkedin-proxy] no free static IP in the person's country, gave the nearest", JSON.stringify({ country: target, ipCountry: picked.country }));
  }
  return { proxySessionId, proxyPort: picked.port, ...(picked.host ? { proxyHost: picked.host } : {}), proxyCountry: picked.country };
}

// Gives an IP back once no saved account uses it: a sign-in that failed
// (rest: false, the IP never carried an account) or a disconnected account
// (rest: true; a bought IP is retired instead). Calling it for an IP a saved
// account still uses does nothing.
export async function releaseProxy(proxySessionId: string, { rest }: { rest: boolean }) {
  await getDb().runTransaction(async (transaction) => {
    const held = await transaction.get(pool().where("assignedTo", "==", proxySessionId).limit(1));
    if (held.empty) return;
    if (!(await transaction.get(sessionsUsing(proxySessionId))).empty) return;
    const timestamp = nowIso();
    transaction.set(held.docs[0].ref, {
      assignedTo: null,
      assignedAt: null,
      ...(rest ? { releasedAt: timestamp, ...(held.docs[0].data().provider ? { retiring: true } : {}) } : {}),
      updatedAt: timestamp,
    }, { merge: true });
  });
}
