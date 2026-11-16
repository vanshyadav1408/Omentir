import { afterAll, beforeEach, expect, test } from "bun:test";
import {
  formFields,
  LinkedInLoginError,
  parseForms,
  startLinkedInLogin,
  submitLinkedInChallenge,
  type LoginOutcome,
} from "./login";

type Call = { url: string; method: string; headers: Headers; body: string };

const originalFetch = globalThis.fetch;
const originalProxy = process.env.LINKEDIN_PROXY_URL;
const calls: Call[] = [];
let replies: Array<(call: Call) => Response> = [];
const noPause = { pause: async () => {} };
const PASSWORD = "correct horse battery staple";
const UA = "Mozilla/5.0 (Macintosh) Chrome/142.0";

function page(body: string, init: { status?: number; cookies?: string[]; location?: string } = {}) {
  const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
  for (const cookie of init.cookies || []) headers.append("set-cookie", cookie);
  if (init.location) headers.set("location", init.location);
  const status = init.status || (init.location ? 302 : 200);
  return new Response(status >= 300 && status < 400 ? null : body, { status, headers });
}

const LOGIN_HTML = `<!doctype html><html><head><title>LinkedIn Login, Sign in | LinkedIn</title></head><body>
<form method="post" class="login__form" action="/checkpoint/lg/login-submit" data-note="a > b" novalidate>
  <input name="csrfToken" value="ajax:4242" type="hidden">
  <input type="hidden" name="loginCsrfParam" value="abc-123">
  <input type="hidden" name='trk' value="guest_homepage&amp;x">
  <input id="username" name="session_key" type="email" value="">
  <input id="password" name="session_password" type="password">
  <input type="checkbox" name="rememberMeOptIn" value="true">
  <button type="submit" name="signin">Sign in</button>
</form></body></html>`;

const START_COOKIES = ['JSESSIONID="ajax:4242"; Path=/; Secure', "bcookie=\"v=2&abc\"; Path=/; Secure", "lang=v=2&lang=en-us; Path=/"];

const PIN_HTML = `<html><head><title>Security Verification | LinkedIn</title></head><body>
<h1>Let's do a quick security check</h1>
<p>The login attempt seems suspicious. To finish signing in please enter the verification code we sent to your email address.</p>
<form id="email-pin-challenge" action="/checkpoint/challenge/verify" method="POST">
  <input type="hidden" name="csrfToken" value="ajax:4242">
  <input type="hidden" name="challengeId" value="AgE123">
  <input type="hidden" name="pageInstance" value="urn:li:page:checkpoint_challenge">
  <input name="pin" type="text" maxlength="6" id="input__email_verification_pin">
  <button type="submit">Submit</button>
</form>
<form action="/checkpoint/challenge/resend" method="POST"><input type="hidden" name="challengeId" value="AgE123"></form>
</body></html>`;

beforeEach(() => {
  calls.length = 0;
  replies = [];
  delete process.env.LINKEDIN_PROXY_URL;
  globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
    const call = {
      url: String(input),
      method: init.method || "GET",
      headers: new Headers(init.headers),
      body: typeof init.body === "string" ? init.body : "",
    };
    calls.push(call);
    const reply = replies.shift();
    if (!reply) throw new Error(`unexpected request ${call.method} ${call.url}`);
    return reply(call);
  }) as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
  if (originalProxy === undefined) delete process.env.LINKEDIN_PROXY_URL;
  else process.env.LINKEDIN_PROXY_URL = originalProxy;
});

function login() {
  return startLinkedInLogin({ email: " sam@example.com ", password: PASSWORD, userAgent: UA, proxySessionId: "0123456789abcdef" }, noPause);
}

async function challengeFromLogin() {
  replies.push(
    () => page(LOGIN_HTML, { cookies: START_COOKIES }),
    () => page("", { location: "https://www.linkedin.com/checkpoint/challenge/AgE123?ut=1" }),
    () => page(PIN_HTML),
  );
  const outcome = await login();
  if (outcome.kind !== "challenge") throw new Error("expected a challenge");
  calls.length = 0;
  return outcome;
}

function verify(outcome: Extract<LoginOutcome, { kind: "challenge" }>, code?: string) {
  return submitLinkedInChallenge({ cookies: outcome.cookies, challenge: outcome.challenge, userAgent: UA, proxySessionId: "0123456789abcdef", code }, noPause);
}

