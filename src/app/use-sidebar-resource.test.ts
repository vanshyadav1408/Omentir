import { afterEach, describe, expect, test } from "bun:test";
import {
  clearSidebarResourceCache,
  prefetchSidebarResource,
  whenSidebarRequestsSettle,
} from "./use-sidebar-resource";

afterEach(() => {
  clearSidebarResourceCache();
});

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("whenSidebarRequestsSettle", () => {
  test("can ignore an in-flight inbox so /leads warmup does not wait on LinkedIn", async () => {
    let releaseInbox!: () => void;
    const inboxGate = new Promise<void>((resolve) => {
      releaseInbox = resolve;
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("linkedinInbox")) {
        await inboxGate;
        return jsonResponse({ threads: [] });
      }
      return jsonResponse({});
    }) as typeof fetch;

    try {
      void prefetchSidebarResource("linkedinInbox");
      const started = Date.now();
      await whenSidebarRequestsSettle(1000, { ignoreNames: ["linkedinInbox"] });
      expect(Date.now() - started).toBeLessThan(200);
    } finally {
      releaseInbox();
      globalThis.fetch = originalFetch;
    }
  });
});

describe("paged resources", () => {
  test("a visited Leads page is served from memory, and only the 30 newest pages are kept", async () => {
    const fetched: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const resource = new URL(String(input), "http://localhost").searchParams.get("resource") || "";
      fetched.push(resource);
      return jsonResponse({ leadPage: { key: resource } });
    }) as typeof fetch;

    try {
      // The fields of "leadPage?page=2" are looked up by its base name; if
      // that broke, nothing would be cached and every revisit would refetch.
      await prefetchSidebarResource("leadPage?page=2");
      await prefetchSidebarResource("leadPage?page=2");
      expect(fetched).toEqual(["leadPage?page=2"]);

      for (let page = 3; page <= 32; page += 1) {
        await prefetchSidebarResource(`leadPage?page=${page}`);
      }
      // Page 2 is now the 31st newest, so it was dropped; page 32 is kept.
      fetched.length = 0;
      await prefetchSidebarResource("leadPage?page=32");
      await prefetchSidebarResource("leadPage?page=2");
      expect(fetched).toEqual(["leadPage?page=2"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
