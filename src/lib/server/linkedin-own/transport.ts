// HTTP transport for the own LinkedIn client.
//
// Rules that keep accounts safe:
// - One proxy per account (a static IP from the pool, or a sticky
//   residential session), so LinkedIn sees one stable home-like IP per
//   person instead of every customer on one VPS IP.
//   Production refuses to send without a proxy.
// - The browser's own user agent, csrf token and cookies, so requests look
//   like the person's logged-in browser tab.
// - Requests per account run one at a time with human-like jittered gaps.
// - Only an explicit HTTP rejection becomes LinkedInResponseError. A timeout
//   or dropped connection after a write left the browser stays a plain Error,
//   because the invite/message may have gone out (automation parks those
//   instead of retrying).

import { createRequire } from "node:module";
import { LinkedInResponseError } from "../linkedin-errors";
import { ACCEPT_NORMALIZED, VOYAGER_BASE } from "./endpoints";

const TIMEOUT_MS = 30_000;
const READ_GAP_MS: [number, number] = [1_200, 2_800];
const WRITE_GAP_MS: [number, number] = [3_000, 6_500];
const CLIENT_VERSION = "1.13.37";

// The exit IP an account uses. proxyPort (with proxyHost when the IP has its
// own address) is a static IP of its own from the proxy pool
// (proxy-pool.ts); without one the account uses the sticky residential
// session proxySessionId, in proxyCountry.
export type ProxyIdentity = {
  proxySessionId: string;
  proxyPort?: number;
  proxyHost?: string;
  proxyCountry?: string;
};

export function proxyIdentityOf(value: ProxyIdentity): ProxyIdentity {
  return {
    proxySessionId: value.proxySessionId,
    ...(value.proxyPort ? { proxyPort: value.proxyPort } : {}),
    ...(value.proxyPort && value.proxyHost ? { proxyHost: value.proxyHost } : {}),
    ...(value.proxyCountry ? { proxyCountry: value.proxyCountry } : {}),
  };
}

export type OwnSession = ProxyIdentity & {
  accountId: string;
  memberId: string;
  cookies: Record<string, string>;
  userAgent: string;
  legacyAccountId?: string;
  version?: string;
  cookieRevision?: number;
  timezone?: string;
};

export type VoyagerRequest = {
  method?: "GET" | "POST" | "DELETE";
  path: string;
  body?: unknown;
  accept?: string;
  write?: boolean;
};

export type SessionHooks = {
  // Cookies LinkedIn rotated on a response (li_at refresh, lidc); persisted so
  // the next process start does not reuse a stale jar.
  onCookiesChanged?: (cookies: Record<string, string>, revision?: number) => void;
  // The session is dead (logged out, checkpoint, csrf mismatch).
  onSessionExpired?: (reason: string) => void;
};

// ---------------------------------------------------------------- cookies

export function parseCookieHeader(header: string) {
  const cookies: Record<string, string> = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name && value) cookies[name] = value;
  }
  return cookies;
}

export function serializeCookies(cookies: Record<string, string>) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

// JSESSIONID is stored quoted ("ajax:123"); the csrf-token header is the bare value.
export function csrfToken(cookies: Record<string, string>) {
  return (cookies.JSESSIONID || "").replace(/^"|"$/g, "");
}

export function requireSessionCookies(cookies: Record<string, string>) {
  if (!cookies.li_at) throw new Error("The li_at cookie is missing.");
  if (!csrfToken(cookies).startsWith("ajax:")) {
    throw new Error("The JSESSIONID cookie is missing or malformed.");
  }
}

