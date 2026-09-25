"use client";

import { useEffect, useSyncExternalStore } from "react";
import { SITE_THEME_STORAGE_KEY as STORAGE_KEY } from "./site-theme-script";

type Preference = "system" | "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readPreference(): Preference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function applyPreference(preference: Preference) {
  const resolved =
    preference === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : preference;
  document.documentElement.setAttribute("data-site-theme", resolved);
}

function setPreference(preference: Preference) {
  try {
    if (preference === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {}
  applyPreference(preference);
  listeners.forEach((listener) => listener());
}

const OPTIONS: Array<{ value: Preference; label: string; icon: React.ReactNode }> = [
  {
    value: "system",
    label: "System theme",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-3.5 w-3.5" aria-hidden="true">
        <rect x="1.75" y="2.5" width="12.5" height="8.5" rx="1.25" />
        <path d="M5.5 13.5h5M8 11v2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "light",
    label: "Light theme",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden="true">
        <circle cx="8" cy="8" r="2.75" />
        <path d="M8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark theme",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
        <path d="M13.25 9.6A5.5 5.5 0 0 1 6.4 2.75a5.5 5.5 0 1 0 6.85 6.85Z" />
      </svg>
    ),
  },
];

export default function SiteThemeToggle() {
  // null during SSR and hydration: no option is marked until the stored
  // preference can be read.
  const preference = useSyncExternalStore(subscribe, readPreference, () => null);

  // "System" has to track OS changes live, the way the head script resolves it once.
  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyPreference("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  return (
    <div className="site-theme-toggle" role="group" aria-label="Theme">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.label}
          title={option.label}
          aria-pressed={preference === option.value}
          onClick={() => setPreference(option.value)}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
