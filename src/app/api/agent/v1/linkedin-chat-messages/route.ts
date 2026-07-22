import { auth } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { getLinkedInAccountByAccountId, getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { listLinkedInChatMessagesPage, listLinkedInInbox } from "@/lib/server/unipile";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspace(userId);
  if (!hasActiveSubscription(workspace)) {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId")?.trim() || "";
  const accountId = url.searchParams.get("accountId")?.trim() || "";
  const cursor = url.searchParams.get("cursor")?.trim() || undefined;
  const account = accountId ? await getLinkedInAccountByAccountId(accountId) : null;

  if (!chatId || !account || account.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const visibleThreads = await listLinkedInInbox({
    accountId: account.accountId,
    limit: 50,
    includeMessageHistory: false,
  });
  if (!visibleThreads.some((thread) => thread.id === chatId)) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const page = await listLinkedInChatMessagesPage({ chatId, limit: 30, cursor });
  return NextResponse.json(page);
}