// Applies Set-Cookie headers. Returns the changed jar, or null when nothing
// that matters changed. A deleted li_at means LinkedIn logged the session out.
export function mergeSetCookies(cookies: Record<string, string>, setCookies: string[]) {
  let changed = false;
  const next = { ...cookies };
  for (const header of setCookies) {
    const [pair, ...attributes] = header.split(";");
    const index = pair.indexOf("=");
    if (index <= 0) continue;
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    const expired =
      !value ||
      value === '""' ||
      value.toLowerCase() === "delete me" ||
      attributes.some((attribute) => {
        const [key, raw] = attribute.split("=");
        if (key?.trim().toLowerCase() === "max-age") return Number(raw) <= 0;
        if (key?.trim().toLowerCase() === "expires") {
          const at = Date.parse(raw || "");
          return Number.isFinite(at) && at < Date.now();
        }
        return false;
      });
    if (expired) {
      if (name in next) {
        delete next[name];
        changed = true;
      }
      continue;
    }
    if (next[name] !== value) {
      next[name] = value;
      changed = true;
    }
  }
  return changed ? next : null;
}

// ---------------------------------------------------------------- proxy

function proxyUnconfigured(name: string) {
  return new LinkedInResponseError(
    503,
    `LinkedIn proxy is not configured (${name}).`,
    JSON.stringify({ type: "errors/provider_unconfigured" }),
  );
}

// An account with a static IP from the pool goes through
// LINKEDIN_ISP_PROXY_URL with its {host} (when the IP has its own address)
// and {port}, e.g. http://USER:pass@{host}:{port}. Every other account uses
// LINKEDIN_PROXY_URL, a sticky residential URL with a {session} placeholder
// and an optional {country} or {country_lower} one, e.g.
// http://USER_c_{country_lower}_s_{session}:pass@residential.byteful.com:8000.
export function proxyUrlForSession(identity: ProxyIdentity, env: NodeJS.ProcessEnv = process.env) {
  const production = env.NODE_ENV === "production";
  if (identity.proxyPort) {
    const template = env.LINKEDIN_ISP_PROXY_URL?.trim();
    if (template) {
      // A URL without {host} would send an IP-specific port to some other
      // host: refuse rather than reach LinkedIn from an unknown IP.
      if (template.includes("{host}") !== Boolean(identity.proxyHost)) throw proxyUnconfigured("LINKEDIN_ISP_PROXY_URL");
      return template.replaceAll("{host}", identity.proxyHost || "").replaceAll("{port}", String(identity.proxyPort));
    }
    // Never quietly move an account off its own IP onto a shared one.
    if (production) throw proxyUnconfigured("LINKEDIN_ISP_PROXY_URL");
    return undefined;
  }
  const template = env.LINKEDIN_PROXY_URL?.trim();
  if (!template) {
    if (production) throw proxyUnconfigured("LINKEDIN_PROXY_URL");
    return undefined;
  }
  const country = (identity.proxyCountry || env.LINKEDIN_PROXY_COUNTRY?.trim() || "").toUpperCase();
  if ((template.includes("{country}") || template.includes("{country_lower}")) && !country) throw proxyUnconfigured("LINKEDIN_PROXY_COUNTRY");
  return template
    .replaceAll("{session}", encodeURIComponent(identity.proxySessionId))
    .replaceAll("{country}", country)
    .replaceAll("{country_lower}", country.toLowerCase());
}

const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== "undefined";
const nodeProxyDispatchers = new Map<string, { close?: () => Promise<void> }>();

function getNodeProxyDispatcher(proxyUrl: string) {
  const existing = nodeProxyDispatchers.get(proxyUrl);
  if (existing) return existing;
  try {
    const require = createRequire(import.meta.url);
    const { ProxyAgent } = require("undici") as { ProxyAgent: new (url: string) => { close?: () => Promise<void> } };
    if (nodeProxyDispatchers.size >= 64) {
      const oldest = nodeProxyDispatchers.keys().next().value;
      if (oldest) {
        nodeProxyDispatchers.get(oldest)?.close?.().catch(() => undefined);
        nodeProxyDispatchers.delete(oldest);
      }
    }
    const dispatcher = new ProxyAgent(proxyUrl);
    nodeProxyDispatchers.set(proxyUrl, dispatcher);
    return dispatcher;
  } catch {
    throw new LinkedInResponseError(
      503,
      "Proxied LinkedIn requests require Bun or Node with undici.",
      JSON.stringify({ type: "errors/provider_unconfigured" }),
    );
  }
}

