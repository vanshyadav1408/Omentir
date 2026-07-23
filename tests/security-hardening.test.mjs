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

test("provider account callbacks use one-time tokens without URL secrets", () => {
  const start = source("../src/app/api/connect/linkedin/route.ts");
  const callback = source("../src/app/api/connect/callback/route.ts");
  assert.match(start, /createLinkedInConnectToken\(userId\)/);
  assert.doesNotMatch(start, /UNIPILE_WEBHOOK_SECRET|searchParams\.set/);
  assert.match(callback, /consumeLinkedInConnectToken\(payload\.name\)/);
  assert.doesNotMatch(callback, /searchParams\.get|UNIPILE_WEBHOOK_SECRET/);
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
  assert.match(agentApi, /rateLimitRequestShared/);
  assert.match(agentApi, /sourceKey: `\$\{authenticated\.workspace\.id\}:\$\{authenticated\.key\.id\}`/);
  assert.match(agentApi, /readAgentApiJsonBody|readJsonBody/);
});

test("public cost controls include shared ceilings and bounded request bodies", () => {
  const limiter = source("../src/lib/request-rate-limit.ts");
  const firestoreIndexes = source("../firestore.indexes.json");
  const analysis = source("../src/app/api/website-analysis/route.ts");
  const preview = source("../src/app/api/website-preview/route.ts");
  const leadPreview = source("../src/app/api/onboarding/lead-preview/route.ts");
  const survey = source("../src/app/api/surveys/submit/route.ts");
  assert.match(limiter, /MAX_BUCKETS = 4096/);
  assert.match(limiter, /`\$\{scope\}:global`/);
  assert.match(limiter, /rateLimitRequestShared/);
  assert.match(limiter, /collection\("rateLimits"\)/);
  assert.match(limiter, /expiresAt:/);
  assert.match(firestoreIndexes, /"collectionGroup": "rateLimits"/);
  assert.match(firestoreIndexes, /"ttl": true/);
  assert.match(analysis, /rateLimitRequestShared\(request, "website-analysis"/);
  assert.match(analysis, /sourceKey: userId/);
  assert.match(analysis, /if \(!userId\)/);
  assert.match(analysis, /readJsonBody<\{ websiteUrl\?: string \}>\(request, 8 \* 1024\)/);
  assert.match(preview, /if \(!userId\)/);
  assert.match(preview, /rateLimitRequestShared\(request, "website-preview"/);
  assert.match(leadPreview, /rateLimitRequestShared\(request, "lead-preview"/);
  assert.match(survey, /rateLimitRequestShared\(request, "survey-submit"/);
  assert.match(survey, /readJsonBody<SubmitBody>\(request, 64 \* 1024\)/);
});

test("job secrets use constant-time comparison", () => {
  const tick = source("../src/app/api/jobs/automation-tick/route.ts");
  const backfill = source("../src/app/api/jobs/mailing-list-backfill/route.ts");
  assert.match(tick, /bearerOrHeaderSecretMatches/);
  assert.match(backfill, /bearerOrHeaderSecretMatches/);
  assert.doesNotMatch(tick, /auth === `Bearer \$\{secret\}`/);
  assert.doesNotMatch(backfill, /cronSecret === secret/);
});

test("Whop activation fails closed without configured plan ids", () => {
  const whop = source("../src/app/api/webhooks/whop/route.ts");
  assert.match(whop, /no WHOP_\*_PLAN_ID configured/);
  assert.doesNotMatch(whop, /if \(!hasConfiguredPlan\) return "startup"/);
});

test("docker compose binds the app port to loopback by default", () => {
  const compose = source("../docker-compose.yml");
  assert.match(compose, /127\.0\.0\.1:3000:3000/);
});

test("CSP includes form-action and framing controls", () => {
  const config = source("../next.config.ts");
  assert.match(config, /form-action 'self'/);
  assert.match(config, /frame-ancestors 'none'/);
  assert.match(config, /object-src 'none'/);
  assert.match(config, /base-uri 'self'/);
  assert.doesNotMatch(config, /unsafe-inline|unsafe-eval/);
});

test("the container base is immutable and private offer assets cannot enter its context", () => {
  const dockerfile = source("../Dockerfile");
  const dockerignore = source("../.dockerignore");
  assert.match(dockerfile, /node:22-alpine@sha256:[a-f0-9]{64}/);
  assert.match(dockerignore, /^public\/offer-letter-\*$/m);
});
