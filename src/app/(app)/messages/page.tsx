import { auth } from "@/lib/server/auth";
import MessagesView from "./messages-view";
import { getWorkspaceSetup } from "@/lib/server/workspace-setup";
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
  const setup = await getWorkspaceSetup(userId);
  if (!setup.linkedInConnected) {
    return (
      <CompleteSetupPrompt emoji="💬" message="Connect LinkedIn on Overview to see messages." />
    );
  }

  return <MessagesContent />;
}