export function fetchOptionsForProxy(proxyUrl: string | undefined): Record<string, unknown> {
  if (!proxyUrl) return {};
  // Bun's fetch takes `{ proxy }`; Node's fetch (next dev) takes an undici `{ dispatcher }`.
  if (!isBun) {
    return { dispatcher: getNodeProxyDispatcher(proxyUrl) };
  }
  return { proxy: proxyUrl };
}

// ---------------------------------------------------------------- pacing

const accountQueues = new Map<string, Promise<void>>();
const nextRequestAt = new Map<string, number>();

function jitter([min, max]: [number, number]) {
  return min + Math.floor(Math.random() * (max - min));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Runs `task` after every earlier request for this account has finished and
// the account's human-like gap has passed.
export async function runPaced<T>(
  accountId: string,
  write: boolean,
  task: () => Promise<T>,
  gaps = { read: READ_GAP_MS, write: WRITE_GAP_MS },
) {
  const previous = accountQueues.get(accountId) || Promise.resolve();
  let release = () => {};
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = previous.then(() => current);
  accountQueues.set(accountId, chained);

  await previous;
  try {
    const waitMs = (nextRequestAt.get(accountId) || 0) - Date.now();
    if (waitMs > 0) await wait(waitMs);
    return await task();
  } finally {
    nextRequestAt.set(accountId, Math.max(nextRequestAt.get(accountId) || 0, Date.now() + jitter(write ? gaps.write : gaps.read)));
    release();
    if (accountQueues.get(accountId) === chained) accountQueues.delete(accountId);
  }
}

// After a 429 the whole account backs off, not just the failed call.
function deferAccount(accountId: string, delayMs: number) {
  nextRequestAt.set(accountId, Math.max(nextRequestAt.get(accountId) || 0, Date.now() + delayMs));
}

// ---------------------------------------------------------------- errors

const SESSION_REDIRECT = /\/(?:login|uas\/login|checkpoint|authwall|signup)/i;

export function isSessionRedirect(location: string | null) {
  return Boolean(location && SESSION_REDIRECT.test(location));
}

function bodyCode(body: string) {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const data = parsed.data && typeof parsed.data === "object" ? (parsed.data as Record<string, unknown>) : {};
    return String(parsed.code || data.code || parsed.serviceErrorCode || data.serviceErrorCode || "");
  } catch {
    return "";
  }
}

// LinkedIn error -> the error type the automation already branches on. The
// type names are the ones the old Unipile integration used.
export function linkedInErrorType(status: number, body: string, write: boolean) {
  const code = bodyCode(body).toUpperCase();
  const lower = body.toLowerCase();
  if (status === 401) return "errors/disconnected_account";
  if (status === 403 && lower.includes("csrf")) return "errors/disconnected_account";
  if (status === 429) return "errors/too_many_requests";
  if (status === 999) return "errors/provider_blocked";
  if (code.includes("CANT_RESEND") || code.includes("RESEND")) return "errors/cannot_resend_yet";
  // The old Unipile integration reported the weekly invite cap with the same
  // type as a per-recipient resend block; outreach-rules only tells them apart
  // by counting distinct leads, so keep that contract.
  if (code.includes("FUSE_LIMIT") || code.includes("WEEKLY") || code.includes("QUOTA")) {
    return "errors/cannot_resend_yet";
  }
  if (code.includes("TOO_LONG") || code.includes("CHARACTER")) return "errors/too_many_characters";
  if (
    status === 404 ||
    code.includes("NOT_FOUND") ||
    code.includes("INVALID_INVITEE") ||
    code.includes("UNREACHABLE") ||
    (status === 403 && lower.includes("profile can't be accessed"))
  ) {
    return write ? "errors/invalid_recipient" : "errors/resource_not_found";
  }
  if (status === 422 || status === 400) return "errors/invalid_parameters";
  if (status >= 500) return "errors/provider_error";
  return "errors/unexpected_status";
}

