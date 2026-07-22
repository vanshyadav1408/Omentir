import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/server/mailing-list";
import { isLocalMode } from "@/lib/runtime-mode";

export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// The Omentir spoke mark from src/app/logo-mark.tsx, inlined because this
// standalone response can't render React components.
const LOGO_SVG = `<svg viewBox="0 0 200 200" fill="currentColor" aria-hidden="true" style="display:block;width:32px;height:32px;"><g transform="translate(100 100) rotate(22.5)"><rect x="-7" y="-90" width="14" height="180" rx="2"/><rect x="-7" y="-90" width="14" height="180" rx="2" transform="rotate(45)"/><rect x="-7" y="-90" width="14" height="180" rx="2" transform="rotate(90)"/><rect x="-7" y="-90" width="14" height="180" rx="2" transform="rotate(135)"/></g></svg>`;

/**
 * Branded standalone page, dark theme by default: Google charcoal surfaces,
 * the seed color's dark pastel roles, and a 64px header holding only the
 * logo and wordmark.
 */
function page(title: string, body: string) {
  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>${escapeHtml(title)} - Omentir</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      :root {
        color-scheme: dark;
        --bg: #131314;
        --surface: #1E1F20;
        --border: #444746;
        --text-primary: rgba(255, 255, 255, 0.90);
        --text-secondary: rgba(255, 255, 255, 0.70);
        --primary: #F2B8C6;
        --on-primary: #4A0D2E;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        min-height: 100vh;
        background: var(--bg);
        color: var(--text-primary);
        font-family: "Google Sans", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        flex-direction: column;
      }
      header {
        height: 64px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 24px;
      }
      header .wordmark {
        font-size: 22px;
        font-weight: 500;
        letter-spacing: -0.01em;
        color: var(--text-primary);
      }
      main {
        flex: 1;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 96px 24px 64px;
      }
      .card {
        width: 100%;
        max-width: 480px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 40px 32px;
        text-align: center;
      }
      .card h1 {
        font-size: 22px;
        font-weight: 500;
        line-height: 1.3;
      }
      .card p {
        margin-top: 16px;
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-secondary);
      }
      .card p strong { color: var(--text-primary); font-weight: 500; }
      .card .action {
        display: inline-block;
        margin-top: 32px;
        background: var(--primary);
        color: var(--on-primary);
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        border-radius: 100px;
        padding: 12px 24px;
      }
      @media (max-width: 767.98px) {
        header { height: 56px; padding: 0 16px; }
        main { padding: 48px 16px 48px; }
        .card { padding: 32px 24px; }
      }
    </style>
  </head>
  <body>
    <header>
      ${LOGO_SVG}
      <span class="wordmark">Omentir</span>
    </header>
    <main>
      <div class="card">
        <h1>${escapeHtml(title)}</h1>
        <p>${body}</p>
        <a class="action" href="/">Back to Omentir</a>
      </div>
    </main>
  </body>
</html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: NextRequest) {
  if (isLocalMode()) return new NextResponse(null, { status: 404 });
  const token = request.nextUrl.searchParams.get("token") || "";
  const entry = await unsubscribeByToken(token);

  if (!entry) {
    return page(
      "Link not recognized",
      "This unsubscribe link is invalid or has expired. If you still want off the list, reply to any of our emails and we will remove you.",
    );
  }

  return page(
    "You're unsubscribed",
    `<strong>${escapeHtml(entry.email)}</strong> will no longer receive emails from the Omentir mailing list.`,
  );
}

// RFC 8058 one-click unsubscribe: mail clients POST to the List-Unsubscribe
// URL (token included in the query string) with no user interaction.
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const entry = await unsubscribeByToken(token);
  if (!entry) {
    return NextResponse.json({ error: "Unknown unsubscribe token." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
