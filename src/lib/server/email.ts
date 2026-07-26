import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";
import {
  hostedContactFormFrom,
  hostedContactFormTo,
  hostedNewSignupFrom,
  hostedNewSignupTo,
  hostedTransactionalFrom,
  hostedWelcomeFrom,
} from "@/lib/hosted-identity";
import { isLocalMode } from "@/lib/runtime-mode";
import { getAppBaseUrl } from "./runtime-config";

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
 * The Omentir spoke mark from src/app/logo-mark.tsx, rasterized to
 * public/omentir-mark-email.png (near-white, because the email carries the
 * product's dark canvas).
 *
 * It rides along as an inline CID attachment rather than a hosted <img src>,
 * for two reasons that both have to hold or the mark is invisible: clients
 * strip inline <svg> outright, and Gmail hides remote images behind "display
 * images below" until the sender is trusted. A CID part renders on open, with
 * no round trip to omentir.com.
 */
const LOGO_CID = "omentir-mark";
const LOGO_FILE = "omentir-mark-email.png";

function logoAttachment() {
  try {
    const content = readFileSync(join(process.cwd(), "public", LOGO_FILE)).toString("base64");
    return { filename: LOGO_FILE, content, contentId: LOGO_CID };
  } catch {
    // Bundled without the public dir (or read-only FS): fall back to the
    // hosted copy so the header degrades to a remote image, not a hole.
    return null;
  }
}

function logoImg(inline: boolean) {
  const src = inline ? `cid:${LOGO_CID}` : escapeHtml(appUrl(`/${LOGO_FILE}`));
  return `<img src="${src}" width="30" height="30" alt="Omentir" style="display:block;width:30px;height:30px;border:0;outline:none;text-decoration:none;">`;
}

/**
 * Welcome-email palette. Mirrors the product tokens in globals.css — dark is
 * the only theme there, so the email that introduces the product should not
 * open as a white page. Hex only: color-mix()/rgba() do not survive email
 * clients, so these are the flattened values of the CSS custom properties.
 */
const MAIL = {
  canvas: "#08080a", // --google-bg
  border: "#2a2c2e", // --google-border
  text: "#ebedef", // --google-text-primary, flattened onto the canvas
  textMuted: "#b4b7ba", // --google-text-secondary, flattened
  textFaint: "#7c7f83",
} as const;

// Google Sans ships to browsers, not mail clients — Roboto then the system
// grotesques is the closest stack that actually resolves in an inbox.
const MAIL_FONT = "Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif";

/**
 * One setup step: plain marker in the gutter, line beside it. A table rather
 * than <ol> so the marker stays put and wrapped lines hang correctly in
 * Outlook, which renders list indentation unpredictably.
 */
function stepRowHtml(step: { n: string; text: string; sub?: string }, isLast: boolean) {
  const pad = isLast ? "0" : "12px";
  const subHtml = step.sub
    ? `<div style="font-size:15px;line-height:1.6;color:${MAIL.textMuted};padding:2px 0 0;">${step.sub}</div>`
    : "";
  return `<tr>
                  <td width="26" valign="top" style="width:26px;padding:0 0 ${pad};font-family:${MAIL_FONT};font-size:15px;line-height:1.6;color:${MAIL.textMuted};">${step.n})</td>
                  <td valign="top" style="padding:0 0 ${pad};font-family:${MAIL_FONT};">
                    <div style="font-size:15px;line-height:1.6;color:${MAIL.text};">${step.text}</div>
                    ${subHtml}
                  </td>
                </tr>`;
}

function buildSignupWelcomeEmail(input: { greeting: string; unsubscribeUrl?: string }) {
  const attachment = logoAttachment();
  const dashboardUrl = appUrl("/dashboard");
  const escapedGreeting = escapeHtml(input.greeting);
  const escapedDashboardUrl = escapeHtml(dashboardUrl);
  const unsubscribeHtml = input.unsubscribeUrl
    ? ` &nbsp;·&nbsp; <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${MAIL.textFaint};text-decoration:underline;">Unsubscribe</a>`
    : "";

  const steps = [
    { n: "i", text: "Connect your LinkedIn account." },
    { n: "ii", text: "Define your ideal customer." },
    {
      n: "iii",
      text: "Setup outreach.",
      sub: "Pick AI or manually setup workflow messages.",
    },
  ];

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>Welcome to Omentir</title>
  </head>
  <body style="margin:0;padding:0;background:${MAIL.canvas};color:${MAIL.text};font-family:${MAIL_FONT};-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">
      Connect your LinkedIn account, define your ideal customer, setup outreach. That's it.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${MAIL.canvas}" style="background-color:${MAIL.canvas};">
      <tr>
        <td align="center" style="padding:40px 24px 44px;">
          <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:520px;">

            <tr>
              <td style="padding:0 0 28px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="middle" style="padding:0 9px 0 0;">${logoImg(Boolean(attachment))}</td>
                    <td valign="middle" style="font-family:${MAIL_FONT};font-size:20px;line-height:1;font-weight:600;letter-spacing:-0.01em;color:${MAIL.text};">Omentir</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td>

                <p style="margin:0 0 14px;font-family:${MAIL_FONT};font-size:15px;line-height:1.6;color:${MAIL.textMuted};">${escapedGreeting}</p>
                <p style="margin:0 0 26px;font-family:${MAIL_FONT};font-size:16px;line-height:1.6;color:${MAIL.text};">We welcome you at Omentir. We convert LinkedIn users to your customers.</p>
                <p style="margin:0 0 16px;font-family:${MAIL_FONT};font-size:15px;line-height:1.6;color:${MAIL.text};">It's very simple to use:</p>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;">
                ${steps.map((step, i) => stepRowHtml(step, i === steps.length - 1)).join("\n                ")}
                </table>

                <p style="margin:0 0 28px;font-family:${MAIL_FONT};font-size:15px;line-height:1.6;color:${MAIL.text};">That's it.</p>

                <p style="margin:0;font-family:${MAIL_FONT};font-size:15px;line-height:1.6;"><a href="${escapedDashboardUrl}" style="color:${MAIL.text};font-weight:600;text-decoration:underline;text-decoration-color:${MAIL.text};">Open Omentir</a></p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0 0;">
                  <tr><td height="1" bgcolor="${MAIL.border}" style="height:1px;line-height:1px;font-size:0;background-color:${MAIL.border};">&nbsp;</td></tr>
                </table>

                <p style="margin:26px 0 0;font-family:${MAIL_FONT};font-size:15px;line-height:1.6;color:${MAIL.textMuted};">If you have any query, just reply to this email.</p>
                <p style="margin:18px 0 0;font-family:${MAIL_FONT};font-size:15px;line-height:1.7;color:${MAIL.text};">Regards,<br>Vansh<br><span style="color:${MAIL.textFaint};">Omentir</span></p>

              </td>
            </tr>

            <tr>
              <td style="padding:34px 0 0;font-family:${MAIL_FONT};font-size:12px;line-height:1.6;color:${MAIL.textFaint};">
                <a href="${escapeHtml(appUrl("/"))}" style="color:${MAIL.textFaint};text-decoration:underline;">omentir.com</a>${unsubscribeHtml}
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    input.greeting,
    "",
    "We welcome you at Omentir. We convert LinkedIn users to your customers.",
    "",
    "It's very simple to use:",
    "",
    ...steps.map((step) => `${step.n}) ${step.text}${step.sub ? ` ${step.sub}` : ""}`),
    "",
    "That's it.",
    "",
    `Open Omentir: ${dashboardUrl}`,
    "",
    "If you have any query, just reply to this email.",
    "",
    "Regards,",
    "Vansh",
    "Omentir",
    ...(input.unsubscribeUrl ? ["", `Unsubscribe: ${input.unsubscribeUrl}`] : []),
  ].join("\n");

  return { html, text, attachments: attachment ? [attachment] : undefined };
}

