import { readFileSync } from "node:fs";
import { gscAiOverviewEvent, parseGscAiOverviewCsv } from "../src/lib/gsc-ai-overview";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: bun scripts/import-gsc-ai-overview.ts path/to/gsc-ai-export.csv");
  process.exit(1);
}

const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
if (!apiKey) {
  console.error("NEXT_PUBLIC_POSTHOG_KEY is missing.");
  process.exit(1);
}

const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") || "https://us.i.posthog.com";
const rows = parseGscAiOverviewCsv(readFileSync(csvPath, "utf8"));
if (rows.length === 0) {
  console.error("No rows in that CSV.");
  process.exit(1);
}

let sent = 0;
for (const row of rows) {
  const event = gscAiOverviewEvent(row);
  const response = await fetch(`${host}/i/v0/e/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      event: event.event,
      distinct_id: event.distinctId,
      timestamp: event.timestamp,
      properties: {
        $insert_id: event.insertId,
        ...event.properties,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`PostHog ${response.status}: ${await response.text()}`);
  }
  sent += 1;
}

console.log(`Imported ${sent} Search Console AI Overview rows into PostHog.`);
