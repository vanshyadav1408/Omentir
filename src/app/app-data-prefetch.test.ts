import { afterEach, describe, expect, test } from "bun:test";
import { warmOtherPageData } from "./(app)/app-data-prefetch";
import { clearSidebarResourceCache, prefetchSidebarResource } from "./use-sidebar-resource";

afterEach(() => {
  clearSidebarResourceCache();
});

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("warmOtherPageData", () => {
  test("starts the Leads page while LinkedIn inbox is still in flight, and never warms the whole lead list", async () => {
    let releaseInbox!: () => void;
    const inboxGate = new Promise<void>((resolve) => {
      releaseInbox = resolve;
    });
    const fetched: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      const resource = new URL(url, "http://localhost").searchParams.get("resource") || "";
      fetched.push(resource);
      if (resource === "linkedinInbox") {
        await inboxGate;
        return jsonResponse({ threads: [], senderAccounts: [] });
      }
      return jsonResponse({
        groups: [],
        leads: [],
        conversations: [],
        agents: [],
        enrollments: [],
        activityDays: [],
        agentApiKeys: [],
        accounts: [],
      });
    }) as typeof fetch;

    try {
      void prefetchSidebarResource("linkedinInbox");
      const warming = warmOtherPageData();
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          const timer = setInterval(() => {
            if (fetched.some((resource) => resource.split(",").includes("leadPage"))) {
              clearInterval(timer);
              resolve();
            }
          }, 5);
          setTimeout(() => {
            clearInterval(timer);
            reject(new Error(`leadPage did not start before inbox finished: ${fetched.join(" | ")}`));
          }, 400);
        }),
        warming,
      ]);
      expect(fetched.some((resource) => resource.split(",").includes("leadPage"))).toBe(true);
      releaseInbox();
      await warming;
      // ~9 MB on the largest workspace; downloading it on every app page is
      // what slowed first loads.
      expect(fetched.some((resource) => resource.split(",").includes("leadPreviews"))).toBe(false);
    } finally {
      releaseInbox();
      globalThis.fetch = originalFetch;
    }
  });
});
