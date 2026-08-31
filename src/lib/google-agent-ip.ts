import { ipInCidrs } from "./cidr";

const GOOGLE_AGENT_IP_URL =
  "https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers-google.json";

type PrefixFile = {
  prefixes?: Array<{ ipv4Prefix?: string; ipv6Prefix?: string }>;
};

let cachedCidrs: string[] | null = null;
let cachedAt = 0;
const CACHE_MS = 24 * 60 * 60 * 1000;

export function parseGoogleAgentPrefixFile(payload: PrefixFile): string[] {
  const cidrs: string[] = [];
  for (const row of payload.prefixes || []) {
    if (row.ipv4Prefix) cidrs.push(row.ipv4Prefix);
    if (row.ipv6Prefix) cidrs.push(row.ipv6Prefix);
  }
  return cidrs;
}

export async function loadGoogleAgentCidrs(): Promise<string[]> {
  if (cachedCidrs && Date.now() - cachedAt < CACHE_MS) return cachedCidrs;
  try {
    const response = await fetch(GOOGLE_AGENT_IP_URL, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return cachedCidrs || [];
    const cidrs = parseGoogleAgentPrefixFile((await response.json()) as PrefixFile);
    if (cidrs.length > 0) {
      cachedCidrs = cidrs;
      cachedAt = Date.now();
    }
    return cidrs;
  } catch {
    return cachedCidrs || [];
  }
}

export function isGoogleAgentIp(ip: string, cidrs: readonly string[]): boolean {
  return ipInCidrs(ip, cidrs);
}
