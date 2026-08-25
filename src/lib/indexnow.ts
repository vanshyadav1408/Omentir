import { siteUrl } from "@/app/seo";

// Public by design: Bing fetches this file to prove the submitter owns the host.
// Hex + dashes, 32 chars, stable across deploys so queued URLs keep validating.
export const INDEXNOW_KEY = "8f3c1a9e6b24d0c75e18a4f2b9d63c07";
// IndexNow checks https://{host}/{key}.txt. A made-up name like
// /indexnow-key.txt is accepted on POST and then discarded when Bing
// cannot fetch the spec path. Keep the old alias so existing pings still verify.
export const INDEXNOW_KEY_PATH = `/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_KEY_ALIAS_PATH = "/indexnow-key.txt";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const BING_INDEXNOW_ENDPOINT = "https://www.bing.com/indexnow";

export function indexNowKeyLocation() {
  return `${siteUrl}${INDEXNOW_KEY_PATH}`;
}

export function indexNowHost() {
  return new URL(siteUrl).host;
}
