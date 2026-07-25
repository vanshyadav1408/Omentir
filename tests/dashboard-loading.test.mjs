import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("the dashboard mounts before its client-side data requests begin", () => {
  const sharedRouteFallback = new URL("../src/app/(app)/loading.tsx", import.meta.url);
  const dashboard = readFileSync(
    new URL("../src/app/(app)/dashboard/dashboard-view.tsx", import.meta.url),
    "utf8",
  );

  assert.equal(
    existsSync(sharedRouteFallback),
    false,
    "a shared route fallback blocks the dashboard client from starting its data requests",
  );
  assert.match(
    dashboard,
    /dashboardResource\.loading/,
    "backend-driven dashboard regions should retain their own loading state",
  );
});

test("the authenticated shell warms the other pages without competing with this one", () => {
  const layout = readFileSync(
    new URL("../src/app/(app)/layout.tsx", import.meta.url),
    "utf8",
  );
  const prefetch = readFileSync(
    new URL("../src/app/(app)/app-data-prefetch.tsx", import.meta.url),
    "utf8",
  );
  const sidebar = readFileSync(
    new URL("../src/app/sidebar.tsx", import.meta.url),
    "utf8",
  );

  // The warm-up used to be unmounted entirely because it competed with the page
  // the user was opening. It is mounted again now that it holds off until that
  // page's own requests have settled - so the guarantee to keep is the wait,
  // not the absence.
  assert.match(
    layout,
    /AppDataPrefetch/,
    "the other app pages never warm up, so each first visit pays full load time",
  );
  assert.match(
    prefetch,
    /whenSidebarRequestsSettle\(\)/,
    "background data warm-up must wait for the current page's requests to finish",
  );
  assert.doesNotMatch(
    sidebar,
    /router\.prefetch/,
    "preloading every dynamic app route creates duplicate auth and Firestore renders",
  );
});

test("background warm-up never duplicates a request that is already in flight", () => {
  const cache = readFileSync(
    new URL("../src/app/use-sidebar-resource.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    cache,
    /function prefetchSidebarResource[\s\S]*?!isSatisfied\(name\)/,
    "prefetching must skip resources already cached or already being fetched",
  );
  assert.match(
    cache,
    /function isSatisfied[\s\S]*?inflightNames\.has\(name\)/,
    "in-flight tracking must be per resource name, not per request string",
  );
});
