import { redirect } from "next/navigation";

// The LinkedIn-connect step now lives inside the consolidated /onboarding flow.
// Kept as a redirect so connect gates and the LinkedIn auth failure URL
// (/connect?error=1) land on the right onboarding step.
export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  redirect(params.error ? "/onboarding?error=1" : "/onboarding");
}
