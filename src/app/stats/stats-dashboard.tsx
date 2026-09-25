"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  STATS_INTERVALS,
  STATS_PERIODS,
  allowedIntervals,
  bucketsBetween,
  defaultInterval,
  resolveStatsRange,
  type StatsQuery,
} from "@/lib/stats-periods";
import type {
  ProductAppData,
  ProductOverviewData,
  StatsAiData,
  StatsBreakdownData,
  StatsFilter,
  StatsOverviewData,
  StatsResponse,
  StatsSection,
} from "@/lib/stats-types";
import { STATS_REFRESH_MS } from "@/lib/stats-types";
import { StatsAiCard } from "./stats-ai-card";
import { StatsBreakdownCard, type BreakdownTab } from "./stats-breakdown-card";
import {
  Favicon,
  Flag,
  Glyph,
  browserIcon,
  channelIcon,
  deviceIcon,
  osIcon,
  referrerIcon,
  urlDomain,
} from "./stats-icons";
import { StatsMainCard } from "./stats-main-card";
import { ProductView } from "./product-view";

type Query = StatsQuery;
export type StatsView = "web" | "product";
const VIEWS: { key: StatsView; label: string }[] = [
  { key: "web", label: "Web analytics" },
  { key: "product", label: "Product analytics" },
];

function writeQuery(query: Query, view: StatsView) {
  const params = new URLSearchParams();
  if (view !== "web") params.set("view", view);
  if (query.period !== "30d") params.set("period", query.period);
  if (query.offset) params.set("offset", String(query.offset));
  if (query.interval !== defaultInterval(query.period)) params.set("interval", query.interval);
  if (query.filters.length) params.set("filters", JSON.stringify(query.filters));
  const search = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}`);
}

type SectionState<T> = { data?: StatsResponse<T>; loading: boolean; refreshing: boolean; error?: string };

// While the server refreshes a stale answer, ask again every few seconds (about a minute at most).
const STALE_POLL_MS = 3_000;
const STALE_POLLS = 20;

// The last answer for the default views (no filters, current period) is kept in
// this browser, so a reload paints numbers at once while the server catches up.
const savedKey = (queryKey: string) => `omentir-stats:${queryKey}`;
function readSaved<T>(queryKey: string): StatsResponse<T> | undefined {
  try {
    const raw = window.localStorage.getItem(savedKey(queryKey));
    return raw ? (JSON.parse(raw) as StatsResponse<T>) : undefined;
  } catch {
    return undefined;
  }
}
function writeSaved(queryKey: string, body: unknown) {
  try {
    window.localStorage.setItem(savedKey(queryKey), JSON.stringify(body));
  } catch {
    // Storage full or blocked: the page still works, it just starts empty next time.
  }
}

function useSection<T>(section: StatsSection, query: Query, refresh: number, tick: number, enabled = true): SectionState<T> {
  const queryKey = JSON.stringify([section, query.period, query.offset, query.interval, query.filters.map(({ key, value }) => [key, value])]);
  const requestKey = enabled ? `${queryKey}#${refresh}#${tick}` : "off";
  const saveable = query.offset === 0 && query.filters.length === 0;
  const lastRefresh = useRef(refresh);
  const [state, setState] = useState<{ key?: string; data?: StatsResponse<T>; error?: string; stale?: boolean }>({});
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let timer: number | undefined;
    const params = new URLSearchParams({
      section,
      period: query.period,
      offset: String(query.offset),
      interval: query.interval,
      filters: JSON.stringify(query.filters.map(({ key, value }) => ({ key, value }))),
    });
    // Only a refresh-button press skips the server's 5-minute cache window.
    const forced = refresh !== lastRefresh.current;
    if (forced) params.set("fresh", "1");
    lastRefresh.current = refresh;
    if (!forced && saveable) {
      queueMicrotask(() => {
        const saved = readSaved<T>(queryKey);
        if (!saved || controller.signal.aborted) return;
        // A server answer that already arrived is newer than the saved copy.
        setState((s) => (s.key === requestKey ? s : { key: requestKey, data: saved, stale: true }));
      });
    }
    const load = (polls: number) => {
      fetch(`/api/stats?${params}`, { signal: controller.signal, cache: "no-store" })
        .then(async (response) => {
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
          const data = body as StatsResponse<T>;
          const stale = data.stale === true && polls < STALE_POLLS;
          setState({ key: requestKey, data, stale });
          if (!data.stale && saveable) writeSaved(queryKey, data);
          if (stale) {
            params.delete("fresh");
            timer = window.setTimeout(() => load(polls + 1), STALE_POLL_MS);
          }
        })
        .catch((error: Error) => {
          if (error.name === "AbortError") return;
          setState((s) => ({ key: requestKey, data: s.data, error: error.message }));
        });
    };
    load(0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // requestKey captures every query field, the refresh button and the 5-minute tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);
  // Keep showing the last data (dimmed) while a new request is in flight. Stale
  // numbers stay undimmed while newer ones load; only the refresh icon spins.
  const settled = state.key === requestKey;
  return {
    data: state.data,
    loading: enabled && !settled,
    refreshing: enabled && settled && state.stale === true,
    error: settled ? state.error : undefined,
  };
}

