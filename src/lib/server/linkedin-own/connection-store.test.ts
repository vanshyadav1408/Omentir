import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import * as fx from "./test-fixtures";
import { decryptSessionSecret } from "./session-crypto";

mock.module("server-only", () => ({}));
mock.module("../lead-avatar-cache", () => ({ queueLeadAvatarPersist: () => {} }));
type Row = Record<string, unknown>;
const rows = new Map<string, Row>();
let failCommit = false;
let transactionTail = Promise.resolve();

function apply(path: string, input: Row, merge = false) {
  const next = merge ? { ...rows.get(path) } : {} as Row;
  for (const [field, value] of Object.entries(input)) {
    const transform = value as { elements?: unknown[] } | undefined;
    next[field] = transform && Array.isArray(transform.elements)
      ? ((next[field] as unknown[]) || []).filter((item) => !transform.elements!.includes(item))
      : value;
  }
  rows.set(path, next);
}
class Ref {
  constructor(readonly path: string) {}
  get id() { return this.path.split("/").at(-1)!; }
  async get() { return new Snap(this); }
  async set(value: Row, options?: { merge?: boolean }) { apply(this.path, value, options?.merge); }
  async update(value: Row) { apply(this.path, value, true); }
  async delete() { rows.delete(this.path); }
}
class Snap {
  constructor(readonly ref: Ref) {}
  get id() { return this.ref.id; }
  get exists() { return rows.has(this.ref.path); }
  data() { const row = rows.get(this.ref.path); return row ? structuredClone(row) : undefined; }
}
class Query {
  constructor(readonly name: string, readonly filters: Array<[string, string, unknown]> = [], readonly count = Infinity) {}
  doc(id: string) { return new Ref(`${this.name}/${id}`); }
  where(field: string, operator: string, value: unknown) { return new Query(this.name, [...this.filters, [field, operator, value]], this.count); }
  limit(count: number) { return new Query(this.name, this.filters, count); }
  async get() {
    const docs = [...rows].filter(([path, row]) => path.startsWith(`${this.name}/`) && this.filters.every(([field, op, value]) => op === "in" ? (value as unknown[]).includes(row[field]) : row[field] === value))
      .slice(0, this.count).map(([path]) => new Snap(new Ref(path)));
    return { docs, empty: !docs.length };
  }
}
const db = {
  collection: (name: string) => new Query(name),
  getAll: async (...refs: Ref[]) => Promise.all(refs.map((ref) => ref.get())),
  batch: () => {
    const writes: Array<() => void> = [];
    return { set: (ref: Ref, value: Row) => { writes.push(() => apply(ref.path, value)); }, commit: async () => { writes.forEach((write) => write()); } };
  },
  runTransaction: async <T>(callback: (transaction: {
    get: (target: Ref | Query) => ReturnType<Ref["get"]> | ReturnType<Query["get"]>;
    set: (ref: Ref, value: Row, options?: { merge?: boolean }) => void;
  }) => Promise<T>) => {
    const previous = transactionTail;
    let release!: () => void;
    transactionTail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    const writes: Array<() => void> = [];
    try {
      const result = await callback({
        get: (target) => {
          if (writes.length) throw new Error("Firestore requires reads before writes");
          return target.get();
        },
        set: (ref, value, options) => { writes.push(() => apply(ref.path, value, options?.merge)); },
      });
      if (failCommit) throw new Error("Simulated database failure");
      writes.forEach((write) => write());
      return result;
    } finally { release(); }
  },
};
mock.module("../firebase", () => ({
  getDb: () => db, nowIso: () => new Date().toISOString(),
  cleanId: (value: string) => value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
  normalizeLinkedInProfileUrl: (value: string) => value,
}));
const realTransport = await import("./transport");
mock.module("./transport", () => ({ ...realTransport, voyagerRequest: async () => fx.meResponse }));
const { connectOwnLinkedInAccount } = await import("./connect");
const { saveLinkedInAccount, claimSystemTask, releaseSystemTask, hasOtherLinkedInConnection } = await import("../data");
const { deleteOwnSession, invalidateOwnSession, loadOwnSession, markOwnSessionExpired, sessionHooks } = await import("./session-store");
const original = { key: process.env.LINKEDIN_SESSION_KEY, local: process.env.RUN_LOCALLY };
afterAll(() => {
  process.env.LINKEDIN_SESSION_KEY = original.key;
  process.env.RUN_LOCALLY = original.local;
  mock.restore();
});
const accountId = `own_${fx.SELF}`;
const input = { cookieHeader: 'li_at=secret; JSESSIONID="ajax:123"', userAgent: "Mozilla/5.0" };
function accountRow() {
  return [...rows].find(([path, row]) => path.startsWith("linkedinAccounts/") && row.accountId === accountId)?.[1];
}
function workspace(id: string) { rows.set(`workspaces/${id}`, { id, ownerId: id, billing: { plan: "solo", status: "active" }, settings: {} }); }
function legacyAccount() {
  rows.set("linkedinAccounts/original-seat", { id: "original-seat", workspaceId: "a", accountId: "legacy-account", provider: "unipile", displayName: "Sam", status: "connected", createdAt: "2025-01-01", updatedAt: "2025-01-01" });
  rows.set("campaigns/campaign", { id: "campaign", workspaceId: "a", linkedInAccountId: "original-seat", status: "active" });
}
beforeEach(() => {
  rows.clear(); failCommit = false;
  invalidateOwnSession(accountId);
  process.env.LINKEDIN_SESSION_KEY = Buffer.alloc(32, 7).toString("base64"); process.env.RUN_LOCALLY = "";
  workspace("a"); workspace("b");
});

