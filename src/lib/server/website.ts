import "server-only";

import { lookup } from "node:dns/promises";
import { request as httpRequest, type IncomingHttpHeaders } from "node:http";
import { request as httpsRequest } from "node:https";
import { isPrivateOrReservedIp, validatePublicWebsiteUrl } from "./website-url-safety";

export class WebsiteUnreachableError extends Error {}

const CANDIDATE_PATHS = ["/", "/product", "/pricing", "/about", "/use-cases"];
const MAX_REDIRECTS = 3;
const MAX_PAGE_BYTES = 512 * 1024;
const AI_CONTENT_TIMEOUT_MS = 3000;
const PAGE_TIMEOUT_MS = 8000;

function normalizeUrl(url: string) {
  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const parsed = new URL(withProtocol);
  validatePublicWebsiteUrl(parsed);
  return parsed;
}

async function publicAddresses(url: URL) {
  validatePublicWebsiteUrl(url);
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateOrReservedIp(address))) {
    throw new Error("Private network addresses are not supported.");
  }
  return addresses;
}

type PublicResponse = {
  status: number;
  headers: IncomingHttpHeaders;
  text: string;
};

async function requestPublicWebsite(url: URL, timeoutMs: number): Promise<PublicResponse> {
  const addresses = await publicAddresses(url);
  const selected = addresses.find(({ family }) => family === 4) || addresses[0];
  const request = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (result: PublicResponse) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const outgoing = request(
      url,
      {
        headers: {
          accept: "text/html, text/plain;q=0.9, */*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
          "user-agent": "Mozilla/5.0 (compatible; Omentir/1.0; +https://omentir.com)",
        },
        // Connect to the address that was actually checked. Keeping the URL
        // hostname preserves Host and TLS certificate verification while
        // closing the DNS-rebinding gap between validation and connection.
        lookup: (_hostname, _options, callback) => {
          callback(null, selected.address, selected.family);
        },
      },
      (response) => {
        const status = response.statusCode || 0;
        if (status >= 300 && status < 400) {
          response.resume();
          finish({ status, headers: response.headers, text: "" });
          return;
        }

        const chunks: Buffer[] = [];
        let bytes = 0;
        response.on("data", (chunk: Buffer) => {
          if (settled) return;
          const remaining = MAX_PAGE_BYTES - bytes;
          if (chunk.byteLength >= remaining) {
            if (remaining > 0) chunks.push(chunk.subarray(0, remaining));
            response.destroy();
            finish({ status, headers: response.headers, text: Buffer.concat(chunks).toString("utf8") });
            return;
          }
          bytes += chunk.byteLength;
          chunks.push(chunk);
        });
        response.on("end", () => {
          finish({ status, headers: response.headers, text: Buffer.concat(chunks).toString("utf8") });
        });
        response.on("error", (error) => {
          if (!settled) reject(error);
        });
      },
    );
    outgoing.setTimeout(timeoutMs, () => outgoing.destroy(new Error("Website request timed out.")));
    outgoing.on("error", (error) => {
      if (!settled) reject(error);
    });
    outgoing.end();
  });
}

async function fetchPublicWebsite(url: URL, timeoutMs = PAGE_TIMEOUT_MS) {
  let current = url;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await requestPublicWebsite(current, timeoutMs);

    if (response.status < 300 || response.status >= 400) return { ...response, url: current };
    const rawLocation = response.headers.location;
    const location = Array.isArray(rawLocation) ? rawLocation[0] : rawLocation;
    if (!location || redirects === MAX_REDIRECTS) {
      throw new Error("Website redirected too many times.");
    }
    current = new URL(location, current);
  }

  throw new Error("Website redirected too many times.");
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWebsitePage(url: URL, timeoutMs?: number) {
  try {
    const response = await fetchPublicWebsite(url, timeoutMs);

    if (response.status < 200 || response.status >= 300) return null;
    const rawContentType = response.headers["content-type"];
    const contentType = Array.isArray(rawContentType) ? rawContentType[0] || "" : rawContentType || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return null;
    }

    const text = stripHtml(response.text);
    return text.length > 100 ? { url: response.url.toString(), text } : null;
  } catch {
    return null;
  }
}

function wwwVariant(url: URL) {
  const variant = new URL(url.toString());
  variant.hostname = url.hostname.startsWith("www.")
    ? url.hostname.slice(4)
    : `www.${url.hostname}`;
  return variant;
}

async function resolvePublicBase(base: URL) {
  try {
    await publicAddresses(base);
    return base;
  } catch {
    const variant = wwwVariant(base);
    try {
      await publicAddresses(variant);
      return variant;
    } catch {
      throw new Error(
        "We couldn't find this website. Double-check the address and try again.",
      );
    }
  }
}

export async function fetchWebsitePages(websiteUrl: string) {
  const base = await resolvePublicBase(normalizeUrl(websiteUrl));
  const aiContent = await fetchWebsitePage(
    new URL("/llms.txt", base.origin),
    AI_CONTENT_TIMEOUT_MS,
  );
  if (aiContent) return [aiContent];

  const candidates = await Promise.all(
    CANDIDATE_PATHS.map((path) => fetchWebsitePage(new URL(path, base.origin))),
  );
  const pages = candidates.filter((page) => page !== null);

  if (!pages.length) {
    throw new WebsiteUnreachableError("Could not read enough text from this website.");
  }

  return pages;
}
