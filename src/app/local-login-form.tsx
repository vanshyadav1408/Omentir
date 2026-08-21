"use client";

import { FormEvent, useState } from "react";
import { AuthField, AuthHeading, AUTH_TAGLINE } from "./auth-ui";
import { safeReturnPath } from "@/lib/safe-return-path";

export default function LocalLoginForm({
  returnTo = "/overview",
  passwordRequired = true,
}: {
  returnTo?: string;
  passwordRequired?: boolean;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/local-auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (response.ok) {
      window.location.assign(safeReturnPath(returnTo));
      return;
    }
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    setError(result?.error || "Could not sign in.");
    setLoading(false);
  }

  return (
    <div className="w-full">
      <AuthHeading
        title={passwordRequired ? "Sign in to this instance" : "Welcome to Omentir"}
        subtitle={
          passwordRequired
            ? "Use the password configured by the instance operator."
            : AUTH_TAGLINE
        }
      />
      <form onSubmit={submit} className="grid gap-4">
        {passwordRequired ? (
          <AuthField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
            autoFocus
            autoComplete="current-password"
          />
        ) : null}
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" disabled={loading} className="auth-btn">
          {loading ? "Opening..." : passwordRequired ? "Continue" : "Continue to dashboard"}
        </button>
      </form>
    </div>
  );
}
