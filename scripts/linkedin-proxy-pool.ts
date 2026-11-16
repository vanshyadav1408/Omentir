/**
 * Manages the static ISP IPs that LinkedIn accounts get one each
 * (src/lib/server/linkedin-own/proxy-pool.ts). Each IP is a port on the
 * provider's gateway (LINKEDIN_ISP_PROXY_URL, e.g. isp.oxylabs.io:8001) with
 * the country shown in the provider's proxy list.
 *
 * Usage:
 *   bun --conditions=react-server scripts/linkedin-proxy-pool.ts list
 *   bun --conditions=react-server scripts/linkedin-proxy-pool.ts sync
 *   bun --conditions=react-server scripts/linkedin-proxy-pool.ts add 8001:US 8002:GB
 *   bun --conditions=react-server scripts/linkedin-proxy-pool.ts remove 8002 [--force]
 *
 * sync runs the Byteful restock now instead of waiting for the automation
 * tick (needs BYTEFUL_API_* and, to buy, LINKEDIN_PROXY_MONTHLY_BUDGET_USD).
 * add/remove are for IPs on a shared gateway bought by hand.
 *
 * Writes to the Firestore project in .env (production's, for this repo).
 * New sign-ins pick an IP on their own; nothing else needs a restart.
 */
import { FieldValue } from "firebase-admin/firestore";
import { getDb, nowIso } from "../src/lib/server/firebase";
import { claimSystemTask } from "../src/lib/server/data";
import { PROXY_POOL_COLLECTION, type ProxyPoolEntry } from "../src/lib/server/linkedin-own/proxy-pool";
import { PROXY_RESTOCK_TASK, syncAndRestockProxies } from "../src/lib/server/linkedin-own/proxy-restock";

const pool = () => getDb().collection(PROXY_POOL_COLLECTION) as FirebaseFirestore.CollectionReference<ProxyPoolEntry>;
const [command, ...args] = process.argv.slice(2);

async function accountUsing(proxySessionId: string | null | undefined) {
  if (!proxySessionId) return undefined;
  const snap = await getDb().collection("linkedinSessions").where("proxySessionId", "==", proxySessionId).limit(1).get();
  return snap.docs[0]?.id;
}

if (command === "list") {
  const entries = (await pool().get()).docs.map((doc) => doc.data()).sort((a, b) => a.country.localeCompare(b.country) || a.port - b.port);
  if (!entries.length) console.log("The pool is empty. Run sync (Byteful) or add <port>:<country>.");
  for (const entry of entries) {
    const account = await accountUsing(entry.assignedTo);
    const state = entry.retired ? "cancelled, ends with its paid month"
      : entry.retiring ? "being cancelled"
      : account ? `account ${account}` : entry.assignedTo ? `held by a sign-in since ${entry.assignedAt}` : "free";
    const address = entry.host ? `${entry.host}:${entry.port}` : String(entry.port);
    console.log(`${address}  ${entry.country}  ${state}${entry.releasedAt ? `  (last released ${entry.releasedAt})` : ""}`);
  }
} else if (command === "sync") {
  if (!(await claimSystemTask(PROXY_RESTOCK_TASK, 60_000))) {
    console.error("A restock ran in the last minute. Try again shortly.");
    process.exit(1);
  }
  await syncAndRestockProxies();
  console.log("Synced with Byteful. Run list to see the pool.");
} else if (command === "add" && args.length) {
  for (const arg of args) {
    const match = /^(\d{2,5}):([A-Za-z]{2})$/.exec(arg);
    if (!match) {
      console.error(`Skipped "${arg}": use <port>:<two-letter country>, e.g. 8001:US.`);
      continue;
    }
    const port = Number(match[1]);
    // merge keeps an existing assignment if the IP is already in the pool.
    await pool().doc(String(port)).set({ port, country: match[2].toUpperCase(), updatedAt: nowIso() }, { merge: true });
    console.log(`Added ${port} (${match[2].toUpperCase()}).`);
  }
} else if (command === "remove" && args[0]) {
  const ref = pool().doc(args[0]);
  const entry = (await ref.get()).data();
  if (!entry) {
    console.error(`Port ${args[0]} is not in the pool.`);
    process.exit(1);
  }
  const account = await accountUsing(entry.assignedTo);
  if (account && !args.includes("--force")) {
    console.error(`Port ${args[0]} is the IP of account ${account}. Add --force to remove it anyway; that account then moves to the residential fallback.`);
    process.exit(1);
  }
  await ref.delete();
  if (account) {
    // Off the IP that is going away. Its next reconnect picks a new one.
    await getDb().collection("linkedinSessions").doc(account).update({ proxyPort: FieldValue.delete(), proxyHost: FieldValue.delete(), updatedAt: nowIso() });
    console.log(`Account ${account} now uses the residential fallback (live within a minute).`);
  }
  console.log(`Removed ${args[0]}.`);
} else {
  console.error("Usage: list | sync | add <port>:<country> ... | remove <port> [--force]");
  process.exit(1);
}
process.exit(0);