test("the login form is read like a browser would submit it", () => {
  const [form] = parseForms(LOGIN_HTML);
  expect(form.attributes.action).toBe("/checkpoint/lg/login-submit");
  expect(formFields(form)).toEqual([
    ["csrfToken", "ajax:4242"],
    ["loginCsrfParam", "abc-123"],
    ["trk", "guest_homepage&x"],
    ["session_key", ""],
    ["session_password", ""],
  ]);
});

test("email and password sign in returns the full session jar", async () => {
  replies.push(
    () => page(LOGIN_HTML, { cookies: START_COOKIES }),
    () => page("", { location: "https://www.linkedin.com/feed/?trk=login", cookies: ["li_at=AQEDsession; Path=/; Secure; HttpOnly", "liap=true; Path=/"] }),
  );
  const outcome = await login();
  expect(outcome.kind).toBe("signed_in");
  expect(outcome.cookies).toMatchObject({ li_at: "AQEDsession", JSESSIONID: '"ajax:4242"', bcookie: '"v=2&abc"' });

  expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
    "GET https://www.linkedin.com/checkpoint/lg/login",
    "POST https://www.linkedin.com/checkpoint/lg/login-submit",
  ]);
  const submit = calls[1];
  const body = new URLSearchParams(submit.body);
  expect(body.get("session_key")).toBe("sam@example.com");
  expect(body.get("session_password")).toBe(PASSWORD);
  expect(body.get("loginCsrfParam")).toBe("abc-123");
  expect(body.get("trk")).toBe("guest_homepage&x");
  expect(body.has("rememberMeOptIn")).toBe(false);
  expect(submit.headers.get("cookie")).toContain('JSESSIONID="ajax:4242"');
  expect(submit.headers.get("user-agent")).toBe(UA);
  expect(submit.headers.get("origin")).toBe("https://www.linkedin.com");
});

test("a wrong password is reported without echoing it", async () => {
  replies.push(
    () => page(LOGIN_HTML, { cookies: START_COOKIES }),
    () => page(LOGIN_HTML.replace("<form", `<div id="error-for-password" class="form__label--error">Wrong email or password.</div><form`)),
  );
  const error = await login().catch((caught) => caught);
  expect(error).toBeInstanceOf(LinkedInLoginError);
  expect((error as LinkedInLoginError).reason).toBe("bad_credentials");
  expect((error as Error).message).not.toContain(PASSWORD);
});

test("an email PIN check is returned for the person to complete", async () => {
  const outcome = await challengeFromLogin();
  expect(outcome.method).toBe("email");
  expect(outcome.hint).toContain("verification code we sent to your email");
  expect(outcome.retryError).toBeUndefined();
  expect(outcome.challenge).toEqual({
    pageUrl: "https://www.linkedin.com/checkpoint/challenge/AgE123?ut=1",
    action: "https://www.linkedin.com/checkpoint/challenge/verify",
    fields: [["csrfToken", "ajax:4242"], ["challengeId", "AgE123"], ["pageInstance", "urn:li:page:checkpoint_challenge"]],
    codeField: "pin",
  });
  expect(outcome.cookies.JSESSIONID).toBe('"ajax:4242"');
});

test("the right code finishes the sign-in", async () => {
  const outcome = await challengeFromLogin();
  replies.push(() => page("", { location: "/feed/", cookies: ["li_at=AQEDafterpin; Path=/; Secure"] }));
  const result = await verify(outcome, " 123 456 ");
  expect(result.kind).toBe("signed_in");
  expect(result.cookies.li_at).toBe("AQEDafterpin");
  expect(calls).toHaveLength(1);
  const body = new URLSearchParams(calls[0].body);
  expect(calls[0].url).toBe("https://www.linkedin.com/checkpoint/challenge/verify");
  expect(body.get("pin")).toBe("123456");
  expect(body.get("challengeId")).toBe("AgE123");
  expect(calls[0].headers.get("referer")).toBe("https://www.linkedin.com/checkpoint/challenge/AgE123?ut=1");
});

test("a rejected code keeps the check open with a retry message", async () => {
  const outcome = await challengeFromLogin();
  replies.push(() => page(PIN_HTML.replace("<form", `<div class="form__error">That's not the right code. Try again.</div><form`)));
  const result = await verify(outcome, "000000");
  expect(result.kind).toBe("challenge");
  if (result.kind === "challenge") expect(result.retryError).toContain("didn't work");
});

