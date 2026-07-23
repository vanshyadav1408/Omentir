import { authOrSignedOut } from "@/lib/server/clerk-session";
import { redirect } from "next/navigation";
import AuthChoice from "../auth-choice";
import OnboardingHeader from "../onboarding-header";
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
  if (userId) redirect("/dashboard");
  if (isLocalMode()) {
    const { next } = await searchParams;
    return (
      <LocalLoginForm
        returnTo={safeReturnPath(next)}
        passwordRequired={isLocalPasswordRequired()}
      />
    );
  }
  return (
    <>
      <OnboardingHeader />
      <AuthChoice primary="login" />
    </>
  );
}
