"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import LogoMark from "./logo-mark";
import { TextField } from "./ui/text-field";

/**
 * Clerk bot-protection host. Only mount after hydration so clerk-js does not
 * call into @clerk/ui while Next/Turbopack is still hydrating (that race logs
 * "Component renderer did not mount within 10s"). Must exist by the time
 * signUp.create / signIn.create run — render it inside those forms.
 */
function ClerkCaptcha() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!ready) return null;

  return (
    <div
      id="clerk-captcha"
      data-cl-theme="dark"
      data-cl-size="flexible"
      className="mx-auto w-full"
    />
  );
}

type ClerkFactor = {
  strategy?: string;
  emailAddressId?: string;
  email_address_id?: string;
  phoneNumberId?: string;
  phone_number_id?: string;
};

type ClerkSignInCodeStrategy = "email_code" | "phone_code" | "totp" | "backup_code";

type ClerkSignInResult = {
  status: string | null;
  createdSessionId: string | null;
  supportedFirstFactors?: ClerkFactor[] | null;
  supportedSecondFactors?: ClerkFactor[] | null;
};

type ClerkBrowser = {
  loaded?: boolean;
  client?: {
    signIn: {
      authenticateWithRedirect: (params: {
        strategy: "oauth_google";
        redirectUrl: string;
        redirectUrlComplete: string;
      }) => Promise<void>;
      create: (
        params:
          | { identifier: string; password: string }
          | { strategy: "reset_password_email_code"; identifier: string },
      ) => Promise<ClerkSignInResult>;
      prepareFirstFactor: (params: {
        strategy: "email_code";
        emailAddressId: string;
      }) => Promise<ClerkSignInResult>;
      prepareSecondFactor: (
        params:
          | { strategy: "email_code"; emailAddressId: string }
          | { strategy: "phone_code"; phoneNumberId: string },
      ) => Promise<ClerkSignInResult>;
      attemptFirstFactor: (
        params:
          | { strategy: "email_code"; code: string }
          | { strategy: "password"; password: string }
          | { strategy: "reset_password_email_code"; code: string; password: string },
      ) => Promise<ClerkSignInResult>;
      attemptSecondFactor: (params: {
        strategy: ClerkSignInCodeStrategy;
        code: string;
      }) => Promise<ClerkSignInResult>;
    };
    signUp: {
      authenticateWithRedirect: (params: {
        strategy: "oauth_google";
        redirectUrl: string;
        redirectUrlComplete: string;
      }) => Promise<void>;
      create: (params: {
        firstName: string;
        lastName: string;
        emailAddress: string;
        password: string;
      }) => Promise<{
        status: string | null;
        createdSessionId: string | null;
        unverifiedFields: string[];
      }>;
      prepareEmailAddressVerification: (params: {
        strategy: "email_code";
      }) => Promise<unknown>;
      attemptEmailAddressVerification: (params: {
        code: string;
      }) => Promise<{
        status: string | null;
        createdSessionId: string | null;
      }>;
    };
  };
  load?: () => Promise<void>;
  setActive?: (params: { session: string; redirectUrl: string }) => Promise<void>;
};

type LoadedClerkBrowser = ClerkBrowser & {
  client: NonNullable<ClerkBrowser["client"]>;
  setActive: NonNullable<ClerkBrowser["setActive"]>;
};

declare global {
  interface Window {
    Clerk?: ClerkBrowser;
  }
}

type AuthChoiceProps = {
  primary: "login" | "signup";
  initialWebsite?: string;
  signupReturnUrl?: string;
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray(error.errors) &&
    error.errors[0]?.message
  ) {
    const message = String(error.errors[0].message);
    return message.toLowerCase().includes("wrong password")
      ? "Wrong password. Click Forgot password to reset it."
      : message;
  }

  if (error instanceof Error) {
    return error.message.toLowerCase().includes("wrong password")
      ? "Wrong password. Click Forgot password to reset it."
      : error.message;
  }

  return "Something went wrong. Please try again.";
}

