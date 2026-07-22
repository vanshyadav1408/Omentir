import { isIP } from "node:net";

export function isPrivateOrReservedIp(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];

  if (isIP(normalized) === 4) {
    const [a, b, c] = normalized.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }

  if (isIP(normalized) === 6) {
    if (normalized === "::" || normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (/^fe[89ab]/.test(normalized)) return true;
    if (normalized.startsWith("ff")) return true;
    const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    return mappedIpv4 ? isPrivateOrReservedIp(mappedIpv4) : false;
  }

  return true;
}

export function validatePublicWebsiteUrl(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS website URLs are supported.");
  }
  if (url.username || url.password) {
    throw new Error("Website URLs cannot contain credentials.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Private network addresses are not supported.");
  }
  if (isIP(hostname) && isPrivateOrReservedIp(hostname)) {
    throw new Error("Private network addresses are not supported.");
  }
}
