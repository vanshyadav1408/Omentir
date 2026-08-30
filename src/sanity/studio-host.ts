export const SANITY_STUDIO_HOST = "sanity.omentir.com";
export const SANITY_STUDIO_ORIGIN = `https://${SANITY_STUDIO_HOST}`;

type HeaderReader = {
  get(name: string): string | null;
};

export function hostnameFromHostHeader(hostHeader: string | null | undefined) {
  if (!hostHeader) return "";
  const first = hostHeader.split(",")[0]?.trim() ?? "";
  return first.replace(/^\[|\]$/g, "").split(":")[0].toLowerCase();
}

export function isSanityStudioHost(hostname: string) {
  return hostnameFromHostHeader(hostname) === SANITY_STUDIO_HOST;
}

function hostnamesFromForwarded(value: string | null) {
  if (!value) return [];
  const hosts: string[] = [];
  for (const part of value.split(",")) {
    const match = /(?:^|;)\s*host=([^;]+)/i.exec(part.trim());
    if (!match) continue;
    hosts.push(hostnameFromHostHeader(match[1]!.replace(/^"|"$/g, "")));
  }
  return hosts.filter(Boolean);
}

export function hostnamesFromHeaders(headers: HeaderReader) {
  const hosts: string[] = [];
  const add = (value: string | null) => {
    if (!value) return;
    for (const part of value.split(",")) {
      const host = hostnameFromHostHeader(part);
      if (host) hosts.push(host);
    }
  };
  add(headers.get("x-omentir-studio-host"));
  add(headers.get("x-forwarded-host"));
  add(headers.get("x-original-host"));
  add(headers.get("host"));
  hosts.push(...hostnamesFromForwarded(headers.get("forwarded")));
  return hosts;
}

export function isSanityStudioRequest(headers: HeaderReader, hostname = "") {
  if (headers.get("x-omentir-studio") === "1") return true;
  if (isSanityStudioHost(hostname)) return true;
  return hostnamesFromHeaders(headers).some(isSanityStudioHost);
}

export function isStudioAppPath(pathname: string) {
  return pathname === "/studio" || pathname.startsWith("/studio/");
}

export function studioBasePathForHost(_hostname?: string) {
  return "/studio";
}

export function studioPathFromPublicPath(pathname: string) {
  if (pathname === "/") return "/studio";
  if (pathname.startsWith("/studio")) return pathname;
  return `/studio${pathname}`;
}

/** Runs in <head> so sanity.omentir.com never paints the marketing homepage. */
export function studioHostRedirectScript() {
  const host = JSON.stringify(SANITY_STUDIO_HOST);
  return `(function(){if(location.hostname!==${host})return;var p=location.pathname;if(p==="/studio"||p.indexOf("/studio/")===0||p.indexOf("/_next")===0||p.indexOf("/api")===0)return;location.replace((p==="/"?"/studio":"/studio"+p)+location.search+location.hash);})();`;
}
