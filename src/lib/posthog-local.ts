// Local dev sessions must never reach PostHog: they inflate visitor,
// session, and retention numbers on every dashboard.
export function isLocalDevHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1" || host === "[::1]";
}
