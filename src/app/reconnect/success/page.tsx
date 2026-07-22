import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { listLinkedInAccounts, saveLinkedInAccount } from "@/lib/server/data";
import { findSingleRecentlyCreatedAccount } from "@/lib/linkedin-connect-recovery";
import { isLocalMode } from "@/lib/runtime-mode";
import { listUnipileLinkedInAccounts, retrieveOwnLinkedInProfile } from "@/lib/server/unipile";
import OnboardingHeader from "../../onboarding-header";
import { createPageMetadata } from "../../seo";
import StepLinkedInConnected from "../../onboarding/step-linkedin-connected";

export const metadata = createPageMetadata({
  title: "LinkedIn reconnected - Omentir",
  description: "Your LinkedIn account is reconnected to Omentir.",
  path: "/reconnect/success",
  noIndex: true,
});

export const dynamic = "force-dynamic";

// Where Unipile returns after a reconnect (flow=reconnect). Existing users land
// here instead of the new-user onboarding success step. Like /connect/success,
// it does not gate on the account already existing in Firestore - Unipile only
// redirects here on a real success, and the notify webhook may still be in
// flight - so it simply shows the confirmation.
export default async function ReconnectSuccessPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  if (isLocalMode()) {
    const linkedInAccounts = await listLinkedInAccounts(userId);
    const recent = findSingleRecentlyCreatedAccount(
      await listUnipileLinkedInAccounts(),
      undefined,
      new Set(linkedInAccounts.map((account) => account.accountId)),
    );
    if (recent) {
      const profile = await retrieveOwnLinkedInProfile(recent.id).catch(() => null);
      await saveLinkedInAccount(userId, {
        accountId: recent.id,
        displayName: profile?.displayName || recent.name,
        ...(profile?.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
        status: "connected",
      });
    }
  }

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--md-sys-color-surface)] px-4 pb-10 pt-14 text-[var(--md-sys-color-on-surface)] sm:px-5">
      <OnboardingHeader />

      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center py-10">
        <div className="flex w-full flex-col items-center text-center">
          <StepLinkedInConnected />
        </div>
      </section>
    </main>
  );
}
