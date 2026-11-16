/**
 * Live write test for the own LinkedIn client, approved by the account
 * owner: one message to the owner's own account, and one connection
 * request to a search-found 2nd/3rd-degree profile that is withdrawn
 * immediately after. Run once, manually:
 *   bun --conditions=react-server scripts/linkedin-own-write-test.ts
 */
import { getDb } from "../src/lib/server/firebase";
import { ownLinkedInRequest } from "../src/lib/server/linkedin-own/router";
import { listSentInvitations, sendConnectionRequest, sendLinkedInMessage, withdrawSentInvitation } from "../src/lib/server/linkedin";

const ctx = { takeProfileView: async () => true };
const sessions = await getDb().collection("linkedinSessions").get();
const active = sessions.docs.find((d) => (d.data() as { status?: string }).status === "active");
if (!active) process.exit(1);
const accountId = active.id;
const me = (await ownLinkedInRequest(accountId, "/api/v1/users/me", undefined, ctx)) as { provider_id: string; name: string; public_identifier?: string };
console.log(`Account: ${me.name} (${me.provider_id})`);

// 1. Message to self.
try {
  const sent = await sendLinkedInMessage({
    accountId,
    providerProfileId: me.provider_id,
    linkedInUrl: `https://www.linkedin.com/in/${me.public_identifier}/`,
    body: "Omentir own-client test message to yourself. You can delete this conversation.",
  });
  console.log("PASS message to self:", JSON.stringify(sent).slice(0, 200));
} catch (error) {
  console.log("FAIL message to self:", error instanceof Error ? error.message : error);
}

// 2. Invite a 2nd/3rd-degree person found by search, then withdraw.
const search = (await ownLinkedInRequest(accountId, "/api/v1/linkedin/search?limit=10", {
  method: "POST",
  body: JSON.stringify({ category: "people", keywords: "founder" }),
}, ctx)) as { items: Array<{ public_identifier?: string; name?: string; network_distance?: string }> };
const target = search.items.find((item) => item.public_identifier && item.network_distance && item.network_distance !== "DISTANCE_1");
if (!target?.public_identifier) {
  console.log("SKIP invite: no 2nd/3rd-degree target in search results");
  process.exit(0);
}
console.log(`Invite target: ${target.name} (${target.public_identifier}, ${target.network_distance})`);
const before = await listSentInvitations(accountId, 1);
try {
  const invite = await sendConnectionRequest({ accountId, linkedInUrl: `https://www.linkedin.com/in/${target.public_identifier}/` });
  console.log("PASS connection request sent:", JSON.stringify(invite).slice(0, 200));
} catch (error) {
  console.log("FAIL connection request:", error instanceof Error ? error.message : error);
  process.exit(0);
}

// Find the new invitation and withdraw it straight away.
const after = await listSentInvitations(accountId, 1);
const beforeIds = new Set(before.invitations.map((item) => item.id));
const fresh = after.invitations.find((item) => !beforeIds.has(item.id)) || after.invitations[0];
if (!fresh) {
  console.log("FAIL withdraw: could not find the new invitation in the sent list");
  process.exit(0);
}
try {
  await withdrawSentInvitation(accountId, fresh.id);
  console.log("PASS invitation withdrawn:", fresh.id);
} catch (error) {
  console.log("FAIL withdraw:", error instanceof Error ? error.message : error);
}
process.exit(0);
