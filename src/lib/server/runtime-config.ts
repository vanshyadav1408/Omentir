import { isAutomationDisabled, isLocalMode, isLocalPasswordRequired } from "../runtime-mode.ts";
import { parseSessionKey } from "./linkedin-own/session-crypto";

function required(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`[config] ${name} is required.`);
  return value;
}

function rejectPlaceholder(value: string, name: string) {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "replace-me" ||
    normalized.startsWith("replace-with-") ||
    normalized.includes("your-firebase-project")
  ) {
    throw new Error(`[config] ${name} still contains a placeholder value.`);
  }
  return value;
}

function requiredSecret(env: NodeJS.ProcessEnv, name: string) {
  return rejectPlaceholder(required(env, name), name);
}

export function parseServiceAccountJson(raw: string) {
  rejectPlaceholder(raw, "FIREBASE_SERVICE_ACCOUNT_KEY");
  let parsed: Record<string, unknown> & { project_id?: string; client_email?: string; private_key?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    try {
      parsed = JSON.parse(raw.replace(/\\n/g, "\n"));
    } catch {
      throw new Error("[config] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.");
    }
  }
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error("[config] FIREBASE_SERVICE_ACCOUNT_KEY is missing project_id, client_email, or private_key.");
  }
  return parsed;
}

function requireEntropy(value: string, name: string, minimumLength: number, minimumUnique: number) {
  if (value.length < minimumLength || new Set(value).size < minimumUnique) {
    throw new Error(`[config] ${name} must be at least ${minimumLength} characters and high entropy.`);
  }
}

function validateBaseUrl(raw: string) {
  const url = new URL(raw);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new Error("[config] APP_BASE_URL must use HTTPS unless it points to localhost.");
  }
  return url.toString().replace(/\/$/, "");
}

export function getAppBaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const configured = env.APP_BASE_URL?.trim();
  if (configured) return validateBaseUrl(configured);
  if (isLocalMode(env)) throw new Error("[config] APP_BASE_URL is required in local mode.");
  return (env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_SITE_URL || "https://omentir.com").replace(/\/$/, "");
}

export function validateRuntimeConfig(env: NodeJS.ProcessEnv = process.env) {
  parseSessionKey(requiredSecret(env, "LINKEDIN_SESSION_KEY"));
  const proxy = env.LINKEDIN_PROXY_URL?.trim();
  if (env.NODE_ENV === "production" && !proxy) {
    throw new Error("[config] LINKEDIN_PROXY_URL is required for the LinkedIn client in production.");
  }
  if (proxy) {
    const url = new URL(proxy.replaceAll("{session}", "config-check").replaceAll("{country}", "US").replaceAll("{country_lower}", "us"));
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("[config] LINKEDIN_PROXY_URL must use HTTP or HTTPS.");
    }
    // Accounts whose country is unknown still need one, or every request
    // through a {country} URL fails.
    if ((proxy.includes("{country}") || proxy.includes("{country_lower}")) && !/^[A-Za-z]{2}$/.test(env.LINKEDIN_PROXY_COUNTRY?.trim() || "")) {
      throw new Error("[config] LINKEDIN_PROXY_URL uses {country}, so LINKEDIN_PROXY_COUNTRY must be a two-letter country code.");
    }
  }
  const ispProxy = env.LINKEDIN_ISP_PROXY_URL?.trim();
  // Bought IPs each have their own address, which only a {host} URL reaches.
  if (env.BYTEFUL_API_PUBLIC_KEY?.trim() && !ispProxy?.includes("{host}")) {
    throw new Error("[config] BYTEFUL_API_PUBLIC_KEY is set, so LINKEDIN_ISP_PROXY_URL must be http://USER:PASS@{host}:{port} with the Byteful proxy user.");
  }
  const budget = env.LINKEDIN_PROXY_MONTHLY_BUDGET_USD?.trim();
  if (budget && !(Number(budget) > 0)) {
    throw new Error("[config] LINKEDIN_PROXY_MONTHLY_BUDGET_USD must be a positive number of US dollars.");
  }
  if (ispProxy) {
    if (!ispProxy.includes("{port}")) {
      throw new Error("[config] LINKEDIN_ISP_PROXY_URL needs a {port} placeholder (one port per static IP).");
    }
    const url = new URL(ispProxy.replaceAll("{host}", "203.0.113.1").replaceAll("{port}", "8001"));
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("[config] LINKEDIN_ISP_PROXY_URL must use HTTP or HTTPS.");
    }
  }
  if (!isLocalMode(env)) {
    required(env, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    required(env, "CLERK_SECRET_KEY");
    if (!isAutomationDisabled(env)) {
      const configuredCronSecret = (env.CRON_SECRET || env.AUTOMATION_JOB_SECRET)?.trim();
      if (!configuredCronSecret) {
        throw new Error("[config] CRON_SECRET is required unless AUTOMATION_DISABLED=true.");
      }
      rejectPlaceholder(configuredCronSecret, "CRON_SECRET");
      requireEntropy(configuredCronSecret, "CRON_SECRET", 24, 10);
    }
    return { mode: "hosted" as const, appBaseUrl: getAppBaseUrl(env) };
  }

  const sessionSecret = requiredSecret(env, "LOCAL_SESSION_SECRET");
  // Password is required unless LOCAL_ALLOW_OPEN_ACCESS=true (explicit opt-in).
  if (isLocalPasswordRequired(env)) {
    const password = requiredSecret(env, "LOCAL_APP_PASSWORD");
    requireEntropy(password, "LOCAL_APP_PASSWORD", 12, 6);
  }
  requireEntropy(sessionSecret, "LOCAL_SESSION_SECRET", 32, 12);

  required(env, "FIREBASE_PROJECT_ID");
  const serviceAccount = parseServiceAccountJson(required(env, "FIREBASE_SERVICE_ACCOUNT_KEY"));
  if (serviceAccount.project_id !== env.FIREBASE_PROJECT_ID) {
    throw new Error("[config] FIREBASE_PROJECT_ID must match the service account project_id.");
  }
  if (env.GEMINI_API_KEY?.trim()) {
    rejectPlaceholder(env.GEMINI_API_KEY, "GEMINI_API_KEY");
  } else {
    required(env, "GOOGLE_CLOUD_PROJECT");
    required(env, "GOOGLE_CLOUD_LOCATION");
  }
  if (!isAutomationDisabled(env)) {
    const configuredCronSecret = (env.CRON_SECRET || env.AUTOMATION_JOB_SECRET)?.trim();
    if (!configuredCronSecret) {
      throw new Error("[config] CRON_SECRET is required unless AUTOMATION_DISABLED=true.");
    }
    const cronSecret = rejectPlaceholder(configuredCronSecret, "CRON_SECRET");
    requireEntropy(cronSecret, "CRON_SECRET", 24, 10);
  }

  return { mode: "local" as const, appBaseUrl: getAppBaseUrl(env) };
}
