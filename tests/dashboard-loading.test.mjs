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

test("the authenticated shell does not preload every route and data resource", () => {
  const layout = readFileSync(
    new URL("../src/app/(app)/layout.tsx", import.meta.url),
    "utf8",
  );
  const sidebar = readFileSync(
    new URL("../src/app/sidebar.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    layout,
    /AppDataPrefetch/,
    "background data warm-up competes with the page the user is opening",
  );
  assert.doesNotMatch(
    sidebar,
    /router\.prefetch/,
    "preloading every dynamic app route creates duplicate auth and Firestore renders",
  );
});
