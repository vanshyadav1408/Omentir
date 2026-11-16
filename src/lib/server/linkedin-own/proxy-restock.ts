import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getDb, nowIso } from "../firebase";
import { bytefulClient, bytefulConfigured, type BytefulClient, type BytefulProxy } from "./byteful";
import { countryDistanceKm } from "./country-centroids";
import { isSpareProxy, PROXY_POOL_COLLECTION, type ProxyPoolEntry, type ProxyPoolRow } from "./proxy-pool";

// Keeps the static IP pool stocked from Byteful, so a new LinkedIn account
// always finds a spare IP and nobody buys IPs by hand. Runs from the
// automation tick every few minutes:
// 1. sync: add IPs Byteful delivered, follow IPs Byteful replaced (the old
//    one stops working), drop IPs that are gone;
// 2. retire: cancel the bought IP of an account that disconnected, at the
//    end of the month already paid;
// 3. restock: buy IPs until LINKEDIN_PROXY_SPARES are free, in the countries
//    people connect from, never above LINKEDIN_PROXY_MONTHLY_BUDGET_USD a
//    month and only from credit already on the Byteful account.

export const PROXY_RESTOCK_TASK = "linkedin-proxy-restock";
const PURCHASES = "linkedinProxyPurchases";
// A purchase normally arrives within minutes. One that has not after an hour
// stops counting as a coming spare and is reported.
const DELIVERY_MS = 60 * 60_000;
// Countries people connected from in the last 30 days steer what gets bought.
const DEMAND_MS = 30 * 24 * 60 * 60_000;
const DEFAULT_SPARES = 2;

type Purchase = {
  serviceId: string;
  country: string;
  monthlyCents: number;
  status: "pending" | "delivered" | "late";
  createdAt: string;
  updatedAt: string;
};

function pool() {
  return getDb().collection(PROXY_POOL_COLLECTION) as FirebaseFirestore.CollectionReference<ProxyPoolEntry>;
}

function purchases() {
  return getDb().collection(PURCHASES) as FirebaseFirestore.CollectionReference<Purchase>;
}

async function readPool(): Promise<ProxyPoolRow[]> {
  return (await pool().get()).docs.map((doc) => ({ ...doc.data(), id: doc.id }));
}

async function pendingPurchases() {
  return (await purchases().where("status", "==", "pending").get()).docs.map((doc) => doc.data());
}

// Points every session on this proxy session at the IP's new address, or
// (with deletes) takes the static IP away so the account picks another one
// the next time it loads.
async function updateSessionsOn(proxySessionId: string, fields: Record<string, unknown>) {
  const sessions = await getDb().collection("linkedinSessions").where("proxySessionId", "==", proxySessionId).get();
  await Promise.all(sessions.docs.map((doc) => doc.ref.update({ ...fields, updatedAt: nowIso() })));
}

