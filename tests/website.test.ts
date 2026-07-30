import { describe, expect, test } from "bun:test";
import { fetchWebsitePages } from "@/lib/server/website";
import { isPrivateOrReservedIp, validatePublicWebsiteUrl } from "@/lib/server/website-url-safety";

// The onboarding fetch degrades instead of erroring: when the direct fetch
// fails, analyzeWebsiteOrSearch quietly falls back to search grounding, so a
// totally dead fetcher still returns a plausible product overview. That is how
// the DNS-rebinding pin in a1c238d shipped a fetcher that could not open a
// single connection. These tests exist to make that failure visible: they
// assert the direct path really reads a live public site.
describe("fetchWebsitePages", () => {
  test("reads a live public website over the pinned-address path", async () => {
    const pages = await fetchWebsitePages("https://example.com");

    expect(pages.length).toBeGreaterThan(0);
    expect(pages[0].text.length).toBeGreaterThan(100);
    expect(pages[0].text).toContain("Example Domain");
  }, 20_000);

  test("rejects input that is not an address, without leaking a raw TypeError", async () => {
    // "Invalid URL" reaches the onboarding panel verbatim and reads like a crash.
    expect(fetchWebsitePages("not a url at all")).rejects.toThrow(/website address/i);
  });

  test("refuses private and link-local hosts so onboarding cannot be used to probe the VPS", async () => {
    expect(fetchWebsitePages("http://localhost:3000")).rejects.toThrow(/private network/i);
    expect(fetchWebsitePages("http://192.168.1.1")).rejects.toThrow(/private network/i);
    expect(fetchWebsitePages("http://169.254.169.254")).rejects.toThrow(/private network/i);
  });
});

describe("website URL safety", () => {
  test("treats loopback, RFC1918, link-local and multicast as private", () => {
    for (const address of ["127.0.0.1", "10.0.0.5", "192.168.1.1", "172.16.0.1", "169.254.169.254", "::1", "fd00::1"]) {
      expect(isPrivateOrReservedIp(address)).toBe(true);
    }
    for (const address of ["8.8.8.8", "1.1.1.1", "2606:4700::1111"]) {
      expect(isPrivateOrReservedIp(address)).toBe(false);
    }
  });

  test("blocks non-HTTP schemes and embedded credentials", () => {
    expect(() => validatePublicWebsiteUrl(new URL("ftp://example.com"))).toThrow(/HTTP/i);
    expect(() => validatePublicWebsiteUrl(new URL("https://user:pass@example.com"))).toThrow(/credentials/i);
  });
});
