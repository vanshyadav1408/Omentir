
export const LOCAL_SESSION_COOKIE = "omentir_local_session";
export const LOCAL_USER_ID = "local";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function encode(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
}

async function signature(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const result = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return encode(String.fromCharCode(...new Uint8Array(result)));
}

function constantTimeEqual(left: string, right: string) {
  const size = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < size; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

export async function createLocalSession(secret: string, now = Date.now()) {
  const payload = encode(JSON.stringify({ sub: LOCAL_USER_ID, exp: Math.floor(now / 1000) + SESSION_SECONDS }));
  return `${payload}.${await signature(payload, secret)}`;
}

export async function verifyLocalSession(token: string | undefined, secret: string, now = Date.now()) {
  if (!token || !secret) return false;
  const [payload, supplied, extra] = token.split(".");
  if (!payload || !supplied || extra) return false;
  const expected = await signature(payload, secret);
  if (!constantTimeEqual(supplied, expected)) return false;
  try {
    const value = JSON.parse(decode(payload)) as { sub?: string; exp?: number };
    return value.sub === LOCAL_USER_ID && typeof value.exp === "number" && value.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export function localCookieOptions(env: NodeJS.ProcessEnv = process.env) {
  const baseUrl = new URL(env.APP_BASE_URL || "http://localhost");
  return {
    httpOnly: true,
    secure: baseUrl.protocol === "https:",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

export function passwordsMatch(supplied: string, expected: string) {
  return constantTimeEqual(supplied, expected);
}
