import assert from "node:assert/strict";
import test from "node:test";
import { isAutomationDisabled, isLocalMode, isLocalPasswordRequired } from "../src/lib/runtime-mode.ts";
import { createLocalSession, passwordsMatch, verifyLocalSession } from "../src/lib/local-session.ts";
import { getAutomationSafetyMode } from "../src/lib/server/automation-safety.ts";
import { planLimits } from "../src/lib/plan-limits.ts";
import { readFileSync } from "node:fs";

test("local mode is explicit and does not infer from missing hosted keys", () => {
  assert.equal(isLocalMode({}), false);
  assert.equal(isLocalMode({ RUN_LOCALLY: "TRUE" }), true);
  assert.equal(isLocalMode({ RUN_LOCALLY: "false" }), false);
});

test("local password protection is enabled only when a password is configured", () => {
  assert.equal(isLocalPasswordRequired({}), false);
  assert.equal(isLocalPasswordRequired({ LOCAL_APP_PASSWORD: "  " }), false);
  assert.equal(isLocalPasswordRequired({ LOCAL_APP_PASSWORD: "configured" }), true);
});

test("passwordless local mode still creates a signed session from a welcome screen", () => {
  const loginPage = readFileSync(new URL("../src/app/login/page.tsx", import.meta.url), "utf8");
  const loginForm = readFileSync(new URL("../src/app/local-login-form.tsx", import.meta.url), "utf8");
  const loginRoute = readFileSync(
    new URL("../src/app/api/local-auth/login/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(loginPage, /passwordRequired=\{isLocalPasswordRequired\(\)\}/);
  assert.match(loginForm, /Welcome to Omentir/);
  assert.match(loginForm, /Continue to dashboard/);
  assert.match(loginForm, /height: 36, minHeight: 36, marginInline: "auto"/);
  assert.match(loginForm, /passwordRequired \? "h-12 w-full" : "w-1\/2"/);
  assert.doesNotMatch(loginForm, /m3-card|m3-card-outlined/);
  assert.match(loginRoute, /if \(isLocalPasswordRequired\(\)\)/);
  assert.match(loginRoute, /await createLocalSession/);
});

test("AUTOMATION_DISABLED is an explicit kill switch", () => {
  assert.equal(isAutomationDisabled({ AUTOMATION_DISABLED: "true" }), true);
  assert.equal(isAutomationDisabled({}), false);
});

test("local sessions reject tampering and expiry", async () => {
  const secret = "a".repeat(32);
  const now = Date.now();
  const token = await createLocalSession(secret, now);
  assert.equal(await verifyLocalSession(token, secret, now), true);
  assert.equal(await verifyLocalSession(`${token}x`, secret, now), false);
  assert.equal(await verifyLocalSession(token, secret, now + 8 * 24 * 60 * 60 * 1000), false);
});

test("password comparison handles different lengths without accepting prefixes", () => {
  assert.equal(passwordsMatch("correct horse", "correct horse"), true);
  assert.equal(passwordsMatch("correct", "correct horse"), false);
});

test("local mode lifts commercial caps but forces automation dry-run", () => {
  const previousMode = process.env.RUN_LOCALLY;
  const previousLive = process.env.ENABLE_LIVE_AUTOMATION;
  process.env.RUN_LOCALLY = "TRUE";
  delete process.env.ENABLE_LIVE_AUTOMATION;
  try {
    assert.equal(planLimits("solo").agents, Number.POSITIVE_INFINITY);
    assert.equal(getAutomationSafetyMode().dryRun, true);
    process.env.ENABLE_LIVE_AUTOMATION = "true";
    assert.equal(getAutomationSafetyMode().dryRun, false);
  } finally {
    if (previousMode === undefined) delete process.env.RUN_LOCALLY;
    else process.env.RUN_LOCALLY = previousMode;
    if (previousLive === undefined) delete process.env.ENABLE_LIVE_AUTOMATION;
    else process.env.ENABLE_LIVE_AUTOMATION = previousLive;
  }
});

test("self-hosted app shell removes hosted-only navigation without changing hosted access", () => {
  const layout = readFileSync(new URL("../src/app/(app)/layout.tsx", import.meta.url), "utf8");
  const sidebar = readFileSync(new URL("../src/app/sidebar.tsx", import.meta.url), "utf8");

  assert.match(layout, /<Sidebar localMode=\{isLocalMode\(\)\} \/>/);
  assert.match(sidebar, /!localMode \? \([\s\S]*href="\/api-keys"/);
  assert.match(sidebar, /!localMode \? \([\s\S]*href="\/contact"/);
  assert.match(sidebar, /href !== "\/api-keys" && href !== "\/contact"/);
});

test("self-hosted settings remove email notifications and account session controls", () => {
  const settings = readFileSync(
    new URL("../src/app/(app)/settings/settings-view.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    settings,
    /\{!localMode \? \([\s\S]*title="Notifications"[\s\S]*title="Account session"[\s\S]*<SignOutButton/,
  );
});
