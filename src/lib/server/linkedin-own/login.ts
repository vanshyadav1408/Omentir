// Signs in to LinkedIn with an email (or phone) and password, the way the
// linkedin.com login page does, and returns the resulting browser session.
//
// - The password is sent once, only to https://www.linkedin.com, and is never
//   stored or logged. What survives is the session cookie jar.
// - Requests use the person's own browser user agent and the account's sticky
//   proxy session, the same identity every later Voyager call uses.
// - When LinkedIn asks for a check, the check's form is returned so the person
//   can enter the code (email, SMS, authenticator) or approve in the app. Checks
//   that need a browser (puzzles) are reported, never worked around.
//
// Status: written from linkedin.com's login and checkpoint pages, NOT yet
// verified live. Unknown pages log a one-line diagnostic (status and path
// only) so the flow can be adjusted.

import { LinkedInResponseError } from "../linkedin-errors";
import { fetchOptionsForProxy, mergeSetCookies, proxyIdentityOf, proxyUrlForSession, serializeCookies, setCookieHeaders, type ProxyIdentity } from "./transport";

const ORIGIN = "https://www.linkedin.com";
export const LOGIN_PAGE_URL = `${ORIGIN}/checkpoint/lg/login`;
const FEED_URL = `${ORIGIN}/feed/`;
const TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 6;
// A person takes a few seconds to type their email and password.
const TYPING_PAUSE_MS: [number, number] = [2_500, 5_000];

export type LoginContext = ProxyIdentity & {
  cookies: Record<string, string>;
  userAgent: string;
};

export type VerificationMethod = "email" | "sms" | "authenticator" | "app" | "code";

export type ChallengeForm = {
  pageUrl: string;
  action: string;
  fields: Array<[string, string]>;
  // Name of the input that takes the code. Missing for app approval.
  codeField?: string;
};

export type LoginOutcome =
  | { kind: "signed_in"; cookies: Record<string, string> }
  | {
      kind: "challenge";
      cookies: Record<string, string>;
      challenge: ChallengeForm;
      method: VerificationMethod;
      hint?: string;
      // Set when LinkedIn rejected the code that was just entered.
      retryError?: string;
    };

// refused: LinkedIn turned away the request itself (403) before any sign-in
// step, which is its bot protection rejecting a server-side client. Never
// worked around; the person tries again later.
export type LoginFailureReason = "bad_credentials" | "unsupported_check" | "blocked" | "refused" | "unexpected";

export class LinkedInLoginError extends Error {
  constructor(readonly reason: LoginFailureReason, message: string) {
    super(message);
    this.name = "LinkedInLoginError";
  }
}

export type LoginDeps = {
  pause?: (ms: number) => Promise<void>;
};

const defaultPause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function between([min, max]: [number, number]) {
  return min + Math.floor(Math.random() * (max - min));
}

// ---------------------------------------------------------------- HTML

const NAMED_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeHtml(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    const lower = entity.toLowerCase();
    try {
      if (lower.startsWith("#x")) return String.fromCodePoint(parseInt(lower.slice(2), 16));
      if (lower.startsWith("#")) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    } catch {
      return match;
    }
    return NAMED_ENTITIES[lower] ?? match;
  });
}

// A start tag, allowing ">" inside quoted attribute values.
const TAG_BODY = String.raw`(?:"[^"]*"|'[^']*'|[^'">])*`;

