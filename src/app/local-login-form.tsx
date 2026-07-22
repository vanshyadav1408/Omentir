"use client";

import { FormEvent, useState } from "react";
import LogoMark from "./logo-mark";
import { TextField } from "./ui/text-field";

export default function LocalLoginForm({
  returnTo = "/dashboard",
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
      window.location.assign(returnTo.startsWith("/") ? returnTo : "/dashboard");
      return;
    }
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    setError(result?.error || "Could not sign in.");
    setLoading(false);
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[var(--md-sys-color-surface)] p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <LogoMark className="mx-auto h-10 w-10" />
          <h1 className="text-2xl font-semibold text-[var(--md-sys-color-on-surface)]">
            {passwordRequired ? "Sign in to this instance" : "Welcome to Omentir"}
          </h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            {passwordRequired
              ? "Use the password configured by the instance operator."
              : "Your self-hosted workspace is ready."}
          </p>
        </div>
        {passwordRequired ? (
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoFocus
            autoComplete="current-password"
            error={error || undefined}
          />
        ) : null}
        <button
          type="submit"
          disabled={loading}
          style={passwordRequired ? undefined : { display: "flex", height: 36, minHeight: 36, marginInline: "auto" }}
          className={`m3-btn m3-btn-filled ${passwordRequired ? "h-12 w-full" : "w-1/2"}`}
        >
          {loading ? "Opening…" : passwordRequired ? "Sign in" : "Continue to dashboard"}
        </button>
      </form>
    </main>
  );
}
