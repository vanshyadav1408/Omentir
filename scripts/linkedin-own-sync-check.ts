import { listActiveOwnSessionAccountIds } from "../src/lib/server/linkedin-own/session-store";
import { getLinkedInAccountByAccountIdAnyStatus } from "../src/lib/server/data";
const ids = await listActiveOwnSessionAccountIds();
console.log("active own session account ids:", JSON.stringify(ids));
for (const id of ids) {
  const account = await getLinkedInAccountByAccountIdAnyStatus(id);
  console.log(id, "-> workspace:", account?.workspaceId, "status:", account?.status);
}
process.exit(0);
