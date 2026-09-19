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
  test("can ignore an in-flight inbox so /leads warmup does not wait on Unipile", async () => {
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