function Menu({ trigger, children, className }: { trigger: ReactNode; children: (close: () => void) => ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="stats-menu" ref={ref}>
      <button type="button" className={className} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {trigger}
        <span className="stats-caret">{Glyph.caret}</span>
      </button>
      {open && <div className="stats-menu-list" role="menu">{children(() => setOpen(false))}</div>}
    </div>
  );
}

const SOURCE_TABS: BreakdownTab[] = [
  { label: "Channel", filterKey: "channel_name", filterLabel: "Channel", icon: (r) => channelIcon(r.value), donut: true },
  { label: "Referrer", filterKey: "referring_domain", filterLabel: "Referrer", icon: (r) => referrerIcon(r.value), display: (r) => (r.value === "(direct)" ? "Direct/None" : r.value) },
  { label: "Campaign", filterKey: "utm_campaign", filterLabel: "Campaign", icon: () => <span className="stats-row-icon">{Glyph.tag}</span> },
];
const PAGE_TABS: BreakdownTab[] = [
  { label: "Hostname", filterKey: "$host", filterLabel: "Hostname", icon: (r) => <Favicon domain={r.value.replace(/\.$/, "")} /> },
  { label: "Page", filterKey: "$pathname", filterLabel: "Page" },
  { label: "Entry page", filterKey: "$entry_pathname", filterLabel: "Entry page" },
  {
    label: "Exit link",
    filterKey: null,
    filterLabel: "Exit link",
    icon: (r) => <Favicon domain={urlDomain(r.value)} />,
    display: (r) => r.value.replace(/^https?:\/\/(www\.)?/, ""),
    href: (r) => r.value,
  },
];
const LOCATION_TABS: BreakdownTab[] = [
  { label: "Country", filterKey: "$geoip_country_name", filterLabel: "Country", icon: (r) => <Flag code={r.label} /> },
  { label: "Region", filterKey: "$geoip_subdivision_1_name", filterLabel: "Region", icon: (r) => <Flag code={r.label} /> },
  { label: "City", filterKey: "$geoip_city_name", filterLabel: "City", icon: (r) => <Flag code={r.label} /> },
];
const TECH_TABS: BreakdownTab[] = [
  { label: "Browser", filterKey: "$browser", filterLabel: "Browser", icon: (r) => browserIcon(r.value) },
  { label: "OS", filterKey: "$os", filterLabel: "OS", icon: (r) => osIcon(r.value) },
  { label: "Device", filterKey: "$device_type", filterLabel: "Device", icon: (r) => deviceIcon(r.value) },
];

