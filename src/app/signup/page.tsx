import { authOrSignedOut } from "@/lib/server/clerk-session";
import { redirect } from "next/navigation";
import AuthChoice from "../auth-choice";
import OnboardingHeader from "../onboarding-header";
import { createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "Sign Up - Omentir",
  description: "Create an Omentir account to start finding customers with AI-powered LinkedIn outreach.",
  path: "/signup",
  noIndex: true,
});

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ website?: string | string[] }>;
}) {
  const { userId } = await authOrSignedOut();
  const params = await searchParams;
  const website = Array.isArray(params.website) ? params.website[0] : params.website;
  const postSignupUrl = website
    ? `/onboarding?website=${encodeURIComponent(website)}`
    : "/onboarding";

  if (userId) {
    redirect(postSignupUrl);
  }

  return (
    <>
      <OnboardingHeader />
      <AuthChoice
        primary="signup"
        initialWebsite={website || ""}
        signupReturnUrl={postSignupUrl}
      />
    </>
  );
}
