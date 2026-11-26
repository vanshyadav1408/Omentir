import { authOrSignedOut } from "@/lib/server/clerk-session";
import { redirect } from "next/navigation";
import AuthChoice from "../auth-choice";
import AuthShell, { AuthLegalFooter } from "../auth-shell";
import { createPageMetadata } from "../seo";
import { safeReturnPath } from "@/lib/safe-return-path";

export const metadata = createPageMetadata({
  title: "Sign Up - Omentir",
  description: "Create an Omentir account to start finding customers with LinkedIn outreach.",
  path: "/signup",
  noIndex: true,
});

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ website?: string | string[]; next?: string | string[] }>;
}) {
  const { userId } = await authOrSignedOut();
  const params = await searchParams;
  const website = Array.isArray(params.website) ? params.website[0] : params.website;
  // `next` carries a flow that needs an account first (redeeming an AppSumo
  // license) back to where it started, as it does on /login.
  const next = Array.isArray(params.next) ? params.next[0] : params.next;
  const postSignupUrl = next
    ? safeReturnPath(next, "/onboarding")
    : website
      ? `/onboarding?website=${encodeURIComponent(website)}`
      : "/onboarding";

  if (userId) {
    redirect(postSignupUrl);
  }

  return (
    <AuthShell marketing footer={<AuthLegalFooter />}>
      <AuthChoice
        primary="signup"
        initialWebsite={website || ""}
        signupReturnUrl={postSignupUrl}
        switchReturnUrl={next ? postSignupUrl : undefined}
      />
    </AuthShell>
  );
}
