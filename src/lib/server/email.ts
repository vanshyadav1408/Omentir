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
 * public/omentir-mark-email.png in a light color for the product's dark canvas.
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
  return `<img src="${src}" width="20" height="20" alt="Omentir" style="display:block;width:20px;height:20px;border:0;outline:none;text-decoration:none;">`;
}

/**
 * Email palette. It follows the product's dark, monochrome theme. Hex only:
 * color-mix()/rgba() do not survive email clients, so these are the flattened
 * values of the CSS custom properties.
 */
const MAIL = {
  canvas: "#08080a", // --google-bg
  surface: "#121314", // --google-surface
  surfaceLow: "#0d0e0f", // --google-surface-low
  surfaceHigh: "#191a1c", // --google-surface-high
  border: "#2a2c2e", // --google-border
  text: "#ebedef", // --google-text-primary, flattened onto the canvas
  textMuted: "#b4b7ba", // --google-text-secondary, flattened
  textFaint: "#7c7f83",
  primary: "#ffffff", // --google-primary
  onPrimary: "#000000", // --google-on-primary
} as const;

// Google Sans ships to browsers, not mail clients. Roboto then the system
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
    ? `<div style="font-size:13px;line-height:1.5;color:${MAIL.textMuted};padding:2px 0 0;">${step.sub}</div>`
    : "";
  return `<tr>
                  <td width="22" valign="top" style="width:22px;padding:0 0 ${pad};font-family:${MAIL_FONT};font-size:14px;line-height:1.5;color:${MAIL.textMuted};">${step.n})</td>
                  <td valign="top" style="padding:0 0 ${pad};font-family:${MAIL_FONT};">
                    <div style="font-size:14px;line-height:1.5;color:${MAIL.text};">${step.text}</div>
                    ${subHtml}
                  </td>
                </tr>`;
}

