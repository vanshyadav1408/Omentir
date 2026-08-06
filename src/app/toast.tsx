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

export type ToastTone = "error" | "success" | "info" | "agent";

type ToastItem = {
  id: string;
  message: string;
  title?: string;
  tone: ToastTone;
  /** Auto-dismiss delay. Defaults by tone. */
  durationMs?: number;
};

export type AgentStartedKind =
  | "leads_only"
  | "outreach_only"
  | "steal_customers"
  | "full"
  | "resume";

type ToastContextValue = {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
  showToast: (message: string, tone?: ToastTone) => void;
  /** Top-right card when an agent is launched or resumed. Fades out in ~4s. */
  showAgentStarted: (agentName?: string, kind?: AgentStartedKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5600;
const AGENT_STARTED_DISMISS_MS = 3800;
export const AGENT_STARTED_STORAGE_KEY = "omentir:agent-started";

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

function toastId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((item: Omit<ToastItem, "id">) => {
    const text = item.message.trim();
    if (!text && !item.title?.trim()) return;
    setToasts((current) => [
      ...current.slice(-4),
      { ...item, id: toastId(), message: text || item.title || "" },
    ]);
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "error") => {
      pushToast({ message, tone });
    },
    [pushToast],
  );

  const showAgentStarted = useCallback(
    (agentName?: string, kind: AgentStartedKind = "full") => {
      const label = agentName?.trim() || "Your agent";
      const detail =
        kind === "leads_only"
          ? "Discovery will continue in the background."
          : kind === "outreach_only"
            ? "Outreach will continue in the background."
            : kind === "steal_customers"
              ? "Competitor comment discovery and outreach will continue in the background."
              : kind === "resume"
                ? "It is active again and will keep working in the background."
                : "Discovery and outreach will continue in the background.";
      pushToast({
        tone: "agent",
        title: kind === "resume" ? "Agent resumed" : "Agent started",
        message: `${label} is running. ${detail}`,
        durationMs: AGENT_STARTED_DISMISS_MS,
      });
    },
    [pushToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      showError: (message: string) => showToast(message, "error"),
      showSuccess: (message: string) => showToast(message, "success"),
      showInfo: (message: string) => showToast(message, "info"),
      showAgentStarted,
    }),
    [showToast, showAgentStarted],
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

  const agentToasts = toasts.filter((toast) => toast.tone === "agent");
  const otherToasts = toasts.filter((toast) => toast.tone !== "agent");

  return createPortal(
    <>
      {/* Top-right: errors/success/info always; agent cards only from md up. */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[300] flex flex-col items-end gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4 md:p-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {otherToasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
        {agentToasts.map((toast) => (
          <div key={toast.id} className="hidden md:block">
            <ToastCard toast={toast} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
      {/* Mobile: agent-started card sits bottom-center (laptop unchanged above). */}
      {agentToasts.length ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[300] flex flex-col items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
          aria-live="polite"
          aria-relevant="additions"
        >
          {agentToasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} mobileBottom />
          ))}
        </div>
      ) : null}
    </>,
    document.body,
  );
}

function ToastCard({
  toast,
  onDismiss,
  mobileBottom = false,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  /** Mobile agent toast: bottom-center enter/exit; desktop keeps top-right. */
  mobileBottom?: boolean;
}) {
  const durationMs =
    toast.durationMs ??
    (toast.tone === "agent" ? AGENT_STARTED_DISMISS_MS : AUTO_DISMISS_MS);

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), durationMs);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss, durationMs]);

  if (toast.tone === "agent") {
    return (
      <div
        role="status"
        className="pointer-events-auto w-[min(calc(100vw-2rem),18rem)] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.12)] bg-[var(--md-sys-color-surface-container-high,var(--google-surface,#1e1f20))] shadow-[0_12px_32px_rgba(0,0,0,0.32)] sm:w-[min(100%,20rem)] sm:rounded-2xl"
        style={{
          fontFamily: "var(--font-app-sans), var(--font-google-sans), var(--font-roboto), sans-serif",
          animation: `${mobileBottom ? "omentir-toast-agent-mobile" : "omentir-toast-agent"} ${durationMs}ms ease forwards`,
          color: "#ffffff",
        }}
      >
        <div className="flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <span
            className="grid h-7 w-7 shrink-0 place-items-center sm:h-8 sm:w-8"
            style={{ color: "#ffffff" }}
            aria-hidden
          >
            {/* Quiet check — pure white via style so dark theme remaps cannot wash it. */}
            <span
              className="material-symbols-outlined text-[20px]! font-light leading-none sm:text-[22px]!"
              style={{ color: "#ffffff" }}
            >
              check_circle
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p
              style={{ fontFamily: "var(--font-varta)", color: "#ffffff" }}
              className="text-[13px] font-semibold leading-4 sm:text-[14px] sm:leading-5"
            >
              {toast.title || "Agent started"}
            </p>
            <p
              className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-4 sm:text-[12px] sm:leading-[1.35]"
              style={{ color: "rgba(255,255,255,0.88)" }}
            >
              {toast.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="min-w-0 flex-1">
        {toast.title ? (
          <p className="text-sm font-semibold leading-5">{toast.title}</p>
        ) : null}
        <p className={`text-sm font-medium leading-5 ${toast.title ? "mt-0.5 opacity-90" : ""}`}>
          {toast.message}
        </p>
      </div>
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

/** Persist a one-shot "agent started" notice across launch redirects. */
export function markAgentStartedNotice(
  agentName?: string,
  kind: AgentStartedKind = "full",
) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      AGENT_STARTED_STORAGE_KEY,
      JSON.stringify({
        name: agentName?.trim() || "",
        kind,
        at: Date.now(),
      }),
    );
  } catch {
    // sessionStorage can throw in private mode; toast on the next page is optional.
  }
}

export function consumeAgentStartedNotice(): {
  name: string;
  kind: AgentStartedKind;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(AGENT_STARTED_STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(AGENT_STARTED_STORAGE_KEY);
    const data = JSON.parse(raw) as {
      name?: string;
      kind?: AgentStartedKind;
      at?: number;
    };
    if (!data.at || Date.now() - data.at > 45_000) return null;
    const kind = data.kind || "full";
    return {
      name: data.name?.trim() || "",
      kind:
        kind === "leads_only" ||
        kind === "outreach_only" ||
        kind === "steal_customers" ||
        kind === "resume" ||
        kind === "full"
          ? kind
          : "full",
    };
  } catch {
    return null;
  }
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
