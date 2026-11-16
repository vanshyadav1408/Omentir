// Signs in to LinkedIn with an email (or phone) and password in a real
// Chromium browser, then hands the resulting session cookies to the Voyager
// transport (transport.ts) that every later call uses.
//
// Why a browser at all: linkedin.com sits behind a JavaScript bot check.
// A plain fetch gets a 403 "Just a moment..." page (verified live), so the
// old fetch-and-scrape login in login.ts could never submit a password.
// A real browser passes that check the same way a person's own browser
// does. Checks a browser cannot pass either (puzzles, Cloudflare loops on
// a flagged IP) are reported, never worked around.
//
// - The password is typed into linkedin.com once and is never stored or
//   logged. What survives is the session cookie jar.
// - The browser runs through the account's proxy (its static IP from the
//   pool, or its sticky residential session), so the session is created
//   from the same IP every later Voyager call uses.
// - A verification check (email PIN, SMS, authenticator, app approval)
//   keeps the browser open in this process, keyed by the pending login
//   id, for up to ten minutes. That means the verify step must reach the
//   same server process that started the sign-in; the app already runs as
//   one standalone process, and the pacing queues in transport.ts make
//   the same assumption.
//
// login.ts still holds the shared error type and the challenge-page
// reader used to classify what the browser landed on.

import { existsSync } from "node:fs";
import type { Browser, BrowserContext, Page } from "playwright-core";
import {
  hasCodeError,
  hasSecurityPuzzle,
  hasVisibleLoginError,
  LinkedInLoginError,
  LOGIN_PAGE_URL,
  readChallengePage,
  textContent,
  type LoginFailureReason,
  type VerificationMethod,
} from "./login";
import { proxyIdentityOf, proxyUrlForSession, type ProxyIdentity } from "./transport";

const LOGIN_URL = LOGIN_PAGE_URL;
const FEED_URL = "https://www.linkedin.com/feed/";
const LIVE_TTL_MS = 10 * 60_000;
const POLL_MS = 1_500;
const POLL_ATTEMPTS = 25;
// Keep each poll bounded well inside HTTP proxy timeouts; the user can click
// "I approved it" again if they needed longer on their phone.
const APP_POLL_ATTEMPTS = 10;

export class NoBrowserAvailableError extends Error {
  constructor(message = "No Chromium browser is available for LinkedIn sign-in.") {
    super(message);
    this.name = "NoBrowserAvailableError";
  }
}

export type BrowserLoginOutcome =
  | { kind: "signed_in"; cookies: Record<string, string> }
  | {
      kind: "challenge";
      method: VerificationMethod;
      hint?: string;
      retryError?: string;
      // Live browser waiting on the check. Register it under the pending
      // login id with registerLiveBrowserLogin; not serializable.
      live: LiveBrowserLogin;
    };

export type LiveBrowserLogin = {
  page: BrowserPage;
  cookies: () => Promise<Record<string, string>>;
  close: () => Promise<void>;
  expiresAt: number;
};

// The slice of a browser page this flow uses. The real implementation is
// a Playwright page; tests drive a fake with the same shape.
export interface BrowserPage {
  goto: (url: string) => Promise<void>;
  wait: (ms: number) => Promise<void>;
  url: () => string;
  title: () => Promise<string>;
  html: () => Promise<string>;
  // Types into the first selector that exists. False when none does.
  typeFirst: (selectors: string[], value: string) => Promise<boolean>;
  // Clicks the first selector that exists. False when none does.
  clickFirst: (selectors: string[]) => Promise<boolean>;
}

export type BrowserLoginDeps = {
  launch?: (input: ProxyIdentity & { userAgent: string; timezone?: string }) => Promise<LiveBrowserLogin>;
  pause?: (ms: number) => Promise<void>;
};

const defaultPause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ------------------------------------------------------------- live store

const liveLogins = new Map<string, LiveBrowserLogin>();

function sweepExpired() {
  const now = Date.now();
  for (const [id, live] of liveLogins) {
    if (live.expiresAt > now) continue;
    liveLogins.delete(id);
    live.close().catch(() => undefined);
  }
}

export function registerLiveBrowserLogin(id: string, live: LiveBrowserLogin) {
  sweepExpired();
  liveLogins.set(id, live);
}

export function getLiveBrowserLogin(id: string) {
  sweepExpired();
  return liveLogins.get(id);
}

export async function closeLiveBrowserLogin(id: string) {
  const live = liveLogins.get(id);
  if (!live) return;
  liveLogins.delete(id);
  await live.close().catch(() => undefined);
}

// ---------------------------------------------------------------- launch

const BROWSER_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
];

