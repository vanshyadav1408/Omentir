import { beforeEach, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

const DELETE = Symbol("delete");
mock.module("firebase-admin/firestore", () => ({ FieldValue: { delete: () => DELETE } }));

// Just enough Firestore: equality queries, merge writes, updates with field
// deletes, and deletes.
type Row = Record<string, unknown>;
const rows = new Map<string, Row>();
function write(path: string, value: Row, merge: boolean) {
  const next: Row = merge ? { ...rows.get(path) } : {};
  for (const [field, item] of Object.entries(value)) {
    if (item === DELETE) delete next[field];
    else next[field] = item;
  }
  rows.set(path, next);
}
class Ref {
  constructor(readonly path: string) {}
  get id() { return this.path.split("/").at(-1)!; }
  async set(value: Row, options?: { merge?: boolean }) { write(this.path, value, Boolean(options?.merge)); }
  async update(value: Row) { write(this.path, value, true); }
  async delete() { rows.delete(this.path); }
}
class Query {
  constructor(readonly name: string, readonly filters: Array<[string, unknown]> = []) {}
  doc(id: string) { return new Ref(`${this.name}/${id}`); }
  where(field: string, _op: string, value: unknown) { return new Query(this.name, [...this.filters, [field, value]]); }
  limit() { return this; }
  async get() {
    const docs = [...rows].filter(([path, row]) => path.startsWith(`${this.name}/`) && this.filters.every(([field, value]) => row[field] === value))
      .map(([path]) => ({ id: path.split("/").at(-1)!, ref: new Ref(path), data: () => structuredClone(rows.get(path)) }));
    return { docs, empty: !docs.length };
  }
}
mock.module("../firebase", () => ({
  getDb: () => ({ collection: (name: string) => new Query(name) }),
  nowIso: () => new Date().toISOString(),
}));

const { syncAndRestockProxies } = await import("./proxy-restock");
const { pickFreeProxy } = await import("./proxy-pool");

// A Byteful account in memory: what it has delivered, what it sells, and
// every purchase and cancellation asked of it.
let live: Array<{ proxy_id: string; proxy_ip_address: string; proxy_http_port: number; proxy_status: string; service_id: string; country_id: string }>;
let sold: string[];
let priceCents: number;
let creditCents: number;
const bought: string[] = [];
const cancelled: string[] = [];
const client = {
  ispProxies: async () => live,
  ispCountries: async () => sold,
  creditCents: async () => creditCents,
  quote: async () => ({ is_valid: true, total: priceCents, total_after_applied_credit: Math.max(0, priceCents - creditCents) }),
  buy: async (country: string) => { bought.push(country); creditCents -= priceCents; return `svc-${bought.length}`; },
  cancelAtPeriodEnd: async (serviceId: string) => { cancelled.push(serviceId); },
};
const ENV = {
  NODE_ENV: "test",
  BYTEFUL_API_PUBLIC_KEY: "pub",
  BYTEFUL_API_PRIVATE_KEY: "priv",
  LINKEDIN_PROXY_MONTHLY_BUDGET_USD: "50",
  LINKEDIN_PROXY_COUNTRY: "US",
} as NodeJS.ProcessEnv;
const run = (env: NodeJS.ProcessEnv = ENV) => syncAndRestockProxies(env, client as never);
const proxy = (id: string, ip: string, country: string, serviceId = `svc-${id}`) => ({
  proxy_id: id, proxy_ip_address: ip, proxy_http_port: 6000, proxy_status: "in_use", service_id: serviceId, country_id: country,
});
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

beforeEach(() => {
  rows.clear();
  live = [];
  sold = ["US", "GB", "SG"];
  priceCents = 300;
  creditCents = 10_000;
  bought.length = 0;
  cancelled.length = 0;
});

test("a delivered IP joins the pool with its own address and its price", async () => {
  rows.set("linkedinProxyPurchases/svc-a", { serviceId: "svc-a", country: "GB", monthlyCents: 300, status: "pending", createdAt: minutesAgo(2) });
  live = [proxy("a", "203.0.113.7", "gb", "svc-a")];
  await run({ ...ENV, LINKEDIN_PROXY_SPARES: "1" });
  expect(rows.get("linkedinProxyPool/byteful-a")).toMatchObject({
    host: "203.0.113.7", port: 6000, country: "GB", provider: "byteful", providerServiceId: "svc-a", monthlyCents: 300,
  });
  expect(rows.get("linkedinProxyPurchases/svc-a")?.status).toBe("delivered");
  // One spare was the target and it just arrived: nothing more to buy.
  expect(bought).toEqual([]);
});

test("when Byteful replaces an IP, the account on it follows to the new address", async () => {
  rows.set("linkedinProxyPool/byteful-a", { host: "203.0.113.7", port: 6000, country: "GB", provider: "byteful", providerProxyId: "a", providerServiceId: "svc-a", assignedTo: "sess-1", assignedAt: minutesAgo(600) });
  rows.set("linkedinSessions/own_A", { proxySessionId: "sess-1", proxyHost: "203.0.113.7", proxyPort: 6000 });
  live = [proxy("a", "198.51.100.9", "gb", "svc-a")];
  await run({ ...ENV, LINKEDIN_PROXY_MONTHLY_BUDGET_USD: "" });
  expect(rows.get("linkedinProxyPool/byteful-a")).toMatchObject({ host: "198.51.100.9", assignedTo: "sess-1" });
  expect(rows.get("linkedinSessions/own_A")).toMatchObject({ proxyHost: "198.51.100.9", proxyPort: 6000 });
});

test("an IP that vanished from Byteful lets its account move to another static IP instead of failing forever", async () => {
  rows.set("linkedinProxyPool/byteful-a", { host: "203.0.113.7", port: 6000, country: "GB", provider: "byteful", providerProxyId: "a", providerServiceId: "svc-a", assignedTo: "sess-1", assignedAt: minutesAgo(600) });
  rows.set("linkedinSessions/own_A", { proxySessionId: "sess-1", proxyHost: "203.0.113.7", proxyPort: 6000, proxyCountry: "GB" });
  await run({ ...ENV, LINKEDIN_PROXY_MONTHLY_BUDGET_USD: "" });
  expect(rows.has("linkedinProxyPool/byteful-a")).toBe(false);
  expect(rows.get("linkedinSessions/own_A")).toEqual({ proxySessionId: "sess-1", proxyCountry: "GB", updatedAt: expect.any(String) });
});

test("a disconnected account's bought IP is cancelled at the end of its month and never handed to someone else", async () => {
  rows.set("linkedinProxyPool/byteful-a", { host: "203.0.113.7", port: 6000, country: "GB", provider: "byteful", providerProxyId: "a", providerServiceId: "svc-a", assignedTo: null, releasedAt: minutesAgo(1), retiring: true });
  live = [proxy("a", "203.0.113.7", "gb", "svc-a")];
  await run({ ...ENV, LINKEDIN_PROXY_MONTHLY_BUDGET_USD: "" });
  expect(cancelled).toEqual(["svc-a"]);
  const retired = { ...rows.get("linkedinProxyPool/byteful-a")!, id: "byteful-a" } as never;
  expect(pickFreeProxy([retired], new Set(), Date.now() + 365 * 24 * 60 * 60_000)).toBeUndefined();
  // Once its month runs out Byteful stops listing it and the pool forgets it.
  live = [];
  await run({ ...ENV, LINKEDIN_PROXY_MONTHLY_BUDGET_USD: "" });
  expect(rows.has("linkedinProxyPool/byteful-a")).toBe(false);
});

test("an IP bought in a dashboard bundle is not cancelled, since that would end its siblings too", async () => {
  const shared = { port: 6000, country: "US", provider: "byteful", providerServiceId: "bundle" };
  rows.set("linkedinProxyPool/byteful-a", { ...shared, host: "203.0.113.1", providerProxyId: "a", releasedAt: minutesAgo(1), retiring: true });
  rows.set("linkedinProxyPool/byteful-b", { ...shared, host: "203.0.113.2", providerProxyId: "b" });
  live = [proxy("a", "203.0.113.1", "us", "bundle"), proxy("b", "203.0.113.2", "us", "bundle")];
  await run({ ...ENV, LINKEDIN_PROXY_MONTHLY_BUDGET_USD: "" });
  expect(cancelled).toEqual([]);
  expect(rows.get("linkedinProxyPool/byteful-a")?.retiring).toBe(false);
});

test("restocking buys spares where people connect from, at the nearest country Byteful sells", async () => {
  // Someone in India just took the last spare.
  rows.set("linkedinProxyPool/byteful-x", { host: "203.0.113.5", port: 6000, country: "SG", requestedCountry: "IN", provider: "byteful", providerProxyId: "x", providerServiceId: "svc-x", monthlyCents: 300, assignedTo: "sess-in", assignedAt: minutesAgo(3) });
  live = [proxy("x", "203.0.113.5", "sg", "svc-x")];
  await run();
  // India is not sold: Singapore for the next Indian user, then the default.
  expect(bought).toEqual(["SG", "US"]);
  expect(rows.get("linkedinProxyPurchases/svc-1")).toMatchObject({ country: "SG", monthlyCents: 300, status: "pending" });
});

test("IPs on their way count as spares, so a slow delivery never causes a second purchase", async () => {
  await run();
  expect(bought).toHaveLength(2);
  await run();
  expect(bought).toHaveLength(2);
});

test("restocking never goes over the monthly budget", async () => {
  rows.set("linkedinProxyPool/byteful-x", { host: "203.0.113.5", port: 6000, country: "US", provider: "byteful", providerProxyId: "x", providerServiceId: "svc-x", monthlyCents: 300, assignedTo: "sess-1", assignedAt: minutesAgo(3) });
  live = [proxy("x", "203.0.113.5", "us", "svc-x")];
  await run({ ...ENV, LINKEDIN_PROXY_MONTHLY_BUDGET_USD: "6" });
  // $3 already spent; one more $3 IP fits, a second would make $9.
  expect(bought).toEqual(["US"]);
});

test("restocking only spends credit already on the Byteful account", async () => {
  creditCents = 100;
  await run();
  expect(bought).toEqual([]);
});

test("without a budget nothing is bought, but delivered IPs still sync", async () => {
  live = [proxy("a", "203.0.113.7", "us")];
  await run({ ...ENV, LINKEDIN_PROXY_MONTHLY_BUDGET_USD: "" });
  expect(bought).toEqual([]);
  expect(rows.has("linkedinProxyPool/byteful-a")).toBe(true);
});

test("a Byteful answer missing most IPs changes nothing, so accounts never jump IP over an API glitch", async () => {
  for (const id of ["a", "b", "c"]) {
    rows.set(`linkedinProxyPool/byteful-${id}`, { host: `203.0.113.${id.charCodeAt(0)}`, port: 6000, country: "US", provider: "byteful", providerProxyId: id, providerServiceId: `svc-${id}`, assignedTo: `sess-${id}`, assignedAt: minutesAgo(600) });
    rows.set(`linkedinSessions/own_${id}`, { proxySessionId: `sess-${id}`, proxyHost: "kept", proxyPort: 6000 });
  }
  live = [];
  await run({ ...ENV, LINKEDIN_PROXY_MONTHLY_BUDGET_USD: "" });
  expect([...rows.keys()].filter((key) => key.startsWith("linkedinProxyPool/"))).toHaveLength(3);
  expect(rows.get("linkedinSessions/own_a")?.proxyPort).toBe(6000);
});
