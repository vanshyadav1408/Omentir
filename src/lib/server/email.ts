import "server-only";

import { Resend } from "resend";
import {
  hostedNewSignupFrom,
  hostedNewSignupTo,
  hostedTransactionalFrom,
  hostedWelcomeFrom,
} from "@/lib/hosted-identity";
import { isLocalMode } from "@/lib/runtime-mode";
import { getAppBaseUrl } from "./runtime-config";
import type { DailyDigestStats } from "@/lib/daily-digest";

export type { DailyDigestStats };

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || (isLocalMode() && !process.env.RESEND_FROM_EMAIL?.trim())) return null;
  return new Resend(apiKey);
}

function hostedEmailEnabled() {
  return !isLocalMode();
}

/** Transactional From: operator's Resend address in local mode; hosted default otherwise. */
function transactionalFrom() {
  return process.env.RESEND_FROM_EMAIL?.trim() || hostedTransactionalFrom();
}

function appUrl(path: string) {
  return `${getAppBaseUrl()}${path}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Email design. One column, no card, no logo: the content, then a footer
 * line. Serif headlines, sans body, calls to action as underlined links.
 * Tone colors mark highlights (step numbers, the digest's reply count).
 *
 * Light colors are inline so every client gets them. MAIL_DARK rides in a
 * prefers-color-scheme block for mail apps that honor it (Apple Mail, iOS
 * Mail, Outlook for Mac); Gmail and Zoho darken the light version themselves.
 * Hex only: color-mix()/rgba() do not survive email clients.
 */
const MAIL = {
  text: "#15151a",
  textMuted: "#5d5d68",
  textFaint: "#8e8e99",
  rule: "#e7e7eb",
  soft: "#f4f4f6",
  blue: "#2f5be7",
  green: "#0f7b57",
  amber: "#a85a00",
} as const;

const MAIL_DARK: Record<keyof typeof MAIL, string> = {
  text: "#ededf0",
  textMuted: "#a6a6b0",
  textFaint: "#7a7a84",
  rule: "#2d2d34",
  soft: "#222228",
  blue: "#8aa4ff",
  green: "#4fd19a",
  amber: "#f2b24e",
};

type MailTone = "text" | "blue" | "green" | "amber";

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif";
const SERIF = "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif";

/** Dark overrides for the m-* classes. !important because inline styles win otherwise. */
function darkModeCss() {
  const d = MAIL_DARK;
  return `
      :root { color-scheme: light dark; supported-color-schemes: light dark; }
      @media (prefers-color-scheme: dark) {
        .m-text { color: ${d.text} !important; }
        .m-muted { color: ${d.textMuted} !important; }
        .m-faint, .m-faint a { color: ${d.textFaint} !important; }
        .m-rule { border-color: ${d.rule} !important; }
        .m-soft { background-color: ${d.soft} !important; }
        .m-tone-text { color: ${d.text} !important; }
        .m-tone-blue { color: ${d.blue} !important; }
        .m-tone-green { color: ${d.green} !important; }
        .m-tone-amber { color: ${d.amber} !important; }
      }`;
}

function toneAttr(tone: MailTone) {
  return `class="m-tone-${tone}" style="color:${MAIL[tone]};`;
}

function plural(count: number, one: string, many: string) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;
}

