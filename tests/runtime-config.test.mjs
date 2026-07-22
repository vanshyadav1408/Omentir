import assert from "node:assert/strict";
import test from "node:test";
import { getAppBaseUrl, validateRuntimeConfig } from "../src/lib/server/runtime-config.ts";

const local = {
  RUN_LOCALLY: "TRUE",
  APP_BASE_URL: "http://localhost:3000",
  LOCAL_APP_PASSWORD: "correct-horse-battery",
  LOCAL_SESSION_SECRET: "abcdefghijklmnopqrstuvwxyzABCDEF123456", // gitleaks:allow deterministic fixture
  FIREBASE_PROJECT_ID: "test-project",
  FIREBASE_SERVICE_ACCOUNT_KEY: JSON.stringify({
    project_id: "test-project",
    client_email: "test@test-project.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n", // gitleaks:allow invalid fixture
  }),
  UNIPILE_DSN: "https://example.unipile.com",
  UNIPILE_API_KEY: "unipile-test-api-key",
  UNIPILE_WEBHOOK_SECRET: "unipile-test-webhook-secret",
  GEMINI_API_KEY: "gemini-test-api-key",
  CRON_SECRET: "cron-secret-with-enough-entropy-12345", // gitleaks:allow deterministic fixture
};

test("local configuration fails loudly instead of falling back to omentir.com", () => {
  assert.throws(() => getAppBaseUrl({ RUN_LOCALLY: "TRUE" }), /APP_BASE_URL/);
  assert.throws(() => validateRuntimeConfig({ ...local, LOCAL_SESSION_SECRET: "short" }), /at least 32/);
  assert.throws(() => validateRuntimeConfig({ ...local, FIREBASE_SERVICE_ACCOUNT_KEY: "" }), /FIREBASE_SERVICE_ACCOUNT_KEY/);
  assert.throws(() => validateRuntimeConfig({ ...local, FIREBASE_SERVICE_ACCOUNT_KEY: "not-json" }), /not valid JSON/);
});

test("disabled automation permits a local instance without a cron secret", () => {
  const withoutCron = { ...local };
  delete withoutCron.CRON_SECRET;
  assert.equal(validateRuntimeConfig({ ...withoutCron, AUTOMATION_DISABLED: "true" }).mode, "local");
});

test("local password is optional but validated when configured", () => {
  assert.equal(validateRuntimeConfig({ ...local, LOCAL_APP_PASSWORD: "" }).mode, "local");
  assert.throws(
    () => validateRuntimeConfig({ ...local, LOCAL_APP_PASSWORD: "short" }),
    /at least 12/,
  );
});

test("published placeholders can never satisfy local startup validation", () => {
  assert.throws(
    () => validateRuntimeConfig({ ...local, LOCAL_APP_PASSWORD: "replace-with-at-least-12-characters" }), // gitleaks:allow documented placeholder
    /placeholder value/,
  );
  assert.throws(
    () => validateRuntimeConfig({ ...local, LOCAL_SESSION_SECRET: "replace-with-at-least-32-random-characters" }), // gitleaks:allow documented placeholder
    /placeholder value/,
  );
  assert.throws(
    () => validateRuntimeConfig({ ...local, UNIPILE_API_KEY: "replace-me" }),
    /placeholder value/,
  );
  assert.throws(
    () => validateRuntimeConfig({ ...local, GEMINI_API_KEY: "replace-me" }),
    /placeholder value/,
  );
  assert.throws(
    () => validateRuntimeConfig({ ...local, CRON_SECRET: "replace-with-a-long-random-secret" }), // gitleaks:allow documented placeholder
    /placeholder value/,
  );
});

test("hosted mode requires Clerk configuration but not local credentials", () => {
  assert.throws(() => validateRuntimeConfig({}), /NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/);
  assert.deepEqual(
    validateRuntimeConfig({
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test",
      CLERK_SECRET_KEY: "sk_test",
      NEXT_PUBLIC_APP_URL: "https://omentir.com",
    }),
    { mode: "hosted", appBaseUrl: "https://omentir.com" },
  );
});

test("plain HTTP is accepted only for localhost", () => {
  assert.equal(getAppBaseUrl(local), "http://localhost:3000");
  assert.throws(() => getAppBaseUrl({ APP_BASE_URL: "http://192.168.1.5:3000" }), /HTTPS/);
});