async function syncPool(live: BytefulProxy[]) {
  const [rows, pending] = await Promise.all([readPool(), pendingPurchases()]);
  const bought = new Map(rows.filter((row) => row.provider === "byteful" && row.providerProxyId).map((row) => [row.providerProxyId!, row]));
  const timestamp = nowIso();

  for (const proxy of live) {
    const host = proxy.proxy_ip_address;
    const port = Number(proxy.proxy_http_port);
    const row = bought.get(proxy.proxy_id);
    if (!row) {
      const purchase = pending.find((item) => item.serviceId === proxy.service_id);
      await pool().doc(`byteful-${proxy.proxy_id}`).set({
        port,
        host,
        country: proxy.country_id.toUpperCase(),
        provider: "byteful",
        providerServiceId: proxy.service_id,
        providerProxyId: proxy.proxy_id,
        ...(purchase ? { monthlyCents: purchase.monthlyCents } : {}),
        updatedAt: timestamp,
      });
      if (purchase) await purchases().doc(purchase.serviceId).set({ status: "delivered", updatedAt: timestamp }, { merge: true });
      continue;
    }
    if (row.host !== host || row.port !== port) {
      // Byteful replaced the IP. The old address stops working, so the
      // account follows it: one forced change, never a daily one.
      await pool().doc(row.id).set({ host, port, updatedAt: timestamp }, { merge: true });
      if (row.assignedTo) await updateSessionsOn(row.assignedTo, { proxyHost: host, proxyPort: port });
      console.warn("[linkedin-proxy] Byteful replaced a static IP; its account moved with it", JSON.stringify({ id: row.id, inUse: Boolean(row.assignedTo) }));
    }
  }

  const liveIds = new Set(live.map((proxy) => proxy.proxy_id));
  const active = [...bought.values()].filter((row) => !row.retired);
  const vanished = active.filter((row) => !liveIds.has(row.providerProxyId!));
  // Many IPs disappearing at once is far more likely a bad API answer than
  // real loss. Moving every account off its IP on that would be the very
  // IP churn this pool exists to prevent, so change nothing and report.
  if (vanished.length > 1 && vanished.length * 2 > active.length) {
    console.error("[linkedin-proxy] Byteful's list is missing most bought IPs; leaving the pool as it is", JSON.stringify({ missing: vanished.length, of: active.length }));
    return;
  }
  for (const row of bought.values()) {
    if (liveIds.has(row.providerProxyId!)) continue;
    // Gone at Byteful: a cancelled IP whose month ran out, or one removed
    // for unpaid renewal. An account still on it moves to another static IP.
    if (row.assignedTo) {
      await updateSessionsOn(row.assignedTo, { proxyPort: FieldValue.delete(), proxyHost: FieldValue.delete() });
      console.error("[linkedin-proxy] a static IP in use disappeared from Byteful; its account moves to another IP", JSON.stringify({ id: row.id }));
    }
    await pool().doc(row.id).delete();
  }

  for (const purchase of pending) {
    if (Date.now() - Date.parse(purchase.createdAt) < DELIVERY_MS || live.some((proxy) => proxy.service_id === purchase.serviceId)) continue;
    console.error("[linkedin-proxy] a bought static IP has not arrived after an hour; check the Byteful dashboard", JSON.stringify({ serviceId: purchase.serviceId }));
    await purchases().doc(purchase.serviceId).set({ status: "late", updatedAt: timestamp }, { merge: true });
  }
}

async function retireReleased(client: BytefulClient) {
  const rows = await readPool();
  for (const row of rows) {
    if (row.provider !== "byteful" || !row.retiring || row.retired || !row.providerServiceId) continue;
    // IPs bought together in the dashboard share one subscription, and
    // cancelling it would end the others too. Those rest and get reused.
    if (rows.filter((other) => other.providerServiceId === row.providerServiceId).length > 1) {
      await pool().doc(row.id).set({ retiring: false, updatedAt: nowIso() }, { merge: true });
      continue;
    }
    await client.cancelAtPeriodEnd(row.providerServiceId);
    await pool().doc(row.id).set({ retired: true, updatedAt: nowIso() }, { merge: true });
  }
}

function sparesTarget(env: NodeJS.ProcessEnv) {
  const value = Number(env.LINKEDIN_PROXY_SPARES ?? DEFAULT_SPARES);
  return Number.isInteger(value) && value >= 0 ? value : DEFAULT_SPARES;
}

function budgetCents(env: NodeJS.ProcessEnv) {
  const value = Number(env.LINKEDIN_PROXY_MONTHLY_BUDGET_USD);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : undefined;
}

// Countries people connected from lately, newest first, then the default.
export function demandCountries(rows: ProxyPoolEntry[], now: number, defaultCountry?: string) {
  const recent = rows
    .filter((row) => row.requestedCountry && row.assignedAt && now - Date.parse(row.assignedAt) < DEMAND_MS)
    .sort((a, b) => (b.assignedAt || "").localeCompare(a.assignedAt || ""))
    .map((row) => row.requestedCountry!.toUpperCase());
  return [...new Set([...recent, ...(defaultCountry ? [defaultCountry.toUpperCase()] : [])])];
}

