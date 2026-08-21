import { AuthHeading } from "../auth-ui";
import SubscriptionSuccessRedirect from "./subscription-success-redirect";

// Subscription-confirmed view, wired into the /onboarding flow. Reached when
// Whop checkout returns to /subscription-creation-successful, which redirects
// to /onboarding?status=subscription-confirmed.
export default function StepSubscriptionConfirmed() {
  return (
    <div className="w-full">
      <AuthHeading
        title="Subscription confirmed"
        subtitle="Your subscription is being activated. We'll take you to the next setup step automatically."
      />
      <SubscriptionSuccessRedirect />
    </div>
  );
}
