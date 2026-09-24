import { auth } from "@/lib/server/auth";
import MessagesView from "./messages-view";
import { listLinkedInAccounts } from "@/lib/server/data";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import CompleteSetupPrompt from "@/app/(app)/complete-setup-prompt";
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
  const workspace = await resolveActiveWorkspace(userId);
  // Stored connection state is enough for this gate; the inbox fetch itself
  // talks to Unipile, so verifying here only delayed the page.
  const linkedInAccounts = await listLinkedInAccounts(workspace.id);
  if (!linkedInAccounts.length) {
    return (
      <CompleteSetupPrompt icon="inbox" message="Connect LinkedIn on Overview to see messages." />
    );
  }

  return <MessagesContent />;
}