function emailShell(input: {
  title: string;
  bodyHtml: string;
  footerHtml: string;
  preheader?: string;
}) {
  const preheaderHtml = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">${escapeHtml(input.preheader)}</div>`
    : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>${escapeHtml(input.title)}</title>
    <style>${darkModeCss()}
    </style>
  </head>
  <body style="margin:0;padding:12px;font-family:${SANS};-webkit-font-smoothing:antialiased;">
    ${preheaderHtml}
    <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;">
      <tr>
        <td style="padding:8px 0 40px;">
          ${input.bodyHtml}
        </td>
      </tr>
      <tr>
        <td class="m-rule m-faint" style="padding:20px 0 8px;border-top:1px solid ${MAIL.rule};font-family:${SANS};font-size:12px;line-height:1.6;color:${MAIL.textFaint};">
          ${input.footerHtml}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function headlineHtml(text: string) {
  return `<h1 class="m-text" style="margin:0;font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:400;letter-spacing:-0.01em;color:${MAIL.text};">${escapeHtml(text)}</h1>`;
}

function introHtml(text: string) {
  return `<p class="m-muted" style="margin:14px 0 0;font-family:${SANS};font-size:16px;line-height:1.6;color:${MAIL.textMuted};">${escapeHtml(text)}</p>`;
}

function paragraphHtml(text: string, margin = "16px 0 0") {
  return `<p class="m-text" style="margin:${margin};font-family:${SANS};font-size:15px;line-height:1.6;color:${MAIL.text};">${escapeHtml(text)}</p>`;
}

function sectionLabelHtml(text: string, margin = "28px 0 10px") {
  return `<p class="m-faint" style="margin:${margin};font-family:${SANS};font-size:11px;line-height:1.4;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${MAIL.textFaint};">${escapeHtml(text)}</p>`;
}

/** The quiet call to action: an underlined link set in the body text. */
function textLinkHtml(href: string, label: string, secondary?: { href: string; label: string }) {
  const secondaryHtml = secondary
    ? ` &nbsp; &nbsp; <a class="m-text" href="${escapeHtml(secondary.href)}" style="color:${MAIL.text};text-decoration:underline;">${escapeHtml(secondary.label)}</a>`
    : "";
  return `<p style="margin:28px 0 0;font-family:${SANS};font-size:15px;line-height:1.6;"><a class="m-text" href="${escapeHtml(href)}" style="color:${MAIL.text};font-weight:600;text-decoration:underline;">${escapeHtml(label)}</a>${secondaryHtml}</p>`;
}

/** A chat-style bubble: their message as they wrote it, line breaks kept. */
function messageBubbleHtml(name: string, body: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0;">
            <tr>
              <td valign="top">
                <p class="m-text" style="margin:0 0 8px;font-family:${SANS};font-size:14px;line-height:20px;font-weight:600;color:${MAIL.text};">${escapeHtml(name)}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td class="m-soft m-text" bgcolor="${MAIL.soft}" style="padding:14px 18px;border-radius:4px 16px 16px 16px;background:${MAIL.soft};color:${MAIL.text};font-family:${SANS};font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(body)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>`;
}

const overviewUrl = () => appUrl("/overview");
const messagesUrl = () => appUrl("/messages");
const settingsUrl = () => appUrl("/settings");
const NOTIFICATION_FOOTER = "Omentir sends these to the notification email in your settings.";

function footerLinkHtml(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="color:${MAIL.textFaint};text-decoration:underline;">${escapeHtml(label)}</a>`;
}

function notificationFooterHtml() {
  return `${escapeHtml(NOTIFICATION_FOOTER)} ${footerLinkHtml(settingsUrl(), "Change it")}`;
}

function notificationFooterText(body: string) {
  return `${body}\n\n${NOTIFICATION_FOOTER} Change it: ${settingsUrl()}`;
}

function buildSignupWelcomeEmail(input: { firstName?: string; unsubscribeUrl?: string }) {
  const greeting = input.firstName ? `Hi ${input.firstName},` : "Hi,";
  const intro =
    "Omentir finds people who match your ideal customer and starts conversations with them on LinkedIn. Setup takes three steps.";
  const steps = [
    { title: "Connect your LinkedIn account", detail: "Invites and messages go out from it, under your name." },
    { title: "Describe your ideal customer", detail: "Omentir uses it to decide who to reach out to." },
    { title: "Set up outreach", detail: "Let AI write each message, or write the sequence yourself." },
  ];
  const help = "If you get stuck, just reply to this email with your query, we're there to help.";

  const stepsHtml = steps
    .map(
      (step, index) => `
            <tr>
              <td width="44" valign="middle" class="m-rule" style="width:44px;padding:16px 0;border-top:1px solid ${MAIL.rule};font-family:${SERIF};font-size:26px;line-height:26px;"><span ${toneAttr("blue")}">${index + 1}</span></td>
              <td valign="top" class="m-rule" style="padding:16px 0;border-top:1px solid ${MAIL.rule};font-family:${SANS};">
                <p class="m-text" style="margin:0;font-size:15px;line-height:22px;font-weight:600;color:${MAIL.text};">${escapeHtml(step.title)}</p>
                <p class="m-muted" style="margin:2px 0 0;font-size:14px;line-height:1.55;color:${MAIL.textMuted};">${escapeHtml(step.detail)}</p>
              </td>
            </tr>`,
    )
    .join("");

  const unsubscribeHtml = input.unsubscribeUrl
    ? ` &nbsp;·&nbsp; ${footerLinkHtml(input.unsubscribeUrl, "Unsubscribe")}`
    : "";

  const html = emailShell({
    title: "Welcome to Omentir",
    preheader: "Connect LinkedIn, describe your ideal customer, set up outreach.",
    footerHtml: `${footerLinkHtml(appUrl("/"), "Omentir")}${unsubscribeHtml}`,
    bodyHtml: `
          <p class="m-muted" style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.6;color:${MAIL.textMuted};">${escapeHtml(greeting)}</p>
          ${headlineHtml("Welcome to Omentir")}
          ${introHtml(intro)}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0;">${stepsHtml}
          </table>
          ${textLinkHtml(overviewUrl(), "Start Setup")}
          ${paragraphHtml(help, "36px 0 0")}
          <p class="m-text" style="margin:18px 0 0;font-family:${SERIF};font-size:20px;line-height:1.3;color:${MAIL.text};">Vansh</p>
          <p class="m-faint" style="margin:2px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${MAIL.textFaint};">Founder, Omentir</p>`,
  });

  const text = [
    greeting,
    "",
    intro,
    "",
    ...steps.map((step, index) => `${index + 1}. ${step.title}. ${step.detail}`),
    "",
    `Start Setup: ${overviewUrl()}`,
    "",
    help,
    "",
    "Vansh",
    "Founder, Omentir",
    ...(input.unsubscribeUrl ? ["", `Unsubscribe: ${input.unsubscribeUrl}`] : []),
  ].join("\n");

  return { html, text };
}

export function emailWasSkipped(result: unknown): result is { skipped: true } {
  return (
    typeof result === "object" &&
    result !== null &&
    "skipped" in result &&
    (result as { skipped?: unknown }).skipped === true
  );
}

function ensureResendAccepted<T extends { error?: { message?: string } | null }>(result: T) {
  if (result.error) {
    throw new Error(result.error.message || "The email provider rejected the message.");
  }
  return result;
}

export async function sendReplyNotification(input: {
  to: string;
  leadName: string;
  campaignName?: string;
  body: string;
  // True when the campaign hands the conversation off to the user on first
  // reply - the email must say automation stopped and it's their turn.
  handoff?: boolean;
  idempotencyKey?: string;
}) {
  const resend = getResend();
  if (!resend) return { skipped: true };

  const headline = `${input.leadName} wrote back`;
  const intro = input.campaignName
    ? `They replied on LinkedIn to your outreach "${input.campaignName}".`
    : "They replied to you on LinkedIn.";
  const closing = input.handoff
    ? "Omentir stopped this sequence when they replied, so nothing else goes out on its own. The next message is yours."
    : "Open the conversation in Omentir to answer.";

  const html = emailShell({
    title: headline,
    preheader: input.body,
    footerHtml: notificationFooterHtml(),
    bodyHtml: `
          ${headlineHtml(headline)}
          ${introHtml(intro)}
          ${messageBubbleHtml(input.leadName, input.body)}
          ${paragraphHtml(closing, "24px 0 0")}
          ${textLinkHtml(messagesUrl(), "Reply in Omentir")}`,
  });

  const text = notificationFooterText(
    [
      headline,
      intro,
      "",
      `"${input.body}"`,
      "",
      closing,
      "",
      `Reply in Omentir: ${messagesUrl()}`,
    ].join("\n"),
  );

  return ensureResendAccepted(
    await resend.emails.send(
      {
        from: transactionalFrom(),
        to: input.to,
        subject: `${input.leadName} wrote back on LinkedIn`,
        html,
        text,
        tags: [{ name: "kind", value: "lead_reply" }],
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
    ),
  );
}

// -----------------------------------------------------------------------------
// 1. Daily digest: the last 24 hours as big numbers, replies first
// -----------------------------------------------------------------------------

const DIGEST_GRID: Array<{ key: keyof DailyDigestStats; label: string }> = [
  { key: "newLeads", label: "New leads found" },
  { key: "invitesSent", label: "Invites sent" },
  { key: "connectionsAccepted", label: "Invites accepted" },
  { key: "messagesSent", label: "Messages sent" },
];

function digestStatCellHtml(value: number, label: string) {
  return `<td width="50%" valign="top" class="m-rule" style="width:50%;padding:18px 0;border-top:1px solid ${MAIL.rule};">
                <p class="m-text" style="margin:0;font-family:${SERIF};font-size:32px;line-height:1.1;color:${MAIL.text};">${value.toLocaleString("en-US")}</p>
                <p class="m-muted" style="margin:6px 0 0;font-family:${SANS};font-size:13px;line-height:1.4;color:${MAIL.textMuted};">${escapeHtml(label)}</p>
              </td>`;
}

function buildDailyDigestEmail(input: {
  stats: DailyDigestStats;
  notes?: string[];
}) {
  const { stats } = input;
  const value = (key: keyof DailyDigestStats) => Math.max(0, stats[key] || 0);
  const replies = value("repliesReceived");
  const headline = replies > 0
    ? `${plural(replies, "person", "people")} replied in the last 24 hours`
    : "Your last 24 hours on Omentir";
  const intro = "Everything Omentir did on LinkedIn for you since this time yesterday.";
  const footer = "You get this because the daily update is on.";

  const gridRows = [DIGEST_GRID.slice(0, 2), DIGEST_GRID.slice(2, 4)]
    .map((pair) => `<tr>${pair.map((metric) => digestStatCellHtml(value(metric.key), metric.label)).join("")}</tr>`)
    .join("");

  const notesHtml = input.notes?.length
    ? `${sectionLabelHtml("Worth knowing")}${input.notes.map((note) => paragraphHtml(note, "0 0 8px")).join("")}`
    : "";

  const html = emailShell({
    title: "Omentir daily update",
    preheader: `${plural(replies, "reply", "replies")}, ${plural(value("newLeads"), "new lead", "new leads")}.`,
    footerHtml: `${escapeHtml(footer)} ${footerLinkHtml(settingsUrl(), "Change the time or turn it off")}`,
    bodyHtml: `
          ${headlineHtml(headline)}
          ${introHtml(intro)}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0;">
            <tr>
              <td colspan="2" class="m-rule" style="padding:20px 0;border-top:1px solid ${MAIL.rule};">
                <p style="margin:0;font-family:${SERIF};font-size:56px;line-height:1;"><span ${toneAttr("blue")}">${replies.toLocaleString("en-US")}</span></p>
                <p class="m-muted" style="margin:8px 0 0;font-family:${SANS};font-size:14px;line-height:1.4;color:${MAIL.textMuted};">${replies === 1 ? "Reply" : "Replies"}</p>
              </td>
            </tr>
            ${gridRows}
          </table>
          ${notesHtml}
          ${textLinkHtml(overviewUrl(), "Open Omentir")}`,
  });

  const text = [
    headline,
    intro,
    "",
    `Replies: ${replies}`,
    ...DIGEST_GRID.map((metric) => `${metric.label}: ${value(metric.key)}`),
    ...(input.notes?.length ? ["", "Worth knowing:", ...input.notes] : []),
    "",
    `Open Omentir: ${overviewUrl()}`,
    "",
    `${footer} Change the time or turn it off: ${settingsUrl()}`,
  ].join("\n");

  return { html, text };
}

export async function sendDailyDigestEmail(input: {
  to: string;
  day: string;
  stats: DailyDigestStats;
  notes?: string[];
  idempotencyKey?: string;
}) {
  const resend = getResend();
  if (!resend) return { skipped: true };

  const { stats } = input;
  const email = buildDailyDigestEmail({ stats, notes: input.notes });

  return ensureResendAccepted(
    await resend.emails.send(
      {
        from: transactionalFrom(),
        to: input.to,
        subject: `Daily update: ${plural(stats.repliesReceived, "reply", "replies")}, ${plural(stats.newLeads, "new lead", "new leads")}`,
        html: email.html,
        text: email.text,
        tags: [{ name: "kind", value: "daily_digest" }],
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
    ),
  );
}

// -----------------------------------------------------------------------------
// 2. Temporary LinkedIn invitation pause: what stopped, when it retries
// -----------------------------------------------------------------------------

function timelineRowHtml(marker: string, tone: MailTone, when: string, what: string, isLast: boolean) {
  const rule = isLast ? "" : `border-bottom:1px solid ${MAIL.rule};`;
  return `<tr>
              <td width="28" valign="top" class="m-rule" style="width:28px;padding:16px 0;${rule}font-family:${SANS};font-size:12px;line-height:22px;"><span ${toneAttr(tone)}">${marker}</span></td>
              <td valign="top" class="m-rule" style="padding:16px 0;${rule}font-family:${SANS};">
                <p class="m-faint" style="margin:0;font-size:12px;line-height:22px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${MAIL.textFaint};">${escapeHtml(when)}</p>
                <p class="m-text" style="margin:2px 0 0;font-size:15px;line-height:1.5;color:${MAIL.text};">${escapeHtml(what)}</p>
              </td>
            </tr>`;
}

export async function sendInvitePauseNotification(input: {
  to: string;
  resumeAtText: string;
  /** Connected LinkedIn account display name (helps multi-account workspaces). */
  accountName?: string;
  idempotencyKey?: string;
}) {
  const resend = getResend();
  if (!resend) return { skipped: true };

  const accountLabel = input.accountName?.trim();
  const headline = accountLabel ? `Invites from ${accountLabel} are paused` : "LinkedIn invites are paused";
  const intro =
    "LinkedIn turned down several connection requests from this account, so Omentir stopped sending new ones for a while.";
  const now = "New connection invites are on hold.";
  const next = "Omentir tries again.";
  const stillRunning = "Messages to people you're already connected with, and your other LinkedIn accounts.";
  const noAction = "You don't need to do anything.";

  const text = notificationFooterText(
    [
      headline,
      "",
      intro,
      "",
      `Now: ${now}`,
      `Around ${input.resumeAtText}: ${next}`,
      "",
      `Still running: ${stillRunning}`,
      "",
      noAction,
      "",
      `Open Omentir: ${overviewUrl()}`,
    ].join("\n"),
  );
  const html = emailShell({
    title: headline,
    preheader: intro,
    footerHtml: notificationFooterHtml(),
    bodyHtml: `
          ${headlineHtml(headline)}
          ${introHtml(intro)}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="m-rule" style="margin:28px 0 0;border-top:1px solid ${MAIL.rule};">
            ${timelineRowHtml("&#9679;", "amber", "Now", now, false)}
            ${timelineRowHtml("&#9675;", "text", `Around ${input.resumeAtText}`, next, true)}
          </table>
          ${sectionLabelHtml("Still running")}
          ${paragraphHtml(stillRunning, "0")}
          ${paragraphHtml(noAction, "20px 0 0")}
          ${textLinkHtml(overviewUrl(), "Open Omentir")}`,
  });

  return ensureResendAccepted(
    await resend.emails.send(
      {
        from: transactionalFrom(),
        to: input.to,
        subject: accountLabel ? `Invites paused for ${accountLabel}` : "LinkedIn invites paused",
        html,
        text,
        tags: [{ name: "kind", value: "invite_pause_notification" }],
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
    ),
  );
}

// -----------------------------------------------------------------------------
// 3. Interested lead: who they are and what they said
// -----------------------------------------------------------------------------

export type InterestedLeadEmailInput = {
  to: string;
  lead: {
    name: string;
    title?: string;
    company?: string;
    location?: string;
    linkedInUrl?: string;
    // Optional fields kept so existing callers can pass a full lead object.
    summary?: string;
    fitScore?: number;
    scoreReasons?: string[];
    signalText?: string;
    /** LinkedIn headshot bytes; embedded inline because the CDN URL expires. */
    photo?: { body: Buffer; contentType: string };
  };
  campaignName?: string;
  /** Connected LinkedIn account that received the reply (multi-account workspaces). */
  linkedInAccountName?: string;
  /** The message / reply that indicated interest */
  interestSignal?: string;
  /** Short AI reason (not shown in the email body) */
  interestReason?: string;
  idempotencyKey?: string;
};

const LEAD_PHOTO_CID = "lead-photo";

function buildInterestedLeadEmail(input: Omit<InterestedLeadEmailInput, "to" | "idempotencyKey">) {
  const { lead } = input;
  const leadName = lead.name || "A lead";
  const headline = `${leadName} sounds interested`;
  const intro = "Omentir read their latest reply and marked it as interest. Worth answering while it's fresh.";
  const role = [lead.title, lead.company].filter(Boolean).join(" at ");
  const account = input.linkedInAccountName?.trim();
  const meta: Array<[string, string]> = [
    ...(account ? ([["Account", account]] as Array<[string, string]>) : []),
    ...(input.campaignName ? ([["Outreach", input.campaignName]] as Array<[string, string]>) : []),
  ];
  const photoType = lead.photo?.contentType.split(";")[0]?.trim().toLowerCase();
  const photoExt = photoType === "image/png" ? "png" : photoType === "image/gif" ? "gif" : "jpg";
  const attachments = lead.photo
    ? [{ filename: `lead-photo.${photoExt}`, content: lead.photo.body.toString("base64"), contentId: LEAD_PHOTO_CID }]
    : undefined;
  const photoHtml = lead.photo
    ? `<td width="62" valign="top" style="width:62px;padding:0 0 18px;"><img src="cid:${LEAD_PHOTO_CID}" width="48" height="48" alt="${escapeHtml(leadName)}" style="display:block;width:48px;height:48px;border:0;border-radius:999px;object-fit:cover;"></td>`
    : "";

  const cardLines = [
    `<p class="m-text" style="margin:0;font-family:${SANS};font-size:16px;line-height:22px;font-weight:600;color:${MAIL.text};">${escapeHtml(leadName)}</p>`,
    role
      ? `<p class="m-muted" style="margin:2px 0 0;font-family:${SANS};font-size:14px;line-height:1.5;color:${MAIL.textMuted};">${escapeHtml(role)}</p>`
      : "",
    lead.location
      ? `<p class="m-faint" style="margin:2px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${MAIL.textFaint};">${escapeHtml(lead.location)}</p>`
      : "",
  ].join("");

  const messageHtml = input.interestSignal
    ? `<tr><td colspan="2" class="m-rule" style="padding:18px 0 0;border-top:1px solid ${MAIL.rule};">
                <p class="m-faint" style="margin:0 0 8px;font-family:${SANS};font-size:11px;line-height:1.4;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${MAIL.textFaint};">Their message</p>
                <p class="m-text" style="margin:0;font-family:${SERIF};font-size:18px;line-height:1.5;color:${MAIL.text};white-space:pre-wrap;">${escapeHtml(input.interestSignal)}</p>
              </td></tr>`
    : "";

  const metaHtml = meta.length
    ? `<p class="m-faint" style="margin:16px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${MAIL.textFaint};">${meta
        .map(([label, value]) => `${escapeHtml(label)}: <span class="m-muted" style="color:${MAIL.textMuted};">${escapeHtml(value)}</span>`)
        .join(" &nbsp;·&nbsp; ")}</p>`
    : "";

  const html = emailShell({
    title: headline,
    preheader: input.interestSignal || intro,
    footerHtml: notificationFooterHtml(),
    bodyHtml: `
          ${headlineHtml(headline)}
          ${introHtml(intro)}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="m-rule" style="margin:28px 0 0;border:1px solid ${MAIL.rule};border-radius:14px;border-collapse:separate;">
            <tr>
              <td style="padding:20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    ${photoHtml}
                    <td valign="top" style="padding:0 0 18px;">${cardLines}</td>
                  </tr>
                  ${messageHtml}
                </table>
              </td>
            </tr>
          </table>
          ${metaHtml}
          ${textLinkHtml(messagesUrl(), "Reply in Omentir", lead.linkedInUrl ? { href: lead.linkedInUrl, label: "View LinkedIn profile" } : undefined)}`,
  });

  const text = notificationFooterText(
    [
      headline,
      intro,
      "",
      leadName,
      ...(role ? [role] : []),
      ...(lead.location ? [lead.location] : []),
      ...(lead.linkedInUrl ? [lead.linkedInUrl] : []),
      ...(input.interestSignal ? ["", "Their message:", `"${input.interestSignal}"`] : []),
      ...(meta.length ? ["", ...meta.map(([label, value]) => `${label}: ${value}`)] : []),
      "",
      `Reply in Omentir: ${messagesUrl()}`,
    ].join("\n"),
  );

  return {
    html,
    text,
    subject: `${leadName} sounds interested`,
    attachments,
  };
}

export async function sendInterestedLeadNotification(input: InterestedLeadEmailInput) {
  const resend = getResend();
  if (!resend) return { skipped: true };

  const email = buildInterestedLeadEmail(input);

  return ensureResendAccepted(
    await resend.emails.send(
      {
        from: transactionalFrom(),
        to: input.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(email.attachments ? { attachments: email.attachments } : {}),
        tags: [{ name: "kind", value: "interested_lead" }],
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
    ),
  );
}

type NewSignupNotificationInput = {
  userId: string;
  name: string;
  email: string;
  websiteUrl?: string;
  location?: string;
  ipAddress?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
  answers: {
    source: string;
    role: string;
    companySize: string;
    goal: string;
  };
  signedUpAtUtc: string;
};

function detailListHtml(rows: Array<[string, string]>) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows
    .map(
      ([label, value]) => `
            <tr>
              <td width="150" valign="top" class="m-rule m-faint" style="width:150px;padding:11px 12px 11px 0;border-top:1px solid ${MAIL.rule};font-family:${SANS};font-size:13px;line-height:1.5;color:${MAIL.textFaint};">${escapeHtml(label)}</td>
              <td valign="top" class="m-rule m-text" style="padding:11px 0;border-top:1px solid ${MAIL.rule};font-family:${SANS};font-size:14px;line-height:1.5;color:${MAIL.text};word-break:break-word;">${escapeHtml(value)}</td>
            </tr>`,
    )
    .join("")}
          </table>`;
}

/** Internal alert for the Omentir team: who signed up, what they want, where from. */
function buildNewSignupNotificationEmail(input: NewSignupNotificationInput) {
  const name = input.name.trim() || input.email;
  const headline = `${name} signed up`;
  const website = input.websiteUrl?.trim();
  const contactLine = [input.email, website].filter(Boolean).join("  ·  ");
  const footer = "Internal alert. Sent for every new Omentir signup.";

  const answers: Array<[string, string]> = [
    ["Wants help with", input.answers.goal],
    ["Role", input.answers.role],
    ["Company size", input.answers.companySize],
    ["Heard about us", input.answers.source],
  ].map(([label, value]) => [label, value?.trim() || "Skipped"]);
  const device = [input.deviceType, input.os, input.browser].filter(Boolean).join(", ");
  const origin: Array<[string, string]> = [
    ["Location", input.location || "Unknown"],
    ["Device", device || "Unknown"],
    ["IP address", input.ipAddress || "Unknown"],
    ["Signed up (UTC)", input.signedUpAtUtc],
  ];
  const websiteHref = website ? (/^https?:\/\//i.test(website) ? website : `https://${website}`) : undefined;

  const html = emailShell({
    title: headline,
    preheader: `${input.email}. Wants help with: ${input.answers.goal || "skipped"}`,
    footerHtml: escapeHtml(footer),
    bodyHtml: `
          ${headlineHtml(headline)}
          ${introHtml(contactLine)}
          ${sectionLabelHtml("What they told us", "32px 0 4px")}
          ${detailListHtml(answers)}
          ${sectionLabelHtml("Where they signed up from", "32px 0 4px")}
          ${detailListHtml(origin)}
          ${websiteHref ? textLinkHtml(websiteHref, "Visit website") : ""}`,
  });

  const text = [
    headline,
    contactLine,
    "",
    "What they told us",
    ...answers.map(([label, value]) => `${label}: ${value}`),
    "",
    "Where they signed up from",
    ...origin.map(([label, value]) => `${label}: ${value}`),
    "",
    footer,
  ].join("\n");

  return { html, text, subject: `New signup: ${name}` };
}

export async function sendNewSignupNotification(input: NewSignupNotificationInput) {
  if (!hostedEmailEnabled()) return { skipped: true, reason: "hosted_only" };
  const resend = getResend();
  if (!resend) return { skipped: true, reason: "missing_resend_api_key" };

  const email = buildNewSignupNotificationEmail(input);
  const idempotencyKey = `new-signup-notification-${input.userId}`;

  const result = await resend.emails.send(
    {
      from: hostedNewSignupFrom(),
      to: hostedNewSignupTo(),
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [
        { name: "kind", value: "new_signup_notification" },
        { name: "user_id", value: input.userId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256) },
      ],
    },
    { idempotencyKey },
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}

export async function scheduleSignupWelcomeEmail(input: {
  to: string;
  firstName?: string | null;
  userId: string;
  eventId?: string | null;
  unsubscribeUrl?: string;
  sendImmediately?: boolean;
}) {
  if (!hostedEmailEnabled()) return { skipped: true, reason: "hosted_only" };
  const resend = getResend();
  if (!resend) return { skipped: true, reason: "missing_resend_api_key" };

  const firstName = input.firstName?.trim() || undefined;
  const scheduledAt = input.sendImmediately
    ? undefined
    : new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const email = buildSignupWelcomeEmail({ firstName, unsubscribeUrl: input.unsubscribeUrl });

  return resend.emails.send(
    {
      from: hostedWelcomeFrom(),
      to: input.to,
      subject: firstName ? `Welcome to Omentir, ${firstName}` : "Welcome to Omentir",
      ...(scheduledAt ? { scheduledAt } : {}),
      html: email.html,
      text: email.text,
      ...(input.unsubscribeUrl
        ? {
            headers: {
              "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }
        : {}),
      tags: [
        { name: "kind", value: "signup_welcome" },
        { name: "user_id", value: input.userId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256) },
      ],
    },
    input.eventId ? { idempotencyKey: `signup-welcome-${input.eventId}` } : undefined,
  );
}
