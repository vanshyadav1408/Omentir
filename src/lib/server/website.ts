import "server-only";

import { lookup } from "node:dns/promises";
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

async function assertPublicDestination(url: URL) {
  validatePublicWebsiteUrl(url);
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateOrReservedIp(address))) {
    throw new Error("Private network addresses are not supported.");
  }
}

async function fetchPublicWebsite(url: URL, timeoutMs = PAGE_TIMEOUT_MS) {
  let current = url;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await assertPublicDestination(current);
    const response = await fetch(current, {
      headers: {
        accept: "text/html, text/plain;q=0.9, */*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "user-agent":
          "Mozilla/5.0 (compatible; Omentir/1.0; +https://omentir.com)",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status < 300 || response.status >= 400) return response;
    const location = response.headers.get("location");
    if (!location || redirects === MAX_REDIRECTS) {
      throw new Error("Website redirected too many times.");
    }
    current = new URL(location, current);
  }

  throw new Error("Website redirected too many times.");
}

async function readLimitedText(response: Response) {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";

  while (true) {
    let result: ReadableStreamReadResult<Uint8Array>;
    try {
      result = await reader.read();
    } catch (error) {
      if (text) return text + decoder.decode();
      throw error;
    }

    const { done, value } = result;
    if (done) return text + decoder.decode();
    const remaining = MAX_PAGE_BYTES - bytes;
    if (value.byteLength > remaining) {
      text += decoder.decode(value.subarray(0, remaining), { stream: true });
      await reader.cancel();
      return text + decoder.decode();
    }
    bytes += value.byteLength;
    text += decoder.decode(value, { stream: true });
  }
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

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return null;
    }

    const text = stripHtml(await readLimitedText(response));
    return text.length > 100 ? { url: url.toString(), text } : null;
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
    await assertPublicDestination(base);
    return base;
  } catch {
    const variant = wwwVariant(base);
    try {
      await assertPublicDestination(variant);
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
