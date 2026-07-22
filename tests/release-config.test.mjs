import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
const snapshotScript = readFileSync(
  new URL("../scripts/create-public-snapshot.sh", import.meta.url),
  "utf8",
);
const publicDeployWorkflow = new URL("../.github/workflows/deploy-production.yml", import.meta.url);
const privateDeployWorkflow = new URL("../private-infra/deploy-production.yml", import.meta.url);
const hostedIdentity = readFileSync(
  new URL("../src/lib/hosted-identity.ts", import.meta.url),
  "utf8",
);

test("the public environment template cannot start with known credentials", () => {
  for (const name of [
    "LOCAL_APP_PASSWORD",
    "LOCAL_SESSION_SECRET",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_SERVICE_ACCOUNT_KEY",
    "UNIPILE_DSN",
    "UNIPILE_API_KEY",
    "UNIPILE_WEBHOOK_SECRET",
    "GEMINI_API_KEY",
    "CRON_SECRET",
  ]) {
    assert.match(envExample, new RegExp(`^${name}=$`, "m"), `${name} must be blank in .env.example`);
  }
});

test("the public application repository contains no production deployment workflow", () => {
  assert.equal(existsSync(publicDeployWorkflow), false);
});

test("hosted provider identifiers are supplied by deployment config, not source", () => {
  assert.doesNotMatch(hostedIdentity, /\b(?:biz|prod|plan)_[A-Za-z0-9_-]{8,}\b/);
  assert.doesNotMatch(hostedIdentity, /\bphc_[A-Za-z0-9_-]{16,}\b/);
  assert.doesNotMatch(hostedIdentity, /\bAIza[A-Za-z0-9_-]{20,}\b/);
});

test("snapshot creation refuses existing content and never deletes the destination", () => {
  assert.match(snapshotScript, /snapshot destination must be new or empty/);
  assert.doesNotMatch(snapshotScript, /--delete|\brm\s+-/);
  for (const privatePath of [
    "AGENTS.md",
    "BLOG_GENERATION.md",
    "CLAUDE.md",
    "Design Prompt.md",
    "OPEN_SOURCE.md",
    "solution.md",
    "private-infra",
    "scripts/grant-subscription.mjs",
    "scripts/inspect-user.mjs",
    "scripts/send-test-welcome.mjs",
    "src/app/whop-analytics.tsx",
  ]) {
    assert.match(snapshotScript, new RegExp(`"${privatePath.replaceAll(".", "\\.")}"`));
  }
});

test("a staged private deployment verifies and deploys the same approved application commit", () => {
  if (!existsSync(privateDeployWorkflow)) {
    assert.equal(existsSync(publicDeployWorkflow), false);
    return;
  }
  const deployWorkflow = readFileSync(privateDeployWorkflow, "utf8");
  assert.doesNotMatch(deployWorkflow, /^\s+push:/m, "production deployment must not run on every push");
  assert.match(
    deployWorkflow,
    /repository: \$\{\{ steps\.commit\.outputs\.app_repository \}\}/,
    "verification must check out from the explicitly selected public application repository",
  );
  assert.match(
    deployWorkflow,
    /ref: \$\{\{ steps\.commit\.outputs\.app_commit_sha \}\}/,
    "verification must check out the requested application commit",
  );
  assert.match(
    deployWorkflow,
    /APP_REPOSITORY: \$\{\{ needs\.verify\.outputs\.app_repository \}\}/,
    "deployment must consume the repository verified by the previous job",
  );
  assert.match(
    deployWorkflow,
    /APP_COMMIT_SHA: \$\{\{ needs\.verify\.outputs\.app_commit_sha \}\}/,
    "deployment must consume the SHA verified by the previous job",
  );
  assert.ok(
    deployWorkflow.indexOf("Check out requested application commit") < deployWorkflow.indexOf("npm ci"),
    "dependencies must be installed from the requested application commit",
  );
});
