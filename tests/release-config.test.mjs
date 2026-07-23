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
const firebaseConfig = readFileSync(new URL("../firebase.json", import.meta.url), "utf8");
const firestoreRules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");

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

test("direct Firestore clients are denied because all application data uses the Admin SDK", () => {
  assert.match(firebaseConfig, /"rules": "firestore\.rules"/);
  assert.match(firestoreRules, /allow read, write: if false;/);
  assert.doesNotMatch(firestoreRules, /if true|request\.auth/);
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

test("private infrastructure does not ship in the public application repository", () => {
  assert.equal(existsSync(privateDeployWorkflow), false);
  assert.equal(existsSync(publicDeployWorkflow), false);
});
