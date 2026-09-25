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
import { loadAi, loadBreakdown, loadGoals, loadOverview } from "@/lib/server/stats/sections";

export const dynamic = "force-dynamic";

const SECTIONS = new Set<StatsSection>(["overview", "sources", "pages", "location", "tech", "goals", "ai"]);
// Stats update every 5 minutes, on the clock (:00, :05, :10, ...). Results are
// cached per window; the page refetches when a new window starts. The refresh
// button (?fresh=1) is the only way to get newer numbers inside a window.
const cache = new Map<string, { at: number; body: unknown }>();

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
  const range = resolveStatsRange(period, offset);
  const requested = params.get("interval");
  const allowed = allowedIntervals(range.from, range.to);
  const interval = isStatsInterval(requested) && allowed.includes(requested) ? requested : defaultInterval(period);
  const filters = parseFilters(params.get("filters"));

  const cacheWindow = Math.floor(Date.now() / STATS_REFRESH_MS);
  const key = JSON.stringify([section, period, offset, interval, filters, cacheWindow]);
  const hit = cache.get(key);
  if (hit && params.get("fresh") !== "1") return NextResponse.json(hit.body);

  try {
    const data =
      section === "overview" ? await loadOverview(range, interval, filters)
      : section === "goals" ? await loadGoals(range, interval, filters)
      : section === "ai" ? await loadAi(range, interval, filters)
      : await loadBreakdown(section, range, filters);
    const body = {
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      interval,
      updatedAt: new Date().toISOString(),
      data,
    };
    cache.set(key, { at: Date.now(), body });
    if (cache.size > 200) cache.delete(cache.keys().next().value as string);
    return NextResponse.json(body);
  } catch (error) {
    console.error("[stats] query failed", section, error);
    return NextResponse.json({ error: "Could not load this section from PostHog." }, { status: 502 });
  }
}
