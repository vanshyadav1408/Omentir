"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ASK_AI_LINKS, AskAiIcon } from "./ask-ai-menu";
import { useTheme, type ThemePreference } from "./theme-provider";

const NAV_LINKS = [
  { href: "/for-agents", label: "For Agents" },
  { href: "/mcp-server", label: "Connector / MCP Server" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blogs", label: "Blogs" },
] as const;

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; icon: string }> = [
  { value: "light", label: "Light", icon: "light_mode" },
  { value: "dark", label: "Dark", icon: "dark_mode" },
  { value: "system", label: "System", icon: "contrast" },
];

/** 48×48 touch target; constant string → identical SSR and client HTML. */
const MENU_TRIGGER_CLASS =
  "grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full text-[var(--md-sys-color-on-surface)] transition-colors hover:bg-[var(--md-sys-state-hover)]";

const CLOSE_BUTTON_CLASS =
  "grid h-12 w-12 shrink-0 cursor-pointer place-items-center text-[var(--md-sys-color-on-surface)]";

/**
 * Full-screen mobile menu sheet. Mounted only after open (post-interaction),
 * so Clerk session / theme preference never participate in SSR hydration.
 */
function MobileMenuSheet({
  onClose,
}: {
  onClose: () => void;
}) {
  const { preference, setPreference } = useTheme();
  const { isSignedIn } = useUser();
  const [portalReady, setPortalReady] = useState(false);
  const [askAiOpen, setAskAiOpen] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("marketing-menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      document.documentElement.classList.remove("marketing-menu-open");
    };
  }, [onClose]);

  if (!portalReady) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[var(--md-sys-color-surface)]"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div className="relative z-[210] flex h-16 shrink-0 items-center justify-end px-4">
        <button type="button" aria-label="Close menu" onClick={onClose} className={CLOSE_BUTTON_CLASS}>
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
        <nav className="flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              onClick={onClose}
              className="flex min-h-14 w-full items-center rounded-2xl px-4 py-4 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] transition hover:bg-[var(--md-sys-state-hover)]"
            >
              {link.label}
            </Link>
          ))}

          <button
            type="button"
            aria-expanded={askAiOpen}
            onClick={() => setAskAiOpen((v) => !v)}
            className="flex min-h-14 w-full cursor-pointer items-center justify-between rounded-2xl px-4 py-4 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] transition hover:bg-[var(--md-sys-state-hover)]"
          >
            Ask AI
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`transition-transform duration-200 ${askAiOpen ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {askAiOpen ? (
            <div className="flex flex-col gap-1 pl-3">
              {ASK_AI_LINKS.map((bot) => (
                <a
                  key={bot.name}
                  href={bot.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  aria-label={`Ask ${bot.name} about Omentir`}
                  className="flex min-h-12 items-center gap-1.5 rounded-2xl px-4 text-base font-medium text-[var(--md-sys-color-on-surface-variant)] transition hover:bg-[var(--md-sys-state-hover)]"
                >
                  Ask
                  <span className="flex items-center gap-1">
                    <AskAiIcon bot={bot} gradientId="askai-gemini-mobile" />
                    {bot.name}
                  </span>
                  about Omentir
                </a>
              ))}
            </div>
          ) : null}
        </nav>

        <div className="mt-8 border-t border-[var(--md-sys-color-outline-variant)] pt-6">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)]">
            Appearance
          </p>
          <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Color theme">
            {THEME_OPTIONS.map((option) => {
              const active = preference === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPreference(option.value)}
                  className={`flex min-h-16 flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3.5 text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                      : "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-state-hover)]"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[26px] leading-none ${active ? "ms-filled" : ""}`}
                    aria-hidden="true"
                  >
                    {option.icon}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto flex w-full flex-col gap-3 pt-10">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              onClick={onClose}
              className="m3-btn m3-btn-filled-secondary h-14 w-full text-base font-semibold"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                className="m3-btn m3-btn-outlined h-14 w-full text-base font-semibold"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="m3-btn m3-btn-filled-secondary h-14 w-full text-base font-semibold"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Mobile-only hamburger. Trigger markup is static so SSR HTML always matches
 * the first client paint. The sheet mounts only after the user opens it.
 */
export function MarketingMobileMenuButton() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={MENU_TRIGGER_CLASS}
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open ? <MobileMenuSheet onClose={close} /> : null}
    </div>
  );
}