function buildSignupWelcomeEmail(input: { greeting: string; unsubscribeUrl?: string }) {
  const attachment = logoAttachment();
  const overviewUrl = appUrl("/overview");
  const escapedGreeting = escapeHtml(input.greeting);
  const escapedOverviewUrl = escapeHtml(overviewUrl);
  const unsubscribeHtml = input.unsubscribeUrl
    ? ` &nbsp;·&nbsp; <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${MAIL.textFaint};text-decoration:underline;">Unsubscribe</a>`
    : "";

  const steps = [
    { n: "1", text: "Connect your LinkedIn account." },
    { n: "2", text: "Define your ideal customer." },
    {
      n: "3",
      text: "Set up outreach.",
      sub: "Use AI or write the workflow messages yourself.",
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
      Connect LinkedIn, define your ideal customer, and set up outreach.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${MAIL.canvas}" style="background-color:${MAIL.canvas};">
      <tr>
        <td align="center" style="padding:24px 16px 32px;">
          <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" bgcolor="${MAIL.surface}" style="width:100%;max-width:520px;background-color:${MAIL.surface};border:1px solid ${MAIL.border};border-radius:10px;overflow:hidden;">

            <tr>
              <td style="padding:22px 22px 18px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="middle" style="padding:0 9px 0 0;">${logoImg(Boolean(attachment))}</td>
                    <td valign="middle" style="font-family:${MAIL_FONT};font-size:18px;line-height:20px;font-weight:600;letter-spacing:-0.01em;color:${MAIL.text};">Omentir</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td>

                <p style="margin:0 0 12px;padding:0 22px;font-family:${MAIL_FONT};font-size:14px;line-height:1.5;color:${MAIL.textMuted};">${escapedGreeting}</p>
                <p style="margin:0 0 20px;padding:0 22px;font-family:${MAIL_FONT};font-size:15px;line-height:1.5;color:${MAIL.text};">Omentir helps turn LinkedIn conversations into customers.</p>
                <p style="margin:0 0 14px;padding:0 22px;font-family:${MAIL_FONT};font-size:14px;line-height:1.5;color:${MAIL.text};">Start in three steps:</p>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 22px 20px;">
                ${steps.map((step, i) => stepRowHtml(step, i === steps.length - 1)).join("\n                ")}
                </table>

                <p style="margin:0;padding:0 22px;font-family:${MAIL_FONT};font-size:14px;line-height:1.5;"><a href="${escapedOverviewUrl}" style="color:${MAIL.text};font-weight:600;text-decoration:underline;text-decoration-color:${MAIL.text};">Open Omentir</a></p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0 0;">
                  <tr><td height="1" bgcolor="${MAIL.border}" style="height:1px;line-height:1px;font-size:0;background-color:${MAIL.border};">&nbsp;</td></tr>
                </table>

                <p style="margin:22px 22px 0;font-family:${MAIL_FONT};font-size:14px;line-height:1.5;color:${MAIL.textMuted};">Questions? Reply to this email.</p>
                <p style="margin:14px 22px 0;font-family:${MAIL_FONT};font-size:14px;line-height:1.5;color:${MAIL.text};">Vansh<br><span style="color:${MAIL.textFaint};">Omentir</span></p>

              </td>
            </tr>

            <tr>
              <td style="padding:20px 22px 22px;font-family:${MAIL_FONT};font-size:12px;line-height:1.5;color:${MAIL.textFaint};">
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
    "Omentir helps turn LinkedIn conversations into customers.",
    "",
    "Start in three steps:",
    "",
    ...steps.map((step) => `${step.n}) ${step.text}${step.sub ? ` ${step.sub}` : ""}`),
    "",
    `Open Omentir: ${overviewUrl}`,
    "",
    "Questions? Reply to this email.",
    "",
    "Vansh",
    "Omentir",
    ...(input.unsubscribeUrl ? ["", `Unsubscribe: ${input.unsubscribeUrl}`] : []),
  ].join("\n");

  return { html, text, attachments: attachment ? [attachment] : undefined };
}

const overviewUrl = () => appUrl("/overview");
const messagesUrl = () => appUrl("/messages");
const AUTO_GENERATED_FOOTER = "Automated message from Omentir.";

function autoFooterHtml() {
  return `<p style="margin:16px 0 0;font-family:${MAIL_FONT};font-size:11px;line-height:1.5;color:${MAIL.textFaint};">${escapeHtml(AUTO_GENERATED_FOOTER)}</p>`;
}

function withAutoFooterText(body: string) {
  return `${body}\n\n${AUTO_GENERATED_FOOTER}`;
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

function emailShell(title: string, bodyHtml: string, attachment: ReturnType<typeof logoAttachment>) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:${MAIL.canvas};color:${MAIL.text};font-family:${MAIL_FONT};-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${MAIL.canvas}" style="background:${MAIL.canvas};padding:24px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${MAIL.surface}" style="max-width:560px;background:${MAIL.surface};border:1px solid ${MAIL.border};border-radius:10px;overflow:hidden;">
            <tr>
              <td style="padding:20px 22px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="middle" style="padding:0 8px 0 0;">${logoImg(Boolean(attachment))}</td>
                    <td valign="middle" style="font-family:${MAIL_FONT};font-size:18px;line-height:20px;font-weight:600;letter-spacing:-0.01em;color:${MAIL.text};">Omentir</td>
                  </tr>
                </table>
              </td>
            </tr>
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
          <td style="width:132px;padding:8px 0;border-bottom:1px solid ${MAIL.border};color:${MAIL.textMuted};font-family:${MAIL_FONT};font-size:12px;line-height:1.4;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:8px 0 8px 12px;border-bottom:1px solid ${MAIL.border};color:${MAIL.text};font-family:${MAIL_FONT};font-size:13px;line-height:1.45;vertical-align:top;word-break:break-word;">${escapeHtml(value || "Not provided")}</td>
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

  const inCampaign = input.campaignName ? ` in ${input.campaignName}` : "";
  const closing = input.handoff
    ? "This campaign stopped after a reply. The next message is yours."
    : "Open Omentir to respond.";
  const attachment = logoAttachment();

  const html = emailShell(
    `${input.leadName} replied on LinkedIn`,
    `
            <tr>
              <td style="padding:20px 22px 6px;">
                <p style="margin:0 0 6px;font-family:${MAIL_FONT};font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${MAIL.textFaint};">Reply received</p>
                <h1 style="margin:0;font-family:${MAIL_FONT};color:${MAIL.text};font-size:20px;line-height:1.25;font-weight:600;">${escapeHtml(input.leadName)} replied on LinkedIn</h1>
                <p style="margin:8px 0 0;font-family:${MAIL_FONT};font-size:13px;line-height:1.5;color:${MAIL.textMuted};">Their latest message${escapeHtml(inCampaign)}:</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 22px 4px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${MAIL.surfaceHigh}" style="border-left:2px solid ${MAIL.primary};background:${MAIL.surfaceHigh};">
                  <tr>
                    <td style="padding:13px 15px;color:${MAIL.text};font-family:${MAIL_FONT};font-size:14px;line-height:1.5;font-style:italic;">&ldquo;${escapeHtml(input.body)}&rdquo;</td>
                  </tr>
                </table>
                <p style="margin:10px 0 0;font-family:${MAIL_FONT};font-size:12px;line-height:1.5;color:${MAIL.textMuted};">${escapeHtml(closing)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 22px 22px;">
                <a href="${messagesUrl()}" style="display:inline-block;border:1px solid ${MAIL.primary};border-radius:6px;background:${MAIL.primary};color:${MAIL.onPrimary};font-family:${MAIL_FONT};font-size:13px;font-weight:600;text-decoration:none;padding:10px 14px;">Open conversation</a>
                ${autoFooterHtml()}
              </td>
            </tr>`,
    attachment,
  );

  const text = withAutoFooterText(
    [
      `${input.leadName} replied${inCampaign}:`,
      "",
      `"${input.body}"`,
      "",
      closing,
      "",
      `Open conversation: ${messagesUrl()}`,
    ].join("\n"),
  );

  return ensureResendAccepted(
    await resend.emails.send(
      {
        from: transactionalFrom(),
        to: input.to,
        subject: `${input.leadName} replied on LinkedIn`,
        html,
        text,
        ...(attachment ? { attachments: [attachment] } : {}),
        tags: [{ name: "kind", value: "lead_reply" }],
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
    ),
  );
}

// -----------------------------------------------------------------------------
// 1. Daily digest: last 24 hours summary (HTML table)
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
            `<p style="margin:10px 0 0;font-family:${MAIL_FONT};font-size:12px;line-height:1.5;color:${MAIL.textMuted};">Note: ${escapeHtml(note)}</p>`,
        )
        .join("")
    : "";
  const attachment = logoAttachment();

  const html = emailShell(
    "Omentir daily update",
    `
            <tr>
              <td style="padding:20px 22px 6px;">
                <h1 style="margin:0;font-family:${MAIL_FONT};color:${MAIL.text};font-size:20px;line-height:1.25;font-weight:600;">Last 24 hours</h1>
                <p style="margin:8px 0 0;font-family:${MAIL_FONT};font-size:13px;line-height:1.5;color:${MAIL.textMuted};">Activity from your Omentir workspace.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 22px 6px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${MAIL.surfaceLow}" style="border:1px solid ${MAIL.border};border-radius:6px;border-collapse:collapse;background:${MAIL.surfaceLow};">
                  <tr>
                    <th align="left" style="padding:9px 10px;background:${MAIL.surfaceHigh};border-bottom:1px solid ${MAIL.border};color:${MAIL.textMuted};font-family:${MAIL_FONT};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;">Metric</th>
                    <th align="right" style="padding:9px 10px;background:${MAIL.surfaceHigh};border-bottom:1px solid ${MAIL.border};color:${MAIL.textMuted};font-family:${MAIL_FONT};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;">Count</th>
                  </tr>
                  ${rows
                    .map(
                      ([label, value], index) => `
                  <tr>
                    <td style="padding:10px;border-bottom:${index === rows.length - 1 ? "0" : `1px solid ${MAIL.border}`};color:${MAIL.text};font-family:${MAIL_FONT};font-size:13px;">${escapeHtml(label)}</td>
                    <td align="right" style="padding:10px;border-bottom:${index === rows.length - 1 ? "0" : `1px solid ${MAIL.border}`};color:${MAIL.text};font-family:${MAIL_FONT};font-size:13px;font-weight:600;">${escapeHtml(value)}</td>
                  </tr>`,
                    )
                    .join("")}
                </table>
                ${notesHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 22px 22px;">
                <a href="${overviewUrl()}" style="display:inline-block;border:1px solid ${MAIL.primary};border-radius:6px;background:${MAIL.primary};color:${MAIL.onPrimary};font-family:${MAIL_FONT};font-size:13px;font-weight:600;text-decoration:none;padding:10px 14px;">Open overview</a>
                ${autoFooterHtml()}
              </td>
            </tr>`,
    attachment,
  );

  const text = withAutoFooterText(
    [
      "Last 24 hours on Omentir",
      "",
      ...rows.map(([label, value]) => `${label}: ${value}`),
      ...(input.notes?.length ? ["", ...input.notes.map((note) => `Note: ${note}`)] : []),
      "",
      `Open overview: ${overviewUrl()}`,
    ].join("\n"),
  );

  return { html, text, attachments: attachment ? [attachment] : undefined };
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
        subject: `Omentir: ${stats.newLeads} new leads, ${stats.repliesReceived} replies`,
        html: email.html,
        text: email.text,
        ...(email.attachments ? { attachments: email.attachments } : {}),
        tags: [{ name: "kind", value: "daily_digest" }],
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
    ),
  );
}

