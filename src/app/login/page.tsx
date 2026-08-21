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
  if (userId) redirect("/overview");
  if (isLocalMode()) {
    const { next } = await searchParams;
    return (
      <AuthShell footer={<AuthLegalFooter mode="login" />}>
        <LocalLoginForm
          returnTo={safeReturnPath(next)}
          passwordRequired={isLocalPasswordRequired()}
        />
      </AuthShell>
    );
  }
  return (
    <AuthShell footer={<AuthLegalFooter mode="login" />}>
      <AuthChoice primary="login" />
    </AuthShell>
  );
}
