import SubscriptionSuccessRedirect from "./subscription-success-redirect";

// Subscription-confirmed view, wired into the /onboarding flow. Reached when
// Whop checkout returns to /subscription-creation-successful, which redirects
// to /onboarding?status=subscription-confirmed.
export default function StepSubscriptionConfirmed() {
  return (
    <div className="w-full max-w-sm text-center">
      <h1
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-4xl font-semibold tracking-tight"
      >
        Subscription confirmed
      </h1>
      <p className="mt-4 text-sm leading-6 text-zinc-600">
        Your subscription is being activated. We&apos;ll take you to the next
        setup step automatically.
      </p>

      <SubscriptionSuccessRedirect />
    </div>
  );
}