// -----------------------------------------------------------------------------
// 2. Temporary LinkedIn invitation pause: simple notification
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
  const attachment = logoAttachment();
  const opening = accountLabel
    ? `LinkedIn rejected several connection attempts from ${accountLabel}.`
    : "LinkedIn rejected several connection attempts from your account.";
  const pauseDetails = `Omentir paused new invites for this account and will test again around ${input.resumeAtText}. Messages to existing connections and other LinkedIn accounts are unaffected.`;
  const text = withAutoFooterText(
    [
      opening,
      "",
      pauseDetails,
      "",
      "No action needed.",
      "",
      `Overview: ${overviewUrl()}`,
    ].join("\n"),
  );
  const html = emailShell(
    "LinkedIn invites paused",
    `
            <tr>
              <td style="padding:20px 22px 6px;">
                <h1 style="margin:0;font-family:${MAIL_FONT};color:${MAIL.text};font-size:20px;line-height:1.25;font-weight:600;">Invites paused</h1>
                <p style="margin:8px 0 0;font-family:${MAIL_FONT};font-size:13px;line-height:1.5;color:${MAIL.textMuted};">${escapeHtml(opening)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 22px 4px;">
                <p style="margin:0;font-family:${MAIL_FONT};font-size:14px;line-height:1.5;color:${MAIL.text};">${escapeHtml(pauseDetails)}</p>
                <p style="margin:10px 0 0;font-family:${MAIL_FONT};font-size:12px;line-height:1.5;color:${MAIL.textMuted};">No action needed.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 22px 22px;">
                <a href="${overviewUrl()}" style="display:inline-block;border:1px solid ${MAIL.primary};border-radius:6px;background:${MAIL.primary};color:${MAIL.onPrimary};font-family:${MAIL_FONT};font-size:13px;font-weight:600;text-decoration:none;padding:10px 14px;">Open overview</a>
                ${autoFooterHtml()}
              </td>
            </tr>`,
    attachment,
  );

  return ensureResendAccepted(
    await resend.emails.send(
      {
        from: transactionalFrom(),
        to: input.to,
        subject: accountLabel
          ? `${accountLabel}: LinkedIn invites paused`
          : "LinkedIn invites paused",
        html,
        text,
        ...(attachment ? { attachments: [attachment] } : {}),
        tags: [{ name: "kind", value: "invite_pause_notification" }],
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
    ),
  );
}

