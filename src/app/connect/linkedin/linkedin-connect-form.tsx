"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

type Method = "email" | "sms" | "authenticator" | "app" | "code";

type ConnectResult = {
  ok?: boolean;
  needsVerification?: boolean;
  loginId?: string;
  method?: Method;
  hint?: string;
  error?: string;
  restart?: boolean;
  // LinkedIn would not let the server sign in (a puzzle, or a refused
  // request); the browser session step is the way left.
  fallback?: boolean;
};

type Step =
  | { kind: "credentials" }
  | { kind: "verify"; loginId: string; method: Method; hint?: string }
  | { kind: "session" };

const FAILED = "Could not connect LinkedIn. Please try again.";

const VERIFY_COPY: Record<Method, { title: string; body: string }> = {
  email: { title: "Check your email", body: "LinkedIn sent a verification code to the email on your account." },
  sms: { title: "Check your phone", body: "LinkedIn sent a verification code to the phone number on your account." },
  authenticator: { title: "Enter your authenticator code", body: "Open your authenticator app and enter the code for LinkedIn." },
  code: { title: "Enter the verification code", body: "LinkedIn sent you a verification code." },
  app: { title: "Approve in the LinkedIn app", body: "LinkedIn sent a sign-in request to the LinkedIn app on your phone. Approve it, then continue." },
};

const inputClass =
  "h-11 w-full rounded-xl border border-[var(--app-field-border,var(--site-border))] bg-transparent px-3.5 text-[15px] text-[var(--site-text)] outline-none transition-colors placeholder:text-[var(--site-text-3)] focus:border-[var(--app-field-border-focus,var(--site-text-2))] disabled:opacity-60";

