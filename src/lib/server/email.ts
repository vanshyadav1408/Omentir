import "server-only";

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

// The Omentir spoke mark from src/app/logo-mark.tsx, inlined as SVG markup.
// Note: Gmail strips inline <svg>, so clients that do so show only the wordmark.
const LOGO_SVG = `<svg viewBox="0 0 200 200" width="32" height="32" fill="#111111" aria-hidden="true" style="display:block;"><g transform="translate(100 100) rotate(22.5)"><rect x="-7" y="-90" width="14" height="180" rx="2"/><rect x="-7" y="-90" width="14" height="180" rx="2" transform="rotate(45)"/><rect x="-7" y="-90" width="14" height="180" rx="2" transform="rotate(90)"/><rect x="-7" y="-90" width="14" height="180" rx="2" transform="rotate(135)"/></g></svg>`;

function buildSignupWelcomeEmail(input: { greeting: string; unsubscribeUrl?: string }) {
  const dashboardUrl = appUrl("/dashboard");
  const escapedGreeting = escapeHtml(input.greeting);
  const escapedDashboardUrl = escapeHtml(dashboardUrl);
  const unsubscribeHtml = input.unsubscribeUrl
    ? `<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#888888;">Don't want emails from us? <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#888888;">Unsubscribe</a>.</p>`
    : "";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to Omentir</title>
  </head>
  <body style="margin:0;background:#f5f6f7;color:#0f0f10;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">
      Welcome to Omentir. Here is how to get from signup to your first LinkedIn campaign.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f6f7;padding:0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #d8d8d8;">
            <tr>
              <td style="padding:34px 30px 22px;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;padding:0 10px 0 0;">
                      ${LOGO_SVG}
                    </td>
                    <td style="vertical-align:middle;font-family:Varta,Arial,Helvetica,sans-serif;font-size:30px;line-height:1;font-weight:600;letter-spacing:0;color:#111111;">Omentir</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 34px;">
                <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:#111111;">${escapedGreeting}</p>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:#111111;">Welcome to Omentir. We help you find relevant buyers, start personalized LinkedIn outreach, and keep every reply organized in one place.</p>
                <p style="margin:0 0 26px;font-size:14px;line-height:1.55;color:#111111;">Your workspace is ready. Here is the fastest way to get started.</p>

                <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:#111111;"><strong>1. Add your website</strong><br>Omentir reads your product and builds your buyer profile.</p>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:#111111;"><strong>2. Connect LinkedIn</strong><br>Use your own account for lead discovery and outreach.</p>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:#111111;"><strong>3. Configure your agent</strong><br>Tell Omentir who to find by role, industry, location, and signals.</p>
                <p style="margin:0 0 28px;font-size:14px;line-height:1.55;color:#111111;"><strong>4. Launch your campaign</strong><br>Send personalized connection requests and messages, then reply from Inbox.</p>

                <p style="margin:0 0 26px;font-size:14px;line-height:1.55;color:#111111;"><!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapedDashboardUrl}" style="height:42px;v-text-anchor:middle;width:140px;" arcsize="14%" stroked="f" fillcolor="#000000">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;">Open Dashboard</center>
                  </v:roundrect>
                <![endif]--><!--[if !mso]><!-- --><a href="${escapedDashboardUrl}" bgcolor="#000000" style="display:inline-block;border:0;border-radius:6px;background-color:#000000;box-shadow:none;color:#ffffff;font-family:Varta,Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;line-height:1;text-decoration:none;padding:13px 20px;mso-hide:all;">Open Dashboard</a><!--<![endif]--></p>

                <p style="margin:0 0 22px;font-size:14px;line-height:1.55;color:#111111;">If you feel stuck, reply to this email.</p>
                <p style="margin:0;font-size:14px;line-height:1.55;color:#111111;">Vansh<br>Founder, Omentir</p>
                ${unsubscribeHtml}
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
    "Welcome to Omentir. We help you find relevant buyers, start personalized LinkedIn outreach, and keep every reply organized in one place.",
    "",
    "Your workspace is ready. Here is the fastest way to get started.",
    "",
    "1. Add your website so Omentir can build your buyer profile.",
    "2. Connect LinkedIn so Omentir can use your own account for lead discovery and outreach.",
    "3. Configure your agent by role, industry, location, and signals.",
    "4. Launch your campaign, then reply from Inbox.",
    "",
    `Dashboard: ${dashboardUrl}`,
    "",
    "If you feel stuck, reply to this email.",
    "",
    "Vansh",
    "Founder, Omentir",
    ...(input.unsubscribeUrl ? ["", `Unsubscribe: ${input.unsubscribeUrl}`] : []),
  ].join("\n");

  return { html, text };
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

// -----------------------------------------------------------------------------
// Sequence handover — the AI sequence ended without a reply; the user should
// take this lead over personally. Exhaustive by design: everything Omentir
// knows about the person, plus the full conversation, so the user never has
// to dig before reaching out.
// -----------------------------------------------------------------------------

