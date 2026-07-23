import { isAutomationDisabled, isLocalMode, isLocalPasswordRequired } from "../runtime-mode.ts";

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
  if (!isLocalMode(env)) {
    required(env, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    required(env, "CLERK_SECRET_KEY");
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
  rejectPlaceholder(required(env, "UNIPILE_DSN"), "UNIPILE_DSN");
  requiredSecret(env, "UNIPILE_API_KEY");
  requiredSecret(env, "UNIPILE_WEBHOOK_SECRET");
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
