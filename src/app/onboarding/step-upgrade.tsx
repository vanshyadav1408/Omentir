import PricingCards from "@/app/pricing-cards";

function billingMessage(status?: string) {
  switch (status) {
    case "active":
      return "Your subscription is active. You can still review plans and billing options here.";
    case "approval_pending":
    case "pending":
      return "You need an active subscription to use Omentir. Choose the plan that fits your sender setup.";
    case "suspended":
      return "Your subscription is suspended. Reactivate it before entering the dashboard.";
    case "cancelled":
    case "expired":
      return "Your previous subscription is no longer active.";
    case "bypassed":
      return "Your workspace access is already enabled.";
    default:
      return "default";
  }
}

function BillingMessage({ status }: { status?: string }) {
  const message = billingMessage(status);

  if (message === "default") {
    return (
      <>
        You need an active plan to use Omentir.
        <br />
        Get everything for{" "}
        <span className="font-medium text-orange-500">$49/month</span>, with a
        minimum of three bookings per week or you pay nothing. Need unlimited
        users, unlimited LinkedIn accounts, SSO, or dedicated
        support? Book an Enterprise call.
      </>
    );
  }

  return message;
}

export default function StepUpgrade({ status }: { status?: string }) {
  return (
    <>
      <div className="mx-auto max-w-2xl text-center">
        <h1
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          Confirm your subscription
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          <BillingMessage status={status} />
        </p>
      </div>

      <div className="w-full text-left">
        <PricingCards
          subscribeCta="Subscribe"
          className="mx-auto mt-10 w-full max-w-4xl pb-12 sm:pb-[3.75rem]"
        />
      </div>
    </>
  );
}