function Field({ label, children, aside }: { label: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-[var(--site-text-2)]">
        {label}
        {aside}
      </span>
      {children}
    </label>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

// One-colour Google "G" so it matches the lock icon instead of Google's brand colours.
function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-[3px] h-3.5 w-3.5 shrink-0" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  );
}

export default function LinkedInConnectForm() {
  const router = useRouter();
  // Password sign-in runs in a real browser on the server, because
  // LinkedIn turns away plain HTTP sign-in requests.
  const [step, setStep] = useState<Step>({ kind: "credentials" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [liAt, setLiAt] = useState("");
  const [jsessionId, setJsessionId] = useState("");
  const [sessionOffered, setSessionOffered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const browser = () => ({
    userAgent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  async function send(url: string, body: unknown) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return (await response.json().catch(() => ({ error: FAILED }))) as ConnectResult;
    } catch {
      return { error: FAILED } satisfies ConnectResult;
    }
  }

  function handle(result: ConnectResult) {
    if (result.ok) {
      setPassword("");
      setCode("");
      setLiAt("");
      setJsessionId("");
      router.push("/overview");
      router.refresh();
      return;
    }
    if (result.needsVerification && result.loginId) {
      const method = result.method || "code";
      // A rejected code comes back without LinkedIn's instruction line; keep the one already shown.
      const hint = result.hint || (step.kind === "verify" && step.method === method ? step.hint : undefined);
      setStep({ kind: "verify", loginId: result.loginId, method, ...(hint ? { hint } : {}) });
      setCode("");
    } else if (result.restart) {
      setStep({ kind: "credentials" });
    }
    if (result.fallback) setSessionOffered(true);
    setError(result.error || "");
    setLoading(false);
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    const result = await send("/api/connect/linkedin/own/login", {
      email,
      password,
      ...browser(),
    });
    // The password is only needed for this one request.
    if (!result.ok && !result.needsVerification) setPassword("");
    handle(result);
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (loading || step.kind !== "verify") return;
    handle(await send("/api/connect/linkedin/own/verify", {
      loginId: step.loginId,
      ...(step.method === "app" ? {} : { code }),
    }));
  }

  async function connectSession(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    handle(await send("/api/connect/linkedin/own", { liAt, jsessionId, ...browser() }));
  }

  function startOver() {
    setStep({ kind: "credentials" });
    setCode("");
    setError("");
  }

  const errorLine = error ? (
    <p className="rounded-xl border border-[color-mix(in_oklab,var(--google-error)_35%,transparent)] bg-[color-mix(in_oklab,var(--google-error)_10%,transparent)] px-3.5 py-2.5 text-[13px] leading-5 text-[var(--google-error)]" role="alert">
      {error}
    </p>
  ) : null;

  const primary = "site-btn site-btn-primary h-11 w-full text-[15px] font-medium disabled:cursor-not-allowed disabled:opacity-60";
  const quietLink = "text-[13px] text-[var(--site-text-2)] underline-offset-4 transition-colors hover:text-[var(--site-text)] hover:underline";

  return (
    <div className="w-full max-w-[440px]">
      <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/linkedin-icon.svg" alt="" className="h-9 w-9 rounded-lg" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--site-text)]">
              {step.kind === "verify"
                ? VERIFY_COPY[step.method].title
                : step.kind === "session"
                  ? "Connect with a browser session"
                  : "Connect LinkedIn"}
            </h1>
            <p className="text-[13px] text-[var(--site-text-2)]">
              Sign in with your LinkedIn account
            </p>
          </div>
        </div>

        {step.kind === "credentials" ? (
          <form onSubmit={signIn} className="ph-no-capture grid gap-4" data-private>
            <Field label="Email or phone">
              <input
                className={inputClass}
                type="text"
                inputMode="email"
                name="linkedin-email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={320}
                required
                disabled={loading}
                autoFocus
              />
            </Field>
            <Field
              label="Password"
              aside={(
                <button type="button" className="text-[12px] font-normal text-[var(--site-text-3)] hover:text-[var(--site-text)]" onClick={() => setShowPassword((shown) => !shown)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              )}
            >
              <input
                className={inputClass}
                type={showPassword ? "text" : "password"}
                name="linkedin-password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                autoComplete="off"
                maxLength={1024}
                required
                disabled={loading}
              />
            </Field>
            {errorLine}
            <button type="submit" className={primary} disabled={loading}>
              {loading ? "Signing in to LinkedIn..." : "Connect LinkedIn"}
            </button>
            {sessionOffered ? (
              <button
                type="button"
                className={quietLink}
                onClick={() => {
                  setStep({ kind: "session" });
                  setError("");
                }}
                disabled={loading}
              >
                Use a browser session instead
              </button>
            ) : null}
            <div className="flex gap-2 rounded-xl bg-[var(--site-card-2)] px-3.5 py-3 text-xs leading-5 text-[var(--site-text-2)]">
              <LockIcon />
              <span>
                Your password is only used to sign in to LinkedIn and is never stored. Omentir keeps an encrypted LinkedIn session instead.{" "}
                <Link href="/linkedin-account-safety" className="font-medium text-[var(--site-text)] underline underline-offset-4">
                  How Omentir handles your LinkedIn account
                </Link>
              </span>
            </div>
            <div className="flex gap-2 rounded-xl bg-[var(--site-card-2)] px-3.5 py-3 text-xs leading-5 text-[var(--site-text-2)]">
              <GoogleIcon />
              <span>
                Sign in to LinkedIn with Google? Set a LinkedIn password first in LinkedIn&apos;s Settings, under Sign in &amp; security.
              </span>
            </div>
          </form>
        ) : null}

        {step.kind === "verify" ? (
          <form onSubmit={verify} className="ph-no-capture grid gap-4" data-private>
            <p className="text-sm leading-6 text-[var(--site-text-2)]">{step.hint || VERIFY_COPY[step.method].body}</p>
            {step.method === "app" ? null : (
              <Field label="Verification code">
                <input
                  className={`${inputClass} h-12 text-center font-mono text-lg tracking-[0.35em]`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => setCode(event.currentTarget.value.replace(/\s+/g, ""))}
                  maxLength={12}
                  required
                  disabled={loading}
                  autoFocus
                />
              </Field>
            )}
            {errorLine}
            <button type="submit" className={primary} disabled={loading}>
              {loading ? "Checking..." : step.method === "app" ? "I approved it" : "Verify and connect"}
            </button>
            <button type="button" className={quietLink} onClick={startOver} disabled={loading}>
              Use a different account
            </button>
          </form>
        ) : null}

        {step.kind === "session" ? (
          <form onSubmit={connectSession} className="ph-no-capture grid gap-4" data-private>
            <p className="text-sm leading-6 text-[var(--site-text-2)]">
              Sign in to linkedin.com in this browser. Then open the browser&apos;s developer tools, go to Application, Cookies,
              https://www.linkedin.com, and copy these two values.
            </p>
            <Field label="li_at">
              <input
                className={`${inputClass} font-mono text-[13px]`}
                type="text"
                name="linkedin-li-at"
                value={liAt}
                onChange={(event) => setLiAt(event.currentTarget.value.trim())}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={8192}
                required
                disabled={loading}
                autoFocus
              />
            </Field>
            <Field label="JSESSIONID">
              <input
                className={`${inputClass} font-mono text-[13px]`}
                type="text"
                name="linkedin-jsessionid"
                value={jsessionId}
                onChange={(event) => setJsessionId(event.currentTarget.value.trim())}
                placeholder="ajax:1234567890"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={1024}
                required
                disabled={loading}
              />
            </Field>
            {errorLine}
            <button type="submit" className={primary} disabled={loading}>
              {loading ? "Checking the session..." : "Connect LinkedIn"}
            </button>
            <div className="flex gap-2 rounded-xl bg-[var(--site-card-2)] px-3.5 py-3 text-xs leading-5 text-[var(--site-text-2)]">
              <LockIcon />
              <span>
                Omentir encrypts both values and never shows them again. They become the same session a password sign-in
                creates.
              </span>
            </div>
            <button type="button" className={quietLink} onClick={startOver} disabled={loading}>
              Back to password sign-in
            </button>
          </form>
        ) : null}
      </div>
      <div className="mt-5 text-center">
        <Link href="/overview" className={quietLink}>Back to overview</Link>
      </div>
    </div>
  );
}
