import "server-only";

// Runs HogQL against PostHog's query API with the personal API key. The key
// never leaves the server; stats.omentir.com only ever sees the rows.

export type StatsPropertyFilter = { key: string; value: string };

export type HogQLResult = { columns: string[]; results: unknown[][] };

const DEFAULT_HOST = "https://us.posthog.com";
const DEFAULT_PROJECT_ID = "430453";

export function statsBackendConfigured() {
  return Boolean(process.env.POSTHOG_PERSONAL_API_KEY);
}

// The page asks for ~15 queries at once. Past a few concurrent queries PostHog
// answers 429 and the retries back off for seconds, so queue them here instead.
const MAX_CONCURRENT = 3;
let running = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  else running++;
  try {
    return await task();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else running--;
  }
}

export function runHogQL(
  query: string,
  range: { from: Date; to: Date },
  filters: StatsPropertyFilter[] = [],
): Promise<HogQLResult> {
  return withSlot(() => queryPostHog(query, range, filters));
}

async function queryPostHog(
  query: string,
  range: { from: Date; to: Date },
  filters: StatsPropertyFilter[] = [],
): Promise<HogQLResult> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) throw new Error("POSTHOG_PERSONAL_API_KEY is not set.");
  const host = (process.env.POSTHOG_API_HOST || DEFAULT_HOST).replace(/\/$/, "");
  const project = process.env.POSTHOG_PROJECT_ID || DEFAULT_PROJECT_ID;

  const request = JSON.stringify({
    query: {
      kind: "HogQLQuery",
      query,
      filters: {
        dateRange: {
          date_from: range.from.toISOString(),
          date_to: range.to.toISOString(),
          explicitDate: true,
        },
        properties: filters.map((filter) => ({
          type: "event",
          key: filter.key,
          operator: "exact",
          value: [filter.value],
        })),
      },
    },
  });

  // PostHog answers 429 (concurrency_limit_exceeded) when too many queries run
  // at once, and the occasional 5xx; both clear up after a short wait.
  let response: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    response = await fetch(`${host}/api/projects/${project}/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(90_000),
      body: request,
    });
    if (response.status !== 429 && response.status < 500) break;
  }

  if (!response || !response.ok) {
    const detail = response ? await response.text().catch(() => "") : "";
    throw new Error(`PostHog query failed (${response?.status ?? "no response"}): ${detail.slice(0, 300)}`);
  }
  const body = (await response.json()) as Partial<HogQLResult>;
  return { columns: body.columns ?? [], results: body.results ?? [] };
}
