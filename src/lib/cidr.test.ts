import { describe, expect, test } from "bun:test";
import { cidrContains, ipInCidrs } from "./cidr";

describe("cidrContains", () => {
  test("matches an IPv4 address inside the prefix so Google-Agent ranges can be checked without a library", () => {
    expect(cidrContains("66.249.90.1", "66.249.90.0/24")).toBe(true);
    expect(cidrContains("66.249.91.1", "66.249.90.0/24")).toBe(false);
    expect(cidrContains("66.249.90.1", "66.249.90.1/32")).toBe(true);
  });

  test("matches an IPv6 address inside the prefix because Google publishes both families", () => {
    expect(cidrContains("2001:db8::1", "2001:db8::/32")).toBe(true);
    expect(cidrContains("2001:db9::1", "2001:db8::/32")).toBe(false);
  });
});

describe("ipInCidrs", () => {
  test("returns false for an empty IP so a missing header does not become Gemini", () => {
    expect(ipInCidrs("", ["66.249.90.0/24"])).toBe(false);
    expect(ipInCidrs("8.8.8.8", ["66.249.90.0/24", "8.8.8.0/24"])).toBe(true);
  });
});