test("LinkedIn moving on to a second check is not reported as a wrong code", async () => {
  const outcome = await challengeFromLogin();
  replies.push(
    () => page("", { location: "/checkpoint/challenge/TwoStep9" }),
    () => page(`<html><body><p>Enter the 6-digit code from your authenticator app to verify it's you.</p>
      <form action="/checkpoint/challenge/verify"><input type="hidden" name="challengeId" value="TwoStep9"><input name="pin" type="tel"></form></body></html>`),
  );
  const result = await verify(outcome, "123456");
  expect(result.kind).toBe("challenge");
  if (result.kind === "challenge") {
    expect(result.method).toBe("authenticator");
    expect(result.retryError).toBeUndefined();
    expect(result.challenge.fields).toEqual([["challengeId", "TwoStep9"]]);
  }
});

test("a security puzzle is reported, never worked around", async () => {
  replies.push(
    () => page(LOGIN_HTML, { cookies: START_COOKIES }),
    () => page("", { location: "/checkpoint/challenge/Puzzle1" }),
    () => page(`<html><body><h1>Let's do a quick security check</h1><iframe src="https://www.linkedin.com/checkpoint/challenge/arkose?x=1"></iframe></body></html>`),
  );
  const error = await login().catch((caught) => caught);
  expect((error as LinkedInLoginError).reason).toBe("unsupported_check");
});

test("credentials are never posted outside linkedin.com", async () => {
  replies.push(() => page(LOGIN_HTML.replace("/checkpoint/lg/login-submit", "https://collector.test/steal"), { cookies: START_COOKIES }));
  const error = await login().catch((caught) => caught);
  expect(error).toBeInstanceOf(LinkedInLoginError);
  expect(calls).toHaveLength(1);
  expect(calls.some((call) => call.body.includes(PASSWORD))).toBe(false);
});

test("LinkedIn refusing the server outright is reported as a refusal, not a page change", async () => {
  replies.push(() => new Response("", { status: 403 }));
  const error = await login().catch((caught) => caught);
  expect((error as LinkedInLoginError).reason).toBe("refused");
  expect((error as Error).message).toContain("Try again in a few minutes");
  expect(calls).toHaveLength(1);
});

test("LinkedIn rate limiting stops the sign-in with a clear reason", async () => {
  replies.push(() => new Response("", { status: 429 }));
  const error = await login().catch((caught) => caught);
  expect((error as LinkedInLoginError).reason).toBe("blocked");
});

test("a malformed code is refused before anything is sent", async () => {
  const outcome = await challengeFromLogin();
  const error = await verify(outcome, "12").catch((caught) => caught);
  expect((error as LinkedInLoginError).reason).toBe("bad_credentials");
  expect(calls).toHaveLength(0);
});

test("invisible reCAPTCHA v3 badges and LIX flags on checkpoint pages are not mistaken for a security puzzle", async () => {
  // Every live LinkedIn /checkpoint/* page carries lix_pemberly_tracking_recaptcha_v3
  // and a presentation reCAPTCHA v3 badge; mistaking those for an Arkose puzzle
  // breaks app-approval sign-in before the user can approve on their phone.
  const appApprovalHtml = `<html><body>
    <h1>Check your LinkedIn app</h1>
    <p>We sent a notification to your signed-in devices. Open your LinkedIn app and tap Yes to confirm your sign-in.</p>
    <form action="/checkpoint/challenge/verify" method="POST">
      <input type="hidden" name="challengeId" value="AppCheck1">
    </form>
    <iframe title="reCAPTCHA" width="256" height="60" role="presentation" src="https://www.google.com/recaptcha/enterprise/anchor?size=invisible"></iframe>
    <code id="lix_pemberly_tracking_recaptcha_v3" style="display: none"><!--"enabled"--></code>
  </body></html>`;
  replies.push(
    () => page(LOGIN_HTML, { cookies: START_COOKIES }),
    () => page("", { location: "/checkpoint/challenge/AppCheck1" }),
    () => page(appApprovalHtml),
  );
  const outcome = await login();
  expect(outcome.kind).toBe("challenge");
  if (outcome.kind === "challenge") {
    expect(outcome.method).toBe("app");
  }
});
