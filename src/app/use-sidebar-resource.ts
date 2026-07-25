"use client";

import { useEffect, useState } from "react";
import { adoptEarlyFetch } from "@/app/sidebar-early-fetch";

// Session-wide cache of /api/app/sidebar-data responses, split by resource so
// overlapping pages can reuse data. For example, dashboard lead previews can
// satisfy the lead portion of Messages without repeating that Firestore read.
// Every mount still revalidates in the background.
const responseCache = new Map<string, Record<string, unknown>>();
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
  leadDashboardPreviews: ["leads"],
  leadAgentRefs: ["leads"],
  enrollmentPreviews: ["enrollments"],
  campaigns: ["campaigns"],
  conversations: ["conversations"],
  automationRuns: ["runs"],
  linkedinConnected: ["connected"],
  activityItems: ["items"],
  linkedinAccounts: ["accounts"],
  linkedinInbox: ["threads", "senderAccounts", "error"],
};

// Resources whose cached fragment is a strict superset of another's: a full
// lead preview carries every field the dashboard/agent projections select, so a
// page that already loaded the heavy list can satisfy the lighter ones from
// cache instead of paying for a second lead query.
const RESOURCE_SUPERSETS: Record<string, string> = {
  leadDashboardPreviews: "leadPreviews",
  leadAgentRefs: "leadPreviews",
};

function resourceNames(resource: string) {
  return resource.split(",").filter(Boolean);
}

function cachedFragment(name: string) {
  const superset = RESOURCE_SUPERSETS[name];
  return responseCache.get(name) ?? (superset ? responseCache.get(superset) : undefined);
}

function isSatisfied(name: string) {
  const superset = RESOURCE_SUPERSETS[name];
  return Boolean(
    cachedFragment(name) || inflightNames.has(name) || (superset && inflightNames.has(superset)),
  );
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
    const fields = RESOURCE_FIELDS[name];
    if (!fields) continue;
    const fragment = Object.fromEntries(
      fields.filter((field) => field in data).map((field) => [field, data[field]]),
    );
    responseCache.set(name, fragment);
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
export function prefetchSidebarResource(resource: string): Promise<unknown> {
  const missing = resourceNames(resource).filter((name) => !isSatisfied(name));
  if (!missing.length) return Promise.resolve();
  return loadSidebarResource(missing.join(","));
}

// Resolves once nothing is in flight, so background warming can wait for the
// page the user is actually looking at to finish loading first. Bounded by a
// deadline so a stalled request can never hold the warmer off forever.
export async function whenSidebarRequestsSettle(timeoutMs = 15000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (inflightRequests.size && Date.now() < deadline) {
    await Promise.allSettled([...inflightRequests.values()]);
  }
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

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const pick = (data: Record<string, unknown>) => select(data);

    // Initial state already serves cached data without a skeleton. Revalidate
    // asynchronously while keeping that value visible instead of flashing a
    // loading state again on refresh/reload.
    void loadSidebarResource(resource).then((data) => {
      if (cancelled) return;
      if (data) setValue(pick(data));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, reloadCount, resource, select]);

  return { value, loading, reload: () => setReloadCount((current) => current + 1) };
}
