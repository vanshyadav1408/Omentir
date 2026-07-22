import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import OnboardingHeader from "../onboarding-header";
import { createPageMetadata } from "../seo";
import StepConnect from "../onboarding/step-connect";

export const metadata = createPageMetadata({
  title: "Reconnect LinkedIn - Omentir",
  description: "Reconnect the LinkedIn account Omentir uses for lead discovery and outreach.",
  path: "/reconnect",
  noIndex: true,
});

export const dynamic = "force-dynamic";

// Standalone reconnect page for existing users. Reuses the onboarding connect
// step for identical visuals, but without the step progress bar - just the
// Omentir header. The connect button carries flow=reconnect so Unipile returns
// to /reconnect/success instead of the new-user onboarding success view.
export default async function ReconnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const params = await searchParams;
  const hasError = Boolean(params.error);

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--md-sys-color-surface)] px-4 pb-10 pt-14 text-[var(--md-sys-color-on-surface)] sm:px-5">
      <OnboardingHeader />

      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center py-10">
        <div className="flex w-full flex-col items-center text-center">
          <StepConnect
            linkedInAccount={null}
            hasError={hasError}
            connectHref="/api/connect/linkedin?flow=reconnect"
          />
        </div>
      </section>
    </main>
  );
}
