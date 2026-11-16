import { auth } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import {
  findLeadForWorkspace,
  listLinkedInAccounts,
} from "@/lib/server/data";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { hasActiveSubscription } from "@/lib/server/subscription";
import {
  findLinkedInChatWithAttendee,
  linkedInChatBelongsToAccount,
  listLinkedInChatMessagesPage,
} from "@/lib/server/linkedin";

// A stored conversation older than the inbox page has no chat id on the client.
// Find the lead's live chat on one of the workspace's accounts so Messages
// shows LinkedIn's thread, not Omentir's partial copy of it.
async function findLeadChat(workspaceId: string, leadId: string) {
  const lead = await findLeadForWorkspace({ workspaceId, leadId });
  const providerProfileId = lead?.providerProfileId?.trim();
  if (!providerProfileId) return null;
  for (const account of await listLinkedInAccounts(workspaceId)) {
    try {
      const chatId = await findLinkedInChatWithAttendee({
        accountId: account.accountId,
        providerProfileId,
      });
      if (chatId) return { chatId, accountId: account.accountId };
    } catch (error) {
      // A dead account should not hide a chat that lives on another one.
      console.error(
        `[linkedin-chat-messages] chat lookup failed on ${account.accountId}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await resolveActiveWorkspace(userId);
  if (!hasActiveSubscription(workspace)) {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const leadId = url.searchParams.get("leadId")?.trim() || "";
  const cursor = url.searchParams.get("cursor")?.trim() || undefined;

  if (leadId) {
    try {
      const chat = await findLeadChat(workspace.id, leadId);
      if (!chat) return NextResponse.json({ chatId: null, messages: [] });
      const page = await listLinkedInChatMessagesPage({ chatId: chat.chatId, limit: 30, cursor });
      return NextResponse.json({ ...chat, ...page });
    } catch (error) {
      console.error(
        "[linkedin-chat-messages] lead history load failed:",
        error instanceof Error ? error.message : error,
      );
      return NextResponse.json(
        { error: "LinkedIn messages could not be loaded. Try again." },
        { status: 502 },
      );
    }
  }

  const chatId = url.searchParams.get("chatId")?.trim() || "";
  const accountId = url.searchParams.get("accountId")?.trim() || "";
  const account = accountId
    ? (await listLinkedInAccounts(workspace.id)).find((item) => item.accountId === accountId)
    : null;

  if (!chatId || !account) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  try {
    if (!(await linkedInChatBelongsToAccount(chatId, account.accountId))) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    const page = await listLinkedInChatMessagesPage({ chatId, limit: 30, cursor });
    return NextResponse.json(page);
  } catch (error) {
    console.error(
      "[linkedin-chat-messages] history load failed:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "LinkedIn messages could not be loaded. Try again." },
      { status: 502 },
    );
  }
}