const dashboardUrl = () => appUrl("/dashboard");
const messagesUrl = () => appUrl("/messages");
const AUTO_GENERATED_FOOTER = "This email is generated automatically with Omentir.";

function autoFooterHtml() {
  return `<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#888888;">${escapeHtml(AUTO_GENERATED_FOOTER)}</p>`;
}

function withAutoFooterText(body: string) {
  return `${body}\n\n${AUTO_GENERATED_FOOTER}`;
}

function emailShell(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f5f6f7;color:#111111;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f6f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dddddd;">
            ${bodyHtml}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function detailRowsHtml(rows: Array<[string, string]>) {
  return rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="width:180px;padding:10px 12px;border-bottom:1px solid #eeeeee;color:#555555;font-size:13px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eeeeee;color:#111111;font-size:13px;line-height:1.5;vertical-align:top;">${escapeHtml(value || "—")}</td>
        </tr>`,
    )
    .join("");
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

  return resend.emails.send(
    {
      from: transactionalFrom(),
      to: input.to,
      subject: `${input.leadName} replied on LinkedIn`,
      text: [
        `${input.leadName} replied${input.campaignName ? ` in ${input.campaignName}` : ""}:`,
        "",
        input.body,
        "",
        input.handoff
          ? "Your outreach hands off on reply, so automation has stopped for this lead - open Omentir to continue the conversation yourself."
          : "Open Omentir to respond.",
      ].join("\n"),
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
  );
}

// -----------------------------------------------------------------------------
// 1. Daily digest — last 24 hours summary (HTML table)
// -----------------------------------------------------------------------------

export type DailyDigestStats = {
  newLeads: number;
  invitesSent: number;
  connectionsAccepted: number;
  messagesSent: number;
  repliesReceived: number;
};

function buildDailyDigestEmail(input: {
  stats: DailyDigestStats;
  notes?: string[];
}) {
  const { stats } = input;
  const rows: Array<[string, string]> = [
    ["New leads discovered", String(stats.newLeads)],
    ["Connection invitations sent", String(stats.invitesSent)],
    ["Connections accepted", String(stats.connectionsAccepted)],
    ["Messages sent", String(stats.messagesSent)],
    ["Replies received", String(stats.repliesReceived)],
  ];

  const notesHtml = input.notes?.length
    ? input.notes
        .map(
          (note) =>
            `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#555555;">Note: ${escapeHtml(note)}</p>`,
        )
        .join("")
    : "";

  const html = emailShell(
    "Omentir daily update",
    `
            <tr>
              <td style="padding:28px 28px 8px;">
                <h1 style="margin:0;color:#111111;font-size:22px;line-height:1.25;font-weight:700;">Your last 24 hours</h1>
                <p style="margin:10px 0 0;font-size:14px;line-height:1.55;color:#444444;">Here is what Omentir did for you.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eeeeee;border-radius:6px;border-collapse:collapse;">
                  <tr>
                    <th align="left" style="padding:10px 12px;background:#f7f7f7;border-bottom:1px solid #eeeeee;color:#555555;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;">Metric</th>
                    <th align="right" style="padding:10px 12px;background:#f7f7f7;border-bottom:1px solid #eeeeee;color:#555555;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;">Count</th>
                  </tr>
                  ${rows
                    .map(
                      ([label, value], index) => `
                  <tr>
                    <td style="padding:12px;border-bottom:${index === rows.length - 1 ? "0" : "1px solid #eeeeee"};color:#111111;font-size:14px;">${escapeHtml(label)}</td>
                    <td align="right" style="padding:12px;border-bottom:${index === rows.length - 1 ? "0" : "1px solid #eeeeee"};color:#111111;font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
                  </tr>`,
                    )
                    .join("")}
                </table>
                ${notesHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px;">
                <a href="${dashboardUrl()}" style="display:inline-block;border-radius:6px;background:#000000;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 18px;">Open Dashboard</a>
                ${autoFooterHtml()}
              </td>
            </tr>`,
  );

  const text = withAutoFooterText(
    [
      "Your last 24 hours on Omentir",
      "",
      ...rows.map(([label, value]) => `${label}: ${value}`),
      ...(input.notes?.length ? ["", ...input.notes.map((note) => `Note: ${note}`)] : []),
      "",
      `Open Dashboard: ${dashboardUrl()}`,
    ].join("\n"),
  );

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

  return resend.emails.send(
    {
      from: transactionalFrom(),
      to: input.to,
      subject: `Omentir daily update: ${stats.newLeads} new leads, ${stats.invitesSent} invites, ${stats.repliesReceived} replies`,
      html: email.html,
      text: email.text,
      tags: [{ name: "kind", value: "daily_digest" }],
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
  );
}

// -----------------------------------------------------------------------------
// 2. Temporary LinkedIn invitation pause — simple plain text
// -----------------------------------------------------------------------------

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

  return resend.emails.send(
    {
      from: transactionalFrom(),
      to: input.to,
      subject: accountLabel
        ? `${accountLabel}: invitation attempts paused temporarily`
        : "LinkedIn invitation attempts paused temporarily",
      text: withAutoFooterText(
        [
          accountLabel
            ? `LinkedIn rejected several connection attempts from ${accountLabel}.`
            : "LinkedIn rejected several connection attempts from your account.",
          "",
          `Omentir paused new invites for this account and will test again around ${input.resumeAtText}. Messages to existing connections and other LinkedIn accounts are unaffected.`,
          "",
          "No action needed.",
          "",
          `Dashboard: ${dashboardUrl()}`,
        ].join("\n"),
      ),
      tags: [{ name: "kind", value: "invite_pause_notification" }],
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
  );
}

// -----------------------------------------------------------------------------
// 3. Interested lead — full lead details when a prospect shows interest
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

function buildInterestedLeadEmail(input: Omit<InterestedLeadEmailInput, "to" | "idempotencyKey">) {
  const { lead } = input;
  const leadName = lead.name || "A lead";

  const rows: Array<[string, string]> = [
    ["Name", lead.name || "—"],
    ["Position", lead.title || "—"],
    ["Company", lead.company || "—"],
    ["Location", lead.location || "—"],
    ["LinkedIn", lead.linkedInUrl || "—"],
    ...(input.linkedInAccountName?.trim()
      ? ([["Account", input.linkedInAccountName.trim()]] as Array<[string, string]>)
      : []),
    ["Last message", input.interestSignal || "—"],
  ];

  const html = emailShell(
    `${leadName} seems interested`,
    `
            <tr>
              <td style="padding:28px 28px 8px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#ba3871;">Interest detected</p>
                <h1 style="margin:0;color:#111111;font-size:22px;line-height:1.25;font-weight:700;">${escapeHtml(leadName)} seems interested</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #eeeeee;">
                  ${detailRowsHtml(rows)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px;">
                <a href="${messagesUrl()}" style="display:inline-block;border-radius:6px;background:#000000;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 18px;">Open Messages</a>
                ${autoFooterHtml()}
              </td>
            </tr>`,
  );

  const text = withAutoFooterText(
    [
      `${leadName} seems interested`,
      "",
      ...rows.map(([label, value]) => `${label}: ${value || "—"}`),
      "",
      `Open Messages: ${messagesUrl()}`,
    ].join("\n"),
  );

  return { html, text, subject: `${leadName} seems interested in your product` };
}

export async function sendInterestedLeadNotification(input: InterestedLeadEmailInput) {
  const resend = getResend();
  if (!resend) return { skipped: true };

  const email = buildInterestedLeadEmail(input);

  return resend.emails.send(
    {
      from: transactionalFrom(),
      to: input.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [{ name: "kind", value: "interested_lead" }],
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
  );
}

type NewSignupNotificationInput = {
  userId: string;
  name: string;
  email: string;
  websiteUrl: string;
  location: string;
  ipAddress: string;
  deviceType: string;
  os: string;
  browser: string;
  answers: {
    source: string;
    role: string;
    companySize: string;
    goal: string;
  };
  signedUpAtUtc: string;
};

function buildNewSignupNotificationEmail(input: NewSignupNotificationInput) {
  const rows = [
    ["Name", input.name],
    ["Email", input.email],
    ["Fetched Website", input.websiteUrl || "N/A"],
    ["Location", input.location],
    ["IP Address", input.ipAddress],
    ["Device Type", input.deviceType],
    ["OS", input.os],
    ["Browser", input.browser],
    ["Signup time (UTC)", input.signedUpAtUtc],
    ["Where did you hear about us?", input.answers.source],
    ["What is your job?", input.answers.role],
    ["Company size", input.answers.companySize],
    ["What do you want Omentir to help with?", input.answers.goal],
  ];

  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="width:210px;padding:10px 12px;border-bottom:1px solid #eeeeee;color:#555555;font-size:13px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eeeeee;color:#111111;font-size:13px;line-height:1.5;vertical-align:top;">${escapeHtml(value || "Unknown")}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Omentir New Signup</title>
  </head>
  <body style="margin:0;background:#f5f6f7;color:#111111;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f6f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dddddd;">
            <tr>
              <td style="padding:28px 28px 12px;">
                <h1 style="margin:0;color:#111111;font-size:24px;line-height:1.2;font-weight:700;">New Signup</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #eeeeee;">
                  ${htmlRows}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "New Signup",
    "",
    ...rows.flatMap(([label, value]) => [`${label}: ${value || "Unknown"}`]),
  ].join("\n");

  return { html, text };
}

export async function sendNewSignupNotification(input: NewSignupNotificationInput) {
  if (!hostedEmailEnabled()) return { skipped: true, reason: "hosted_only" };
  const resend = getResend();
  if (!resend) return { skipped: true, reason: "missing_resend_api_key" };

  const email = buildNewSignupNotificationEmail(input);

  return resend.emails.send(
    {
      from: hostedNewSignupFrom(),
      to: hostedNewSignupTo(),
      subject: "Omentir New Signup",
      html: email.html,
      text: email.text,
      tags: [
        { name: "kind", value: "new_signup_notification" },
        { name: "user_id", value: input.userId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256) },
      ],
    },
    { idempotencyKey: `new-signup-notification-${input.userId}` },
  );
}

