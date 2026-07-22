/**
 * Theme storage keys shared by ThemeProvider (client) and RootLayout (server).
 * Preference lives in localStorage + cookie; resolved theme in a cookie so the
 * server can paint the correct class without a blocking <script> (React 19).
 */
export const THEME_STORAGE_KEY = "omentir-theme";
export const THEME_RESOLVED_COOKIE = "omentir-theme-resolved";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Client-only: persist preference + resolved theme for the next SSR paint. */
export function writeThemeCookies(
  preference: ThemePreference,
  resolved: ResolvedTheme,
) {
  if (typeof document === "undefined") return;
  const base = `path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`;
  document.cookie = `${THEME_STORAGE_KEY}=${encodeURIComponent(preference)};${base}`;
  document.cookie = `${THEME_RESOLVED_COOKIE}=${encodeURIComponent(resolved)};${base}`;
}

/**
 * Server: resolve dark/light from cookies. Default dark (app-wide default).
 * Prefers the explicit resolved cookie (accurate for "system"); falls back to preference.
 */
export function resolveThemeFromCookies(input: {
  preference?: string;
  resolved?: string;
}): ResolvedTheme {
  const resolved = input.resolved;
  if (resolved === "light" || resolved === "dark") return resolved;

  const preference = input.preference;
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  // system / missing → default dark (matches historic FOUC bootstrap)
  return "dark";
}
