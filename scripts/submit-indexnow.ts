import sitemap from "../src/app/sitemap";
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  indexNowHost,
  indexNowKeyLocation,
} from "../src/lib/indexnow";

// Search engines should only be pinged for canonical HTML. Machine indexes
// and the agents.md guide are not Bing search results.
function htmlSitemapUrls() {
  return sitemap()
    .map((entry) => entry.url)
    .filter((url) => {
      const path = new URL(url).pathname;
      return !path.endsWith(".md") && !path.endsWith(".txt") && !path.endsWith(".json");
    });
}

const urls = htmlSitemapUrls();
if (urls.length === 0) {
  console.error("IndexNow: sitemap produced no HTML URLs.");
  process.exit(1);
}

const response = await fetch(INDEXNOW_ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: indexNowHost(),
    key: INDEXNOW_KEY,
    keyLocation: indexNowKeyLocation(),
    urlList: urls,
  }),
});

const body = await response.text();
if (!response.ok) {
  console.error(
    `IndexNow rejected the batch (${response.status}). Deploy the key file at ${indexNowKeyLocation()} first.\n${body}`
  );
  process.exit(1);
}

console.log(`IndexNow accepted ${urls.length} HTML URLs (${response.status}).`);
