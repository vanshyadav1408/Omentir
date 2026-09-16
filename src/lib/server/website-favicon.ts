import "server-only";

import {
  faviconFallbackUrl,
  looksLikeImageContentType,
  parseFaviconCandidates,
} from "@/lib/website-favicon";
import { fetchPublicUrl, fetchWebsiteDocument } from "./website";

const FAVICON_FETCH_TIMEOUT_MS = 4000;
const MAX_CANDIDATES_TO_PROBE = 4;

export async function resolveWebsiteFavicon(websiteUrl: string) {
  const trimmed = websiteUrl.trim();
  if (!trimmed) return null;

  const page = await fetchWebsiteDocument(trimmed, FAVICON_FETCH_TIMEOUT_MS);
  const pageUrl = page?.url || (/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  const html = page?.status && page.status >= 200 && page.status < 300 ? page.text : "";
  const candidates = html ? parseFaviconCandidates(html, pageUrl) : [];

  if (!candidates.length) {
    try {
      candidates.push(new URL("/favicon.ico", pageUrl).toString());
    } catch {
      // Invalid website URL: fall through to the public icon service.
    }
  }

  for (const candidate of candidates.slice(0, MAX_CANDIDATES_TO_PROBE)) {
    const response = await fetchPublicUrl(candidate, FAVICON_FETCH_TIMEOUT_MS);
    if (!response || response.status < 200 || response.status >= 300) continue;
    if (!looksLikeImageContentType(response.contentType, response.url)) continue;
    return response.url;
  }

  return faviconFallbackUrl(trimmed);
}