function responseError(status: number, body: string, write: boolean, retryAfter?: number) {
  const type = linkedInErrorType(status, body, write);
  // Errors enter logs and automation history. Upstream bodies can echo secrets
  // in arbitrary formats, so only our fixed error type and HTTP status leave here.
  return new LinkedInResponseError(
    status === 999 ? 503 : status,
    `LinkedIn request failed: ${status} ${type}`,
    JSON.stringify({ type }),
    retryAfter,
  );
}

function sessionExpiredError(reason: string) {
  return new LinkedInResponseError(
    401,
    `LinkedIn session needs to be reconnected: ${reason}`,
    JSON.stringify({ type: "errors/disconnected_account", detail: reason }),
  );
}

// ---------------------------------------------------------------- request

function headersFor(session: OwnSession, accept: string, hasBody: boolean) {
  return {
    "user-agent": session.userAgent,
    accept,
    "accept-language": "en-US,en;q=0.9",
    "csrf-token": csrfToken(session.cookies),
    cookie: serializeCookies(session.cookies),
    "x-li-lang": "en_US",
    "x-restli-protocol-version": "2.0.0",
    "x-li-track": JSON.stringify({
      clientVersion: CLIENT_VERSION,
      mpVersion: CLIENT_VERSION,
      osName: "web",
      timezone: session.timezone || "UTC",
      deviceFormFactor: "DESKTOP",
      mpName: "voyager-web",
      displayDensity: 2,
      displayWidth: 1920,
      displayHeight: 1080,
    }),
    referer: "https://www.linkedin.com/feed/",
    ...(hasBody ? { "content-type": "application/json; charset=UTF-8", origin: "https://www.linkedin.com" } : {}),
  };
}

export function setCookieHeaders(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function retryAfterMs(value: string | null) {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}

// True when no connection was opened, so the request cannot have reached
// LinkedIn. Bun reports a refused connection, a failed DNS lookup and an
// unreachable proxy with the one code below (checked on Bun 1.3.14); Node's
// fetch puts the system code on error.cause. Timeouts and resets are not
// here on purpose: the request may already have been delivered.
function neverConnected(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  const causeCode = (error as { cause?: { code?: unknown } } | null)?.cause?.code;
  return code === "ConnectionRefused" || causeCode === "ECONNREFUSED" || causeCode === "ENOTFOUND";
}

async function sendOnce(session: OwnSession, request: VoyagerRequest, hooks: SessionHooks) {
  const proxyOptions = fetchOptionsForProxy(proxyUrlForSession(session));
  const method = request.method || "GET";
  const hasBody = request.body !== undefined;
  const response = await fetch(`${VOYAGER_BASE}${request.path}`, {
    method,
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: headersFor(session, request.accept || ACCEPT_NORMALIZED, hasBody),
    ...(hasBody ? { body: JSON.stringify(request.body) } : {}),
    ...proxyOptions,
  } as RequestInit).catch((error) => {
    // A proxy or network outage is a typed rejection. As a plain Error it
    // counted as "may have been sent" and parked the lead for manual review.
    if (neverConnected(error)) {
      throw new LinkedInResponseError(
        503,
        "LinkedIn could not be reached. Nothing was sent.",
        JSON.stringify({ type: "errors/network_unreachable" }),
      );
    }
    throw error;
  });

  const rotated = mergeSetCookies(session.cookies, setCookieHeaders(response));
  if (rotated) {
    session.cookies = rotated;
    if (!rotated.li_at) {
      hooks.onSessionExpired?.("LinkedIn cleared the session cookie");
      throw sessionExpiredError("LinkedIn cleared the session cookie");
    }
    session.cookieRevision = (session.cookieRevision || 0) + 1;
    hooks.onCookiesChanged?.(rotated, session.cookieRevision);
  }

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (isSessionRedirect(location)) {
      const reason = location?.includes("checkpoint") ? "LinkedIn asked for a security check" : "LinkedIn signed the session out";
      hooks.onSessionExpired?.(reason);
      throw sessionExpiredError(reason);
    }
    throw responseError(response.status, `redirect to ${location || "unknown"}`, Boolean(request.write));
  }
  return response;
}

