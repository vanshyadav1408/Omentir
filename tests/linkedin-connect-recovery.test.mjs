import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { findSingleRecentlyCreatedAccount } from "../src/lib/linkedin-connect-recovery.ts";

const proxy = readFileSync(new URL("../src/proxy.ts", import.meta.url), "utf8");

test("localhost connect recovery accepts one recent provider account and never guesses", () => {
  const now = Date.parse("2026-07-22T09:35:00Z");
  const recent = { id: "recent", name: "LinkedIn", createdAt: "2026-07-22T09:30:00Z" };
  const old = { id: "old", name: "LinkedIn", createdAt: "2026-07-21T09:30:00Z" };

  assert.equal(findSingleRecentlyCreatedAccount([old, recent], now)?.id, "recent");
  assert.equal(findSingleRecentlyCreatedAccount([recent, { ...recent, id: "other" }], now), null);
  assert.equal(findSingleRecentlyCreatedAccount([old], now), null);
  assert.equal(
    findSingleRecentlyCreatedAccount(
      [recent, { ...recent, id: "other" }],
      now,
      new Set(["recent"]),
    )?.id,
    "other",
  );
});

test("self-hosted account linking stays unlimited and persists reconnect successes", () => {
  const settingsPage = readFileSync(new URL("../src/app/(app)/settings/page.tsx", import.meta.url), "utf8");
  const settingsView = readFileSync(new URL("../src/app/(app)/settings/settings-view.tsx", import.meta.url), "utf8");
  const reconnectSuccess = readFileSync(new URL("../src/app/reconnect/success/page.tsx", import.meta.url), "utf8");

  assert.match(settingsPage, /localMode=\{isLocalMode\(\)\}/);
  assert.match(settingsView, /localMode \|\| plan === "enterprise"/);
  assert.match(reconnectSuccess, /if \(isLocalMode\(\)\)/);
  assert.match(reconnectSuccess, /await saveLinkedInAccount\(userId/);
});

test("local middleware allows connect result pages to finish account persistence", () => {
  assert.match(proxy, /path === "\/connect" \|\| path\.startsWith\("\/connect\/"\)/);
  assert.match(proxy, /path === "\/reconnect" \|\| path\.startsWith\("\/reconnect\/"\)/);
  assert.match(proxy, /isProtectedRoute\(request\) \|\| localConnectRoute/);
});
