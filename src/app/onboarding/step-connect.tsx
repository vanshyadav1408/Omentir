import Image from "next/image";
import Link from "next/link";
import type { LinkedInAccount } from "@/lib/server/types";

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
    <div className="w-full max-w-sm text-center">
      <h1
        style={{ fontFamily: "var(--font-varta)" }}
        className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap text-4xl font-semibold leading-none tracking-tight sm:text-5xl"
      >
        <span>Connect</span>
        <Image
          src="/linkedin-logo.png"
          alt="LinkedIn"
          width={252}
          height={61}
          priority
          className="h-[0.95em] w-auto"
        />
      </h1>
      <p className="mt-4 text-base leading-7 text-zinc-600">
        Link the LinkedIn account Omentir should use for lead discovery and
        outreach. You&apos;ll be taken through a secure login flow.
      </p>

      {hasError && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Connection failed. Please try again.
        </p>
      )}

      {linkedInAccount && (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center">
          <p className="text-sm font-medium text-zinc-950">
            {linkedInAccount.displayName}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">Connected</p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href={connectHref}
          style={{ fontFamily: "var(--font-varta)" }}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#ba3871] px-5 pt-px text-[1.05rem] font-semibold leading-none text-white transition hover:brightness-95"
        >
          {linkedInAccount ? "Reconnect LinkedIn" : "Connect LinkedIn"}
        </Link>
        {linkedInAccount && (
          <Link
            href="/dashboard"
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-50"
          >
            Continue to dashboard
          </Link>
        )}
        <p className="-mt-1 text-center text-[10.8px] leading-5 text-zinc-500">
          You&apos;ll briefly leave Omentir to securely connect LinkedIn.
        </p>
      </div>
    </div>
  );
}
