import { redirect } from "next/navigation";
import { auth } from "@/lib/server/auth";
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

  return (
    <AuthShell wide>
      <LinkedInConnectForm />
    </AuthShell>
  );
}
