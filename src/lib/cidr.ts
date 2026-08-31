export function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = (value << 8) + octet;
  }
  return value >>> 0;
}

function expandIpv6(ip: string): bigint | null {
  const trimmed = ip.trim().toLowerCase().split("%")[0] || "";
  if (!trimmed || trimmed.includes(".")) return null;
  const sides = trimmed.split("::");
  if (sides.length > 2) return null;
  const head = sides[0] ? sides[0].split(":") : [];
  const tail = sides.length === 2 && sides[1] ? sides[1].split(":") : [];
  if (head.includes("") || tail.includes("")) return null;
  const missing = 8 - head.length - tail.length;
  if (missing < 0) return null;
  if (sides.length === 1 && missing !== 0) return null;
  const groups = [...head, ...Array(Math.max(missing, 0)).fill("0"), ...tail];
  if (groups.length !== 8) return null;
  let value = 0n;
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
    value = (value << 16n) + BigInt(parseInt(group, 16));
  }
  return value;
}

export function cidrContains(ip: string, cidr: string): boolean {
  const slash = cidr.indexOf("/");
  if (slash === -1) return false;
  const network = cidr.slice(0, slash).trim();
  const bits = Number(cidr.slice(slash + 1));
  if (!Number.isInteger(bits) || bits < 0) return false;

  const ipv4 = ipv4ToInt(ip);
  if (ipv4 !== null) {
    const net = ipv4ToInt(network);
    if (net === null || bits > 32) return false;
    if (bits === 0) return true;
    const mask = bits === 32 ? 0xffffffff : (~((1 << (32 - bits)) - 1)) >>> 0;
    return (ipv4 & mask) === (net & mask);
  }

  const addr = expandIpv6(ip);
  const net6 = expandIpv6(network);
  if (addr === null || net6 === null || bits > 128) return false;
  if (bits === 0) return true;
  const mask = bits === 128 ? (1n << 128n) - 1n : ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - bits)) - 1n);
  return (addr & mask) === (net6 & mask);
}

export function ipInCidrs(ip: string, cidrs: readonly string[]): boolean {
  if (!ip) return false;
  return cidrs.some((cidr) => cidrContains(ip, cidr));
}
