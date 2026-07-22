import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("website fetching connects to the public address that passed SSRF validation", () => {
  const website = source("../src/lib/server/website.ts");
  assert.match(website, /const addresses = await publicAddresses\(url\)/);
  assert.match(website, /lookup: \(_hostname, _options, callback\)/);
  assert.match(website, /callback\(null, selected\.address, selected\.family\)/);
  assert.doesNotMatch(website, /fetch\(current/);
});

test("provider account callbacks are one-time and never carry a shared secret in the URL", () => {
  const start = source("../src/app/api/connect/linkedin/route.ts");
  const callback = source("../src/app/api/connect/callback/route.ts");
  assert.match(start, /createLinkedInConnectToken\(userId\)/);
  assert.doesNotMatch(start, /searchParams\.set\("secret"/);
  assert.match(callback, /consumeLinkedInConnectToken\(payload\.name\)/);
  assert.match(callback, /listUnipileLinkedInAccounts/);
});

test("users cannot register an arbitrary provider account through a server action", () => {
  const actions = source("../src/app/actions.ts");
  assert.doesNotMatch(actions, /export async function saveLinkedInAccountAction/);
  assert.doesNotMatch(actions, /export async function connectLinkedInAccountAction/);
});

test("agent tokens stay out of URLs", () => {
  const agentApi = source("../src/lib/server/agent-api.ts");
  assert.match(agentApi, /authorization\.match/);
  assert.doesNotMatch(agentApi, /searchParams\.get\("key"\)/);
});

test("public cost controls include a global ceiling and bounded request bodies", () => {
  const limiter = source("../src/lib/request-rate-limit.ts");
  const analysis = source("../src/app/api/website-analysis/route.ts");
  const survey = source("../src/app/api/surveys/submit/route.ts");
  assert.match(limiter, /MAX_BUCKETS = 4096/);
  assert.match(limiter, /`\$\{scope\}:global`/);
  assert.match(analysis, /rateLimitRequest\(request, "website-analysis"/);
  assert.match(analysis, /readJsonBody<\{ websiteUrl\?: string \}>\(request, 8 \* 1024\)/);
  assert.match(survey, /rateLimitRequest\(request, "survey-submit"/);
  assert.match(survey, /readJsonBody<SubmitBody>\(request, 64 \* 1024\)/);
});

test("the container base is immutable and private offer assets cannot enter its context", () => {
  const dockerfile = source("../Dockerfile");
  const dockerignore = source("../.dockerignore");
  assert.match(dockerfile, /node:22-alpine@sha256:[a-f0-9]{64}/);
  assert.match(dockerignore, /^public\/offer-letter-\*$/m);
});
