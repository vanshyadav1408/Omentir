import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import MessagesView from "./messages-view";
import { getWorkspace, listLinkedInAccounts } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "Messages - Omentir",
  description: "Manage replies and LinkedIn conversations inside Omentir.",
  path: "/messages",
  noIndex: true,
});

async function MessagesContent() {
  return (
    <MessagesView
      conversations={[]}
      leads={[]}
      linkedInThreads={[]}
      senderAccounts={[]}
    />
  );
}

export default async function MessagesPage() {
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }
  // Workspace docs are keyed by owner userId, so both reads run in parallel.
  const [workspace, linkedInAccounts] = await Promise.all([
    getWorkspace(userId),
    listLinkedInAccounts(userId),
  ]);
  if (!hasActiveSubscription(workspace)) {
    redirect("/upgrade");
  }
  if (!linkedInAccounts.length) {
    redirect("/connect");
  }

  return <MessagesContent />;
}
