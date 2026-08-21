import Link from "next/link";
import type { LinkedInAccount } from "@/lib/server/types";
import { AuthHeading } from "../auth-ui";

export default function StepConnect({
  linkedInAccount,
  hasError,
  connectHref = "/api/connect/linkedin",
}: {
  linkedInAccount: LinkedInAccount | null;
  hasError: boolean;
  connectHref?: string;
}) {
  return (
    <div className="w-full">
      <AuthHeading
        title="Connect LinkedIn"
        subtitle="Link the LinkedIn account Omentir should use for lead discovery and outreach. You'll be taken through a secure login flow."
      />

      {hasError ? (
        <p className="auth-error mb-4">Connection failed. Please try again.</p>
      ) : null}

      {linkedInAccount ? (
        <div className="mb-4 rounded-lg border border-[#2e2e2e] px-4 py-3">
          <p className="text-sm font-medium text-white">{linkedInAccount.displayName}</p>
          <p className="mt-0.5 text-xs text-[#737373]">Connected</p>
        </div>
      ) : null}

      <div className="grid gap-3">
        <Link href={connectHref} className="auth-btn">
          {linkedInAccount ? "Reconnect LinkedIn" : "Connect LinkedIn"}
        </Link>
        {linkedInAccount ? (
          <Link href="/overview" className="auth-social text-sm">
            Continue to overview
          </Link>
        ) : null}
        <p className="text-center text-[11px] leading-5 text-[#737373]">
          You'll briefly leave Omentir to securely connect LinkedIn.
        </p>
      </div>
    </div>
  );
}
