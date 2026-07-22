import { redirect } from "next/navigation";

// The subscription-confirmed view now lives inside the consolidated /onboarding
// flow. Kept as a redirect so the Whop checkout success URL keeps working.
export default function SubscriptionCreationSuccessfulPage() {
  redirect("/onboarding?status=subscription-confirmed");
}
