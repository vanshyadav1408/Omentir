"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useState } from "react";
import { adoptEarlyFetch } from "@/app/sidebar-early-fetch";
import { pruneOtherUsers, readStoredResource, storeResource } from "@/app/sidebar-resource-store";

// Session-wide cache of /api/app/sidebar-data responses, split by resource so
// overlapping pages can reuse data (Agents and Overview both read "agents").
// Every mount still revalidates in the background.
//
// A resource name may carry a query after "?" (one Leads page:
// "leadPage?group=g1&page=2"). Those are cached in memory for back-and-forth
// paging, capped, and never written to IndexedDB: only each page's default
// view persists across visits.
const responseCache = new Map<string, Record<string, unknown>>();
const MAX_QUERY_RESPONSES = 30;
const inflightRequests = new Map<string, Promise<Record<string, unknown> | null>>();
// Per-resource-name refcount of the requests currently in flight. Keyed by name
// rather than by the comma-joined resource string so a background prefetch can
// tell that "leadPreviews" is already being fetched as part of some other
// combination and skip it instead of re-running the same query.
const inflightNames = new Map<string, number>();

const RESOURCE_FIELDS: Record<string, string[]> = {
  agents: ["agents"],
  agentApiKeys: ["agentApiKeys"],
  groups: ["groups"],
  leadPreviews: ["leads"],
  leadPage: ["leadPage"],
  overviewSummary: ["overviewSummary"],
  agentMetrics: ["agentMetrics"],
  campaigns: ["campaigns"],
  conversations: ["conversations"],
  automationRuns: ["runs"],
  linkedinConnected: ["connected"],
  activityItems: ["items"],
  activityDays: ["activityDays"],
  linkedinAccounts: ["accounts"],
  linkedinInbox: ["threads", "senderAccounts", "error"],
};

function resourceNames(resource: string) {
  return resource.split(",").filter(Boolean);
}

function hasQuery(name: string) {
  return name.includes("?");
}

function baseName(name: string) {
  const queryAt = name.indexOf("?");
  return queryAt === -1 ? name : name.slice(0, queryAt);
}

function cachedFragment(name: string) {
  return responseCache.get(name);
}

function isSatisfied(name: string) {
  return Boolean(cachedFragment(name) || inflightNames.has(name));
}

function readCachedResponse(resource: string) {
  const names = resourceNames(resource);
  if (!names.length) return undefined;
  const fragments = names.map(cachedFragment);
  if (fragments.some((fragment) => !fragment)) return undefined;
  return Object.assign({}, ...fragments) as Record<string, unknown>;
}

function cacheResponse(resource: string, data: Record<string, unknown>) {
  for (const name of resourceNames(resource)) {
    const fields = RESOURCE_FIELDS[baseName(name)];
    if (!fields) continue;
    const fragment = Object.fromEntries(
      fields.filter((field) => field in data).map((field) => [field, data[field]]),
    );
    // Re-insert so Map order is least recently stored first.
    responseCache.delete(name);
    responseCache.set(name, fragment);
  }
  const queryNames = [...responseCache.keys()].filter(hasQuery);
  for (const name of queryNames.slice(0, Math.max(0, queryNames.length - MAX_QUERY_RESPONSES))) {
    responseCache.delete(name);
  }
}

