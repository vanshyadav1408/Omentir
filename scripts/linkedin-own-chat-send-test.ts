import { getDb } from "../src/lib/server/firebase";
import { ownLinkedInRequest } from "../src/lib/server/linkedin-own/router";
import { sendLinkedInChatMessage } from "../src/lib/server/linkedin";

const ctx = { takeProfileView: async () => true };
const sessions = await getDb().collection("linkedinSessions").get();
const active = sessions.docs.find((d) => (d.data() as { status?: string }).status === "active");
if (!active) process.exit(1);
const accountId = active.id;
const me = (await ownLinkedInRequest(accountId, "/api/v1/users/me", undefined, ctx)) as { provider_id: string };
const chats = (await ownLinkedInRequest(accountId, "/api/v1/chats?limit=25", undefined, ctx)) as { items: Array<{ id: string; attendee_provider_id?: string }> };
console.log("chats scanned:", chats.items.length, "| self attendee present:", chats.items.some((c) => c.attendee_provider_id === me.provider_id));
const selfChat = chats.items.find((chat) => chat.attendee_provider_id === me.provider_id);
if (!selfChat) {
  console.log("SKIP: self conversation not in first 25 chats");
  process.exit(0);
}
const sent = await sendLinkedInChatMessage({ accountId, chatId: selfChat.id, body: "Omentir own-client test: reply inside your self thread. You can delete this conversation." });
console.log("PASS send in existing chat:", JSON.stringify(sent).slice(0, 160));
process.exit(0);
