import type { ReactNode } from "react";
import Link from "next/link";
import LogoMark from "./logo-mark";
import OnboardingHeader from "./onboarding-header";

export default function AuthShell({
  children,
  footer,
  top,
  wide = false,
  marketing = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  top?: ReactNode;
  wide?: boolean;
  /** Login, signup and the SSO landing: marketing theme without the site
   *  header, the form in a white card on a gradient panel. */
  marketing?: boolean;
}) {
  if (marketing) {
    return (
      // No site header on login/signup, just the logo home. `cal-site` is the
      // marker the header used to carry: it switches on the marketing theme.
      <main className="site-theme cal-site cal-auth flex min-h-screen flex-col">
        <div className="cal-auth-stage">
          <Link href="/" className="cal-auth-logo" aria-label="Omentir home">
            <LogoMark className="h-6 w-6" />
            Omentir
          </Link>
          <div className="cal-auth-card">
            <div className="cal-auth-form">{children}</div>
          </div>
          {footer ? <div className="cal-auth-footer">{footer}</div> : null}
        </div>
      </main>
    );
  }

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
        <div className="mt-auto px-5 py-6 text-center text-xs leading-5 text-[var(--site-text-2)]">
          {footer}
        </div>
      ) : (
        <div className="h-10 shrink-0" aria-hidden />
      )}
    </div>
  );
}

export function AuthLegalFooter() {
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

  return (
    <p>
      {terms} and {privacy}
    </p>
  );
}
