import { afterEach, beforeEach, expect, mock, setSystemTime, test } from "bun:test";

mock.module("server-only", () => ({}));

// Just enough Firestore for the pool: equality queries, merge writes, and
// transactions that run one at a time with reads before writes.
type Row = Record<string, unknown>;
const rows = new Map<string, Row>();
let dbCalls = 0;
let transactionTail = Promise.resolve();

class Ref {
  constructor(readonly path: string) {}
  get id() { return this.path.split("/").at(-1)!; }
  async get() { return { exists: rows.has(this.path), data: () => structuredClone(rows.get(this.path)) }; }
}
class Query {
  constructor(readonly name: string, readonly filters: Array<[string, unknown]> = [], readonly count = Infinity) {}
  doc(id: string) { return new Ref(`${this.name}/${id}`); }
  where(field: string, _op: string, value: unknown) { return new Query(this.name, [...this.filters, [field, value]], this.count); }
  limit(count: number) { return new Query(this.name, this.filters, count); }
  async get() {
    const docs = [...rows].filter(([path, row]) => path.startsWith(`${this.name}/`) && this.filters.every(([field, value]) => row[field] === value))
      .slice(0, this.count).map(([path]) => ({ ref: new Ref(path), id: path.split("/").at(-1)!, data: () => structuredClone(rows.get(path)) }));
    return { docs, empty: !docs.length };
  }
}
const db = {
  collection: (name: string) => new Query(name),
  runTransaction: async <T>(callback: (transaction: {
    get: (target: Query) => ReturnType<Query["get"]>;
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
        set: (ref, value, options) => {
          writes.push(() => rows.set(ref.path, { ...(options?.merge ? rows.get(ref.path) : {}), ...value }));
        },
      });
      writes.forEach((write) => write());
      return result;
    } finally { release(); }
  },
};
mock.module("../firebase", () => ({
  getDb: () => { dbCalls++; return db; },
  nowIso: () => new Date().toISOString(),
}));

const { keptProxyIdentity, pickFreeProxy, releaseProxy, requestCountry, reserveProxy } = await import("./proxy-pool");

const POOL_ON = { NODE_ENV: "test", LINKEDIN_ISP_PROXY_URL: "http://user-u:p@isp.example.com:{port}" } as NodeJS.ProcessEnv;
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
let now = Date.parse("2026-11-16T10:00:00.000Z");

function addIp(port: number, country: string) {
  rows.set(`linkedinProxyPool/${port}`, { port, country, updatedAt: new Date(now).toISOString() });
}
// What a successful connect leaves behind: a saved session on this proxy.
function saveAccount(proxySessionId: string) {
  rows.set(`linkedinSessions/own_${proxySessionId}`, { proxySessionId, status: "active" });
}
function advance(ms: number) {
  now += ms;
  setSystemTime(new Date(now));
}

beforeEach(() => {
  rows.clear();
  dbCalls = 0;
  now = Date.parse("2026-11-16T10:00:00.000Z");
  setSystemTime(new Date(now));
});
afterEach(() => {
  setSystemTime();
});

test("two people never share one static IP; when the pool is full the connect is refused, never put on an IP that changes daily", async () => {
  addIp(8001, "US");
  expect(await reserveProxy("first", "US", POOL_ON)).toEqual({ proxySessionId: "first", proxyPort: 8001, proxyCountry: "US" });
  saveAccount("first");
  advance(2 * DAY);
  expect(await reserveProxy("second", "US", POOL_ON)).toBeNull();
});

test("a person gets a static IP in their own country, else the nearest country with one free", async () => {
  addIp(8001, "US");
  addIp(8002, "SG");
  addIp(8003, "GB");
  expect((await reserveProxy("uk-person", "GB", POOL_ON))?.proxyPort).toBe(8003);
  // No India IPs: Singapore is nearest, and the IP says where it really is.
  expect(await reserveProxy("in-person", "IN", POOL_ON)).toEqual({ proxySessionId: "in-person", proxyPort: 8002, proxyCountry: "SG" });
  // With Singapore and Britain taken, the next nearest that is free.
  expect((await reserveProxy("in-person-2", "IN", POOL_ON))?.proxyPort).toBe(8001);
  expect(await reserveProxy("in-person-3", "IN", POOL_ON)).toBeNull();
});

test("an unknown country is treated as the configured default country", async () => {
  addIp(8001, "US");
  addIp(8002, "IN");
  expect((await reserveProxy("unknown", undefined, { ...POOL_ON, LINKEDIN_PROXY_COUNTRY: "in" }))?.proxyPort).toBe(8002);
});

test("asking again for the same sign-in returns the IP it already holds", async () => {
  addIp(8001, "US");
  addIp(8002, "US");
  const first = await reserveProxy("same", "US", POOL_ON);
  expect(await reserveProxy("same", "US", POOL_ON)).toEqual(first);
  expect([...rows.values()].filter((row) => row.assignedTo === "same")).toHaveLength(1);
});