export async function scheduleSignupWelcomeEmail(input: {
  to: string;
  firstName?: string | null;
  userId: string;
  eventId?: string | null;
  unsubscribeUrl?: string;
}) {
  if (!hostedEmailEnabled()) return { skipped: true, reason: "hosted_only" };
  const resend = getResend();
  if (!resend) return { skipped: true, reason: "missing_resend_api_key" };

  const firstName = input.firstName?.trim();
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const scheduledAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const email = buildSignupWelcomeEmail({ greeting, unsubscribeUrl: input.unsubscribeUrl });

  return resend.emails.send(
    {
      from: hostedWelcomeFrom(),
      to: input.to,
      subject: "Welcome to Omentir",
      scheduledAt,
      html: email.html,
      text: email.text,
      ...(email.attachments ? { attachments: email.attachments } : {}),
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

/**
 * In-app Contact form. Subject = title, body = message only.
 * Reply-To is the customer's account email so you can answer in one click.
 * Hosted-only — self-hosted installs do not send to Omentir inboxes.
 */
export async function sendContactFormEmail(input: {
  title: string;
  contactEmail: string;
  roleTitle?: string;
  query: string;
  workspaceId?: string;
}) {
  if (!hostedEmailEnabled()) {
    throw new Error("The contact form is only available on the hosted Omentir cloud.");
  }
  const resend = getResend();
  if (!resend) {
    throw new Error("Email is not configured. Try again later or use another contact option.");
  }

  const title = input.title.trim().slice(0, 200);
  const contactEmail = input.contactEmail.trim().slice(0, 320);
  const query = input.query.trim().slice(0, 5000);

  if (!title || !contactEmail || !query) {
    throw new Error("Title, contact email, and message are required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error("Enter a valid contact email.");
  }

  // Body is intentionally only the customer message — no labels or metadata.
  const text = query;
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111;font-size:14px;line-height:1.6;">
    <p style="margin:0;white-space:pre-wrap;">${escapeHtml(query)}</p>
  </body>
</html>`;

  return resend.emails.send({
    from: hostedContactFormFrom(),
    to: hostedContactFormTo(),
    replyTo: contactEmail,
    subject: title,
    text,
    html,
    tags: [{ name: "kind", value: "contact_form" }],
  });
}
