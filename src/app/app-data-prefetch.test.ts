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
  test("starts leadPreviews while LinkedIn inbox is still in flight so /leads and /messages can warm in the background on Overview", async () => {
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
            if (fetched.some((resource) => resource.split(",").includes("leadPreviews"))) {
              clearInterval(timer);
              resolve();
            }
          }, 5);
          setTimeout(() => {
            clearInterval(timer);
            reject(new Error(`leadPreviews did not start before inbox finished: ${fetched.join(" | ")}`));
          }, 400);
        }),
        warming,
      ]);
      expect(fetched.some((resource) => resource.split(",").includes("leadPreviews"))).toBe(true);
    } finally {
      releaseInbox();
      globalThis.fetch = originalFetch;
    }
  });
});
