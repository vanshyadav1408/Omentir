import { describe, expect, test } from "bun:test";
import { buildEarlyFetchScript } from "./sidebar-early-fetch";

function overviewEarlyFetchResources(script: string) {
  const marker = "var r=(";
  const start = script.indexOf(marker);
  const end = script.indexOf(")[p]", start);
  if (start < 0 || end < 0) {
    throw new Error("early-fetch script did not inline a routes table");
  }
  const routes = JSON.parse(script.slice(start + marker.length, end)) as Record<
    string,
    string[]
  >;
  return routes["/overview"] ?? [];
}

describe("overview early-fetch", () => {
  test("starts activityDays as its own request so dashboard stats are not blocked on reconcile", () => {
    const overview = overviewEarlyFetchResources(buildEarlyFetchScript());
    const activityRequests = overview.filter((resource) =>
      resource.split(",").includes("activityDays"),
    );
    expect(activityRequests).toEqual(["activityDays"]);
    expect(overview.some((resource) => resource.includes("leadDashboardPreviews"))).toBe(
      true,
    );
  });
});

describe("early-fetch routes", () => {
  // The hook adopts the pre-hydration promise only when its resource string is
  // identical. A drifted key does not fail loudly: the page just fires a second
  // copy of the same heavy read, so pin every entry to the view that uses it.
  const views: Record<string, string> = {
    "/overview": "src/app/(app)/overview/overview-view.tsx",
    "/leads": "src/app/(app)/leads/leads-view.tsx",
    "/messages": "src/app/(app)/messages/messages-view.tsx",
    "/agents": "src/app/(app)/agents/agents-view.tsx",
    "/settings": "src/app/(app)/settings/settings-view.tsx",
    "/api-keys": "src/app/(app)/api-keys/api-keys-view.tsx",
  };

  test("every route's resources are exactly the keys its page asks for", async () => {
    const { EARLY_FETCH_ROUTES, DASHBOARD_RESOURCE, ACTIVITY_DAYS_RESOURCE, LINKEDIN_INBOX_RESOURCE } =
      await import("./sidebar-early-fetch");
    const constants: Record<string, string> = {
      DASHBOARD_RESOURCE,
      ACTIVITY_DAYS_RESOURCE,
      LINKEDIN_INBOX_RESOURCE,
    };
    expect(Object.keys(EARLY_FETCH_ROUTES).sort()).toEqual(Object.keys(views).sort());
    for (const [route, resources] of Object.entries(EARLY_FETCH_ROUTES)) {
      const source = await Bun.file(views[route]).text();
      const hookKeys = [...source.matchAll(/useSidebarResource(?:<[^>]*>)?\(\s*("([^"]+)"|([A-Z_]+))/g)].map(
        (match) => match[2] ?? constants[match[3]],
      );
      for (const resource of resources) {
        expect({ route, resource, found: hookKeys.includes(resource) }).toEqual({
          route,
          resource,
          found: true,
        });
      }
    }
  });
});
