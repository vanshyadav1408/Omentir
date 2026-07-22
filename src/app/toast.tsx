"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "./use-hydrated";

export type ToastTone = "error" | "success" | "info";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5600;

/** Pull a short user-facing string from thrown values (server actions, Error, string). */
export function userFacingError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (typeof error === "string") {
    const trimmed = error.trim();
    return trimmed || fallback;
  }
  if (error instanceof Error) {
    const msg = error.message?.trim() || "";
    // Next.js / React generic digests — not useful to end users
    if (
      !msg ||
      msg === "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details." ||
      msg.startsWith("An error occurred in the Server Components") ||
      /^[a-f0-9]{8,}$/i.test(msg)
    ) {
      return fallback;
    }
    return msg;
  }
  return fallback;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone = "error") => {
    const text = message.trim();
    if (!text) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((current) => [...current.slice(-4), { id, message: text, tone }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      showError: (message: string) => showToast(message, "error"),
      showSuccess: (message: string) => showToast(message, "success"),
      showInfo: (message: string) => showToast(message, "info"),
    }),
    [showToast],
  );

  // Context only around children — never insert toast DOM as a sibling of the
  // RSC `{children}` slot (Next streaming markers like <script id="_R_"> live
  // there and cause hydration mismatches).
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastLayer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastLayer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const hydrated = useHydrated();

  if (!hydrated) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[300] flex flex-col items-end gap-2 p-4 pt-[max(1rem,env(safe-area-inset-top))] md:p-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const toneClass =
    toast.tone === "error"
      ? "border-[var(--md-sys-color-error)]/25 bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]"
      : toast.tone === "success"
        ? "border-emerald-500/20 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-950/80 dark:text-emerald-100"
        : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]";

  const iconName =
    toast.tone === "error" ? "error" : toast.tone === "success" ? "check_circle" : "info";

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-[var(--md-sys-elevation-3)] ${toneClass}`}
      style={{ fontFamily: "var(--font-app-sans), var(--font-google-sans), var(--font-roboto), sans-serif" }}
    >
      <span
        className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] leading-none"
        aria-hidden
      >
        {iconName}
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium leading-5">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="ms-icon-button -mr-1 -mt-1 h-8 w-8 shrink-0 opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden>
          close
        </span>
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
