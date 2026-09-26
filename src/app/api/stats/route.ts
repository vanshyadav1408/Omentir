import { NextResponse, type NextRequest } from "next/server";
import {
  allowedIntervals,
  defaultInterval,
  isStatsInterval,
  isStatsPeriod,
  resolveStatsRange,
} from "@/lib/stats-periods";
import { STATS_REFRESH_MS, type StatsSection } from "@/lib/stats-types";
import { statsAccess } from "@/lib/server/stats/access";
import { statsBackendConfigured, type StatsPropertyFilter } from "@/lib/server/stats/posthog-query";
import { STATS_FILTER_KEYS } from "@/lib/server/stats/queries";
import { loadProductApp, loadProductOverview } from "@/lib/server/stats/product";
import { loadAi, loadBreakdown, loadGoals, loadOverview } from "@/lib/server/stats/sections";

export const dynamic = "force-dynamic";

const SECTIONS = new Set<StatsSection>(["overview", "sources", "pages", "location", "tech", "goals", "ai", "product", "product-app"]);
// Stats update every 5 minutes, on the clock (:00, :05, :10, ...). Results are
// cached per window; the page refetches when a new window starts. The refresh
// button (?fresh=1) is the only way to get newer numbers inside a window.
// A cold PostHog query can take 10s or more, so once a window has passed the
// last answer is sent right away (marked stale) while a new one is fetched.
const cache = new Map<string, { window: number; body: Record<string, unknown> }>();
const inFlight = new Map<string, Promise<Record<string, unknown>>>();

function refreshSection(key: string, load: () => Promise<unknown>, range: { from: Date; to: Date }, interval: string) {
  let pending = inFlight.get(key);
  if (!pending) {
    pending = load()
      .then((data) => {
        const body = {
          range: { from: range.from.toISOString(), to: range.to.toISOString() },
          interval,
          updatedAt: new Date().toISOString(),
          data,
        };
        cache.delete(key);
        cache.set(key, { window: Math.floor(Date.now() / STATS_REFRESH_MS), body });
        if (cache.size > 200) cache.delete(cache.keys().next().value as string);
        return body;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return pending;
}

function parseFilters(raw: string | null): StatsPropertyFilter[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((f): f is StatsPropertyFilter =>
        !!f && typeof f.key === "string" && typeof f.value === "string" && STATS_FILTER_KEYS.has(f.key))
      .slice(0, 10);
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const access = await statsAccess();
  if (access === "signed-out") return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (access !== "allowed") return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!statsBackendConfigured()) {
    return NextResponse.json({ error: "POSTHOG_PERSONAL_API_KEY is not set on this server." }, { status: 503 });
  }

  const params = request.nextUrl.searchParams;
  const section = params.get("section") as StatsSection;
  if (!SECTIONS.has(section)) return NextResponse.json({ error: "Unknown section." }, { status: 400 });
  const periodParam = params.get("period");
  const period = isStatsPeriod(periodParam) ? periodParam : "30d";
  const offset = Math.min(Math.max(Number(params.get("offset")) || 0, 0), 500);
  const window = Math.floor(Date.now() / STATS_REFRESH_MS);
  const range = resolveStatsRange(period, offset, window * STATS_REFRESH_MS);
  const requested = params.get("interval");
  const allowed = allowedIntervals(range.from, range.to);
  let interval = isStatsInterval(requested) && allowed.includes(requested) ? requested : defaultInterval(period);
  const product = section === "product" || section === "product-app";
  // Product numbers are daily counters, so the Product view has no hourly buckets.
  if (product && interval === "hour") interval = "day";
  const filters = product ? [] : parseFilters(params.get("filters"));

  const key = JSON.stringify([section, period, offset, interval, filters]);
  const load = () =>
    section === "product" ? loadProductOverview(range, interval)
    : section === "product-app" ? loadProductApp(range, interval)
    : section === "overview" ? loadOverview(range, interval, filters)
    : section === "goals" ? loadGoals(range, interval, filters)
    : section === "ai" ? loadAi(range, interval, filters)
    : loadBreakdown(section, range, filters);

  const hit = cache.get(key);
  if (hit && params.get("fresh") !== "1") {
    if (hit.window === Math.floor(Date.now() / STATS_REFRESH_MS)) return NextResponse.json(hit.body);
    refreshSection(key, load, range, interval).catch((error) => console.error("[stats] background refresh failed", section, error));
    return NextResponse.json({ ...hit.body, stale: true });
  }

  try {
    return NextResponse.json(await refreshSection(key, load, range, interval));
  } catch (error) {
    console.error("[stats] query failed", section, error);
    // Only the allowlisted owner reaches this point, so the real reason is safe to show.
    const reason = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Could not load this section. ${reason}` }, { status: 502 });
  }
}
