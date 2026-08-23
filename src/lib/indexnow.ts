import { siteUrl } from "@/app/seo";

// Public by design: Bing fetches this file to prove the submitter owns the host.
// Hex + dashes, 32 chars, stable across deploys so queued URLs keep validating.
export const INDEXNOW_KEY = "8f3c1a9e6b24d0c75e18a4f2b9d63c07";
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export function indexNowKeyLocation() {
  return `${siteUrl}${INDEXNOW_KEY_PATH}`;
}

export function indexNowHost() {
  return new URL(siteUrl).host;
}
