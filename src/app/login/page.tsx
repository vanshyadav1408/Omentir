import { authOrSignedOut } from "@/lib/server/clerk-session";
import { redirect } from "next/navigation";
import AuthChoice from "../auth-choice";
import AuthShell, { AuthLegalFooter } from "../auth-shell";
import { createPageMetadata } from "../seo";
import { isLocalMode, isLocalPasswordRequired } from "@/lib/runtime-mode";
import { safeReturnPath } from "@/lib/safe-return-path";
import LocalLoginForm from "../local-login-form";

export const metadata = createPageMetadata({
  title: "Login - Omentir",
  description: "Log in to your Omentir account.",
  path: "/login",
  noIndex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { userId } = await authOrSignedOut();
  // `next` carries flows that need sign-in first (e.g. OAuth consent for an AI
  // app) back to where they started, in both hosted and local mode.
  const { next } = await searchParams;
  const returnTo = safeReturnPath(next);
  if (userId) redirect(returnTo);
  if (isLocalMode()) {
    return (
      <AuthShell footer={<AuthLegalFooter />}>
        <LocalLoginForm
          returnTo={returnTo}
          passwordRequired={isLocalPasswordRequired()}
        />
      </AuthShell>
    );
  }
  return (
    <AuthShell footer={<AuthLegalFooter />}>
      <AuthChoice primary="login" loginReturnUrl={returnTo} />
    </AuthShell>
  );
}