// Sends one request in the account's paced queue. Returns parsed JSON, or the
// raw Response when `raw` is set (attachment bytes).
export async function voyagerRequest(
  session: OwnSession,
  request: VoyagerRequest & { raw?: false },
  hooks?: SessionHooks,
): Promise<unknown>;
export async function voyagerRequest(
  session: OwnSession,
  request: VoyagerRequest & { raw: true },
  hooks?: SessionHooks,
): Promise<Response>;
export async function voyagerRequest(
  session: OwnSession,
  request: VoyagerRequest & { raw?: boolean },
  hooks: SessionHooks = {},
) {
  return runPaced(session.accountId, Boolean(request.write), async () => {
    const response = await sendOnce(session, request, hooks);
    if (response.ok) {
      if (request.raw) return response;
      if (response.status === 204) return undefined;
      const body = await response.text();
      return body ? JSON.parse(body) : undefined;
    }

    const body = await response.text().catch(() => "");
    const error = responseError(
      response.status,
      body,
      Boolean(request.write),
      retryAfterMs(response.headers.get("retry-after")),
    );
    if (request.write && response.status >= 500 && response.status !== 999) {
      throw new Error("LinkedIn did not confirm the result. Check the conversation before sending again.");
    }
    if (error.errorType === "errors/disconnected_account") {
      hooks.onSessionExpired?.(error.message);
    }
    if (response.status === 429 || response.status === 999) {
      deferAccount(session.accountId, Math.max(error.retryAfterMs || 0, 60_000));
    }
    throw error;
  });
}

// Fetches a linkedin.com web page (search results are server-rendered
// HTML, not a Voyager response) with the session cookies, through the
// account's proxy and pacing queue. Redirects are followed by hand so
// cookies never leave linkedin.com.
export async function fetchLinkedInWebPage(session: OwnSession, url: URL, hooks: SessionHooks = {}) {
  if (url.protocol !== "https:" || url.hostname !== "www.linkedin.com") {
    throw new LinkedInResponseError(400, "Invalid LinkedIn page.", JSON.stringify({ type: "errors/invalid_parameters" }));
  }
  return runPaced(session.accountId, false, async () => {
    let current = url;
    for (let hop = 0; hop < 4; hop += 1) {
      const response = await fetch(current, {
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "user-agent": session.userAgent,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
          cookie: serializeCookies(session.cookies),
        },
        ...fetchOptionsForProxy(proxyUrlForSession(session)),
      } as RequestInit);
      const rotated = mergeSetCookies(session.cookies, setCookieHeaders(response));
      if (rotated) {
        session.cookies = rotated;
        if (!rotated.li_at) {
          hooks.onSessionExpired?.("LinkedIn cleared the session cookie");
          throw sessionExpiredError("LinkedIn cleared the session cookie");
        }
        session.cookieRevision = (session.cookieRevision || 0) + 1;
        hooks.onCookiesChanged?.(rotated, session.cookieRevision);
      }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || isSessionRedirect(location)) {
          const reason = location?.includes("checkpoint")
            ? "LinkedIn asked for a security check"
            : "LinkedIn signed the session out";
          hooks.onSessionExpired?.(reason);
          throw sessionExpiredError(reason);
        }
        const next = new URL(location, current);
        if (next.hostname !== "www.linkedin.com") {
          throw responseError(response.status, `redirect to ${next.hostname}`, false);
        }
        current = next;
        continue;
      }
      if (!response.ok) {
        const error = responseError(
          response.status,
          await response.text().catch(() => ""),
          false,
          retryAfterMs(response.headers.get("retry-after")),
        );
        if (error.errorType === "errors/disconnected_account") {
          hooks.onSessionExpired?.(error.message);
        }
        if (response.status === 429 || response.status === 999) {
          deferAccount(session.accountId, Math.max(error.retryAfterMs || 0, 60_000));
        }
        throw error;
      }
      return response.text();
    }
    throw responseError(310, "too many redirects", false);
  });
}

