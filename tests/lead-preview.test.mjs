import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const gemini = read("src/lib/server/gemini.ts");
const route = read("src/app/api/onboarding/lead-preview/route.ts");
const step = read("src/app/onboarding/step-lead-preview.tsx");

test("onboarding step 2 renders a fast pass before waiting on the grounded one", () => {
  // The step used to make one blocking request that had to survive the reverse
  // proxy window; when it didn't, the user got "couldn't find leads" instead of
  // the leads the draft call would have produced in ten seconds.
  assert.match(step, /fetchLeads\("fast", \d+_?\d*\)/);
  assert.match(step, /fetchLeads\("search", \d+_?\d*\)/);
  // Both passes are in flight together and each renders as it lands, so the
  // good results are never queued behind the draft.
  assert.match(step, /const searchTask = fetchLeads\("search"/);
  assert.match(step, /if \(!cancelled && !groundedLanded\)/);
  assert.match(step, /upgrading: true/);
});

test("a failed grounded pass keeps the leads already on screen", () => {
  // Replacing real leads with an error screen was the visible half of the bug.
  assert.match(step, /current\.status === "ready"\s*\?\s*\{ \.\.\.current, upgrading: false \}/);
});

test("every lead-preview stage is bounded by one shared budget", () => {
  // Retries used to be able to stack past the proxy window: a 40s grounded call
  // plus a 15s draft that itself retried twice.
  assert.match(gemini, /const remainingMs = \(\) => budgetMs - \(Date\.now\(\) - startedAt\)/);
  assert.match(gemini, /Math\.min\(15_000, remainingMs\(\)\)/);
  assert.match(gemini, /Math\.min\(38_000, remainingMs\(\)\)/);
  assert.match(route, /mode === "fast" \? \{ mode, budgetMs: 28_000 \}/);
});

test("the draft net runs alongside the grounded call, not after it", () => {
  // Started afterwards it only ever inherited an exhausted budget and timed out.
  assert.match(gemini, /const netPromise = mode === "auto" \? draftAttempt\(0\.7\) : Promise\.resolve\(\[\]\)/);
  const netStart = gemini.indexOf("const netPromise");
  const searchStart = gemini.indexOf("const searchLeads = await searchAttempt()");
  assert.ok(netStart > 0 && netStart < searchStart);
});

test("leads without a company survive normalization", () => {
  // Freelancers and solo creators - the buyers for prosumer products like a
  // social scheduler - legitimately have no company, and requiring one was
  // silently emptying the preview for those products.
  assert.match(gemini, /if \(!lead\.name \|\| !lead\.title\) return false;/);
  assert.doesNotMatch(gemini, /!lead\.name \|\| !lead\.title \|\| !lead\.company/);
});

test("a short strict pass falls back to a relaxed floor instead of an empty step", () => {
  assert.match(gemini, /function relaxPreviewLeads/);
  assert.match(gemini, /normalizePreviewLeads\(pools\.flatMap[\s\S]*?, 40\)/);
  // Both modes reconsider the raw pools before failing.
  assert.equal(gemini.match(/relaxPreviewLeads\(rawPools\)/g)?.length, 2);
});

test("grounded search never regains the options that silently emptied it", () => {
  // Grounding plus constrained JSON decoding returns an empty candidate after
  // 75-95s on Vertex. Both options must stay off the grounded calls.
  const groundedCalls = gemini.split("googleSearch").slice(1);
  assert.ok(groundedCalls.length >= 2);
  for (const call of groundedCalls) {
    // The option being set, not the comments warning against setting it.
    const config = call.slice(0, 600);
    assert.doesNotMatch(config, /responseMimeType:/);
    assert.doesNotMatch(config, /maxOutputTokens:/);
  }
});

test("preview failures name their cause instead of one generic message", () => {
  assert.match(gemini, /function previewFailureMessage/);
  assert.match(gemini, /rate limiting us right now/);
  assert.match(gemini, /took too long this time/);
  assert.match(gemini, /misconfigured on the server/);
  // Stage outcomes are logged, so production can be diagnosed from pm2 logs.
  assert.match(gemini, /\[lead-preview\] stage=\$\{stage\}/);
});

test("the Gemini diagnostics job reports runtime config without leaking secrets", () => {
  const diagnostics = read("src/app/api/jobs/gemini-diagnostics/route.ts");
  assert.match(diagnostics, /CRON_SECRET \|\| process\.env\.AUTOMATION_JOB_SECRET/);
  assert.match(diagnostics, /bearerOrHeaderSecretMatches/);
  assert.match(gemini, /export async function runGeminiDiagnostics/);
  // Reports which credential path is in use, never the credential itself.
  assert.match(gemini, /hasServiceAccount/);
  assert.doesNotMatch(gemini.slice(gemini.indexOf("runGeminiDiagnostics")), /apiKey:|private_key/);
});