async function getLoadedClerk(): Promise<LoadedClerkBrowser | null> {
  if (typeof window === "undefined") return null;

  // Clerk injects window.Clerk from the async clerk-js script. Wait briefly so a
  // fast click right after first paint does not race the script tag.
  const deadline = Date.now() + 8_000;
  let clerk = window.Clerk;
  while (!clerk && Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, 50));
    clerk = window.Clerk;
  }
  if (!clerk) return null;

  if (!clerk.loaded && clerk.load) {
    await clerk.load();
  }

  if (!clerk.client || !clerk.setActive) return null;
  return clerk as LoadedClerkBrowser;
}

async function activateSession(
  clerk: LoadedClerkBrowser,
  session: string,
  redirectUrl: string,
) {
  const fallback = window.setTimeout(() => {
    window.location.assign(redirectUrl);
  }, 1500);

  await clerk.setActive({
    session,
    redirectUrl,
  });

  window.clearTimeout(fallback);
  window.location.assign(redirectUrl);
}

function emailAddressIdFromFactor(factor: ClerkFactor | undefined) {
  return factor?.emailAddressId || factor?.email_address_id || "";
}

function phoneNumberIdFromFactor(factor: ClerkFactor | undefined) {
  return factor?.phoneNumberId || factor?.phone_number_id || "";
}

function isCompleteSignIn(
  result: ClerkSignInResult,
): result is ClerkSignInResult & { status: "complete"; createdSessionId: string } {
  return result.status === "complete" && Boolean(result.createdSessionId);
}

type VerifyMode = "signup" | "signin-first" | "signin-second";
type FormMode = "default" | "reset-request" | "reset-verify";

