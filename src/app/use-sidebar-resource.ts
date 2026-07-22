"use client";

import { useEffect, useState } from "react";

// Session-wide cache of /api/app/sidebar-data responses, split by resource so
// overlapping pages can reuse data. For example, dashboard lead previews can
// satisfy the lead portion of Messages without repeating that Firestore read.
// Every mount still revalidates in the background.
const responseCache = new Map<string, Record<string, unknown>>();
const inflightRequests = new Map<string, Promise<Record<string, unknown> | null>>();

const RESOURCE_FIELDS: Record<string, string[]> = {
  agents: ["agents"],
  agentApiKeys: ["agentApiKeys"],
  groups: ["groups"],
  leadPreviews: ["leads"],
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

function resourceNames(resource: string) {
  return resource.split(",").filter(Boolean);
}

function readCachedResponse(resource: string) {
  const names = resourceNames(resource);
  if (!names.length) return undefined;
  const fragments = names.map((name) => responseCache.get(name));
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

  const request = fetch(`/api/app/sidebar-data?resource=${encodeURIComponent(resource)}`)
    .then((response) => (response.ok ? response.json() : null))
    .then((data: Record<string, unknown> | null) => {
      if (data) cacheResponse(resource, data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflightRequests.delete(resource);
    });
  inflightRequests.set(resource, request);
  return request;
}

// Warm the cache for a resource without mounting its page. Skips resources
// that are already cached or already being fetched.
export function prefetchSidebarResource(resource: string): Promise<unknown> {
  const missing = resourceNames(resource).filter((name) => !responseCache.has(name));
  if (!missing.length) return Promise.resolve();
  return loadSidebarResource(missing.join(","));
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