// Sends one HTML / RSC web request on www.linkedin.com in the account's paced
// queue, keeping cookie rotation and checkpoint expiry detection identical to
// Voyager calls.
export async function flagshipWebRequest(
  session: OwnSession,
  request: {
    method?: "GET" | "POST";
    path: string;
    body?: unknown;
    accept?: string;
    referer?: string;
    write?: boolean;
  },
  hooks: SessionHooks = {},
): Promise<string> {
  return runPaced(session.accountId, Boolean(request.write), async () => {
    const proxyOptions = fetchOptionsForProxy(proxyUrlForSession(session));
    const method = request.method || "GET";
    const hasBody = request.body !== undefined;
    let url = new URL(request.path, "https://www.linkedin.com");

    for (let hop = 0; hop < 4; hop += 1) {
      const response = await fetch(url, {
        method: hop === 0 ? method : "GET",
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "user-agent": session.userAgent,
          accept: request.accept || "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
          cookie: serializeCookies(session.cookies),
          ...(hasBody && hop === 0
            ? {
                "csrf-token": csrfToken(session.cookies),
                "content-type": "application/json",
                origin: "https://www.linkedin.com",
              }
            : {}),
          referer: request.referer || "https://www.linkedin.com/feed/",
        },
        ...(hasBody && hop === 0 ? { body: JSON.stringify(request.body) } : {}),
        ...proxyOptions,
      } as RequestInit);

      const rotated = mergeSetCookies(session.cookies, setCookieHeaders(response));
      if (rotated) {
        session.cookies = rotated;
        if (!rotated.li_at) {
          hooks.onSessionExpired?.("LinkedIn cleared the session cookie");
          throw sessionExpiredError("LinkedIn cleared the session cookie");
        }
        session.cookieRevision = (session.cookieRevision || 0) + 1;
        hooks.onCookiesChanged?.(rotated, session.cookieRevision);
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || isSessionRedirect(location)) {
          const reason = location?.includes("checkpoint")
            ? "LinkedIn asked for a security check"
            : "LinkedIn signed the session out";
          hooks.onSessionExpired?.(reason);
          throw sessionExpiredError(reason);
        }
        const next = new URL(location, url);
        if (next.protocol !== "https:" || next.hostname !== "www.linkedin.com") {
          throw responseError(response.status, `redirect to ${next.hostname}`, Boolean(request.write));
        }
        url = next;
        continue;
      }

      const body = await response.text().catch(() => "");
      if (response.ok) return body;

      const error = responseError(
        response.status,
        body,
        Boolean(request.write),
        retryAfterMs(response.headers.get("retry-after")),
      );
      if (request.write && response.status >= 500 && response.status !== 999) {
        throw new Error("LinkedIn did not confirm the result.");
      }
      if (error.errorType === "errors/disconnected_account") {
        hooks.onSessionExpired?.(error.message);
      }
      if (response.status === 429 || response.status === 999) {
        deferAccount(session.accountId, Math.max(error.retryAfterMs || 0, 60_000));
      }
      throw error;
    }

    throw responseError(310, "too many redirects", Boolean(request.write));
  });
}

// Media (message attachments, avatars) only from LinkedIn's own hosts, and
// cookies only to linkedin.com. Attachment ids are client-supplied, so this is
// what stops them from turning the proxy into an open fetcher.
export function assertLinkedInMediaUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new LinkedInResponseError(400, "Invalid attachment.", JSON.stringify({ type: "errors/invalid_parameters" }));
  }
  const host = url.hostname.toLowerCase();
  const allowed =
    url.protocol === "https:" && (host === "www.linkedin.com" || host.endsWith(".licdn.com"));
  if (!allowed) {
    throw new LinkedInResponseError(400, "Invalid attachment.", JSON.stringify({ type: "errors/invalid_parameters" }));
  }
  return url;
}