export function browserExecutable(env: NodeJS.ProcessEnv = process.env) {
  const configured = env.LINKEDIN_BROWSER_PATH?.trim() || env.LINKEDIN_BROWSER_EXECUTABLE?.trim();
  if (configured) return configured;
  return BROWSER_CANDIDATES.find((candidate) => existsSync(candidate));
}

function proxyOption(identity: ProxyIdentity) {
  const raw = proxyUrlForSession(identity);
  if (!raw) return undefined;
  const url = new URL(raw);
  return {
    server: `${url.protocol}//${url.host}`,
    ...(url.username ? { username: decodeURIComponent(url.username) } : {}),
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
  };
}

async function launchBrowser(input: ProxyIdentity & { userAgent: string; timezone?: string }): Promise<LiveBrowserLogin> {
  // Loaded on first use, not at module import: playwright-core is a heavy
  // native-adjacent dependency and route/unit-test imports of this module
  // must not pay for (or break on) it.
  const { chromium } = await import("playwright-core");
  let browser: Browser;
  try {
    browser = await chromium.launch({
      ...(browserExecutable() ? { executablePath: browserExecutable() } : {}),
      headless: process.env.LINKEDIN_BROWSER_HEADLESS !== "0",
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
    });
  } catch {
    throw new NoBrowserAvailableError(
      "No Chromium browser is available for LinkedIn sign-in. Set LINKEDIN_BROWSER_PATH on the server.",
    );
  }
  const proxy = proxyOption(input);
  let context: BrowserContext;
  try {
    context = await browser.newContext({
      userAgent: input.userAgent,
      locale: "en-US",
      viewport: { width: 1280, height: 800 },
      ...(input.timezone ? { timezoneId: input.timezone } : {}),
      ...(proxy ? { proxy } : {}),
    });
  } catch (error) {
    await browser.close().catch(() => undefined);
    throw error;
  }
  const page = await context.newPage();
  const wrapped = wrapPage(page);
  return {
    page: wrapped,
    cookies: async () => cookiesOf(context),
    close: async () => {
      await context.close().catch(() => undefined);
      await browser.close().catch(() => undefined);
    },
    expiresAt: Date.now() + LIVE_TTL_MS,
  };
}

async function cookiesOf(context: BrowserContext) {
  const cookies: Record<string, string> = {};
  for (const cookie of await context.cookies()) {
    if (cookie.domain.endsWith("linkedin.com")) cookies[cookie.name] = cookie.value;
  }
  return cookies;
}

function wrapPage(page: Page): BrowserPage {
  return {
    goto: async (url) => {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    },
    wait: (ms) => page.waitForTimeout(ms),
    url: () => page.url(),
    title: () => page.title().catch(() => ""),
    html: () => page.content().catch(() => ""),
    typeFirst: async (selectors, value) => {
      for (const selector of selectors) {
        const locator = page.locator(selector).first();
        if (!(await locator.isVisible().catch(() => false))) continue;
        await locator.fill("", { timeout: 5_000 }).catch(() => undefined);
        await locator.pressSequentially(value, { delay: 45, timeout: 15_000 });
        return true;
      }
      return false;
    },
    clickFirst: async (selectors) => {
      for (const selector of selectors) {
        const locator = page.locator(selector).first();
        if (!(await locator.isVisible().catch(() => false))) continue;
        const navigation = page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 12_000 }).catch(() => undefined);
        await locator.click({ timeout: 15_000 });
        await Promise.race([navigation, page.waitForTimeout(3_000)]);
        return true;
      }
      return false;
    },
  };
}

// ------------------------------------------------------------- page state

const USERNAME_SELECTORS = ["#username", 'input[name="session_key"]', 'input[type="email"]'];
const ACCOUNT_CHOOSER_SELECTORS = [
  'button:has-text("Sign in using another account")',
  'a:has-text("Sign in using another account")',
  "button.signin-other-account",
];
const PASSWORD_SELECTORS = ["#password", 'input[name="session_password"]', 'input[type="password"]'];
const SUBMIT_SELECTORS = ['button[type="submit"]', 'input[type="submit"]'];
const CODE_SELECTORS = [
  "#input__email_verification_pin",
  "#input__phone_verification_pin",
  "#input__two_step_verification_pin",
  'input[name="pin"]',
  'input[name="verificationCode"]',
  'input[name="code"]',
  'input[autocomplete="one-time-code"]',
  'input[name="challenge"]',
];

const CLOUDFLARE = /just a moment|challenges\.cloudflare\.com|__cf_chl/i;

type PageState =
  | { kind: "signed_in" }
  | { kind: "challenge"; method: VerificationMethod; hint?: string; codeError?: boolean }
  | { kind: "failure"; reason: LoginFailureReason; message: string }
  | { kind: "waiting" };