test("a sign-in waiting on a verification code keeps its IP; an abandoned one gets it back after 30 minutes", async () => {
  addIp(8001, "US");
  await reserveProxy("waiting", "US", POOL_ON);
  advance(10 * MINUTE);
  expect((await reserveProxy("other", "US", POOL_ON))?.proxyPort).toBeUndefined();
  advance(21 * MINUTE);
  expect((await reserveProxy("later", "US", POOL_ON))?.proxyPort).toBe(8001);
});

test("a saved account keeps its IP however old the assignment is", async () => {
  addIp(8001, "US");
  await reserveProxy("owner", "US", POOL_ON);
  saveAccount("owner");
  advance(90 * DAY);
  expect((await reserveProxy("newcomer", "US", POOL_ON))?.proxyPort).toBeUndefined();
  // Giving it back is refused while the account still uses it.
  await releaseProxy("owner", { rest: false });
  expect(rows.get("linkedinProxyPool/8001")?.assignedTo).toBe("owner");
});

test("a failed sign-in's IP is free again at once, with no rest", async () => {
  addIp(8001, "US");
  await reserveProxy("failed", "US", POOL_ON);
  await releaseProxy("failed", { rest: false });
  expect((await reserveProxy("retry", "US", POOL_ON))?.proxyPort).toBe(8001);
});

test("a disconnected account's IP rests 30 days before another person gets it", async () => {
  addIp(8001, "US");
  await reserveProxy("leaver", "US", POOL_ON);
  saveAccount("leaver");
  rows.delete("linkedinSessions/own_leaver");
  await releaseProxy("leaver", { rest: true });
  advance(29 * DAY);
  expect((await reserveProxy("too-soon", "US", POOL_ON))?.proxyPort).toBeUndefined();
  advance(DAY);
  expect((await reserveProxy("after-rest", "US", POOL_ON))?.proxyPort).toBe(8001);
});

test("without LINKEDIN_ISP_PROXY_URL the pool is never touched", async () => {
  addIp(8001, "US");
  expect(await reserveProxy("plain", "US", {} as NodeJS.ProcessEnv)).toEqual({ proxySessionId: "plain", proxyCountry: "US" });
  expect(dbCalls).toBe(0);
});

test("unused IPs go out before ones that rested, so IPs rotate evenly", () => {
  const rested = { port: 8001, country: "US", releasedAt: new Date(now - 60 * DAY).toISOString(), updatedAt: "" };
  const unused = { port: 8002, country: "US", updatedAt: "" };
  expect(pickFreeProxy([rested, unused], new Set(), now)?.port).toBe(8002);
});

test("a reconnect keeps the account's IP and only moves onto a static IP it did not have", () => {
  const storedStatic = { proxySessionId: "old", proxyPort: 8001, proxyCountry: "US" };
  const storedResidential = { proxySessionId: "old", proxyCountry: "US" };
  const freshStatic = { proxySessionId: "new", proxyPort: 8002, proxyCountry: "US" };
  const freshResidential = { proxySessionId: "new", proxyCountry: "US" };
  expect(keptProxyIdentity(storedStatic, freshStatic)).toEqual(storedStatic);
  expect(keptProxyIdentity(storedResidential, freshStatic)).toEqual(freshStatic);
  expect(keptProxyIdentity(storedResidential, freshResidential)).toEqual(storedResidential);
  // Accounts saved before countries were recorded pick one up on reconnect.
  expect(keptProxyIdentity({ proxySessionId: "old" }, freshResidential)).toEqual({ proxySessionId: "old", proxyCountry: "US" });
  expect(keptProxyIdentity(undefined, freshResidential)).toEqual(freshResidential);
});

test("only real country codes from Cloudflare count", () => {
  const headers = (value?: string) => new Headers(value === undefined ? {} : { "cf-ipcountry": value });
  expect(requestCountry(headers("IN"))).toBe("IN");
  expect(requestCountry(headers("gb"))).toBe("GB");
  for (const value of [undefined, "", "XX", "T1", "USA"]) expect(requestCountry(headers(value))).toBeUndefined();
});

test("a bought IP comes with its own address, and on disconnect it is retired instead of passed on", async () => {
  rows.set("linkedinProxyPool/byteful-a", { port: 6000, host: "203.0.113.7", country: "GB", provider: "byteful", updatedAt: "" });
  expect(await reserveProxy("buyer", "GB", POOL_ON)).toEqual({ proxySessionId: "buyer", proxyPort: 6000, proxyHost: "203.0.113.7", proxyCountry: "GB" });
  expect(rows.get("linkedinProxyPool/byteful-a")?.requestedCountry).toBe("GB");
  saveAccount("buyer");
  rows.delete("linkedinSessions/own_buyer");
  await releaseProxy("buyer", { rest: true });
  expect(rows.get("linkedinProxyPool/byteful-a")).toMatchObject({ assignedTo: null, retiring: true });
  advance(365 * DAY);
  expect(await reserveProxy("next", "GB", POOL_ON)).toBeNull();
});
