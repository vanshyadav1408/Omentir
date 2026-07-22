import Link from "next/link";

// LinkedIn-connected view, wired into the /onboarding flow. Reached when Unipile
// returns to /connect/success, which redirects to
// /onboarding?status=linkedin-connected.
export default function StepLinkedInConnected() {
  return (
    <div className="w-full max-w-sm text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#ba3871] text-white">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">LinkedIn connected</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        Your account is linked. Omentir can now find your potential customers and contact them.
      </p>
      <Link
        href="/dashboard"
        className="mt-7 inline-flex h-10 items-center rounded-md bg-[#ba3871] px-6 text-sm font-semibold text-white transition hover:brightness-95"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