export default function StatsDashboard({ initialQuery, initialView }: { initialQuery: Query; initialView: StatsView }) {
  const [query, setQuery] = useState<Query>(initialQuery);
  const [view, setView] = useState<StatsView>(initialView);
  const [refresh, setRefresh] = useState(0);
  const [tick, setTick] = useState(0);

  // Refetch at every 5-minute mark (:00, :05, ...), when the server's cache window rolls over.
  useEffect(() => {
    const wait = STATS_REFRESH_MS - (Date.now() % STATS_REFRESH_MS) + 2_000;
    const timer = window.setTimeout(() => setTick((t) => t + 1), wait);
    return () => window.clearTimeout(timer);
  }, [tick]);

  // Keep the URL in step so a reload or a shared link opens the same view.
  useEffect(() => writeQuery(query, view), [query, view]);

  const update = useCallback((patch: Partial<Query>) => {
    setQuery((current) => {
      const next = { ...current, ...patch };
      if (patch.period && !patch.interval) next.interval = defaultInterval(patch.period);
      const range = resolveStatsRange(next.period, next.offset);
      const allowed = allowedIntervals(range.from, range.to);
      if (!allowed.includes(next.interval)) next.interval = allowed.includes("day") ? "day" : allowed[0];
      return next;
    });
  }, []);

  const addFilter = useCallback(
    (filter: StatsFilter) => {
      setQuery((current) => {
        const filters = [...current.filters.filter((f) => f.key !== filter.key), filter];
        const next = { ...current, filters };
          return next;
      });
    },
    [],
  );

  const web = view === "web";
  const range = useMemo(() => resolveStatsRange(query.period, query.offset), [query]);
  // Product numbers are daily counters: no hourly buckets and no web filters there.
  const intervals = allowedIntervals(range.from, range.to).filter((i) => web || i !== "hour");
  const interval = web || query.interval !== "hour" ? query.interval : "day";
  const productQuery = useMemo(() => ({ ...query, interval, filters: [] }), [query, interval]);
  const overview = useSection<StatsOverviewData>("overview", query, refresh, tick, web);
  const sources = useSection<StatsBreakdownData>("sources", query, refresh, tick, web);
  const pages = useSection<StatsBreakdownData>("pages", query, refresh, tick, web);
  const location = useSection<StatsBreakdownData>("location", query, refresh, tick, web);
  const tech = useSection<StatsBreakdownData>("tech", query, refresh, tick, web);
  const ai = useSection<StatsAiData>("ai", query, refresh, tick, web);
  const product = useSection<ProductOverviewData>("product", productQuery, refresh, tick, !web);
  const productApp = useSection<ProductAppData>("product-app", productQuery, refresh, tick, !web);

  const buckets = useMemo(() => bucketsBetween(range.from, range.to, interval), [range, interval]);
  const anyLoading = [overview, sources, pages, location, tech, ai, product, productApp].some((s) => s.loading || s.refreshing);
  const stamp = web ? overview.data?.updatedAt : product.data?.updatedAt;
  const updatedAt = stamp ? new Date(stamp) : null;
  const periodLabel = STATS_PERIODS.find((p) => p.key === query.period)?.label ?? "";
  const rangeLabel =
    query.offset > 0
      ? `${range.from.toISOString().slice(0, 10)} to ${new Date(range.to.getTime() - 1).toISOString().slice(0, 10)}`
      : periodLabel;

  const live = query.offset === 0 && query.period !== "yesterday";

  return (
    <div className="stats-root">
      <div className="stats-wrap">
        <div className="stats-brand">
          {/* eslint-disable-next-line @next/next/no-img-element -- same-origin app icon */}
          <img src="/icon.png" alt="" />
          Omentir <small>stats</small>
        </div>

        <div className="stats-toolbar">
          <span className="stats-pill">
            {/* eslint-disable-next-line @next/next/no-img-element -- same-origin app icon */}
            <img src="/icon.png" alt="" />
            omentir.com
          </span>

          <Menu className="stats-pill" trigger={<span>{VIEWS.find((v) => v.key === view)?.label}</span>}>
            {(close) =>
              VIEWS.map((v) => (
                <button key={v.key} type="button" role="menuitemradio" aria-checked={v.key === view}
                  onClick={() => { setView(v.key); close(); }}>
                  {v.label}
                </button>
              ))
            }
          </Menu>

          <div className="stats-stepper">
            <button type="button" aria-label="Previous period" disabled={query.period === "all"} onClick={() => update({ offset: query.offset + 1 })}>
              <span style={{ width: 16, height: 16, display: "inline-flex" }}>{Glyph.chevronLeft}</span>
            </button>
            <Menu className="stats-menu-trigger" trigger={<span>{rangeLabel}</span>}>
              {(close) =>
                STATS_PERIODS.map((p) => (
                  <button key={p.key} type="button" role="menuitemradio" aria-checked={p.key === query.period && query.offset === 0}
                    onClick={() => { update({ period: p.key, offset: 0 }); close(); }}>
                    {p.label}
                  </button>
                ))
              }
            </Menu>
            <button type="button" aria-label="Next period" disabled={query.offset === 0} onClick={() => update({ offset: Math.max(0, query.offset - 1) })}>
              <span style={{ width: 16, height: 16, display: "inline-flex" }}>{Glyph.chevronRight}</span>
            </button>
          </div>

          <Menu className="stats-pill" trigger={<span>{STATS_INTERVALS.find((i) => i.key === interval)?.label}</span>}>
            {(close) =>
              STATS_INTERVALS.map((i) => (
                <button key={i.key} type="button" role="menuitemradio" aria-checked={i.key === interval}
                  disabled={!intervals.includes(i.key)} onClick={() => { update({ interval: i.key }); close(); }}>
                  {i.label}
                </button>
              ))
            }
          </Menu>

          <button type="button" className={`stats-icon-btn${anyLoading ? " is-spinning" : ""}`} aria-label="Refresh now" title="Refresh now" onClick={() => setRefresh((r) => r + 1)}>
            <span style={{ width: 16, height: 16, display: "inline-flex" }}>{Glyph.refresh}</span>
          </button>
          {updatedAt && (
            <span className="stats-updated">
              Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}, refreshes every 5 min
            </span>
          )}
        </div>

        {web && query.filters.length > 0 && (
          <div className="stats-filters">
            {query.filters.map((f) => (
              <span key={f.key} className="stats-chip">
                <b>{f.label}</b>
                <button type="button" aria-label={`Remove ${f.label}`} onClick={() => update({ filters: query.filters.filter((x) => x.key !== f.key) })}>
                  <span style={{ width: 12, height: 12, display: "inline-flex" }}>{Glyph.close}</span>
                </button>
              </span>
            ))}
            {query.filters.length > 1 && (
              <button type="button" className="stats-link-btn" onClick={() => update({ filters: [] })}>Clear all</button>
            )}
          </div>
        )}

        {web ? (
        <>
        <StatsMainCard
          data={overview.data?.data}
          loading={overview.loading}
          error={overview.error}
          buckets={buckets}
          interval={query.interval}
          live={live}
        />

        <div className="stats-grid">
          <StatsBreakdownCard title="Sources" tabs={SOURCE_TABS} data={sources.data?.data} loading={sources.loading} error={sources.error} onFilter={addFilter} />
          <StatsBreakdownCard title="Pages" tabs={PAGE_TABS} initialTab={1} data={pages.data?.data} loading={pages.loading} error={pages.error} onFilter={addFilter} />
          <StatsBreakdownCard title="Location" tabs={LOCATION_TABS} data={location.data?.data} loading={location.loading} error={location.error} onFilter={addFilter} />
          <StatsBreakdownCard title="Tech" tabs={TECH_TABS} data={tech.data?.data} loading={tech.loading} error={tech.error} onFilter={addFilter} />
        </div>

        <StatsAiCard data={ai.data?.data} loading={ai.loading} error={ai.error} buckets={buckets} interval={query.interval} onFilter={addFilter} />
        </>
        ) : (
          <ProductView
            overview={{ data: product.data?.data, loading: product.loading, error: product.error }}
            app={{ data: productApp.data?.data, loading: productApp.loading, error: productApp.error }}
            buckets={buckets}
            interval={interval}
          />
        )}
      </div>
    </div>
  );
}
