import { expect, test } from "bun:test";
import {
  classifyBrowserPage,
  closeLiveBrowserLogin,
  getLiveBrowserLogin,
  registerLiveBrowserLogin,
  startBrowserLinkedInLogin,
  submitBrowserLinkedInChallenge,
  type BrowserPage,
  type LiveBrowserLogin,
} from "./browser-login";
import { LinkedInLoginError } from "./login";

const LOGIN_HTML = `<html><head><title>LinkedIn Login</title></head><body>
<form action="/checkpoint/lg/login-submit"><input name="session_key"><input name="session_password" type="password"></form>
</body></html>`;

const LOGIN_ERROR_HTML = LOGIN_HTML.replace("<form", `<div id="error-for-password">Wrong email or password.</div><form`);

const PIN_HTML = `<html><head><title>Security Verification</title></head><body>
<p>To finish signing in please enter the verification code we sent to your email address.</p>
<form action="/checkpoint/challenge/verify" method="POST">
<input type="hidden" name="csrfToken" value="ajax:4242">
<input type="hidden" name="challengeId" value="AgE123">
<input name="pin" type="text">
</form></body></html>`;

const FEED_HTML = `<html><head><title>Feed</title></head><body>home</body></html>`;

// A scripted stand-in for the real Chromium page. The state moves the way
// LinkedIn moves it: submit on the login form lands on the feed, a PIN
// page, or back on the form with an error.
class FakePage implements BrowserPage {
  state: "login" | "pin" | "feed" | "cloudflare" | "puzzle" = "login";
  email = "";
  password = "";
  code = "";
  pinAfterLogin: boolean;
  closed = false;

  constructor(options: { pinAfterLogin?: boolean; start?: FakePage["state"] } = {}) {
    this.pinAfterLogin = Boolean(options.pinAfterLogin);
    if (options.start) this.state = options.start;
  }

  async goto(url: string) { void url; }
  async wait(ms: number) { void ms; }
  url() {
    if (this.state === "pin") return "https://www.linkedin.com/checkpoint/challenge/AgE123";
    if (this.state === "feed") return "https://www.linkedin.com/feed/";
    return "https://www.linkedin.com/login";
  }
  async title() {
    return this.state === "cloudflare" ? "Just a moment..." : "LinkedIn";
  }
  async html() {
    if (this.state === "pin") return PIN_HTML;
    if (this.state === "feed") return FEED_HTML;
    if (this.state === "cloudflare") return `<html><head><title>Just a moment...</title></head><body>challenges.cloudflare.com</body></html>`;
    if (this.state === "puzzle") return `<html><body><iframe src="https://www.linkedin.com/checkpoint/challenge/arkose"></iframe></body></html>`;
    return this.password === "wrong" ? LOGIN_ERROR_HTML : LOGIN_HTML;
  }
  async typeFirst(selectors: string[], value: string) {
    const joined = selectors.join(" ");
    if (this.state === "login" && joined.includes("session_key")) { this.email = value; return true; }
    if (this.state === "login" && joined.includes("session_password")) { this.password = value; return true; }
    if (this.state === "pin" && joined.includes("pin")) { this.code = value; return true; }
    return false;
  }
  async clickFirst(selectors: string[]) { void selectors;
    if (this.state === "login") {
      this.state = this.password === "wrong" ? "login" : this.pinAfterLogin ? "pin" : "feed";
      return true;
    }
    if (this.state === "pin") {
      if (this.code === "123456") this.state = "feed";
      return true;
    }
    return false;
  }
  cookies(): Record<string, string> {
    if (this.state === "feed") return { li_at: "AQEDsession", JSESSIONID: '"ajax:4242"' };
    return { JSESSIONID: '"ajax:4242"' };
  }
}

function liveFor(page: FakePage): LiveBrowserLogin {
  return {
    page,
    cookies: async () => page.cookies(),
    close: async () => { page.closed = true; },
    expiresAt: Date.now() + 60_000,
  };
}

function depsFor(page: FakePage) {
  return { launch: async () => liveFor(page), pause: async () => {} };
}

const INPUT = { email: " sam@example.com ", password: "correct horse", userAgent: "Mozilla/5.0 test", proxySessionId: "0123456789abcdef" };

test("email and password typed into the browser return the session jar", async () => {
  const page = new FakePage();
  const outcome = await startBrowserLinkedInLogin(INPUT, depsFor(page));
  expect(page.email).toBe("sam@example.com");
  expect(page.password).toBe("correct horse");
  expect(outcome.kind).toBe("signed_in");
  if (outcome.kind === "signed_in") expect(outcome.cookies).toMatchObject({ li_at: "AQEDsession", JSESSIONID: '"ajax:4242"' });
  expect(page.closed).toBe(true);
});

