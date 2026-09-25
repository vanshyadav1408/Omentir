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

export async function runHogQL(
  query: string,
  range: { from: Date; to: Date },
  filters: StatsPropertyFilter[] = [],
): Promise<HogQLResult> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) throw new Error("POSTHOG_PERSONAL_API_KEY is not set.");
  const host = (process.env.POSTHOG_API_HOST || DEFAULT_HOST).replace(/\/$/, "");
  const project = process.env.POSTHOG_PROJECT_ID || DEFAULT_PROJECT_ID;

  const response = await fetch(`${host}/api/projects/${project}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`PostHog query failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  const body = (await response.json()) as Partial<HogQLResult>;
  return { columns: body.columns ?? [], results: body.results ?? [] };
}
