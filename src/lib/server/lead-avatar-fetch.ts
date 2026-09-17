import "server-only";

import { lookup } from "node:dns/promises";
import { isLinkedInMediaUrl } from "@/lib/lead-avatar";
import { isPrivateOrReservedIp, validatePublicWebsiteUrl } from "./website-url-safety";

const MAX_BYTES = 1024 * 1024;
const TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 3;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const IMAGE_MAGIC: Array<{ bytes: number[]; type: string }> = [
  { bytes: [0xff, 0xd8, 0xff], type: "image/jpeg" },
  { bytes: [0x89, 0x50, 0x4e, 0x47], type: "image/png" },
  { bytes: [0x47, 0x49, 0x46, 0x38], type: "image/gif" },
  { bytes: [0x52, 0x49, 0x46, 0x46], type: "image/webp" },
];

export type FetchedLeadAvatar = {
  body: Buffer;
  contentType: string;
};

function sniffImageType(body: Buffer, contentType: string) {
  const type = contentType.split(";")[0]?.trim().toLowerCase() || "";
  if (type.startsWith("image/") && type !== "image/svg+xml") return type;
  for (const magic of IMAGE_MAGIC) {
    if (magic.bytes.every((byte, index) => body[index] === byte)) return magic.type;
  }
  if (body.subarray(4, 8).toString("ascii") === "ftyp") return "image/avif";
  return null;
}

async function assertPublicLinkedInMedia(url: URL) {
  validatePublicWebsiteUrl(url);
  if (url.protocol !== "https:" || !isLinkedInMediaUrl(url.toString())) {
    throw new Error("Only LinkedIn media URLs can be proxied.");
  }
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateOrReservedIp(address))) {
    throw new Error("Private network addresses are not supported.");
  }
}

async function readLimitedBody(response: Response) {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_BYTES) return null;
  const reader = response.body?.getReader();
  if (!reader) return Buffer.alloc(0);

  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

async function requestAvatar(url: URL, referrer?: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "user-agent": BROWSER_UA,
        ...(referrer ? { referer: referrer } : {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchLeadAvatarBytes(rawUrl: string): Promise<FetchedLeadAvatar | null> {
  let current: URL;
  try {
    current = new URL(rawUrl);
    await assertPublicLinkedInMedia(current);
  } catch {
    return null;
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    let response: Response;
    try {
      response = await requestAvatar(current);
      if (response.status === 401 || response.status === 403) {
        response = await requestAvatar(current, "https://www.linkedin.com/");
      }
    } catch {
      return null;
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || hop === MAX_REDIRECTS) return null;
      try {
        current = new URL(location, current);
        await assertPublicLinkedInMedia(current);
      } catch {
        return null;
      }
      continue;
    }

    if (response.status < 200 || response.status >= 300) return null;
    const body = await readLimitedBody(response);
    if (!body?.byteLength) return null;
    const contentType = sniffImageType(body, response.headers.get("content-type") || "");
    if (!contentType) return null;
    return { body, contentType };
  }

  return null;
}
