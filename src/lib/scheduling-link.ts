const SCHEDULING_HOSTS = ["cal.com", "calendly.com"];

export function normalizeSchedulingLink(value: string) {
  const raw = value.trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    const supportedHost = SCHEDULING_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
    if (url.protocol !== "https:" || !supportedHost) return null;
    return url.toString();
  } catch {
    return null;
  }
}
