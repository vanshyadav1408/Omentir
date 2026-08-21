import type { ReactNode } from "react";
import Link from "next/link";
import OnboardingHeader from "./onboarding-header";

export default function AuthShell({
  children,
  footer,
  top,
  wide = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  top?: ReactNode;
  wide?: boolean;
}) {
  // Login and signup stay on the 360px form column. Onboarding (progress `top`)
  // and plan/upgrade (`wide`) use the same 48rem secondary column as help/blog.
  const secondary = Boolean(top) || wide;

  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <OnboardingHeader />
      {top ? (
        <div className="omentir-secondary-width pt-20 sm:pt-24">
          {top}
        </div>
      ) : null}
      <div
        className={`flex flex-1 flex-col items-center justify-center ${
          top ? "py-10" : "py-24"
        } ${
          secondary
            ? "omentir-secondary-width"
            : "mx-auto w-full max-w-[360px] px-5"
        }`}
      >
        {children}
      </div>
      {footer ? (
        <div className="mt-auto px-5 py-6 text-center text-xs leading-5 text-[#737373]">
          {footer}
        </div>
      ) : (
        <div className="h-10 shrink-0" aria-hidden />
      )}
    </div>
  );
}

export function AuthLegalFooter({ mode }: { mode: "login" | "signup" }) {
  const terms = (
    <Link href="/terms-of-service" className="auth-link">
      Terms of Service
    </Link>
  );
  const privacy = (
    <Link href="/privacy-policy" className="auth-link">
      Privacy Policy
    </Link>
  );

  if (mode === "signup") {
    return (
      <p>
        By creating an account, you agree to the {terms} and {privacy}.
      </p>
    );
  }

  return (
    <p>
      {terms} and {privacy}
    </p>
  );
}
