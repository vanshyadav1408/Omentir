export const SANITY_STUDIO_HOST = "sanity.omentir.com";
export const SANITY_STUDIO_ORIGIN = `https://${SANITY_STUDIO_HOST}`;

export function hostnameFromHostHeader(hostHeader: string | null | undefined) {
  return (hostHeader || "").split(":")[0].toLowerCase();
}

export function isSanityStudioHost(hostname: string) {
  return hostname === SANITY_STUDIO_HOST;
}

export function isStudioAppPath(pathname: string) {
  return pathname === "/studio" || pathname.startsWith("/studio/");
}

export function studioBasePathForHost(hostname: string) {
  return isSanityStudioHost(hostname) ? "/" : "/studio";
}

export function studioPathFromPublicPath(pathname: string) {
  if (pathname === "/") return "/studio";
  if (pathname.startsWith("/studio")) return pathname;
  return `/studio${pathname}`;
}
