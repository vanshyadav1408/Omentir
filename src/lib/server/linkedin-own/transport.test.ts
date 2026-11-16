import { afterEach, expect, test } from "bun:test";
import { LinkedInResponseError } from "../linkedin-errors";
import {
  assertLinkedInMediaUrl,
  csrfToken,
  fetchLinkedInWebPage,
  linkedInErrorType,
  mergeSetCookies,
  parseCookieHeader,
  proxyUrlForSession,
  requireSessionCookies,
  runPaced,
  voyagerRequest,
  uploadLinkedInMedia,
  type OwnSession,
} from "./transport";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function session(accountId = `own_ACoTest${Math.random().toString(36).slice(2, 8)}`): OwnSession {
  return {
    accountId,
    memberId: "ACoTest",
    cookies: { li_at: "secret-li-at", JSESSIONID: '"ajax:123"' },
    userAgent: "Mozilla/5.0 Test",
    proxySessionId: "abc",
  };
}

test("cookies parse from a pasted header and the csrf token drops JSESSIONID's quotes", () => {
  const cookies = parseCookieHeader('li_at=AQE; JSESSIONID="ajax:987"; lang=v=2&lang=en-us');
  expect(cookies.li_at).toBe("AQE");
  expect(cookies.lang).toBe("v=2&lang=en-us");
  expect(csrfToken(cookies)).toBe("ajax:987");
  expect(() => requireSessionCookies({ JSESSIONID: '"ajax:1"' })).toThrow("li_at");
  expect(() => requireSessionCookies({ li_at: "x" })).toThrow("JSESSIONID");
});

test("rotated cookies are kept and a cleared li_at is visible as a logout", () => {
  const jar = { li_at: "old", JSESSIONID: '"ajax:1"', lidc: "a" };
  expect(mergeSetCookies(jar, ["lidc=a; Path=/"])).toBeNull();
  expect(mergeSetCookies(jar, ["lidc=b; Path=/"])?.lidc).toBe("b");
  const loggedOut = mergeSetCookies(jar, ['li_at=delete me; Max-Age=0; Path=/']);
  expect(loggedOut && "li_at" in loggedOut).toBe(false);
});