export async function fetchLinkedInMedia(session: OwnSession, value: string, hooks: SessionHooks = {}) {
  let url = assertLinkedInMediaUrl(value);
  return runPaced(session.accountId, false, async () => {
    const proxyOptions = fetchOptionsForProxy(proxyUrlForSession(session));
    // Redirects are followed by hand so every hop is host-checked and the
    // session cookie never travels past www.linkedin.com.
    for (let hop = 0; hop < 4; hop += 1) {
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "user-agent": session.userAgent,
          ...(url.hostname === "www.linkedin.com"
            ? { cookie: serializeCookies(session.cookies), "csrf-token": csrfToken(session.cookies) }
            : {}),
        },
        ...proxyOptions,
      } as RequestInit);
      const rotated = mergeSetCookies(session.cookies, setCookieHeaders(response));
      if (rotated) {
        session.cookies = rotated;
        if (!rotated.li_at) {
          hooks.onSessionExpired?.("LinkedIn cleared the session cookie");
          throw sessionExpiredError("LinkedIn cleared the session cookie");
        }
        session.cookieRevision = (session.cookieRevision || 0) + 1;
        hooks.onCookiesChanged?.(rotated, session.cookieRevision);
      }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || isSessionRedirect(location)) {
          const reason = location?.includes("checkpoint")
            ? "LinkedIn asked for a security check"
            : "LinkedIn signed the session out";
          hooks.onSessionExpired?.(reason);
          throw sessionExpiredError(reason);
        }
        url = assertLinkedInMediaUrl(new URL(location, url).toString());
        continue;
      }
      if (!response.ok) {
        const error = responseError(response.status, await response.text().catch(() => ""), false);
        if (error.errorType === "errors/disconnected_account") {
          hooks.onSessionExpired?.(error.message);
        }
        throw error;
      }
      return response;
    }
    throw responseError(310, "too many redirects", false);
  });
}

// Upload slots are supplied by LinkedIn, but still receive the same host and
// redirect checks as downloads. Browser cookies never go to CDN hosts.
export async function uploadLinkedInMedia(
  session: OwnSession,
  value: string,
  file: File,
  suppliedHeaders: Record<string, string> = {},
  hooks: SessionHooks = {},
) {
  const url = assertLinkedInMediaUrl(value);
  const headers = new Headers({ "content-type": file.type || "application/octet-stream" });
  for (const [name, header] of Object.entries(suppliedHeaders)) {
    if (!/^(?:cookie|authorization|host|csrf-token|content-length|connection|transfer-encoding)$/i.test(name)) headers.set(name, header);
  }
  headers.set("user-agent", session.userAgent);
  if (url.hostname === "www.linkedin.com") {
    headers.set("cookie", serializeCookies(session.cookies));
    headers.set("csrf-token", csrfToken(session.cookies));
  }
  return runPaced(session.accountId, true, async () => {
    const response = await fetch(url, {
      method: "PUT", redirect: "manual", headers, body: file,
      signal: AbortSignal.timeout(120_000),
      ...fetchOptionsForProxy(proxyUrlForSession(session)),
    } as RequestInit);
    const rotated = mergeSetCookies(session.cookies, setCookieHeaders(response));
    if (rotated) {
      session.cookies = rotated;
      if (!rotated.li_at) {
        hooks.onSessionExpired?.("LinkedIn cleared the session cookie");
        throw sessionExpiredError("LinkedIn cleared the session cookie");
      }
      session.cookieRevision = (session.cookieRevision || 0) + 1;
      hooks.onCookiesChanged?.(rotated, session.cookieRevision);
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || isSessionRedirect(location)) {
        const reason = location?.includes("checkpoint")
          ? "LinkedIn asked for a security check"
          : "LinkedIn signed the session out";
        hooks.onSessionExpired?.(reason);
        throw sessionExpiredError(reason);
      }
      throw responseError(response.status, `redirect to ${location}`, true);
    }
    if (!response.ok) {
      const error = responseError(response.status, "Attachment upload failed", false);
      if (error.errorType === "errors/disconnected_account") {
        hooks.onSessionExpired?.(error.message);
      }
      throw error;
    }
  });
}
