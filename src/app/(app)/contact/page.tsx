import { auth, currentUser } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { submitContactFormAction } from "@/app/actions";
import { getWorkspace } from "@/lib/server/data";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { isLocalMode } from "@/lib/runtime-mode";
import { createPageMetadata } from "@/app/seo";
import ContactView from "./contact-view";

export const metadata = createPageMetadata({
  title: "Contact - Omentir",
  description: "Contact the Omentir team by LinkedIn, X, email, Telegram, Whop, or the in-app form.",
  path: "/contact",
  noIndex: true,
});

export default async function ContactPage() {
  const localMode = isLocalMode();
  const { userId } = await auth();
  if (!userId) {
    await auth.protect();
    throw new Error("Unauthorized");
  }

  const [workspace, user] = await Promise.all([getWorkspace(userId), currentUser()]);
  if (!hasActiveSubscription(workspace)) {
    redirect("/upgrade");
  }

  const defaultEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses[0]?.emailAddress ||
    workspace.notificationEmail ||
    "";

  return (
    <ContactView
      defaultEmail={defaultEmail}
      localMode={localMode}
      submitAction={submitContactFormAction}
    />
  );
}