// -----------------------------------------------------------------------------
// 3. Interested lead: full lead details when a prospect shows interest
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
    ["Name", lead.name || "Not provided"],
    ["Position", lead.title || "Not provided"],
    ["Company", lead.company || "Not provided"],
    ["Location", lead.location || "Not provided"],
    ["LinkedIn", lead.linkedInUrl || "Not provided"],
    ...(input.linkedInAccountName?.trim()
      ? ([["Account", input.linkedInAccountName.trim()]] as Array<[string, string]>)
      : []),
    ["Last message", input.interestSignal || "Not provided"],
  ];
  const attachment = logoAttachment();

  const html = emailShell(
    `${leadName} seems interested`,
    `
            <tr>
              <td style="padding:20px 22px 6px;">
                <p style="margin:0 0 6px;font-family:${MAIL_FONT};font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${MAIL.textFaint};">Interest detected</p>
                <h1 style="margin:0;font-family:${MAIL_FONT};color:${MAIL.text};font-size:20px;line-height:1.25;font-weight:600;">${escapeHtml(leadName)} seems interested</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 22px 6px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid ${MAIL.border};">
                  ${detailRowsHtml(rows)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 22px 22px;">
                <a href="${messagesUrl()}" style="display:inline-block;border:1px solid ${MAIL.primary};border-radius:6px;background:${MAIL.primary};color:${MAIL.onPrimary};font-family:${MAIL_FONT};font-size:13px;font-weight:600;text-decoration:none;padding:10px 14px;">Open messages</a>
                ${autoFooterHtml()}
              </td>
            </tr>`,
    attachment,
  );

  const text = withAutoFooterText(
    [
      `${leadName} seems interested`,
      "",
      ...rows.map(([label, value]) => `${label}: ${value || "Not provided"}`),
      "",
      `Open messages: ${messagesUrl()}`,
    ].join("\n"),
  );

  return {
    html,
    text,
    subject: `${leadName} seems interested in your product`,
    attachments: attachment ? [attachment] : undefined,
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
    ["Fetched website", input.websiteUrl || "Not provided"],
    ["Location", input.location],
    ["IP address", input.ipAddress],
    ["Device type", input.deviceType],
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
          <td style="width:170px;padding:8px 0;border-bottom:1px solid ${MAIL.border};color:${MAIL.textMuted};font-family:${MAIL_FONT};font-size:12px;line-height:1.4;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:8px 0 8px 12px;border-bottom:1px solid ${MAIL.border};color:${MAIL.text};font-family:${MAIL_FONT};font-size:13px;line-height:1.45;vertical-align:top;word-break:break-word;">${escapeHtml(value || "Not provided")}</td>
        </tr>`,
    )
    .join("");
  const attachment = logoAttachment();

  const html = emailShell(
    "New Omentir signup",
    `
            <tr>
              <td style="padding:20px 22px 6px;">
                <h1 style="margin:0;font-family:${MAIL_FONT};color:${MAIL.text};font-size:20px;line-height:1.25;font-weight:600;">New signup</h1>
                <p style="margin:8px 0 0;font-family:${MAIL_FONT};font-size:13px;line-height:1.5;color:${MAIL.textMuted};">A new user joined Omentir.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 22px 6px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid ${MAIL.border};">
                  ${htmlRows}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 22px 22px;">
                ${autoFooterHtml()}
              </td>
            </tr>`,
    attachment,
  );

  const text = [
    "New signup",
    "",
    ...rows.flatMap(([label, value]) => [`${label}: ${value || "Not provided"}`]),
  ].join("\n");

  return { html, text, attachments: attachment ? [attachment] : undefined };
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
      subject: "New Omentir signup",
      html: email.html,
      text: email.text,
      ...(email.attachments ? { attachments: email.attachments } : {}),
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
  sendImmediately?: boolean;
}) {
  if (!hostedEmailEnabled()) return { skipped: true, reason: "hosted_only" };
  const resend = getResend();
  if (!resend) return { skipped: true, reason: "missing_resend_api_key" };

  const firstName = input.firstName?.trim();
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const scheduledAt = input.sendImmediately
    ? undefined
    : new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const email = buildSignupWelcomeEmail({ greeting, unsubscribeUrl: input.unsubscribeUrl });

  return resend.emails.send(
    {
      from: hostedWelcomeFrom(),
      to: input.to,
      subject: "Welcome to Omentir",
      ...(scheduledAt ? { scheduledAt } : {}),
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
 * Hosted-only: self-hosted installs do not send to Omentir inboxes.
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

  // Body is intentionally only the customer message, with no labels or metadata.
  const text = query;
  const attachment = logoAttachment();
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:${MAIL.canvas};color:${MAIL.text};font-family:${MAIL_FONT};-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${MAIL.canvas}" style="background:${MAIL.canvas};padding:24px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${MAIL.surface}" style="max-width:560px;background:${MAIL.surface};border:1px solid ${MAIL.border};border-radius:10px;overflow:hidden;">
            <tr>
              <td style="padding:20px 22px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="middle" style="padding:0 8px 0 0;">${logoImg(Boolean(attachment))}</td>
                    <td valign="middle" style="font-family:${MAIL_FONT};font-size:18px;line-height:20px;font-weight:600;letter-spacing:-0.01em;color:${MAIL.text};">Omentir</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 22px 22px;font-family:${MAIL_FONT};font-size:14px;line-height:1.5;color:${MAIL.text};">
                <p style="margin:0;white-space:pre-wrap;">${escapeHtml(query)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return resend.emails.send({
    from: hostedContactFormFrom(),
    to: hostedContactFormTo(),
    replyTo: contactEmail,
    subject: title,
    text,
    html,
    ...(attachment ? { attachments: [attachment] } : {}),
    tags: [{ name: "kind", value: "contact_form" }],
  });
}
