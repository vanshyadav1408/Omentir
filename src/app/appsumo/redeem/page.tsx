import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { activateAppSumoLicenseAction } from "@/app/actions";
import AuthShell, { AuthLegalFooter } from "@/app/auth-shell";
import { AuthHeading, AuthSwitchLine } from "@/app/auth-ui";
import { createPageMetadata } from "@/app/seo";
import {
  APPSUMO_PRODUCTS_URL,
  appSumoTierLimits,
  normalizeAppSumoTier,
} from "@/lib/appsumo-tiers";
import {
  APPSUMO_CLAIM_COOKIE,
  APPSUMO_REDEEM_PATH,
  pendingAppSumoLicense,
} from "@/lib/server/appsumo";
import { currentUser } from "@/lib/server/auth";
import { authOrSignedOut } from "@/lib/server/clerk-session";
import { findWorkspace } from "@/lib/server/data";

export const metadata = createPageMetadata({
  title: "AppSumo License - Omentir",
  description: "Attach your AppSumo license to an Omentir account.",
  path: APPSUMO_REDEEM_PATH,
  noIndex: true,
});

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  invalid:
    "That activation link did not work, or it was already used. Activate the license again from your AppSumo account.",
  expired:
    "This activation timed out. Activate the license again from your AppSumo account.",
  refunded: "This license was refunded or deactivated on AppSumo, so it cannot be activated.",
  claimed:
    "This license is already attached to another Omentir account. Log in with that account to use it.",
  has_license:
    "This account already has an AppSumo license. To change tier, upgrade or downgrade that license in your AppSumo account.",
  unknown:
    "We have no record of this license yet. Wait a few minutes, then activate it again from your AppSumo account. If it still fails, email hi@omentir.com with your license key.",
  unavailable: "AppSumo activation is not available right now. Try again in a few minutes.",
  failed: "The license could not be attached. Try again.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function count(amount: number, singular: string, plural: string) {
  return `${amount} ${amount === 1 ? singular : plural}`;
}

// This is the OAuth redirect URL saved in the AppSumo Partner Portal. AppSumo
// checks it with a plain GET that must answer 200, so with no code the page
// renders and never redirects.
export default async function AppSumoRedeemPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  const code = first(params.code);
  // The exchange has to set a cookie, which a page cannot do.
  if (code) redirect(`/api/appsumo/redeem?code=${encodeURIComponent(code)}`);

  const error = ERRORS[first(params.error) || ""];
  const [{ userId }, cookieStore] = await Promise.all([authOrSignedOut(), cookies()]);
  const license = await pendingAppSumoLicense(cookieStore.get(APPSUMO_CLAIM_COOKIE)?.value);
  const returnTo = encodeURIComponent(APPSUMO_REDEEM_PATH);

  if (!license) {
    return (
      <AuthShell marketing footer={<AuthLegalFooter />}>
        <AuthHeading
          title="Activate your AppSumo license"
          subtitle="Choose Activate on Omentir in your AppSumo products."
        />
        {error ? <p className="auth-error mb-4">{error}</p> : null}
        <a
          href={APPSUMO_PRODUCTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="auth-btn auth-btn-signup"
        >
          Open AppSumo
        </a>
        <AuthSwitchLine>
          {userId ? (
            <Link href="/overview" className="auth-link auth-switch-link">
              Back to Omentir
            </Link>
          ) : (
            <>
              Already activated?{" "}
              <Link href="/login" className="auth-link auth-switch-link">
                Log in
              </Link>
            </>
          )}
        </AuthSwitchLine>
      </AuthShell>
    );
  }

  const tier = normalizeAppSumoTier(license.tier);
  const limits = appSumoTierLimits(tier);
  const included = `License Tier ${tier} includes ${count(
    limits.linkedInAccounts,
    "LinkedIn account",
    "LinkedIn accounts",
  )} and ${count(limits.workspaces, "workspace", "workspaces")}.`;

  if (!userId) {
    return (
      <AuthShell marketing footer={<AuthLegalFooter />}>
        <AuthHeading
          title="Your AppSumo license is ready"
          subtitle={`${included} Create an Omentir account to attach it, or log in if you already have one.`}
        />
        {error ? <p className="auth-error mb-4">{error}</p> : null}
        <div className="grid gap-3">
          <Link href={`/signup?next=${returnTo}`} className="auth-btn auth-btn-signup">
            Create account
          </Link>
          <Link href={`/login?next=${returnTo}`} className="auth-btn">
            Log in
          </Link>
        </div>
      </AuthShell>
    );
  }

  const [user, workspace] = await Promise.all([currentUser(), findWorkspace(userId)]);
  const email = user?.primaryEmailAddress?.emailAddress;
  const billing = workspace?.billing;
  const hasMonthlyPlan =
    billing?.provider === "whop" && billing.status === "active" && billing.plan !== "lifetime";

  return (
    <AuthShell marketing footer={<AuthLegalFooter />}>
      <AuthHeading
        title="Attach your AppSumo license"
        subtitle={`${included} It will be attached to ${email || "the account you are logged in to"}.`}
      />
      {error ? <p className="auth-error mb-4">{error}</p> : null}
      {hasMonthlyPlan ? (
        <p className="auth-muted mb-4 text-[13px] leading-snug">
          This account also has a monthly Omentir plan. The license does not cancel it. Cancel it
          in Settings if you no longer need it.
        </p>
      ) : null}
      <form action={activateAppSumoLicenseAction}>
        <button type="submit" className="auth-btn auth-btn-signup">
          Attach license
        </button>
      </form>
    </AuthShell>
  );
}
