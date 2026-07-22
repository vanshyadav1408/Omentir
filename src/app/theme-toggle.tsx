"use client";

import { useTheme, type ThemePreference } from "./theme-provider";

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: string; hint: string }> = [
  { value: "light", label: "Light", icon: "light_mode", hint: "Warm light surfaces" },
  { value: "dark", label: "Dark", icon: "dark_mode", hint: "Material 3 tonal dark" },
  { value: "system", label: "System", icon: "contrast", hint: "Match device setting" },
];

/** Segmented control for Settings → Appearance. */
export function ThemePreferenceControl() {
  const { preference, setPreference } = useTheme();

  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color theme">
      {OPTIONS.map((option) => {
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.hint}
            onClick={() => setPreference(option.value)}
            className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 transition ${
              active
                ? "border-transparent bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-state-hover)]"
            }`}
          >
            <span
              className={`material-symbols-outlined ${active ? "ms-filled" : "text-[var(--md-sys-color-on-surface-variant)]"}`}
              style={{ fontSize: 20 }}
              aria-hidden="true"
            >
              {option.icon}
            </span>
            <span className={`text-sm font-medium ${active ? "" : "text-[var(--md-sys-color-on-surface)]"}`}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function useThemeCycle() {
  const { preference, resolved, setPreference } = useTheme();

  function cycle() {
    const order: ThemePreference[] = ["light", "dark", "system"];
    const idx = order.indexOf(preference);
    setPreference(order[(idx + 1) % order.length]);
  }

  const icon =
    preference === "system" ? "contrast" : resolved === "dark" ? "dark_mode" : "light_mode";
  const label =
    preference === "system" ? "System theme" : resolved === "dark" ? "Dark theme" : "Light theme";

  return { cycle, icon, label, preference, resolved };
}

/**
 * Compact icon cycle for the sidebar footer (light → dark → system).
 * ThemeProvider SSR/first paint is always preference "dark" / resolved "dark",
 * so icon + label match on server and client without a hydrated gate. Never
 * omit the label span based on mount state — that creates a DOM structure
 * mismatch (the exact hydration error seen in the mobile drawer footer).
 */
export function ThemeCycleButton({ collapsed = false }: { collapsed?: boolean }) {
  const { cycle, icon, label } = useThemeCycle();

  return (
    <button
      type="button"
      onClick={cycle}
      title={label}
      aria-label={`Theme: ${label}. Click to change.`}
      className={`flex min-h-12 w-full cursor-pointer items-center rounded-full py-2 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] transition hover:bg-[var(--md-sys-state-hover)] hover:text-[var(--md-sys-color-on-surface)] ${
        collapsed ? "justify-center gap-0 px-2" : "gap-3 px-3"
      }`}
    >
      <span className="material-symbols-outlined leading-none" aria-hidden="true">
        {icon}
      </span>
      {!collapsed ? <span className="translate-y-[1px]">{label}</span> : null}
    </button>
  );
}

/** 48×48 icon button for marketing header (same light → dark → system cycle). */
export function MarketingThemeButton() {
  const { cycle, icon, label } = useThemeCycle();

  return (
    <button
      type="button"
      onClick={cycle}
      title={label}
      aria-label={`Theme: ${label}. Click to change.`}
      className="ms-icon-button text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-state-hover)] hover:text-[var(--md-sys-color-on-surface)]"
    >
      <span className="material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
