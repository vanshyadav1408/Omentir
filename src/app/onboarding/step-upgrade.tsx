import PricingCards from "@/app/pricing-cards";

function billingMessage(status?: string) {
  switch (status) {
    case "active":
      return "Your subscription is active. You can still review plans and billing options here.";
    case "approval_pending":
    case "pending":
      return "You need an active subscription to use Omentir. Choose the plan that fits your sender setup.";
    case "suspended":
      return "Your subscription is suspended. Reactivate it before entering Overview.";
    case "cancelled":
    case "expired":
      return "Your previous subscription is no longer active.";
    case "bypassed":
      return "Your workspace access is already enabled.";
    default:
      return "Pick a plan to continue.";
  }
}

export default function StepUpgrade({ status }: { status?: string }) {
  return (
    <>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-medium tracking-tight text-white">
          Confirm your subscription
        </h1>
        <p className="auth-muted mt-1.5 text-[15px] leading-6">
          {billingMessage(status)}
        </p>
      </div>

      <div className="w-full text-left">
        <PricingCards
          subscribeCta="Subscribe"
          className="mx-auto mt-10 w-full pb-12 sm:pb-[3.75rem]"
        />
      </div>
    </>
  );
}