export function classifyBrowserPage(input: {
  url: string;
  title: string;
  html: string;
  hasSession: boolean;
  submitted?: boolean;
  settledTicks?: number;
}): PageState {
  const { url, title, html, hasSession } = input;
  let path = url;
  try {
    path = new URL(url).pathname;
  } catch {
    // keep as is
  }
  const text = textContent(html);
  if (CLOUDFLARE.test(title) || CLOUDFLARE.test(html.slice(0, 4_000))) {
    return {
      kind: "failure",
      reason: "refused",
      message:
        "LinkedIn refused the sign-in request from Omentir, so password sign-in isn't available right now. Try again in a few minutes.",
    };
  }
  if (hasSession && !/\/checkpoint\//i.test(path)) return { kind: "signed_in" };
  if (hasVisibleLoginError(html)) {
    return {
      kind: "failure",
      reason: "bad_credentials",
      message: "LinkedIn didn't accept that sign-in. Check your email and password and try again.",
    };
  }
  if (/too many|unusual activity|temporarily restricted|try again later/i.test(text)) {
    return {
      kind: "failure",
      reason: "blocked",
      message: "LinkedIn is limiting sign-in attempts for this account. Wait a while, then try again.",
    };
  }
  const challenge = readChallengePage(html, url);
  if (challenge) {
    return {
      kind: "challenge",
      method: challenge.method,
      ...(challenge.hint ? { hint: challenge.hint } : {}),
      ...(hasCodeError(html) ? { codeError: true } : {}),
    };
  }
  if (/\/checkpoint\//i.test(path) && /linkedin app|approve|mobile app|tap yes|notification|check your phone/i.test(text)) {
    return { kind: "challenge", method: "app" };
  }
  if (hasSecurityPuzzle(html)) {
    return {
      kind: "failure",
      reason: "unsupported_check",
      message:
        "LinkedIn wants a security puzzle that can only be solved on linkedin.com. Sign in to LinkedIn in this browser once, then try again here.",
    };
  }
  // Still sitting on the login form after several poll ticks: LinkedIn kept the sign-in.
  if (input.submitted && (input.settledTicks ?? 0) >= 3 && /session_key/.test(html) && /session_password/.test(html)) {
    return {
      kind: "failure",
      reason: "bad_credentials",
      message: "LinkedIn didn't accept that sign-in. Check your email and password and try again.",
    };
  }
  return { kind: "waiting" };
}

async function readState(live: LiveBrowserLogin, submitted = false, settledTicks = 0): Promise<PageState> {
  const cookies = await live.cookies();
  return classifyBrowserPage({
    url: live.page.url(),
    title: await live.page.title(),
    html: await live.page.html(),
    hasSession: Boolean(cookies.li_at),
    submitted,
    settledTicks,
  });
}

// Polls until the page settles into a state worth reporting. A challenge
// seen again at the same URL after a code submit means the code failed.
async function settle(
  live: LiveBrowserLogin,
  pause: (ms: number) => Promise<void>,
  attempts = POLL_ATTEMPTS,
  previousChallengeUrl?: string,
): Promise<BrowserLoginOutcome> {
  if (previousChallengeUrl) await pause(1_000);
  let appChallenge: Extract<PageState, { kind: "challenge" }> | undefined;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const state = await readState(live, true, attempt);
    if (state.kind === "signed_in") return finishSignIn(live);
    if (state.kind === "failure") throw new LinkedInLoginError(state.reason, state.message);
    if (state.kind === "challenge") {
      const retry = Boolean(previousChallengeUrl && samePath(live.page.url(), previousChallengeUrl));
      // App approval: the same check page stays up until the person
      // approves on their phone, so keep polling instead of reporting
      // the check again straight away.
      if (retry && state.method === "app") {
        appChallenge = state;
        await pause(POLL_MS);
        continue;
      }
      // Give an in-flight PIN submit two poll cycles before concluding the
      // page stayed put, unless LinkedIn already rendered an error banner.
      if (retry && !state.codeError && attempt < 2) {
        await pause(POLL_MS);
        continue;
      }
      return {
        kind: "challenge",
        method: state.method,
        ...(state.hint ? { hint: state.hint } : {}),
        ...(retry ? { retryError: "That code didn't work. Check it and try again, or request a new one from LinkedIn." } : {}),
        live,
      };
    }
    await pause(POLL_MS);
  }
  // Still waiting on the phone approval when the poll budget ran out:
  // hand the check back so the person can confirm and poll again.
  if (appChallenge) {
    return {
      kind: "challenge",
      method: appChallenge.method,
      ...(appChallenge.hint ? { hint: appChallenge.hint } : {}),
      retryError: "LinkedIn hasn't confirmed your approval yet. Approve the sign-in in the LinkedIn app, then try again.",
      live,
    };
  }
  throw new LinkedInLoginError("unexpected", "LinkedIn sign-in didn't finish. Try again later.");
}