// A person with two Omentir logins was told "already connected to another
// workspace" and could not use their own LinkedIn under the second one. Each
// login now gets its own account row, and both send through one session.
test("the same LinkedIn member can be connected under two Omentir logins on one shared session", async () => {
  const [first, second] = await Promise.all([connectOwnLinkedInAccount({ ...input, workspaceId: "a" }), connectOwnLinkedInAccount({ ...input, workspaceId: "b" })]);
  expect([first.workspaceId, second.workspaceId].sort()).toEqual(["a", "b"]);
  expect(first.id).not.toBe(second.id);
  expect([...rows.keys()].filter((path) => path.startsWith("linkedinSessions/"))).toEqual([`linkedinSessions/${accountId}`]);
  expect(JSON.parse(decryptSessionSecret(String(rows.get(`linkedinSessions/${accountId}`)!.sealedCookies))).li_at).toBe("secret");
});

// With a row per login, a sign-in must find its own login's row. Picking the
// other login's row would add a duplicate on every sign-in and profile refresh.
test("signing in again under one login reuses that login's row and leaves the other login's row alone", async () => {
  const first = await connectOwnLinkedInAccount({ ...input, workspaceId: "a" });
  const second = await connectOwnLinkedInAccount({ ...input, workspaceId: "b" });
  const secondBefore = structuredClone(rows.get(`linkedinAccounts/${second.id}`));
  const again = await connectOwnLinkedInAccount({ ...input, cookieHeader: 'li_at=fresh; JSESSIONID="ajax:456"', workspaceId: "a" });
  expect(again.id).toBe(first.id);
  expect(again.createdAt).toBe(first.createdAt);
  expect(rows.get(`linkedinAccounts/${second.id}`)).toEqual(secondBefore);
  expect([...rows.keys()].filter((path) => path.startsWith("linkedinAccounts/"))).toHaveLength(2);
});

// Disconnecting deletes the stored session. With two logins on that session,
// the first one to leave must not sign the other one out.
test("a LinkedIn account counts as still in use until its last login disconnects", async () => {
  const first = await connectOwnLinkedInAccount({ ...input, workspaceId: "a" });
  const second = await connectOwnLinkedInAccount({ ...input, workspaceId: "b" });
  expect(await hasOtherLinkedInConnection(first)).toBe(true);
  rows.get(`linkedinAccounts/${second.id}`)!.status = "disconnected";
  expect(await hasOtherLinkedInConnection(first)).toBe(false);
});

test("a failed account commit never leaves new credentials behind", async () => {
  failCommit = true;
  await expect(connectOwnLinkedInAccount({ ...input, workspaceId: "a" })).rejects.toThrow();
  expect(rows.has(`linkedinSessions/${accountId}`)).toBe(false);
});

test("simultaneous different accounts cannot exceed the owner's paid seat limit", async () => {
  const make = (memberId: string) => saveLinkedInAccount("a", { accountId: `own_${memberId}`, displayName: memberId, status: "connected", ownSession: { accountId: `own_${memberId}`, memberId, cookies: { li_at: "test", JSESSIONID: "ajax:1" }, userAgent: "Mozilla/5.0", proxySessionId: "p" } });
  const results = await Promise.allSettled([make("ACoMemberOne"), make("ACoMemberTwo")]);
  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  expect([...rows.keys()].filter((path) => path.startsWith("linkedinSessions/"))).toHaveLength(1);
});

