"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/app/use-body-scroll-lock";

export default function SignOutButton({ localMode = false }: { localMode?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  useBodyScrollLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading]);

  const close = useCallback(() => {
    if (loading) return;
    setOpen(false);
    setError("");
  }, [loading]);

  const confirmSignOut = async () => {
    setLoading(true);
    setError("");
    try {
      // Clear session then hard-navigate so no stale app shell stays mounted.
      if (localMode) {
        const response = await fetch("/api/local-auth/logout", { method: "POST" });
        if (!response.ok) throw new Error("Could not end the local session.");
      } else {
        const clerk = (window as Window & { Clerk?: { signOut?: (options: { redirectUrl: string }) => Promise<void> } }).Clerk;
        if (!clerk?.signOut) throw new Error("Authentication did not load.");
        await clerk.signOut({ redirectUrl: "/" });
      }
      window.location.assign("/");
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Could not sign out. Please try again.");
    }
  };

  const dialog =
    open && mounted
      ? createPortal(
          <div
            className="m3-dialog-scrim z-[220]"
            role="presentation"
            onClick={close}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="sign-out-title"
              className="m3-dialog-surface"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="sign-out-title" className="m3-dialog-title">
                Sign out?
              </h2>
              <p className="m3-dialog-body">
                You will be signed out of Omentir on this device and returned to the home page.
              </p>
              {error ? (
                <p className="mt-3 text-sm text-[var(--md-sys-color-error)]" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="m3-dialog-actions">
                <button
                  type="button"
                  onClick={close}
                  disabled={loading}
                  className="m3-dialog-btn m3-dialog-btn--text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSignOut}
                  disabled={loading}
                  aria-busy={loading}
                  className="m3-dialog-btn m3-dialog-btn--destructive"
                >
                  {loading ? <span className="m3-dialog-btn__spinner" aria-hidden /> : null}
                  {loading ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="m3-card m3-card-outlined flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
            Sign out of this device
          </p>
          <p className="mt-1 text-[13px] leading-5 text-[var(--md-sys-color-on-surface-variant)]">
            End your session on this browser. You can sign back in anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError("");
            setOpen(true);
          }}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--md-sys-color-error)] bg-transparent px-5 text-sm font-semibold text-[var(--md-sys-color-error)] transition hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)]"
        >
          <span className="material-symbols-outlined text-[18px] leading-none" aria-hidden="true">
            logout
          </span>
          Sign out
        </button>
      </div>
      {dialog}
    </>
  );
}
