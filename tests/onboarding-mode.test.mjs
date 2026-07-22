import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const actions = readFileSync(new URL("../src/app/actions.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/onboarding/page.tsx", import.meta.url), "utf8");
const progress = readFileSync(
  new URL("../src/app/onboarding/onboarding-progress.tsx", import.meta.url),
  "utf8",
);
const connectSuccess = readFileSync(
  new URL("../src/app/connect/success/page.tsx", import.meta.url),
  "utf8",
);
const setup = readFileSync(new URL("../src/app/setup/page.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(
  new URL("../src/app/(app)/dashboard/page.tsx", import.meta.url),
  "utf8",
);

test("hosted onboarding retains questions and plan selection", () => {
  assert.match(progress, /const PRODUCT_STEPS = \[[\s\S]*"Personalisation",[\s\S]*"Select Plan",/);
  assert.match(page, /!selfHosted && requestedStep === 3 \? 3 : 2/);
});

test("self-hosted onboarding skips hosted-only steps and email preparation", () => {
  assert.match(
    progress,
    /const SELF_HOSTED_STEPS = \["Your Product", "Example Leads", "Setup LinkedIn"\]/,
  );
  assert.match(actions, /if \(!hadCompletedOnboarding && !isLocalMode\(\)\)/);

  const localAction = actions.slice(
    actions.indexOf("export async function completeSelfHostedOnboardingAction"),
    actions.indexOf("export async function saveProductProfileAction"),
  );
  assert.match(localAction, /if \(!isLocalMode\(\)\) throw new Error/);
  assert.doesNotMatch(localAction, /send[A-Za-z]+Email|sendNewSignupNotification|Resend/);
});

test("first-time self-hosters enter setup until they create an agent or campaign", () => {
  assert.match(connectSuccess, /\(!isLocalMode\(\) && !isFirstLinkedInConnection\(linkedInAccount\)\)/);
  assert.match(connectSuccess, /redirect\("\/setup"\)/);
  assert.match(setup, /\(!isLocalMode\(\) && !isFirstLinkedInConnection\(linkedInAccount\)\)/);
  assert.match(dashboard, /if \(isLocalMode\(\)\)[\s\S]*!agents\.length && !campaigns\.length[\s\S]*redirect\("\/setup"\)/);
});