// The country to buy the next IP in: the newest demand country that has no
// spare yet, at the nearest country Byteful sells when it does not sell that
// one.
export function nextPurchaseCountry(demand: string[], sold: string[], stocked: string[]) {
  const sellable = (country: string) => sold.includes(country)
    ? country
    : [...sold].sort((a, b) => countryDistanceKm(country, a) - countryDistanceKm(country, b))[0];
  for (const country of demand) {
    const target = sellable(country);
    if (!stocked.includes(target)) return target;
  }
  return demand.length ? sellable(demand[0]) : sold[0];
}

async function restock(client: BytefulClient, env: NodeJS.ProcessEnv) {
  const budget = budgetCents(env);
  if (budget === undefined) return;
  const now = Date.now();
  const [rows, pending] = await Promise.all([readPool(), pendingPurchases()]);
  const coming = pending.filter((purchase) => now - Date.parse(purchase.createdAt) < DELIVERY_MS);
  const spares = rows.filter((row) => isSpareProxy(row, now));
  let spend = rows.filter((row) => row.provider === "byteful" && !row.retired).reduce((sum, row) => sum + (row.monthlyCents || 0), 0)
    + coming.reduce((sum, purchase) => sum + purchase.monthlyCents, 0);

  // Renewals come out of credit. Too little means IPs, and with them
  // accounts' IPs, start dropping off at the end of the month.
  const credit = await client.creditCents().catch(() => undefined);
  if (credit !== undefined && credit < spend) {
    console.warn("[linkedin-proxy] Byteful credit covers less than one month of static IP renewals; top up", JSON.stringify({ creditCents: credit, monthlyCents: spend }));
  }

  let need = sparesTarget(env) - spares.length - coming.length;
  if (need <= 0) return;
  const sold = await client.ispCountries();
  if (!sold.length) {
    console.error("[linkedin-proxy] Byteful has no static ISP IPs for sale right now; cannot restock");
    return;
  }
  const stocked = [...spares.map((row) => row.country), ...coming.map((purchase) => purchase.country)];
  const demand = demandCountries(rows, now, env.LINKEDIN_PROXY_COUNTRY?.trim());
  while (need > 0) {
    const country = nextPurchaseCountry(demand, sold, stocked);
    const quote = await client.quote(country);
    if (!quote.is_valid) {
      console.error("[linkedin-proxy] Byteful refused to quote a static IP", JSON.stringify({ country, reason: quote.invalid_reason ?? null }));
      return;
    }
    if (spend + quote.total > budget) {
      console.error("[linkedin-proxy] monthly static IP budget reached; not buying more", JSON.stringify({ budgetCents: budget, monthlyCents: spend, nextCents: quote.total }));
      return;
    }
    if (quote.total_after_applied_credit > 0) {
      console.error("[linkedin-proxy] not enough Byteful credit to buy a static IP; top up", JSON.stringify({ country, priceCents: quote.total }));
      return;
    }
    const serviceId = await client.buy(country);
    const timestamp = nowIso();
    await purchases().doc(serviceId).set({ serviceId, country, monthlyCents: quote.total, status: "pending", createdAt: timestamp, updatedAt: timestamp });
    console.warn("[linkedin-proxy] bought a static IP", JSON.stringify({ country, monthlyCents: quote.total, serviceId }));
    spend += quote.total;
    stocked.push(country);
    need--;
  }
}

export async function syncAndRestockProxies(env: NodeJS.ProcessEnv = process.env, client: BytefulClient = bytefulClient(env)) {
  if (!bytefulConfigured(env)) return;
  const live = (await client.ispProxies()).filter((proxy) => proxy.proxy_status !== "pending_deletion");
  await syncPool(live);
  await retireReleased(client);
  await restock(client, env);
}
