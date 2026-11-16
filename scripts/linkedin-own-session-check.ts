import { getDb } from "../src/lib/server/firebase";
const db = getDb();
const sessions = await db.collection("linkedinSessions").get();
console.log(`linkedinSessions docs: ${sessions.size}`);
for (const doc of sessions.docs) {
  const d = doc.data() as { status?: string; displayName?: string; updatedAt?: string };
  console.log(`- ${doc.id} status=${d.status || "?"} name=${d.displayName || "?"} updated=${d.updatedAt || "?"}`);
}
const accounts = await db.collection("linkedinAccounts").where("accountId", ">=", "own_").where("accountId", "<", "own_\uf8ff").get().catch(() => null);
console.log(`own linkedinAccounts docs: ${accounts ? accounts.size : "query failed"}`);
if (accounts) for (const doc of accounts.docs) {
  const d = doc.data() as { status?: string; displayName?: string; accountId?: string };
  console.log(`- ${d.accountId} status=${d.status || "?"} name=${d.displayName || "?"}`);
}
const pending = await db.collection("linkedinPendingLogins").get();
console.log(`linkedinPendingLogins docs: ${pending.size}`);
process.exit(0);