test("a PIN check keeps the browser open and the right code finishes sign-in", async () => {
  const page = new FakePage({ pinAfterLogin: true });
  const outcome = await startBrowserLinkedInLogin(INPUT, depsFor(page));
  expect(outcome.kind).toBe("challenge");
  if (outcome.kind !== "challenge") return;
  expect(outcome.method).toBe("email");
  expect(page.closed).toBe(false);

  registerLiveBrowserLogin("login-1", outcome.live);
  expect(getLiveBrowserLogin("login-1")).toBe(outcome.live);
  const result = await submitBrowserLinkedInChallenge(outcome.live, { code: "123 456", method: "email" }, depsFor(page));
  expect(result.kind).toBe("signed_in");
  expect(page.code).toBe("123456");
  expect(page.closed).toBe(true);
  await closeLiveBrowserLogin("login-1");
  expect(getLiveBrowserLogin("login-1")).toBeUndefined();
});

test("a wrong password is reported and the browser is closed", async () => {
  const page = new FakePage();
  const error = await startBrowserLinkedInLogin({ ...INPUT, password: "wrong" }, depsFor(page)).catch((caught) => caught);
  expect(error).toBeInstanceOf(LinkedInLoginError);
  expect((error as LinkedInLoginError).reason).toBe("bad_credentials");
  expect(page.closed).toBe(true);
});

test("a wrong code keeps the check open with a retry message", async () => {
  const page = new FakePage({ pinAfterLogin: true });
  const outcome = await startBrowserLinkedInLogin(INPUT, depsFor(page));
  if (outcome.kind !== "challenge") throw new Error("expected a challenge");
  const result = await submitBrowserLinkedInChallenge(outcome.live, { code: "000000", method: "email" }, depsFor(page));
  expect(result.kind).toBe("challenge");
  if (result.kind === "challenge") expect(result.retryError).toContain("didn't work");
  expect(page.closed).toBe(false);
});

test("a malformed code is refused before anything is typed", async () => {
  const page = new FakePage({ pinAfterLogin: true });
  const outcome = await startBrowserLinkedInLogin(INPUT, depsFor(page));
  if (outcome.kind !== "challenge") throw new Error("expected a challenge");
  const error = await submitBrowserLinkedInChallenge(outcome.live, { code: "12", method: "email" }, depsFor(page)).catch((caught) => caught);
  expect((error as LinkedInLoginError).reason).toBe("bad_credentials");
  expect(page.code).toBe("");
});

test("LinkedIn's bot check page is a refusal, not a page change", async () => {
  const page = new FakePage({ start: "cloudflare" });
  const error = await startBrowserLinkedInLogin(INPUT, depsFor(page)).catch((caught) => caught);
  expect((error as LinkedInLoginError).reason).toBe("refused");
  expect(page.closed).toBe(true);
});

test("a security puzzle is reported, never worked around", async () => {
  const page = new FakePage({ start: "puzzle" });
  // The puzzle shows after submit in real life; here classification is
  // what matters, so check the classifier directly as well.
  expect(classifyBrowserPage({ url: page.url(), title: "LinkedIn", html: await page.html(), hasSession: false }).kind).toBe("failure");
  const error = await startBrowserLinkedInLogin(INPUT, depsFor(page)).catch((caught) => caught);
  expect(error).toBeInstanceOf(LinkedInLoginError);
});

test("live checkpoint login markup (hidden error slots, reCAPTCHA v3 badge, in-flight submit) does not misfire", () => {
  const liveCheckpointHtml = `<html><head><title>LinkedIn Login, Sign in | LinkedIn</title></head><body>
    <form method="post" class="login__form" action="/checkpoint/lg/login-submit">
      <div id="error-for-username" class="form__label--error hidden__imp" role="alert"> <!----> </div>
      <input id="username" name="session_key" type="email">
      <div id="error-for-password" class="form__label--error hidden__imp" role="alert"> <!----> </div>
      <input id="password" name="session_password" type="password">
    </form>
    <iframe title="reCAPTCHA" width="256" height="60" role="presentation" src="https://www.google.com/recaptcha/enterprise/anchor?size=invisible"></iframe>
    <code id="lix_pemberly_tracking_recaptcha_v3" style="display: none"><!--"enabled"--></code>
  </body></html>`;

  // Before typing: must stay in "waiting" so credentials can be entered, not
  // fail as a puzzle or wrong password.
  expect(
    classifyBrowserPage({
      url: "https://www.linkedin.com/checkpoint/lg/login",
      title: "LinkedIn Login, Sign in | LinkedIn",
      html: liveCheckpointHtml,
      hasSession: false,
    }),
  ).toEqual({ kind: "waiting" });

  // Immediately after clicking submit while the POST is still in flight
  // (settledTicks === 0): must wait for LinkedIn's response instead of
  // rejecting a valid sign-in.
  expect(
    classifyBrowserPage({
      url: "https://www.linkedin.com/checkpoint/lg/login",
      title: "LinkedIn Login, Sign in | LinkedIn",
      html: liveCheckpointHtml,
      hasSession: false,
      submitted: true,
      settledTicks: 0,
    }),
  ).toEqual({ kind: "waiting" });
});
