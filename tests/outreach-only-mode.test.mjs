import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const button = readFileSync(
  new URL("../src/app/(app)/agents/new-agent-button.tsx", import.meta.url),
  "utf8",
);
const page = readFileSync(
  new URL("../src/app/(app)/agents/new/page.tsx", import.meta.url),
  "utf8",
);
const actions = readFileSync(new URL("../src/app/actions.ts", import.meta.url), "utf8");
const entitlements = readFileSync(
  new URL("../src/lib/server/entitlements.ts", import.meta.url),
  "utf8",
);
const automationRoute = readFileSync(
  new URL("../src/app/api/jobs/automation-tick/route.ts", import.meta.url),
  "utf8",
);

test("Outreach Only uses the shared hosted and self-hosted agent flow", () => {
  assert.match(button, /href="\/agents\/new\?mode=outreach"/);
  assert.match(page, /params\.mode === "outreach"[\s\S]*createOutreachOnlyAgentFromSetup/);
  assert.match(actions, /export async function importLinkedInCsvLeadsAction/);
  assert.doesNotMatch(button, /isLocalMode|selfHosted/);
  assert.doesNotMatch(page, /params\.mode === "outreach"[\s\S]{0,200}isLocalMode/);
});

test("self-hosted mode grants entitlement while preserving explicit live-send safety", () => {
  assert.match(entitlements, /if \(isLocalMode\(\)\)[\s\S]*subscriptionActive: true/);
  assert.match(entitlements, /planId: "self-hosted"[\s\S]*limits: unlimited/);
  assert.match(
    automationRoute,
    /isLocalMode\(\) && process\.env\.ENABLE_LIVE_AUTOMATION\?\.toLowerCase\(\) !== "true"/,
  );
});