export type SequenceHandoverEmailInput = {
  to: string;
  lead: {
    name: string;
    title?: string;
    company?: string;
    location?: string;
    linkedInUrl?: string;
    summary?: string;
    fitScore?: number;
    scoreReasons?: string[];
    leadReason?: string;
    signalText?: string;
    signalSource?: string;
    signalUrl?: string;
    signalObservedAt?: string;
  };
  campaignName?: string;
  linkedInAccountName?: string;
  // AI-drafted "why this person is worth your time" paragraph; optional -
  // the email falls back to a plain line so a drafting failure never blocks it.
  aiBriefing?: string;
  // Everything exchanged, oldest first, as "speaker: text" lines.
  transcript: string[];
  messagesSent: number;
  idempotencyKey?: string;
};

function buildSequenceHandoverEmail(input: SequenceHandoverEmailInput) {
  const { lead } = input;
  const leadName = lead.name || "This lead";
  const briefing =
    input.aiBriefing?.trim() ||
    `${leadName} accepted your connection request but hasn't replied after ${input.messagesSent} messages. They matched your buyer profile, so a personal note from you may land where automation didn't.`;

  const rows: Array<[string, string]> = [
    ["Name", leadName],
    ["Position", lead.title || "—"],
    ["Company", lead.company || "—"],
    ["Location", lead.location || "—"],
    ["LinkedIn", lead.linkedInUrl || "—"],
    ["About them", lead.summary || "—"],
    ...(lead.leadReason ? ([["Why they were surfaced", lead.leadReason]] as Array<[string, string]>) : []),
    ...(lead.signalText
      ? ([[
          `Buying signal${lead.signalSource ? ` (via ${lead.signalSource})` : ""}`,
          `${lead.signalText}${lead.signalObservedAt ? ` (seen ${lead.signalObservedAt.slice(0, 10)})` : ""}`,
        ]] as Array<[string, string]>)
      : []),
    ...(lead.signalUrl ? ([["Signal link", lead.signalUrl]] as Array<[string, string]>) : []),
    ...(typeof lead.fitScore === "number" ? ([["Fit score", `${lead.fitScore}/100`]] as Array<[string, string]>) : []),
    ...(lead.scoreReasons?.length
      ? ([["Fit notes", lead.scoreReasons.join("; ")]] as Array<[string, string]>)
      : []),
    ...(input.campaignName ? ([["Campaign", input.campaignName]] as Array<[string, string]>) : []),
    ...(input.linkedInAccountName
      ? ([["LinkedIn account", input.linkedInAccountName]] as Array<[string, string]>)
      : []),
    ["Messages sent", String(input.messagesSent)],
  ];

  const transcriptHtml = input.transcript.length
    ? `
            <tr>
              <td style="padding:16px 28px 8px;">
                <h2 style="margin:0 0 8px;color:#111111;font-size:15px;font-weight:700;">Everything sent so far</h2>
                ${input.transcript
                  .map(
                    (line) =>
                      `<p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:#333333;border-left:3px solid #eeeeee;padding-left:10px;">${escapeHtml(line)}</p>`,
                  )
                  .join("")}
              </td>
            </tr>`
    : "";

  const html = emailShell(
    `Time to take over: ${leadName}`,
    `
            <tr>
              <td style="padding:28px 28px 8px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#ba3871;">Sequence finished — your turn</p>
                <h1 style="margin:0;color:#111111;font-size:22px;line-height:1.25;font-weight:700;">Talk to ${escapeHtml(leadName)} yourself</h1>
                <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#333333;">${escapeHtml(briefing)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #eeeeee;">
                  ${detailRowsHtml(rows)}
                </table>
              </td>
            </tr>
            ${transcriptHtml}
            <tr>
              <td style="padding:20px 28px 28px;">
                <a href="${messagesUrl()}" style="display:inline-block;border-radius:6px;background:#000000;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 18px;">Open Messages</a>
                ${autoFooterHtml()}
              </td>
            </tr>`,
  );

  const text = withAutoFooterText(
    [
      `Talk to ${leadName} yourself - the automated sequence has finished.`,
      "",
      briefing,
      "",
      ...rows.map(([label, value]) => `${label}: ${value || "—"}`),
      ...(input.transcript.length ? ["", "Everything sent so far:", ...input.transcript] : []),
      "",
      `Open Messages: ${messagesUrl()}`,
    ].join("\n"),
  );

  return { html, text, subject: `Your turn with ${leadName}${lead.company ? ` (${lead.company})` : ""}` };
}

export async function sendSequenceHandoverEmail(input: SequenceHandoverEmailInput) {
  const resend = getResend();
  if (!resend) return { skipped: true };

  const email = buildSequenceHandoverEmail(input);

  return resend.emails.send(
    {
      from: transactionalFrom(),
      to: input.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [{ name: "kind", value: "sequence_handover" }],
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
      subject: "Find customers that want your product with AI.",
      scheduledAt,
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