export function parseAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const body = tag.replace(/^<\s*[a-z0-9-]+/i, "").replace(/\/?\s*>$/, "");
  const pattern = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of body.matchAll(pattern)) {
    const name = match[1].toLowerCase();
    if (name in attributes) continue;
    attributes[name] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

export type HtmlForm = {
  attributes: Record<string, string>;
  inputs: Array<Record<string, string>>;
  html: string;
};

export function parseForms(html: string): HtmlForm[] {
  const forms: HtmlForm[] = [];
  const formPattern = new RegExp(String.raw`<form\b${TAG_BODY}>([\s\S]*?)</form\s*>`, "gi");
  const inputPattern = new RegExp(String.raw`<input\b${TAG_BODY}>`, "gi");
  for (const match of html.matchAll(formPattern)) {
    const openTag = match[0].match(new RegExp(String.raw`^<form\b${TAG_BODY}>`, "i"))?.[0] || "<form>";
    forms.push({
      attributes: parseAttributes(openTag),
      inputs: [...match[1].matchAll(inputPattern)].map((input) => parseAttributes(input[0])),
      html: match[1],
    });
  }
  return forms;
}

// The values a browser would submit for this form, minus buttons and
// unchecked boxes.
export function formFields(form: HtmlForm): Array<[string, string]> {
  const fields: Array<[string, string]> = [];
  for (const input of form.inputs) {
    const name = input.name;
    if (!name) continue;
    const type = (input.type || "text").toLowerCase();
    if (["submit", "button", "image", "file", "reset"].includes(type)) continue;
    if ((type === "checkbox" || type === "radio") && !("checked" in input)) continue;
    fields.push([name, input.value ?? ""]);
  }
  return fields;
}

export function textContent(html: string) {
  return decodeHtml(
    html
      .replace(/<script\b[\s\S]*?<\/script\b[^>]*>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function pageTitle(html: string) {
  return textContent(html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] || "").slice(0, 120);
}

// ---------------------------------------------------------------- pages

const LOGIN_FORM_ACTION = /login-submit|uas\/login-submit/i;

export function findLoginForm(html: string) {
  return parseForms(html).find(
    (form) => form.inputs.some((input) => input.name === "session_key") || LOGIN_FORM_ACTION.test(form.attributes.action || ""),
  );
}

const PUZZLE_IFRAME = /arkose|funcaptcha|hcaptcha|recaptcha\/(?:api2|enterprise)\/bframe|checkpoint\/challenge\/[^\s"']*captcha/i;
const CODE_INPUT_NAME = /^(?:pin|code|verificationcode|verification_code|otp|twostepcode|security_code|challenge_response)$/i;
const CODE_ERROR = /not the right code|wrong code|incorrect|invalid (?:code|pin|verification)|code (?:is|has) expired|try again/i;

// Strips scripts, styles, and hidden <code> flags (LinkedIn embeds feature
// flags like lix_pemberly_tracking_recaptcha_v3 in <code> elements on every
// checkpoint page, which must not be mistaken for an interactive puzzle).
function stripInertMarkup(html: string) {
  return html
    .replace(/<script\b[\s\S]*?<\/script\b[^>]*>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<code\b[\s\S]*?<\/code\s*>/gi, " ");
}

export function hasSecurityPuzzle(html: string) {
  if (findLoginForm(html)) return false;
  const cleaned = stripInertMarkup(html);
  for (const match of cleaned.matchAll(new RegExp(String.raw`<iframe\b${TAG_BODY}>`, "gi"))) {
    const attrs = parseAttributes(match[0]);
    if (attrs.role?.toLowerCase() === "presentation") continue;
    const descriptor = `${attrs.src || ""} ${attrs.id || ""} ${attrs.title || ""} ${attrs.class || ""}`;
    if (PUZZLE_IFRAME.test(descriptor)) return true;
  }
  if (/(?:id=["']captcha-internal["']|name=["']captchaUserResponseToken["'])/i.test(cleaned)) {
    return true;
  }
  const visible = textContent(cleaned);
  return /solve this puzzle|security puzzle|verify you are a human/i.test(visible);
}

function codeInputOf(form: HtmlForm) {
  const named = form.inputs.find((input) => {
    const type = (input.type || "text").toLowerCase();
    return input.name && type !== "hidden" && CODE_INPUT_NAME.test(input.name);
  });
  if (named) return named;
  if (!/checkpoint/i.test(form.attributes.action || "")) return undefined;
  if (form.inputs.some((input) => input.name === "session_key" || input.name === "session_password")) {
    return undefined;
  }
  const visibleInputs = form.inputs.filter((input) => {
    const type = (input.type || "text").toLowerCase();
    return Boolean(input.name) && ["text", "tel", "number"].includes(type);
  });
  return visibleInputs.length === 1 ? visibleInputs[0] : undefined;
}

function methodFor(text: string, codeField?: string): VerificationMethod {
  if (!codeField) return "app";
  if (/authenticator/i.test(text)) return "authenticator";
  if (/text message|\bSMS\b|phone number|mobile number/i.test(text)) return "sms";
  if (/e-?mail/i.test(text)) return "email";
  return "code";
}

// LinkedIn's own instruction line ("Enter the code we sent to ..."), shown as
// plain text so the person knows where to look.
function hintFrom(html: string) {
  const paragraphs = [...html.matchAll(/<(p|h1|h2|label)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)].map((match) => textContent(match[2]));
  const line = paragraphs.find((text) => /code|sent|verif|authenticator|approve|app/i.test(text) && text.length > 12);
  return line ? line.slice(0, 240) : undefined;
}

function absoluteLinkedInUrl(raw: string, base: string) {
  let url: URL;
  try {
    url = new URL(raw || base, base);
  } catch {
    throw new LinkedInLoginError("unexpected", "LinkedIn sign-in sent an unreadable address.");
  }
  // Credentials and codes only ever go to linkedin.com over HTTPS.
  if (url.protocol !== "https:" || url.hostname !== "www.linkedin.com") {
    throw new LinkedInLoginError("unexpected", "LinkedIn sign-in pointed to an unexpected address.");
  }
  return url.toString();
}

export function readChallengePage(html: string, pageUrl: string, retry = false): Extract<LoginOutcome, { kind: "challenge" }> | null {
  if (findLoginForm(html)) return null;
  const forms = parseForms(html);
  const codeForm = forms.find((form) => codeInputOf(form));
  if (!codeForm && hasSecurityPuzzle(html)) return null;
  const form = codeForm || forms.find((candidate) => /checkpoint/i.test(candidate.attributes.action || ""));
  if (!form) return null;
  const codeField = codeInputOf(form)?.name;
  const text = textContent(html);
  if (!codeField && !/linkedin app|approve|mobile app|tap yes|notification|check your phone/i.test(text)) return null;
  const errorText = retry ? errorMessageIn(html) : undefined;
  const hint = hintFrom(html);
  const retryMessage = retry
    ? codeField || errorText
      ? "That code didn't work. Check it and try again, or request a new one from LinkedIn."
      : "LinkedIn hasn't confirmed your approval yet. Approve the sign-in in the LinkedIn app, then try again."
    : undefined;
  return {
    kind: "challenge",
    cookies: {},
    challenge: {
      pageUrl,
      action: absoluteLinkedInUrl(form.attributes.action || "", pageUrl),
      fields: formFields(form).filter(([name]) => name !== codeField),
      ...(codeField ? { codeField } : {}),
    },
    method: methodFor(text, codeField),
    ...(hint ? { hint } : {}),
    ...(retryMessage ? { retryError: retryMessage } : {}),
  };
}

export function errorMessageIn(html: string) {
  const errors = [...html.matchAll(new RegExp(String.raw`<(div|span|p)\b(${TAG_BODY})>([\s\S]*?)<\/\1\s*>`, "gi"))]
    .filter((match) => {
      const attrs = parseAttributes(`<div ${match[2]}>`);
      const cls = attrs.class || "";
      const id = attrs.id || "";
      if (/\bhidden(?:__imp)?\b/i.test(cls)) return false;
      return /error|alert-content/i.test(`${cls} ${id}`);
    })
    .map((match) => textContent(match[3]))
    .filter(Boolean);
  return errors.find((text) => CODE_ERROR.test(text)) || errors[0];
}

export function hasCodeError(html: string) {
  return Boolean(errorMessageIn(html)) || CODE_ERROR.test(textContent(html));
}

const VISIBLE_LOGIN_ERROR_TEXT =
  /wrong (?:email|password)|incorrect (?:email|password)|that password doesn't look right|couldn't find a linkedin account|recognize that email|please enter a valid/i;

// LinkedIn's blank /checkpoint/lg/login page includes empty hidden placeholder
// divs (#error-for-username, #error-for-password with class hidden__imp). Only
// non-hidden error containers with actual text count as a rejected sign-in.
export function hasVisibleLoginError(html: string) {
  for (const match of html.matchAll(new RegExp(String.raw`<(div|span|p)\b(${TAG_BODY})>([\s\S]*?)<\/\1\s*>`, "gi"))) {
    const attrs = parseAttributes(`<div ${match[2]}>`);
    const cls = attrs.class || "";
    const id = attrs.id || "";
    if (/\bhidden(?:__imp)?\b/i.test(cls)) continue;
    if (!/(?:^error-for-(?:password|username)$|form__label--error|alert-content)/i.test(`${id} ${cls}`)) continue;
    if (textContent(match[3]).length > 0) return true;
  }
  return VISIBLE_LOGIN_ERROR_TEXT.test(textContent(html));
}

function loginFailure(html: string): LinkedInLoginError {
  const text = textContent(html);
  if (/too many|unusual activity|temporarily restricted|try again later/i.test(text)) {
    return new LinkedInLoginError("blocked", "LinkedIn is limiting sign-in attempts for this account. Wait a while, then try again.");
  }
  return new LinkedInLoginError("bad_credentials", "LinkedIn didn't accept that sign-in. Check your email and password and try again.");
}

function hasLoginError(html: string) {
  return hasVisibleLoginError(html) || Boolean(findLoginForm(html));
}

function refusedError() {
  return new LinkedInLoginError(
    "refused",
    "LinkedIn refused the sign-in request from Omentir, so password sign-in isn't available right now. Try again in a few minutes.",
  );
}

function puzzleError() {
  return new LinkedInLoginError(
    "unsupported_check",
    "LinkedIn wants a security puzzle that can only be solved on linkedin.com. Sign in to LinkedIn in this browser once, then try again here.",
  );
}

function diagnostic(step: string, status: number, url: string, html = "") {
  // Status and path only: no query string, cookies, email or password.
  let path = url;
  try {
    path = new URL(url).pathname;
  } catch {
    // keep as is
  }
  console.warn(`[linkedin-own] login ${step}: unexpected response`, JSON.stringify({ status, path, title: pageTitle(html) }));
}

// ---------------------------------------------------------------- HTTP

async function request(
  context: LoginContext,
  url: string,
  init: { form?: Array<[string, string]>; referer?: string } = {},
) {
  const target = absoluteLinkedInUrl(url, ORIGIN);
  let response: Response;
  try {
    response = await fetch(target, {
      method: init.form ? "POST" : "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": context.userAgent,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        ...(Object.keys(context.cookies).length ? { cookie: serializeCookies(context.cookies) } : {}),
        ...(init.referer ? { referer: init.referer } : {}),
        ...(init.form ? { "content-type": "application/x-www-form-urlencoded", origin: ORIGIN } : {}),
      },
      ...(init.form ? { body: new URLSearchParams(init.form).toString() } : {}),
      ...fetchOptionsForProxy(proxyUrlForSession(context)),
    } as RequestInit);
  } catch (error) {
    if (error instanceof LinkedInResponseError) throw error;
    throw new LinkedInLoginError("unexpected", "Could not reach LinkedIn. Try again in a moment.");
  }
  const merged = mergeSetCookies(context.cookies, setCookieHeaders(response));
  if (merged) context.cookies = merged;
  if (response.status === 999 || response.status === 429) {
    throw new LinkedInLoginError("blocked", "LinkedIn is limiting sign-in attempts right now. Wait a while, then try again.");
  }
  return response;
}

const CHALLENGE_PATH = /\/checkpoint\/(?:challenge|challengesV2|rp\/request-password-reset|pk\/)/i;
const CHECKPOINT_PATH = /^\/checkpoint\//i;

// Follows redirects by hand until LinkedIn either sets the session cookie or
// shows a page. Returns that page's URL and HTML.
async function settle(context: LoginContext, response: Response, url: string) {
  let current = response;
  let currentUrl = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const location = current.status >= 300 && current.status < 400 ? current.headers.get("location") : null;
    if (!location) {
      return { status: current.status, url: currentUrl, html: await current.text().catch(() => ""), redirected: hop > 0 };
    }
    const next = new URL(location, currentUrl);
    // Signed in: the session cookie is set and LinkedIn has left /checkpoint/.
    if (context.cookies.li_at && !CHECKPOINT_PATH.test(next.pathname)) {
      return { status: current.status, url: next.toString(), html: "", signedIn: true, redirected: true };
    }
    if (next.hostname !== "www.linkedin.com" && next.hostname !== "linkedin.com") {
      diagnostic("redirect", current.status, next.toString());
      throw new LinkedInLoginError("unexpected", "LinkedIn sign-in went somewhere unexpected. Try again later.");
    }
    next.hostname = "www.linkedin.com";
    const referer = currentUrl;
    currentUrl = next.toString();
    current = await request(context, currentUrl, { referer });
  }
  throw new LinkedInLoginError("unexpected", "LinkedIn sign-in redirected too many times. Try again later.");
}

async function finishSignIn(context: LoginContext): Promise<LoginOutcome> {
  // Voyager calls need the csrf JSESSIONID. It is normally set by the login
  // page; fetch the feed once if LinkedIn has not set it yet.
  if (!/^"?ajax:/.test(context.cookies.JSESSIONID || "")) {
    await request(context, FEED_URL, { referer: LOGIN_PAGE_URL });
  }
  if (!context.cookies.li_at || !/^"?ajax:/.test(context.cookies.JSESSIONID || "")) {
    throw new LinkedInLoginError("unexpected", "LinkedIn signed in but did not start a usable session. Try again.");
  }
  return { kind: "signed_in", cookies: context.cookies };
}

function samePath(a: string, b?: string) {
  if (!b) return false;
  try {
    return new URL(a).pathname === new URL(b).pathname;
  } catch {
    return false;
  }
}

async function outcomeOf(
  context: LoginContext,
  page: { status: number; url: string; html: string; signedIn?: boolean; redirected: boolean },
  step: "login" | "verify",
  previousChallengeUrl?: string,
): Promise<LoginOutcome> {
  if (page.signedIn || (context.cookies.li_at && !CHECKPOINT_PATH.test(new URL(page.url).pathname))) {
    return finishSignIn(context);
  }
  if (page.status === 401 || page.status === 403) {
    diagnostic(step, page.status, page.url, page.html);
    throw refusedError();
  }
  const path = new URL(page.url).pathname;
  if (CHALLENGE_PATH.test(path) || step === "verify") {
    // The same check shown again means the code was rejected; a different
    // page means LinkedIn moved on to another check (email PIN, then 2FA).
    const retry = step === "verify" && (!page.redirected || samePath(page.url, previousChallengeUrl));
    const challenge = readChallengePage(page.html, page.url, retry);
    if (challenge) return { ...challenge, cookies: context.cookies };
    if (hasSecurityPuzzle(page.html) || /captcha/i.test(path)) throw puzzleError();
    diagnostic(step, page.status, page.url, page.html);
    throw new LinkedInLoginError(
      "unsupported_check",
      "LinkedIn asked for a security check that can't be completed here. Sign in to LinkedIn in this browser once, then try again.",
    );
  }
  if (step === "login" && (hasLoginError(page.html) || /\/(?:login|uas\/login|checkpoint\/lg)/i.test(path))) {
    const failure = loginFailure(page.html);
    if (!hasVisibleLoginError(page.html)) diagnostic("login", page.status, page.url, page.html);
    throw failure;
  }
  diagnostic(step, page.status, page.url, page.html);
  throw new LinkedInLoginError("unexpected", "LinkedIn returned a page Omentir doesn't recognise yet. Try again later.");
}

// ---------------------------------------------------------------- flows

export async function startLinkedInLogin(
  input: ProxyIdentity & { email: string; password: string; userAgent: string },
  deps: LoginDeps = {},
): Promise<LoginOutcome> {
  const pause = deps.pause || defaultPause;
  const context: LoginContext = { cookies: {}, userAgent: input.userAgent, ...proxyIdentityOf(input) };

  const loginPage = await request(context, LOGIN_PAGE_URL);
  const html = loginPage.status === 200 ? await loginPage.text().catch(() => "") : "";
  const form = findLoginForm(html);
  if (!form) {
    diagnostic("page", loginPage.status, LOGIN_PAGE_URL, html);
    if (loginPage.status === 401 || loginPage.status === 403) throw refusedError();
    throw new LinkedInLoginError("unexpected", "LinkedIn's sign-in page has changed. Omentir can't sign in with a password right now.");
  }
  const action = absoluteLinkedInUrl(form.attributes.action || "", LOGIN_PAGE_URL);
  const fields = formFields(form).filter(([name]) => name !== "session_key" && name !== "session_password");
  fields.push(["session_key", input.email.trim()], ["session_password", input.password]);

  await pause(between(TYPING_PAUSE_MS));
  const submitted = await request(context, action, { form: fields, referer: LOGIN_PAGE_URL });
  return outcomeOf(context, await settle(context, submitted, action), "login");
}

// Sends the code (or, for app approval, just the form) back to LinkedIn.
export async function submitLinkedInChallenge(
  input: ProxyIdentity & { cookies: Record<string, string>; challenge: ChallengeForm; userAgent: string; code?: string },
  deps: LoginDeps = {},
): Promise<LoginOutcome> {
  const pause = deps.pause || defaultPause;
  const context: LoginContext = { cookies: { ...input.cookies }, userAgent: input.userAgent, ...proxyIdentityOf(input) };
  const { challenge } = input;
  const fields = [...challenge.fields];
  if (challenge.codeField) {
    const code = (input.code || "").replace(/\s+/g, "");
    if (!/^[A-Za-z0-9]{4,12}$/.test(code)) {
      throw new LinkedInLoginError("bad_credentials", "Enter the code exactly as LinkedIn shows it.");
    }
    fields.push([challenge.codeField, code]);
  }
  await pause(between([800, 1_600]));
  const action = absoluteLinkedInUrl(challenge.action, challenge.pageUrl);
  const submitted = await request(context, action, { form: fields, referer: challenge.pageUrl });
  return outcomeOf(context, await settle(context, submitted, action), "verify", challenge.pageUrl);
}