test("reconnecting a disconnected account must still fit the owner's paid seat limit", async () => {
  legacyAccount();
  rows.set("linkedinAccounts/old-own-seat", { id: "old-own-seat", workspaceId: "a", accountId, provider: "own", displayName: "Sam", status: "disconnected", createdAt: "2025-01-01", updatedAt: "2025-01-01" });
  await expect(saveLinkedInAccount("a", { accountId, displayName: "Sam", status: "connected", ownSession: { accountId, memberId: fx.SELF, cookies: { li_at: "test", JSESSIONID: "ajax:1" }, userAgent: "Mozilla/5.0", proxySessionId: "p" } })).rejects.toThrow("current plan");
  expect(rows.get("linkedinAccounts/old-own-seat")?.status).toBe("disconnected");
  expect(rows.has(`linkedinSessions/${accountId}`)).toBe(false);
});

// The connect form used to ask "reconnecting an account?" and moved the old
// account's row and campaigns onto the new sign-in. Every connect is a new
// account now, so an old row is never rewritten by one.
test("connecting next to an old Unipile account adds a new account and leaves the old one as it was", async () => {
  legacyAccount();
  rows.get("linkedinAccounts/original-seat")!.status = "disconnected";
  const before = structuredClone(rows.get("linkedinAccounts/original-seat"));
  const connected = await connectOwnLinkedInAccount({ ...input, workspaceId: "a" });
  expect(connected.id).not.toBe("original-seat");
  expect(rows.get("linkedinAccounts/original-seat")).toEqual(before);
  expect(rows.get("campaigns/campaign")?.linkedInAccountId).toBe("original-seat");
  expect([...rows.keys()].some((path) => path.startsWith("linkedinRetiredAccounts/"))).toBe(false);
});

test("failed sync restores its successful watermark and cannot release a newer claim", async () => {
  const claim = await claimSystemTask("sync", 0);
  expect(claim).toBeTruthy();
  await releaseSystemTask("sync", { previousRunAt: 123, claimedAt: claim!.claimedAt });
  const key = "automationLocks/task-sync";
  expect(rows.get(key)?.lastRunAt).toBe(123);
  rows.set(key, { lastRunAt: claim!.claimedAt + 1 });
  await releaseSystemTask("sync", { previousRunAt: 123, claimedAt: claim!.claimedAt });
  expect(rows.get(key)?.lastRunAt).toBe(claim!.claimedAt + 1);
});

test("responses from a previous connection cannot replace or expire fresh credentials", async () => {
  await connectOwnLinkedInAccount({ ...input, workspaceId: "a" });
  const previous = await loadOwnSession(accountId);
  await connectOwnLinkedInAccount({ ...input, cookieHeader: 'li_at=fresh; JSESSIONID="ajax:456"', workspaceId: "a" });
  const current = await loadOwnSession(accountId);
  expect(current.version).not.toBe(previous.version);
  sessionHooks(accountId, previous.version).onCookiesChanged?.({ li_at: "stale", JSESSIONID: "ajax:123" }, 99);
  await markOwnSessionExpired(accountId, "Old response", previous.version);
  const stored = rows.get(`linkedinSessions/${accountId}`)!;
  expect(stored.status).toBe("active");
  expect(JSON.parse(decryptSessionSecret(String(stored.sealedCookies))).li_at).toBe("fresh");
  expect((await loadOwnSession(accountId)).version).toBe(current.version);
  expect(accountRow()?.status).toBe("connected");
});

// An expired session used to leave the account "connected": automation kept
// sending into it, every lead failed and retried, and nothing said
// "reconnect" until the owner happened to open the app.
test("LinkedIn ending the session disconnects the account so outreach stops and the app asks to reconnect", async () => {
  await connectOwnLinkedInAccount({ ...input, workspaceId: "a" });
  const session = await loadOwnSession(accountId);
  await markOwnSessionExpired(accountId, "LinkedIn signed the session out", session.version);
  expect(rows.get(`linkedinSessions/${accountId}`)?.status).toBe("expired");
  expect(accountRow()?.status).toBe("disconnected");
});

