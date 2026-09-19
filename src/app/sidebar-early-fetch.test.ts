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
