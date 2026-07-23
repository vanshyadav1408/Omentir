/**
 * Same-origin relative path for post-login redirects.
 * Rejects protocol-relative (//evil.com), backslash tricks, and absolute URLs.
 */
export function safeReturnPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  if (/^\/[^/]*:/.test(trimmed)) return fallback;
  // Disallow control characters and encoded slashes that can reintroduce // after decode.
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return fallback;
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded.startsWith("//") || decoded.includes("\\") || /^\/[^/]*:/.test(decoded)) {
      return fallback;
    }
  } catch {
    return fallback;
  }
  return trimmed;
}