export default function AuthChoice({
  primary,
  initialWebsite = "",
  signupReturnUrl,
}: AuthChoiceProps) {
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyMode, setVerifyMode] = useState<VerifyMode>("signup");
  const [signInCodeStrategy, setSignInCodeStrategy] =
    useState<ClerkSignInCodeStrategy>("email_code");
  const [formMode, setFormMode] = useState<FormMode>("default");
  const [resetEmail, setResetEmail] = useState("");

  const isSignup = primary === "signup";
  const postSignupUrl =
    signupReturnUrl ||
    (initialWebsite ? `/onboarding?website=${encodeURIComponent(initialWebsite)}` : "/onboarding");

  const handleGoogle = async () => {
    setError("");
    setLoading(true);

    try {
      const clerk = await getLoadedClerk();
      if (!clerk) {
        setError("Authentication did not load. Refresh the page and try again.");
        return;
      }

      if (isSignup) {
        await clerk.client.signUp.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: postSignupUrl,
        });
        return;
      }

      await clerk.client.signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const prepareSignInCodeStep = async (
    clerk: LoadedClerkBrowser,
    result: ClerkSignInResult,
  ) => {
    const emailFactor = result.supportedSecondFactors?.find(
      (factor) => factor.strategy === "email_code",
    );
    const emailAddressId = emailAddressIdFromFactor(emailFactor);
    if (emailAddressId) {
      await clerk.client.signIn.prepareSecondFactor({
        strategy: "email_code",
        emailAddressId,
      });
      setSignInCodeStrategy("email_code");
      setVerifyMode("signin-second");
      setVerifyingEmail(true);
      setError("");
      return true;
    }

    const phoneFactor = result.supportedSecondFactors?.find(
      (factor) => factor.strategy === "phone_code",
    );
    const phoneNumberId = phoneNumberIdFromFactor(phoneFactor);
    if (phoneNumberId) {
      await clerk.client.signIn.prepareSecondFactor({
        strategy: "phone_code",
        phoneNumberId,
      });
      setSignInCodeStrategy("phone_code");
      setVerifyMode("signin-second");
      setVerifyingEmail(true);
      setError("");
      return true;
    }

    if (result.supportedSecondFactors?.some((factor) => factor.strategy === "totp")) {
      setSignInCodeStrategy("totp");
      setVerifyMode("signin-second");
      setVerifyingEmail(true);
      setError("");
      return true;
    }

    if (result.supportedSecondFactors?.some((factor) => factor.strategy === "backup_code")) {
      setSignInCodeStrategy("backup_code");
      setVerifyMode("signin-second");
      setVerifyingEmail(true);
      setError("");
      return true;
    }

    return false;
  };

  const completeSignIn = async (
    clerk: LoadedClerkBrowser,
    initialResult: ClerkSignInResult,
    password: string,
  ) => {
    let result = initialResult;

    if (isCompleteSignIn(result)) {
      await activateSession(clerk, result.createdSessionId, "/dashboard");
      return true;
    }

    if (result.status === "needs_first_factor") {
      const passwordSupported = result.supportedFirstFactors?.some(
        (factor) => factor.strategy === "password",
      );
      if (passwordSupported) {
        result = await clerk.client.signIn.attemptFirstFactor({
          strategy: "password",
          password,
        });
        if (isCompleteSignIn(result)) {
          await activateSession(clerk, result.createdSessionId, "/dashboard");
          return true;
        }
      }

      if (result.status === "needs_second_factor") {
        return prepareSignInCodeStep(clerk, result);
      }

      const emailFactor = result.supportedFirstFactors?.find(
        (factor) => factor.strategy === "email_code",
      );
      const emailAddressId = emailAddressIdFromFactor(emailFactor);
      if (emailAddressId) {
        await clerk.client.signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId,
        });
        setSignInCodeStrategy("email_code");
        setVerifyMode("signin-first");
        setVerifyingEmail(true);
        setError("");
        return true;
      }
    }

    if (result.status === "needs_second_factor") {
      return prepareSignInCodeStep(clerk, result);
    }

    return false;
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");
    setLoading(true);

    try {
      const clerk = await getLoadedClerk();
      if (!clerk) {
        setError("Authentication did not load. Refresh the page and try again.");
        return;
      }

      const password = String(formData.get("password") || "");
      const result = await clerk.client.signIn.create({
        identifier: String(formData.get("email") || ""),
        password,
      });

      if (await completeSignIn(clerk, result, password)) {
        return;
      }

      setError("This sign in needs another security step. Try the verification code or Google sign in.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");
    setLoading(true);

    try {
      const clerk = await getLoadedClerk();
      if (!clerk) {
        setError("Authentication did not load. Refresh the page and try again.");
        return;
      }

      const result = await clerk.client.signUp.create({
        firstName: String(formData.get("firstName") || ""),
        lastName: String(formData.get("lastName") || ""),
        emailAddress: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
      });

      if (result.status === "complete" && result.createdSessionId) {
        await activateSession(clerk, result.createdSessionId, postSignupUrl);
        return;
      }

      if (result.unverifiedFields.includes("email_address")) {
        await clerk.client.signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setVerifyMode("signup");
        setVerifyingEmail(true);
        setError("");
        return;
      }

      setError("Please complete the remaining sign up step.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");
    setLoading(true);

    try {
      const clerk = await getLoadedClerk();
      if (!clerk) {
        setError("Authentication did not load. Refresh the page and try again.");
        return;
      }

      const code = String(formData.get("code") || "");

      const result =
        verifyMode === "signin-first"
          ? await clerk.client.signIn.attemptFirstFactor({
              strategy: "email_code",
              code,
            })
          : verifyMode === "signin-second"
            ? await clerk.client.signIn.attemptSecondFactor({
                strategy: signInCodeStrategy,
                code,
              })
          : await clerk.client.signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete" && result.createdSessionId) {
        const redirectUrl = verifyMode === "signup" ? postSignupUrl : "/dashboard";
        await activateSession(clerk, result.createdSessionId, redirectUrl);
        return;
      }

      if (verifyMode === "signin-first" && result.status === "needs_second_factor") {
        if (await prepareSignInCodeStep(clerk, result)) {
          return;
        }
      }

      setError(
        verifyMode === "signup"
          ? "Please complete the remaining sign up step."
          : "This sign in needs another security step. Try the verification code or Google sign in.",
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setError("");
    setInfo("");
    setFormMode("reset-request");
  };

  const handleResetRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const clerk = await getLoadedClerk();
      if (!clerk) {
        setError("Authentication did not load. Refresh the page and try again.");
        return;
      }

      await clerk.client.signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      setResetEmail(email);
      setFormMode("reset-verify");
      setInfo("Check your email inbox for the verification code.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") || "");
    const password = String(formData.get("password") || "");
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const clerk = await getLoadedClerk();
      if (!clerk) {
        setError("Authentication did not load. Refresh the page and try again.");
        return;
      }

      const result = await clerk.client.signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await activateSession(clerk, result.createdSessionId, "/dashboard");
        return;
      }

      setError("Could not reset your password. Please try again.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading;

  const fieldSurface = "var(--md-sys-color-surface)";
  const textMuted = "text-sm text-[var(--md-sys-color-on-surface-variant)]";
  const textLink =
    "text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:text-[var(--md-sys-color-on-surface)]";
  const primarySubmit =
    "m3-btn m3-btn-filled mx-auto flex h-12 w-full cursor-pointer items-center justify-center px-4 text-sm font-semibold leading-none disabled:cursor-not-allowed disabled:opacity-60";
  const errorText = "text-sm text-[var(--md-sys-color-error)]";

  return (
    <main className="relative min-h-screen bg-[var(--md-sys-color-surface)] px-5 text-[var(--md-sys-color-on-surface)]">
      <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center pb-10 pt-24">
        <div className="mx-auto mb-8 flex w-fit items-center gap-2 text-base font-normal text-[var(--md-sys-color-on-surface)]">
          <span>{isSignup ? "Welcome to" : "Welcome back to"}</span>
          <Link
            href="/"
            className="flex select-none items-center gap-1.5 font-medium text-[var(--md-sys-color-on-surface)]"
          >
            <LogoMark className="h-7 w-7 text-[var(--md-sys-color-on-surface)]" />
            <span className="leading-none">Omentir</span>
          </Link>
        </div>

        {formMode === "default" ? (
        <>
        <button
          type="button"
          onClick={handleGoogle}
          className="m3-btn m3-btn-outlined mx-auto h-12 w-full gap-2.5 text-sm font-semibold"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 48 48"
            className="h-[18px] w-[18px] shrink-0"
          >
            <path
              fill="#4285F4"
              d="M47.532 24.552c0-1.636-.146-3.21-.418-4.722H24.48v8.94h12.93c-.557 3-2.252 5.541-4.798 7.243v6.022h7.762c4.541-4.184 7.158-10.341 7.158-17.483z"
            />
            <path
              fill="#34A853"
              d="M24.48 48c6.48 0 11.916-2.146 15.888-5.823l-7.762-6.022c-2.155 1.443-4.91 2.298-8.126 2.298-6.252 0-11.546-4.218-13.434-9.892H3.018v6.218C6.974 42.572 15.072 48 24.48 48z"
            />
            <path
              fill="#FBBC05"
              d="M11.046 28.561c-.48-1.443-.754-2.984-.754-4.561s.274-3.118.754-4.561v-6.218H3.018A23.94 23.94 0 0 0 .48 24c0 3.873.929 7.535 2.538 10.779l8.028-6.218z"
            />
            <path
              fill="#EA4335"
              d="M24.48 9.547c3.524 0 6.687 1.213 9.176 3.594l6.882-6.882C36.39 2.382 30.954 0 24.48 0 15.072 0 6.974 5.428 3.018 13.221l8.028 6.218c1.888-5.674 7.182-9.892 13.434-9.892z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="my-8 flex items-center gap-4">
          <span className="h-px flex-1 bg-[var(--md-sys-color-outline-variant)]" />
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--md-sys-color-on-surface-variant)]">
            Or continue with email
          </span>
          <span className="h-px flex-1 bg-[var(--md-sys-color-outline-variant)]" />
        </div>
        </>
        ) : null}

        {formMode === "reset-request" ? (
          <form onSubmit={handleResetRequest} className="grid gap-5">
            <TextField
              className="mx-auto w-full"
              variant="outlined"
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
              defaultValue={resetEmail}
              labelSurface={fieldSurface}
            />

            {error ? <p className={errorText}>{error}</p> : null}

            <button type="submit" disabled={disabled} className={primarySubmit}>
              {loading ? "Please wait..." : "Send reset code"}
            </button>

            <button
              type="button"
              onClick={() => {
                setFormMode("default");
                setError("");
                setInfo("");
              }}
              className={`mx-auto ${textLink}`}
            >
              Back to login
            </button>
          </form>
        ) : formMode === "reset-verify" ? (
          <form onSubmit={handleResetVerify} className="grid gap-5">
            {info ? <p className={textMuted}>{info}</p> : null}

            <TextField
              className="mx-auto w-full"
              variant="outlined"
              label="Verification code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter code"
              required
              labelSurface={fieldSurface}
            />

            <TextField
              className="mx-auto w-full"
              variant="outlined"
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min 8 characters"
              required
              labelSurface={fieldSurface}
            />

            {error ? <p className={errorText}>{error}</p> : null}

            <button type="submit" disabled={disabled} className={primarySubmit}>
              {loading ? "Please wait..." : "Reset password"}
            </button>

            <button
              type="button"
              onClick={() => {
                setFormMode("default");
                setError("");
                setInfo("");
              }}
              className={`mx-auto ${textLink}`}
            >
              Back to login
            </button>
          </form>
        ) : verifyingEmail ? (
          <form onSubmit={handleVerifyEmail} className="grid gap-5">
              <div className="mx-auto grid w-full gap-1.5">
                {verifyMode === "signup" || signInCodeStrategy === "email_code" ? (
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    Check your email inbox for the verification code.
                  </p>
                ) : null}
                <TextField
                  variant="outlined"
                  label="Verification code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter code"
                  required
                  labelSurface={fieldSurface}
                />
              </div>

            {error ? <p className={errorText}>{error}</p> : null}

            <button type="submit" disabled={disabled} className={primarySubmit}>
              {loading ? "Please wait..." : "Verify code"}
            </button>
          </form>
        ) : (
          <form onSubmit={isSignup ? handleSignup : handleLogin} className="grid gap-5">
            {isSignup ? (
              <div className="mx-auto grid w-full gap-3 sm:grid-cols-2">
                <TextField
                  variant="outlined"
                  label="First Name"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="John"
                  required
                  labelSurface={fieldSurface}
                />
                <TextField
                  variant="outlined"
                  label="Last Name"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  labelSurface={fieldSurface}
                />
              </div>
            ) : null}

            <TextField
              className="mx-auto w-full"
              variant="outlined"
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
              labelSurface={fieldSurface}
            />

            <div className="mx-auto grid w-full gap-1.5">
              <TextField
                variant="outlined"
                label={isSignup ? "Create Password" : "Password"}
                name="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder={isSignup ? "Min 8 characters" : "Password"}
                required
                labelSurface={fieldSurface}
              />
              {!isSignup ? (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className={`justify-self-end text-xs font-medium ${textLink}`}
                >
                  Forgot password?
                </button>
              ) : null}
            </div>

            {error ? <p className={errorText}>{error}</p> : null}

            {/* Inside the form that calls signIn/signUp.create (Clerk bot protection). */}
            <ClerkCaptcha />

            <button type="submit" disabled={disabled} className={primarySubmit}>
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-base text-[var(--md-sys-color-on-surface-variant)]">
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-semibold text-[var(--md-sys-color-primary)] transition-colors hover:opacity-90"
          >
            {isSignup ? "Login" : "Sign Up"}
          </Link>
        </p>
      </div>
    </main>
  );
}