function samePath(a: string, b: string) {
  try {
    return new URL(a).pathname === new URL(b).pathname;
  } catch {
    return false;
  }
}

async function finishSignIn(live: LiveBrowserLogin): Promise<BrowserLoginOutcome> {
  let cookies = await live.cookies();
  // Voyager calls need the csrf JSESSIONID. It is normally set by the
  // login pages; fetch the feed once if LinkedIn has not set it yet.
  if (!/^"?ajax:/.test(cookies.JSESSIONID || "")) {
    await live.page.goto(FEED_URL).catch(() => undefined);
    await live.page.wait(1_000).catch(() => undefined);
    cookies = await live.cookies();
  }
  if (!cookies.li_at || !/^"?ajax:/.test(cookies.JSESSIONID || "")) {
    throw new LinkedInLoginError("unexpected", "LinkedIn signed in but did not start a usable session. Try again.");
  }
  return { kind: "signed_in", cookies };
}

// ----------------------------------------------------------------- flows

export async function startBrowserLinkedInLogin(
  input: ProxyIdentity & { email: string; password: string; userAgent: string; timezone?: string },
  deps: BrowserLoginDeps = {},
): Promise<BrowserLoginOutcome> {
  const pause = deps.pause || defaultPause;
  const launch = deps.launch || launchBrowser;
  const live = await launch({ userAgent: input.userAgent, ...proxyIdentityOf(input), ...(input.timezone ? { timezone: input.timezone } : {}) });
  try {
    await live.page.goto(LOGIN_URL);
    // Let the bot check run before touching the form.
    await pause(2_000);
    const landed = await readState(live);
    if (landed.kind === "failure") throw new LinkedInLoginError(landed.reason, landed.message);
    if (landed.kind === "signed_in") return finishSignIn(live);

    if (!(await live.page.typeFirst(USERNAME_SELECTORS, input.email.trim()))) {
      await live.page.clickFirst(ACCOUNT_CHOOSER_SELECTORS);
      await pause(800);
      if (!(await live.page.typeFirst(USERNAME_SELECTORS, input.email.trim()))) {
        const state = await readState(live);
        if (state.kind === "failure") throw new LinkedInLoginError(state.reason, state.message);
        throw new LinkedInLoginError("unexpected", "LinkedIn's sign-in page has changed. Omentir can't sign in with a password right now.");
      }
    }
    await live.page.typeFirst(PASSWORD_SELECTORS, input.password);
    await pause(600);
    if (!(await live.page.clickFirst(SUBMIT_SELECTORS))) {
      throw new LinkedInLoginError("unexpected", "LinkedIn's sign-in page has changed. Omentir can't sign in with a password right now.");
    }
    const outcome = await settle(live, pause);
    if (outcome.kind === "signed_in") await live.close().catch(() => undefined);
    return outcome;
  } catch (error) {
    await live.close().catch(() => undefined);
    throw error;
  }
}

// Sends the code (or, for app approval, just waits for the approval) in
// the browser that is still sitting on LinkedIn's check page.
export async function submitBrowserLinkedInChallenge(
  live: LiveBrowserLogin,
  input: { code?: string; method: VerificationMethod },
  deps: BrowserLoginDeps = {},
): Promise<BrowserLoginOutcome> {
  const pause = deps.pause || defaultPause;
  const previousUrl = live.page.url();
  if (input.method !== "app") {
    const code = (input.code || "").replace(/\s+/g, "");
    if (!/^[A-Za-z0-9]{4,12}$/.test(code)) {
      throw new LinkedInLoginError("bad_credentials", "Enter the code exactly as LinkedIn shows it.");
    }
    if (!(await live.page.typeFirst(CODE_SELECTORS, code))) {
      // The check page moved on (or expired) since the code was sent.
      const state = await readState(live);
      if (state.kind === "signed_in") return finishSignIn(live);
      if (state.kind === "failure") throw new LinkedInLoginError(state.reason, state.message);
      throw new LinkedInLoginError("unexpected", "LinkedIn's check page has changed. Start the sign-in again.");
    }
    await pause(400);
    await live.page.clickFirst(SUBMIT_SELECTORS);
    const outcome = await settle(live, pause, POLL_ATTEMPTS, previousUrl);
    if (outcome.kind === "signed_in") await live.close().catch(() => undefined);
    return outcome;
  }
  // App approval: nothing to type. Poll until LinkedIn lets the browser
  // through or the check times out on LinkedIn's side.
  const outcome = await settle(live, pause, APP_POLL_ATTEMPTS, previousUrl);
  if (outcome.kind === "signed_in") await live.close().catch(() => undefined);
  return outcome;
}