test("production never sends LinkedIn traffic from the server's own IP", () => {
  const production = { NODE_ENV: "production" } as NodeJS.ProcessEnv;
  expect(() => proxyUrlForSession({ proxySessionId: "s1" }, production)).toThrow(LinkedInResponseError);
  expect(proxyUrlForSession({ proxySessionId: "s1" }, { NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBeUndefined();
  expect(proxyUrlForSession({ proxySessionId: "s 1" }, { ...production, LINKEDIN_PROXY_URL: "http://u-session-{session}:p@gate:7000" })).toBe(
    "http://u-session-s%201:p@gate:7000",
  );
});

test("an account with a static IP always uses it, never the shared residential pool", () => {
  const env = {
    NODE_ENV: "production",
    LINKEDIN_PROXY_URL: "http://u-sessid-{session}:p@gate:7777",
    LINKEDIN_ISP_PROXY_URL: "http://user-u:p@isp.example.com:{port}",
  } as NodeJS.ProcessEnv;
  expect(proxyUrlForSession({ proxySessionId: "s1", proxyPort: 8003, proxyCountry: "US" }, env)).toBe("http://user-u:p@isp.example.com:8003");
  // Losing the static IP setting must stop the account, not move it to another IP.
  expect(() => proxyUrlForSession({ proxySessionId: "s1", proxyPort: 8003 }, { ...env, LINKEDIN_ISP_PROXY_URL: "" })).toThrow(LinkedInResponseError);
});

test("residential accounts exit in their own country, or the default when it is unknown", () => {
  const env = {
    NODE_ENV: "production",
    LINKEDIN_PROXY_URL: "http://customer-u-cc-{country}-sessid-{session}:p@gate:7777",
    LINKEDIN_PROXY_COUNTRY: "us",
  } as NodeJS.ProcessEnv;
  expect(proxyUrlForSession({ proxySessionId: "s1", proxyCountry: "IN" }, env)).toBe("http://customer-u-cc-IN-sessid-s1:p@gate:7777");
  expect(proxyUrlForSession({ proxySessionId: "s1" }, env)).toBe("http://customer-u-cc-US-sessid-s1:p@gate:7777");
  // A blank country would give the proxy a random country: refuse instead.
  expect(() => proxyUrlForSession({ proxySessionId: "s1" }, { ...env, LINKEDIN_PROXY_COUNTRY: "" })).toThrow(LinkedInResponseError);
});

test("LinkedIn invite errors map to the types outreach-rules already acts on", () => {
  // These strings are the contract with automation.ts / outreach-rules.ts.
  expect(linkedInErrorType(400, JSON.stringify({ data: { code: "CANT_RESEND_YET" } }), true)).toBe("errors/cannot_resend_yet");
  expect(linkedInErrorType(429, JSON.stringify({ code: "FUSE_LIMIT_EXCEEDED" }), true)).toBe("errors/too_many_requests");
  expect(linkedInErrorType(400, JSON.stringify({ code: "FUSE_LIMIT_EXCEEDED" }), true)).toBe("errors/cannot_resend_yet");
  expect(linkedInErrorType(404, "", true)).toBe("errors/invalid_recipient");
  // A missing profile on a READ must not be reported as an undeliverable recipient.
  expect(linkedInErrorType(404, "", false)).toBe("errors/resource_not_found");
  expect(linkedInErrorType(401, "", false)).toBe("errors/disconnected_account");
  expect(linkedInErrorType(403, "CSRF check failed", false)).toBe("errors/disconnected_account");
});

test("an expired session is reported, typed, and flagged for reconnect", async () => {
  let expiredReason = "";
  globalThis.fetch = (async () =>
    new Response(null, { status: 302, headers: { location: "https://www.linkedin.com/checkpoint/challenge" } })) as unknown as typeof fetch;
  const error = await voyagerRequest(session(), { path: "/me" }, { onSessionExpired: (reason) => (expiredReason = reason) }).catch((caught) => caught);
  expect(error).toBeInstanceOf(LinkedInResponseError);
  expect((error as LinkedInResponseError).errorType).toBe("errors/disconnected_account");
  expect(expiredReason).toContain("security check");
});

test("a write that times out stays ambiguous (plain Error), so automation does not resend", async () => {
  globalThis.fetch = (async () => {
    throw new DOMException("The operation timed out.", "TimeoutError");
  }) as unknown as typeof fetch;
  const error = await voyagerRequest(session(), { path: "/x", method: "POST", body: {}, write: true }).catch((caught) => caught);
  expect(error).toBeInstanceOf(Error);
  expect(error).not.toBeInstanceOf(LinkedInResponseError);
});

test("a connection that never opened is a typed rejection, so a proxy outage does not strand due invites", async () => {
  // Automation parks a plain Error on a write as "may have been sent", and a
  // queued invite never leaves that state without manual review. When the
  // proxy or network is down nothing was sent, so the lead must stay retryable.
  globalThis.fetch = (async () => {
    throw Object.assign(new Error("Unable to connect. Is the computer able to access the url?"), { code: "ConnectionRefused" });
  }) as unknown as typeof fetch;
  const error = await voyagerRequest(session(), { path: "/x", method: "POST", body: {}, write: true }).catch((caught) => caught);
  expect(error).toBeInstanceOf(LinkedInResponseError);
  expect((error as LinkedInResponseError).errorType).toBe("errors/network_unreachable");
});

test("an explicit LinkedIn rejection is typed, so automation may safely retry", async () => {
  globalThis.fetch = (async () => Response.json({ code: "CANT_RESEND_YET" }, { status: 400 })) as unknown as typeof fetch;
  const error = await voyagerRequest(session(), { path: "/x", method: "POST", body: {}, write: true }).catch((caught) => caught);
  expect((error as LinkedInResponseError).errorType).toBe("errors/cannot_resend_yet");
});

test("a server error after a send stays ambiguous so automation cannot repeat a possibly delivered message", async () => {
  globalThis.fetch = (async () => Response.json({}, { status: 502 })) as unknown as typeof fetch;
  const error = await voyagerRequest(session(), { path: "/x", method: "POST", body: {}, write: true }).catch((caught) => caught);
  expect(error).toBeInstanceOf(Error);
  expect(error).not.toBeInstanceOf(LinkedInResponseError);
});

test("cookies and csrf ride along, and the secret never appears in error text", async () => {
  let seen: Record<string, string> = {};
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    seen = init.headers as Record<string, string>;
    return Response.json({ detail: 'upstream says secret-li-at and li_at=secret-li-at', li_at: "secret-li-at", JSESSIONID: "ajax:123" }, { status: 500 });
  }) as unknown as typeof fetch;
  const error = (await voyagerRequest(session(), { path: "/me" }).catch((caught) => caught)) as LinkedInResponseError;
  expect(seen.cookie).toContain("li_at=secret-li-at");
  expect(seen["csrf-token"]).toBe("ajax:123");
  expect(error.status).toBe(500);
  expect(error.message).not.toContain("secret-li-at");
  expect(error.message).not.toContain("ajax:123");
  expect(error.detail).toBeUndefined();
});

test("requests for one account never overlap (LinkedIn sees one browser, not a burst)", async () => {
  const order: string[] = [];
  let active = 0;
  const task = (name: string) => async () => {
    active += 1;
    expect(active).toBe(1);
    order.push(name);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
  };
  const gaps = { read: [0, 1] as [number, number], write: [0, 1] as [number, number] };
  await Promise.all([runPaced("acct", false, task("a"), gaps), runPaced("acct", false, task("b"), gaps), runPaced("acct", true, task("c"), gaps)]);
  expect(order).toEqual(["a", "b", "c"]);
});

test("attachment urls can only point at LinkedIn's own media hosts", () => {
  expect(assertLinkedInMediaUrl("https://media.licdn.com/dms/image/x").hostname).toBe("media.licdn.com");
  expect(assertLinkedInMediaUrl("https://www.linkedin.com/dms/prv/x").hostname).toBe("www.linkedin.com");
  for (const bad of [
    "http://media.licdn.com/x",
    "https://evil.example/x",
    "https://media.licdn.com.evil.example/x",
    "https://169.254.169.254/latest",
    "file:///etc/passwd",
  ]) {
    expect(() => assertLinkedInMediaUrl(bad)).toThrow(LinkedInResponseError);
  }
});

test("account-wide rate-limit backoff survives the normal pacing gap", async () => {
  const originalTimeout = globalThis.setTimeout;
  const delays: number[] = [];
  globalThis.setTimeout = ((callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) => {
    delays.push(delay || 0);
    return originalTimeout(callback, 0, ...args);
  }) as typeof setTimeout;
  let count = 0;
  globalThis.fetch = (async () => ++count === 1
    ? Response.json({}, { status: 429, headers: { "retry-after": "120" } })
    : Response.json({ ok: true })) as unknown as typeof fetch;
  try {
    const current = session();
    await voyagerRequest(current, { path: "/me" }).catch(() => {});
    await voyagerRequest(current, { path: "/me" });
    expect(delays.some((delay) => delay >= 119_000)).toBe(true);
  } finally {
    globalThis.setTimeout = originalTimeout;
  }
});

test("attachment bytes use the approved upload host and cookies stay on linkedin.com", async () => {
  const seen: Array<{ url: string; headers: Headers; text: string; redirect?: RequestRedirect }> = [];
  globalThis.fetch = (async (url: URL, init: RequestInit) => {
    seen.push({ url: String(url), headers: new Headers(init.headers), text: await (init.body as File).text(), redirect: init.redirect });
    return new Response(null, { status: 201 });
  }) as typeof fetch;
  await uploadLinkedInMedia(session(), "https://www.linkedin.com/dms/upload/x", new File(["bytes"], "a.txt"));
  await uploadLinkedInMedia(session(), "https://media.licdn.com/dms/upload/y", new File(["other"], "b.txt"), { cookie: "should-not-travel" });
  expect(seen[0].headers.get("cookie")).toContain("li_at=");
  expect(seen[1].headers.has("cookie")).toBe(false);
  expect(seen.map((item) => item.text)).toEqual(["bytes", "other"]);
  expect(seen.every((item) => item.redirect === "manual")).toBe(true);
});

test("an unexpected upload redirect cannot forward file bytes or session credentials", async () => {
  let requests = 0;
  globalThis.fetch = (async () => { requests += 1; return new Response(null, { status: 307, headers: { location: "https://attacker.test" } }); }) as unknown as typeof fetch;
  await expect(uploadLinkedInMedia(session(), "https://www.linkedin.com/dms/upload/x", new File(["bytes"], "a.txt"))).rejects.toBeInstanceOf(LinkedInResponseError);
  expect(requests).toBe(1);
  await expect(uploadLinkedInMedia(session(), "https://attacker.test", new File(["bytes"], "a.txt"))).rejects.toBeInstanceOf(LinkedInResponseError);
  expect(requests).toBe(1);
});

test("an expired session during web-page search marks the account expired for reconnect", async () => {
  let expiredReason = "";
  globalThis.fetch = (async () =>
    new Response(null, { status: 302, headers: { location: "https://www.linkedin.com/uas/login" } })) as unknown as typeof fetch;
  const error = await fetchLinkedInWebPage(
    session(),
    new URL("https://www.linkedin.com/search/results/people/?keywords=Founder"),
    { onSessionExpired: (reason) => (expiredReason = reason) },
  ).catch((caught) => caught);
  expect(error).toBeInstanceOf(LinkedInResponseError);
  expect((error as LinkedInResponseError).errorType).toBe("errors/disconnected_account");
  expect(expiredReason).toContain("signed the session out");
});

test("a bought IP is reached at its own address, and a URL that cannot name it is refused", () => {
  const env = { NODE_ENV: "production", LINKEDIN_PROXY_URL: "http://u:p@gate:8000", LINKEDIN_ISP_PROXY_URL: "http://u:p@{host}:{port}" } as NodeJS.ProcessEnv;
  expect(proxyUrlForSession({ proxySessionId: "s1", proxyPort: 6000, proxyHost: "203.0.113.7" }, env)).toBe("http://u:p@203.0.113.7:6000");
  // A port without its host, or a host the URL ignores, would reach LinkedIn from the wrong IP.
  expect(() => proxyUrlForSession({ proxySessionId: "s1", proxyPort: 6000 }, env)).toThrow(LinkedInResponseError);
  expect(() => proxyUrlForSession({ proxySessionId: "s1", proxyPort: 6000, proxyHost: "203.0.113.7" }, { ...env, LINKEDIN_ISP_PROXY_URL: "http://u:p@isp.example.com:{port}" })).toThrow(LinkedInResponseError);
});

test("providers that want lower-case countries get them", () => {
  const env = { NODE_ENV: "production", LINKEDIN_PROXY_URL: "http://u_c_{country_lower}_s_{session}:p@residential.example.com:8000" } as NodeJS.ProcessEnv;
  expect(proxyUrlForSession({ proxySessionId: "s1", proxyCountry: "GB" }, env)).toBe("http://u_c_gb_s_s1:p@residential.example.com:8000");
});
