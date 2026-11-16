import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { auth } from "@/lib/server/auth";
import { listReplaceableLinkedInAccounts } from "@/lib/server/data";
import AuthShell from "../../auth-shell";
import { createPageMetadata } from "../../seo";
import LinkedInConnectForm from "./linkedin-connect-form";

export const metadata = createPageMetadata({
  title: "Connect LinkedIn - Omentir",
  description: "Connect your LinkedIn account to Omentir.",
  path: "/connect/linkedin",
  noIndex: true,
});

export default async function LinkedInConnectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login?next=/connect/linkedin");

  // Accounts connected through the old Unipile integration. Signing in again
  // without naming one creates a second record, and the old one's campaigns
  // and conversations stay behind on a connection that can never send.
  const workspace = await resolveActiveWorkspace(userId);
  const oldAccounts = await listReplaceableLinkedInAccounts(workspace.id);

  return (
    <AuthShell wide>
      <LinkedInConnectForm oldAccounts={oldAccounts} />
    </AuthShell>
  );
}
