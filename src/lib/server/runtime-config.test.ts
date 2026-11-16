import { expect, test } from "bun:test";
import { validateRuntimeConfig } from "./runtime-config";

const localEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "development",
  RUN_LOCALLY: "TRUE",
  LOCAL_SESSION_SECRET: "local-session-secret-0123456789-abcdefghijklmnopqrstuvwxyz",
  LOCAL_APP_PASSWORD: "local-password-0123456789",
  APP_BASE_URL: "http://localhost:3000",
  FIREBASE_PROJECT_ID: "test-project",
  FIREBASE_SERVICE_ACCOUNT_KEY: JSON.stringify({ project_id: "test-project", client_email: "test@example.com", private_key: "test" }),
  GEMINI_API_KEY: "gemini-test-key",
  AUTOMATION_DISABLED: "true",
  LINKEDIN_SESSION_KEY: Buffer.alloc(32, 7).toString("base64"),
};

test("self-hosting needs no paid LinkedIn API provider", () => {
  expect(validateRuntimeConfig(localEnv).mode).toBe("local");
});

// Every LinkedIn account runs on the own client now, so a hosted server
// without the session key must refuse to start rather than fail on each call.
test("hosted mode also refuses to start without the LinkedIn session key", () => {
  const hosted = {
    NODE_ENV: "development",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
    CLERK_SECRET_KEY: "sk_test_example",
    AUTOMATION_DISABLED: "true",
  } as NodeJS.ProcessEnv;
  expect(() => validateRuntimeConfig(hosted)).toThrow("LINKEDIN_SESSION_KEY");
  expect(validateRuntimeConfig({ ...hosted, LINKEDIN_SESSION_KEY: localEnv.LINKEDIN_SESSION_KEY }).mode).toBe("hosted");
});

test("an invalid session key prevents startup before any customer's session can be lost", () => {
  for (const key of ["", Buffer.alloc(16).toString("base64")]) {
    expect(() => validateRuntimeConfig({ ...localEnv, LINKEDIN_SESSION_KEY: key })).toThrow("LINKEDIN_SESSION_KEY");
  }
});

test("production cannot start the own client without its account proxy", () => {
  expect(() => validateRuntimeConfig({ ...localEnv, NODE_ENV: "production" })).toThrow("LINKEDIN_PROXY_URL");
  expect(validateRuntimeConfig({ ...localEnv, NODE_ENV: "production", LINKEDIN_PROXY_URL: "http://user-session-{session}:pass@proxy.example.com:7000" }).mode).toBe("local");
});

test("a configured proxy must be a usable HTTP URL", () => {
  expect(() => validateRuntimeConfig({ ...localEnv, LINKEDIN_PROXY_URL: "file:///tmp/proxy" })).toThrow("LINKEDIN_PROXY_URL");
});

// Caught at startup instead of on every LinkedIn request.
test("a per-country proxy URL needs a default country for accounts whose country is unknown", () => {
  const perCountry = "http://customer-u-cc-{country}-sessid-{session}:p@pr.example.com:7777";
  expect(() => validateRuntimeConfig({ ...localEnv, LINKEDIN_PROXY_URL: perCountry })).toThrow("LINKEDIN_PROXY_COUNTRY");
  expect(validateRuntimeConfig({ ...localEnv, LINKEDIN_PROXY_URL: perCountry, LINKEDIN_PROXY_COUNTRY: "IN" }).mode).toBe("local");
});

test("the static IP pool URL must name the port each IP lives on", () => {
  expect(() => validateRuntimeConfig({ ...localEnv, LINKEDIN_ISP_PROXY_URL: "http://user-u:p@isp.example.com:8001" })).toThrow("{port}");
  expect(() => validateRuntimeConfig({ ...localEnv, LINKEDIN_ISP_PROXY_URL: "socks5://user-u:p@isp.example.com:{port}" })).toThrow("LINKEDIN_ISP_PROXY_URL");
  expect(validateRuntimeConfig({ ...localEnv, LINKEDIN_ISP_PROXY_URL: "http://user-u:p@isp.example.com:{port}" }).mode).toBe("local");
});

test("buying IPs needs a pool URL that reaches each IP's own address, and a real budget", () => {
  const keys = { BYTEFUL_API_PUBLIC_KEY: "pub", BYTEFUL_API_PRIVATE_KEY: "priv" };
  expect(() => validateRuntimeConfig({ ...localEnv, ...keys })).toThrow("{host}");
  expect(() => validateRuntimeConfig({ ...localEnv, ...keys, LINKEDIN_ISP_PROXY_URL: "http://u:p@isp.example.com:{port}" })).toThrow("{host}");
  const ok = { ...localEnv, ...keys, LINKEDIN_ISP_PROXY_URL: "http://u:p@{host}:{port}" };
  expect(validateRuntimeConfig(ok).mode).toBe("local");
  expect(() => validateRuntimeConfig({ ...ok, LINKEDIN_PROXY_MONTHLY_BUDGET_USD: "fifty" })).toThrow("LINKEDIN_PROXY_MONTHLY_BUDGET_USD");
  expect(validateRuntimeConfig({ ...ok, LINKEDIN_PROXY_MONTHLY_BUDGET_USD: "50" }).mode).toBe("local");
});
