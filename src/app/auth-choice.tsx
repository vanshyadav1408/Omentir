"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AuthField, AuthHeading, AUTH_TAGLINE, AuthSwitchLine, GoogleMark } from "./auth-ui";

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
  const [stage, setStage] = useState<"identity" | "password">("identity");

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
        redirectUrlComplete: "/overview",
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
      await activateSession(clerk, result.createdSessionId, "/overview");
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
          await activateSession(clerk, result.createdSessionId, "/overview");
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
        const redirectUrl = verifyMode === "signup" ? postSignupUrl : "/overview";
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
        await activateSession(clerk, result.createdSessionId, "/overview");
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
  const submitClass = `auth-btn ${isSignup ? "auth-btn-signup" : ""}`;
  const heading =
    formMode === "reset-request" || formMode === "reset-verify"
      ? "Reset your password"
      : verifyingEmail
        ? "Check your email"
        : "Welcome to Omentir";
  const subtitle =
    formMode === "reset-request"
      ? "Enter the email on your account."
      : formMode === "reset-verify"
        ? info || "Enter the code from your inbox, then choose a new password."
        : verifyingEmail
          ? verifyMode === "signup" || signInCodeStrategy === "email_code"
            ? "We sent a verification code to your inbox."
            : "Enter the verification code to finish signing in."
          : AUTH_TAGLINE;

  const goToPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStage("password");
  };

  const backToIdentity = () => {
    setStage("identity");
    setError("");
  };

  const backToLogin = () => {
    setFormMode("default");
    setStage("identity");
    setError("");
    setInfo("");
  };

  return (
    <div className="w-full">
      <AuthHeading title={heading} subtitle={subtitle} />

      {formMode === "default" && stage === "identity" && !verifyingEmail ? (
        <button
          type="button"
          onClick={handleGoogle}
          disabled={disabled}
          className="auth-social mb-6 gap-2.5"
        >
          <GoogleMark />
          Continue with Google
        </button>
      ) : null}

      {formMode === "reset-request" ? (
        <form onSubmit={handleResetRequest} className="grid gap-4">
          <AuthField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Your email address"
            required
            defaultValue={resetEmail}
          />
          {error ? <p className="auth-error">{error}</p> : null}
          <button type="submit" disabled={disabled} className="auth-btn">
            {loading ? "Please wait..." : "Send reset code"}
          </button>
          <button type="button" onClick={backToLogin} className="auth-link justify-self-start text-[13px]">
            Back to login
          </button>
        </form>
      ) : formMode === "reset-verify" ? (
        <form onSubmit={handleResetVerify} className="grid gap-4">
          <AuthField
            label="Verification code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter code"
            required
          />
          <AuthField
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min 8 characters"
            required
          />
          {error ? <p className="auth-error">{error}</p> : null}
          <button type="submit" disabled={disabled} className="auth-btn">
            {loading ? "Please wait..." : "Reset password"}
          </button>
          <button type="button" onClick={backToLogin} className="auth-link justify-self-start text-[13px]">
            Back to login
          </button>
        </form>
      ) : verifyingEmail ? (
        <form onSubmit={handleVerifyEmail} className="grid gap-4">
          <AuthField
            label="Verification code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter code"
            required
          />
          {error ? <p className="auth-error">{error}</p> : null}
          <button type="submit" disabled={disabled} className={submitClass}>
            {loading ? "Please wait..." : "Verify code"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={stage === "identity" ? goToPassword : isSignup ? handleSignup : handleLogin}
          className="grid gap-4"
        >
          {isSignup ? (
            <div className={`grid grid-cols-2 gap-3 ${stage === "password" ? "hidden" : ""}`}>
              <AuthField
                label="First name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Your first name"
                required
              />
              <AuthField
                label="Last name"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Your last name"
              />
            </div>
          ) : null}

          <AuthField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Your email address"
            required
          />

          {stage === "password" ? (
            <div className="grid gap-1.5">
              <AuthField
                label="Password"
                name="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder={isSignup ? "Min 8 characters" : "Your password"}
                required
                autoFocus
              />
              {!isSignup ? (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="auth-link justify-self-end text-xs"
                >
                  Forgot password?
                </button>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="auth-error">{error}</p> : null}

          <ClerkCaptcha />

          <button type="submit" disabled={disabled} className={submitClass}>
            {loading
              ? "Please wait..."
              : stage === "identity"
                ? isSignup
                  ? "Continue"
                  : "Continue with email"
                : "Continue"}
          </button>

          {stage === "password" ? (
            <button type="button" onClick={backToIdentity} className="auth-link justify-self-start text-[13px]">
              Back
            </button>
          ) : null}
        </form>
      )}

      {formMode === "default" && !verifyingEmail ? (
        <AuthSwitchLine>
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <Link href={isSignup ? "/login" : "/signup"} className="auth-link">
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </AuthSwitchLine>
      ) : null}
    </div>
  );
}