function loadSidebarResource(resource: string): Promise<Record<string, unknown> | null> {
  const pending = inflightRequests.get(resource);
  if (pending) return pending;

  const names = resourceNames(resource);
  for (const name of names) inflightNames.set(name, (inflightNames.get(name) ?? 0) + 1);

  // A page can start its request before hydration (see sidebar-early-fetch);
  // adopt that one instead of firing a duplicate.
  const early = adoptEarlyFetch(resource);
  const response =
    early ??
    fetch(`/api/app/sidebar-data?resource=${encodeURIComponent(resource)}`).then((result) =>
      result.ok ? result.json() : null,
    );

  const request = response
    .then((data: Record<string, unknown> | null) => {
      if (data) cacheResponse(resource, data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflightRequests.delete(resource);
      for (const name of names) {
        const remaining = (inflightNames.get(name) ?? 1) - 1;
        if (remaining > 0) inflightNames.set(name, remaining);
        else inflightNames.delete(name);
      }
    });
  inflightRequests.set(resource, request);
  return request;
}

// Warm the cache for a resource without mounting its page. Skips resources that
// are already cached or already being fetched - otherwise the background warmer
// fires a second copy of a query the current page is still waiting on, and the
// two compete for the same Firestore/bandwidth budget.
export function clearSidebarResourceCache() {
  responseCache.clear();
  inflightRequests.clear();
  inflightNames.clear();
}

export function prefetchSidebarResource(resource: string): Promise<unknown> {
  const missing = resourceNames(resource).filter((name) => !isSatisfied(name));
  if (!missing.length) return Promise.resolve();
  return loadSidebarResource(missing.join(","));
}

// Resolves once nothing is in flight, so background warming can wait for the
// page the user is actually looking at to finish loading first. Bounded by a
// deadline so a stalled request can never hold the warmer off forever.
// ignoreNames lets Overview start warming /leads while the LinkedIn inbox is still
// in flight, instead of blocking Firestore warmup on a 3s LinkedIn round trip.
export async function whenSidebarRequestsSettle(
  timeoutMs = 15000,
  options?: { ignoreNames?: Iterable<string> },
): Promise<void> {
  const ignore = new Set(options?.ignoreNames);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const blocking = [...inflightRequests.entries()].filter(([resource]) =>
      resourceNames(resource).some((name) => !ignore.has(name)),
    );
    if (!blocking.length) return;
    await Promise.allSettled(blocking.map(([, request]) => request));
  }
}

// `${userId}:${workspaceId}` for the signed-in app shell; empty elsewhere, which
// turns off the persisted (cross-visit) layer.
const SidebarCacheScopeContext = createContext("");

export function SidebarCacheScope({
  userId,
  workspaceId,
  children,
}: {
  userId: string;
  workspaceId: string;
  children: React.ReactNode;
}) {
  const scope = userId && workspaceId ? `${userId}:${workspaceId}` : "";
  useEffect(() => {
    if (userId) void pruneOtherUsers(userId);
  }, [userId]);
  return createElement(SidebarCacheScopeContext.Provider, { value: scope }, children);
}

export function useSidebarResource<T>(
  resource: string,
  initialValue: T,
  select: (data: Record<string, unknown>) => T,
  enabled = true,
) {
  const [value, setValue] = useState<T>(() => {
    const cached = enabled ? readCachedResponse(resource) : undefined;
    return cached ? select(cached) : initialValue;
  });
  const [loading, setLoading] = useState(enabled && !readCachedResponse(resource));
  const [reloadCount, setReloadCount] = useState(0);
  const scope = useContext(SidebarCacheScopeContext);
  // When the resource changes (the next Leads page) and memory already holds
  // it, show it in this render instead of the previous page.
  const [shownResource, setShownResource] = useState(resource);
  if (shownResource !== resource) {
    setShownResource(resource);
    const cached = enabled ? readCachedResponse(resource) : undefined;
    if (cached) {
      setValue(select(cached));
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let fresh = false;
    const pick = (data: Record<string, unknown>) => select(data);
    // Paged views are short-lived and many; only default views persist.
    const persisted = scope && !resourceNames(resource).some(hasQuery) ? scope : "";

    // Nothing in memory (reload or new visit): paint the last visit's data from
    // IndexedDB while the request runs. A slow disk read must never overwrite
    // the fresh response, hence the `fresh` guard.
    if (persisted && !readCachedResponse(resource)) {
      void readStoredResource(persisted, resource).then((stored) => {
        if (cancelled || fresh || !stored) return;
        setValue(pick(stored));
        setLoading(false);
      });
    }

    // Initial state already serves cached data without a skeleton. Revalidate
    // asynchronously while keeping that value visible instead of flashing a
    // loading state again on refresh/reload.
    void loadSidebarResource(resource).then((data) => {
      if (cancelled) return;
      fresh = true;
      if (data) {
        setValue(pick(data));
        if (persisted) storeResource(persisted, resource, data);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, reloadCount, resource, scope, select]);

  const reload = useCallback(() => {
    setReloadCount((current) => current + 1);
  }, []);

  return { value, loading, reload };
}
