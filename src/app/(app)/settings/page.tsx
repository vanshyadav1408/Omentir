import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import SettingsView from "./settings-view";
import {
  disconnectLinkedInAccountAction,
  saveSettingsAction,
} from "@/app/actions";
import { getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { createPageMetadata } from "@/app/seo";
import { isLocalMode } from "@/lib/runtime-mode";

export const metadata = createPageMetadata({
  title: "Settings - Omentir",
  description: "Manage Omentir workspace settings, notification email, sending limits, and connected accounts.",
  path: "/settings",
  noIndex: true,
});

type SessionClaimsProfile = {
  email?: string;
  image_url?: string;
  first_name?: string;
  full_name?: string;
  name?: string;
  picture?: string;
};

export default async function SettingsPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }

  const workspace = await getWorkspace(userId);
  if (!hasActiveSubscription(workspace)) {
    redirect("/upgrade");
  }
  const profile = (sessionClaims || {}) as SessionClaimsProfile;
  const userName = profile.full_name || profile.name || profile.first_name || "User";
  const userEmail = profile.email || workspace.notificationEmail || "not set";
  const imageUrl = profile.image_url || profile.picture;

  return (
    <SettingsView
      workspace={workspace}
      linkedInAccounts={[]}
      user={{ name: userName, email: userEmail, imageUrl }}
      saveAction={saveSettingsAction}
      disconnectAction={disconnectLinkedInAccountAction}
      localMode={isLocalMode()}
      notificationsEnabled={
        !isLocalMode() || Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
      }
    />
  );
}