test("a stored session that cannot be decrypted is a typed rejection, not a possibly sent message", async () => {
  // Automation treats a plain Error from a send as "may have been sent" and
  // parks the lead for manual review. A wrong LINKEDIN_SESSION_KEY fails
  // before any request leaves, so the lead has to stay retryable.
  await connectOwnLinkedInAccount({ ...input, workspaceId: "a" });
  rows.get(`linkedinSessions/${accountId}`)!.sealedCookies = "not-a-sealed-value";
  invalidateOwnSession(accountId);
  const error = await loadOwnSession(accountId).catch((caught) => caught);
  expect(error?.name).toBe("LinkedInResponseError");
  expect(error?.status).toBe(503);
  expect(error?.errorType).toBe("errors/provider_unconfigured");
});

test("late cookie refreshes cannot recreate a disconnected session", async () => {
  await connectOwnLinkedInAccount({ ...input, workspaceId: "a" });
  const session = await loadOwnSession(accountId);
  await deleteOwnSession(accountId);
  sessionHooks(accountId, session.version).onCookiesChanged?.({ li_at: "late", JSESSIONID: "ajax:123" }, 1);
  await db.runTransaction(async () => {});
  expect(rows.has(`linkedinSessions/${accountId}`)).toBe(false);
});

test("cookie refreshes keep the latest response when persistence runs out of order", async () => {
  await connectOwnLinkedInAccount({ ...input, workspaceId: "a" });
  const session = await loadOwnSession(accountId);
  const hooks = sessionHooks(accountId, session.version);
  hooks.onCookiesChanged?.({ li_at: "latest", JSESSIONID: "ajax:789" }, 2);
  hooks.onCookiesChanged?.({ li_at: "older", JSESSIONID: "ajax:456" }, 1);
  await db.runTransaction(async () => {});
  const stored = rows.get(`linkedinSessions/${accountId}`)!;
  expect(stored.cookieRevision).toBe(2);
  expect(JSON.parse(decryptSessionSecret(String(stored.sealedCookies))).li_at).toBe("latest");
});

// LinkedIn treats an IP that changes every day as a warning sign, and
// residential sessions change at least daily.
test("an account saved before the static IP pool moves onto one static IP on its next load, keeps it, and gives it back on disconnect", async () => {
  await connectOwnLinkedInAccount({ ...input, workspaceId: "a" });
  const before = rows.get(`linkedinSessions/${accountId}`)!;
  expect(before.proxyPort).toBeUndefined();
  rows.set("linkedinProxyPool/8001", { port: 8001, country: "SG", updatedAt: "2026-01-01T00:00:00.000Z" });
  process.env.LINKEDIN_ISP_PROXY_URL = "http://user-u:p@isp.example.com:{port}";
  process.env.LINKEDIN_PROXY_COUNTRY = "IN";
  try {
    invalidateOwnSession(accountId);
    expect(await loadOwnSession(accountId)).toMatchObject({ proxySessionId: before.proxySessionId, proxyPort: 8001, proxyCountry: "SG" });
    expect(rows.get(`linkedinSessions/${accountId}`)).toMatchObject({ proxyPort: 8001, proxyCountry: "SG" });
    expect(rows.get("linkedinProxyPool/8001")?.assignedTo).toBe(before.proxySessionId);
    invalidateOwnSession(accountId);
    expect((await loadOwnSession(accountId)).proxyPort).toBe(8001);

    await deleteOwnSession(accountId);
    expect(rows.get("linkedinProxyPool/8001")?.assignedTo).toBeNull();
    expect(rows.get("linkedinProxyPool/8001")?.releasedAt).toBeTruthy();
  } finally {
    delete process.env.LINKEDIN_ISP_PROXY_URL;
    delete process.env.LINKEDIN_PROXY_COUNTRY;
  }
});

test("reconnecting keeps the account's static IP even when the new sign-in held another one", async () => {
  await connectOwnLinkedInAccount({ ...input, workspaceId: "a", proxySessionId: "aaaaaaaaaaaaaaaa", proxyPort: 8001, proxyCountry: "US" });
  await connectOwnLinkedInAccount({ ...input, workspaceId: "a", proxySessionId: "bbbbbbbbbbbbbbbb", proxyPort: 8002, proxyCountry: "US" });
  expect(rows.get(`linkedinSessions/${accountId}`)).toMatchObject({ proxySessionId: "aaaaaaaaaaaaaaaa", proxyPort: 8001 });
});
