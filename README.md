# Omentir

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Omentir is an open-source alternative to LinkedIn outreach and automation tools like [HeyReach](https://heyreach.io) and [Gojiberry](https://gojiberry.ai).

It's an AI sales workspace for finding qualified LinkedIn prospects, drafting contextual outreach, running human-paced campaigns, and handling replies — but you own the code and run it on your own infrastructure.

Use the managed product at [omentir.com](https://omentir.com), or self-host the same application code with your own Firebase, Gemini, and Typesafe accounts and, in production, a proxy for LinkedIn traffic.

Omentir reaches LinkedIn through its own client, which ships in this repo. Earlier releases used Unipile for that; it is no longer needed. See [LinkedIn client](#linkedin-client).

**One codebase:** hosted cloud and self-host share this repo. `RUN_LOCALLY=TRUE` switches auth, billing, marketing, and hosted-only mail off. Public brand contacts for omentir.com stay in source on purpose (see `src/lib/hosted-identity.ts`); they are not used for self-hosted operation.

### Connect from other AI apps (Claude, ChatGPT, Grok, Grok Bot, Cursor, …)

People use Omentir from chat and coding agents without sharing LinkedIn passwords:

1. In Omentir: connect LinkedIn and fill **Workspace**.
2. **Chat apps (Claude, ChatGPT, Grok):** Settings → Connectors → add  
   `https://omentir.com/api/agent/v1/mcp` → sign in and approve **Connect workspace** → enable tools in the chat.  
   No API key.
3. **Grok Bot** (the always-on teammate app, not grok.com chat): Settings → Plugins → search Marketplace for Omentir. If it is not listed, add the same MCP URL as a custom server → approve Connect workspace. Do not sign LinkedIn into the Bot computer. [Grok Bot integration](https://omentir.com/integrations/grok-bot).
4. **Cursor / Claude Code / scripts:** create a key on the [API page](https://omentir.com/api-keys) and send  
   `Authorization: Bearer <token>` to the MCP endpoint or REST `/api/agent/v1/*`.
5. Ask the assistant to create a classic lead finder or a **Steal Customers** agent (`mode: steal_customers` + competitor company URLs). If you have more than one company, ask it to list workspaces and switch.

Docs: [MCP integration](https://omentir.com/integrations/mcp), [Agent API](https://omentir.com/features/agent-api-and-mcp), [agents.md](https://omentir.com/agents.md) (machine guide), [OpenAPI](https://omentir.com/api/agent/v1/openapi.json).

---

## Self-hosting

Omentir is self-hostable with external managed services. It is not offline or dependency-free. You provide Firebase/Firestore, a sticky residential proxy for LinkedIn traffic in production, either a Gemini API key or a Google Cloud Vertex AI project, and a Typesafe API key for lead scoring. You do not need a LinkedIn API vendor.

Self-hosting removes the Omentir subscription, but Firebase, Google AI, Typesafe, and the proxy can still cost money.

### Quick start on localhost

Install Git and either Docker with Docker Compose, or Bun 1.3. Then clone and configure the project:

```bash
git clone https://github.com/vanshyadav1408/Omentir.git
cd Omentir
cp .env.example .env
```

Open `.env` and fill in every uncommented blank value. Complete the provider setup below before starting the server.

Generate independent secrets with:

```bash
openssl rand -base64 48
```

Use that (or a password manager) for at least:

- `LOCAL_SESSION_SECRET` (required)
- `LOCAL_APP_PASSWORD` (required unless you explicitly allow open access — see [Access control](#access-control-local-login))
- `CRON_SECRET` (required unless automation is fully disabled)
- `LINKEDIN_SESSION_KEY` (required; exactly 32 bytes, so generate it with `openssl rand -base64 32`)

`LINKEDIN_PROXY_URL` is required whenever the server runs in production mode. That includes the Docker image and `bun start`, even on localhost. Only `bun run dev` starts without it.

For an initial setup with all automation disabled, leave `CRON_SECRET` blank and set `AUTOMATION_DISABLED=true` instead. Keep `ENABLE_LIVE_AUTOMATION=false` until dry-run output has been reviewed.

#### Run with Docker

Docker is the supported self-hosting path. Omentir runs on amd64 and arm64. The image includes Chromium, which LinkedIn sign-in needs.

```bash
docker compose up --build -d
docker compose logs -f omentir
```

Open `http://localhost:3000`. Press `Ctrl+C` to exit the log view without stopping Omentir. Stop the server later with `docker compose down`.

**Port binding:** Compose publishes the app as `127.0.0.1:3000:3000` only. That means the container is reachable from the same machine (`http://localhost:3000`), not from other devices on your LAN or the public internet. This is intentional: a misconfigured or passwordless instance must not become reachable just because Docker started.

To expose the app on a real host (LAN/VPS):

1. Put HTTPS reverse proxy (Caddy, nginx, Traefik, etc.) on the public interface.
2. Proxy to `127.0.0.1:3000` (or change the Compose bind only if you understand the risk).
3. Set `APP_BASE_URL` to the exact public HTTPS origin (no trailing slash).
4. Keep a strong `LOCAL_APP_PASSWORD` (do not enable open access on a public URL).

#### Run with Bun

For local development:

```bash
bun install
bun run dev
```

For a production-style local server:

```bash
bun install
bun run build
bun start
```

Open `http://localhost:3000`. Sign in with `LOCAL_APP_PASSWORD` unless you opted into open access (see below).

Outside Docker, connecting a LinkedIn account needs Chrome or Chromium on the same machine. Omentir finds the usual install paths on macOS and Linux. Set `LINKEDIN_BROWSER_PATH` if yours is somewhere else.

Bun is the package manager and script runner, but `bun run dev` deliberately starts Next on Node rather than under `bun --bun`. In dev, Turbopack loads every package in `serverExternalPackages` (firebase-admin among them) through a hashed specifier such as `firebase-admin-<hash>/firestore`, which only resolves via a loader hook Next installs in Node. Bun's resolver does not run that hook, so `bun --bun next dev` fails on the first Firestore import with `ResolveMessage: Cannot find module`. Production is unaffected: built output emits plain requires, so `build` and `start` still run under Bun.

### Access control (local login)

Self-host mode uses a **single workspace** and a signed, HTTP-only session cookie (`omentir_local_session`), not Clerk.

| Setting | Behavior |
|---|---|
| `LOCAL_APP_PASSWORD` set (12+ characters, high entropy) | Login form requires that password. **This is the default expectation.** |
| `LOCAL_APP_PASSWORD` blank and `LOCAL_ALLOW_OPEN_ACCESS` unset/false | **Startup fails.** Blank password is no longer enough to run an unprotected instance. |
| `LOCAL_ALLOW_OPEN_ACCESS=true` and blank password | Explicit opt-in: welcome screen with a “Continue to overview” button (no password). Use only on a trusted machine / private network. |
| `LOCAL_ALLOW_OPEN_ACCESS=true` and password set | Password is still required (open-access flag does not weaken a configured password). |
| `LOCAL_SESSION_SECRET` | Required always. Minimum 32 characters, high entropy. Used to HMAC-sign session tokens. Changing it invalidates all existing sessions. |

Additional login hardening that matters for operators:

- **Origin check:** `POST /api/local-auth/login` only accepts requests whose `Origin` matches `APP_BASE_URL`.
- **Brute-force throttle:** wrong passwords are rate-limited per source IP (in-process).
- **Post-login redirects:** the `?next=` return path is sanitized so values like `//evil.com` cannot open-redirect the browser after sign-in. Only same-origin relative paths (starting with a single `/`) are allowed.
- **Cookie flags:** session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` when `APP_BASE_URL` is HTTPS.

### 1. Provider setup

1. Create a dedicated Firebase project. Enable Firestore and create a service account. Never reuse the hosted Omentir project.
2. Deploy the required indexes with `firebase deploy --only firestore:indexes`, or create the indexes from Firestore error links. The source is `firestore.indexes.json`.
   - Also deploy `firebase deploy --only firestore:rules`. Omentir reaches Firestore only through the server-side Admin SDK, so the shipped `firestore.rules` denies all direct browser/client access. Keep it deployed — it stops anyone from reading or writing your data with a leaked project ID or web API key.
3. For production, get a sticky residential proxy that accepts a per-session username (`LINKEDIN_PROXY_URL`). `bun run dev` on your own machine works without one. There is no LinkedIn API vendor to sign up for. LinkedIn can restrict automated accounts.
4. Create a Gemini API key. For Vertex instead, set `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, and `GOOGLE_APPLICATION_CREDENTIALS_JSON`, enable Vertex AI, and grant the service account Vertex AI User. Set `GEMINI_MODEL` either way; there is no default in code.
5. Create a Typesafe API key at `console.typesafe.ai/keys`. Typesafe's Jev model decides whether a discovered lead qualifies. Without the key every discovered lead is skipped.

### 2. Configure

Copy `.env.example` to `.env`. Required local settings are validated at server startup:

| Variable | Scope | Secret | Runtime behavior |
|---|---|---:|---|
| `RUN_LOCALLY=TRUE` | local | no | Selects built-in single-workspace authentication |
| `APP_BASE_URL` | shared | no | Canonical server URL; HTTPS required off localhost |
| `LOCAL_APP_PASSWORD` | local | yes* | Required access password unless open access is explicitly allowed; minimum 12 characters when set |
| `LOCAL_ALLOW_OPEN_ACCESS` | local | no | Must be exactly `true` to allow a passwordless welcome screen |
| `LOCAL_SESSION_SECRET` | local | yes | Independent random value, minimum 32 characters |
| `LOCAL_USER_NAME` / `LOCAL_USER_EMAIL` | local | no | Display identity for the single local workspace |
| `FIREBASE_PROJECT_ID` | shared | no | Dedicated Firebase project |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | shared | yes | Service-account JSON; malformed JSON fails startup |
| `LINKEDIN_SESSION_KEY` | shared | yes | Required. 32 bytes, base64; encrypts stored LinkedIn session cookies |
| `LINKEDIN_PROXY_URL` | shared | yes | Sticky residential proxy URL with a `{session}` placeholder and an optional `{country}` one; required in production mode (Docker and `bun start`) |
| `LINKEDIN_PROXY_COUNTRY` | shared | no | Two-letter country for accounts whose country is unknown. Required when `LINKEDIN_PROXY_URL` uses `{country}` |
| `LINKEDIN_ISP_PROXY_URL` | shared | no | Static ISP proxy URL with `{port}` (and `{host}` when each IP has its own address). Turns on the static IP pool: one IP per account that never changes, and no new account on a residential IP |
| `BYTEFUL_API_PUBLIC_KEY` / `BYTEFUL_API_PRIVATE_KEY` | shared | no | Byteful API keys. Keeps the static IP pool in sync with Byteful and, with a budget, buys IPs on its own |
| `LINKEDIN_PROXY_MONTHLY_BUDGET_USD` | shared | no | Most Omentir may spend on bought static IPs per month. Without it nothing is bought |
| `LINKEDIN_PROXY_SPARES` | shared | no | Free static IPs kept ready for new accounts (default 2) |
| `LINKEDIN_BROWSER_PATH` | shared | no | Path to a Chrome or Chromium binary for LinkedIn sign-in. Only needed outside Docker when the browser is not in a usual install path |
| `GEMINI_API_KEY` | local/simple | yes | Gemini Developer API path |
| Vertex variables | shared/advanced | yes | Alternative to `GEMINI_API_KEY` |
| `GEMINI_MODEL` | shared | no | Required for AI features. The model comes only from this setting |
| `TYPESAFE_API_KEY` | shared | yes | Lead scoring. Without it every discovered lead is skipped |
| `CRON_SECRET` | shared | yes | Required unless automation is disabled; used by the built-in scheduler and job routes |
| `ENABLE_LIVE_AUTOMATION` | local | no | Live sends remain off unless exactly `true` |
| `AUTOMATION_DISABLED` | shared | no | Emergency stop; skips scheduler and job execution |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | optional | yes/mixed | Transactional notifications only in local mode |
| `ALLOWED_DEV_ORIGINS` | dev only | no | Extra hostnames for Next.js HMR when using tunnels/proxies |

\* Treat `LOCAL_APP_PASSWORD` as a secret even though it is typed by a human.

Generate secrets with a cryptographically secure password manager or `openssl rand -base64 48`. Placeholder strings such as `replace-me` are rejected at startup.

#### LinkedIn client

Omentir talks to LinkedIn through its own client in `src/lib/server/linkedin-own/`. No third-party LinkedIn API sits in between, so there is no vendor account to open, no per-seat API bill, and no webhook to register.

**Settings.** Set `LINKEDIN_SESSION_KEY` to 32 random bytes encoded as base64 (`openssl rand -base64 32`). The server will not start without it. With `NODE_ENV=production` the server also refuses to start without `LINKEDIN_PROXY_URL`, an HTTP or HTTPS proxy URL with a `{session}` placeholder, for example `http://user-session-{session}:pass@gate.example.com:7000`. Each account gets its own sticky session, so LinkedIn sees one stable IP per account. Add `{country}` (for example `http://customer-USER-cc-{country}-sessid-{session}-sesstime-1440:pass@pr.oxylabs.io:7777`) to keep each account in the country it connected from, which comes from Cloudflare's `CF-IPCountry` header, and set `LINKEDIN_PROXY_COUNTRY` for accounts where that is unknown.

**Static IP pool (optional).** Sticky residential IPs change at least once a day, and LinkedIn treats an IP that changes every day as a warning sign. To give each account a static IP of its own instead, buy static ISP IPs, set `LINKEDIN_ISP_PROXY_URL` to the gateway with a `{port}` placeholder (for example `http://user-USER:pass@isp.oxylabs.io:{port}`), and add each IP's port and country with `bun --conditions=react-server scripts/linkedin-proxy-pool.ts add 8001:US 8002:GB`. A new sign-in takes a free IP in its own country, or in the nearest country with one free, keeps it across reconnects, and gives it back on disconnect, where it rests 30 days before the next account. When no IP is free the connect is refused, so add IPs before you run out. Accounts connected before the pool existed move onto a static IP the next time they load.

**Buying IPs automatically (Byteful).** Set `BYTEFUL_API_PUBLIC_KEY`, `BYTEFUL_API_PRIVATE_KEY`, `LINKEDIN_ISP_PROXY_URL=http://USER:PASS@{host}:{port}` with your Byteful proxy user, and `LINKEDIN_PROXY_MONTHLY_BUDGET_USD`. Every five minutes the automation tick keeps `LINKEDIN_PROXY_SPARES` IPs free by buying one-month static ISP IPs from your Byteful credit, in the countries people connect from (the nearest country Byteful sells when it does not sell theirs). It never spends past the budget or beyond the credit already on the account. It also follows IPs Byteful replaces and cancels the IP of a disconnected account at the end of its paid month. Keep enough credit for a month of renewals; the server logs a warning when there is less. Run `bun --conditions=react-server scripts/linkedin-proxy-pool.ts sync` to do it immediately. The pool keeps your own accounts apart; a provider's shared IPs can still carry its other customers' traffic. Keep `LINKEDIN_SESSION_KEY` backed up and unchanged: if it is lost or replaced, the stored sessions cannot be decrypted and every account has to reconnect.

**Connecting an account.** The Connect LinkedIn buttons open `/connect/linkedin` in Omentir. The user types their LinkedIn email or phone and password, and Omentir signs in once in a real Chromium browser on the server, through that account's proxy session. A real browser is needed because LinkedIn's bot check refuses plain HTTP sign-in requests. If LinkedIn asks for a verification code or an approval in the LinkedIn app, the same screen handles it. A check that a browser cannot pass, such as an interactive puzzle, is reported and never worked around. The form then offers a fallback: paste `li_at` and `JSESSIONID` from a browser tab that is already signed in. Reconnecting uses the same screen.

**What is stored.** Only the resulting session cookies, encrypted with AES-256-GCM, in the Firestore collection `linkedinSessions`. Each session is bound to the account's sticky proxy session and browser user agent. The password is used once and is never stored or logged. Cookies are never returned to the browser.

**What it covers.** Profile, company, and post discovery, connection requests and withdrawals, inbox reads, messages, and file attachments. Requests for one account run one at a time with jittered gaps. Replies and accepted invitations are found by polling from the automation tick. Reply sync reads active conversation histories even when messages are already marked read. An incomplete history check stops a send instead of assuming no earlier outreach exists.

**Upgrading from a Unipile-based release.** Earlier releases reached LinkedIn through Unipile. That integration is removed. `UNIPILE_DSN`, `UNIPILE_API_KEY`, and `UNIPILE_WEBHOOK_SECRET` are no longer read and can be deleted from `.env`. The Unipile webhook route and the connect callback route no longer exist, so any webhook still registered in a Unipile dashboard can be deleted too. Accounts that were connected through Unipile show as disconnected and cannot send. To keep an account's campaigns, reconnect it and pick the old account in the form's replace field. Omentir cannot read the old account anymore, so the choice is limited to accounts in your own workspaces. Replacing keeps the account record ID, campaign references, and stored conversations. It stops if outreach is sending at that moment. Automated messages sent before the switch are recognized by their text and send time, so the owner-message guard does not mistake them for messages you wrote by hand.

**Verification status.** On 2026-11-16 the client was run against a live LinkedIn session from a development machine, without a proxy. The read probe passed (profiles, search, posts, comments, reactions, companies, invitations, connections, inbox, messages). So did a write test: one message, and one connection request that was then withdrawn. Attachment upload, a production deployment behind a proxy, and a full scheduler-driven campaign have not been exercised live yet. LinkedIn changes these internal calls without notice; `src/lib/server/linkedin-own/endpoints.ts` is the one place to update. Local tests use invented fixtures and cannot prove current compatibility, so validate with a test account before you rely on it. Proxy traffic and maintenance still have costs.

### 3. HTTPS

`http://localhost` is supported for local browser use. Any LAN, VPS, tunnel, or internet deployment must use HTTPS. Put a reverse proxy such as Caddy or nginx in front of port 3000 (prefer proxying to the loopback bind above) and set `APP_BASE_URL` to the exact public origin. Do not expose port 3000 on `0.0.0.0` without TLS and a password.

LinkedIn needs no callback or inbound webhook URL. Replies and accepted invitations are found by polling LinkedIn from the automation tick.

### 4. Enable automation safely

Keep `ENABLE_LIVE_AUTOMATION=false`, connect LinkedIn, and inspect dry-run decisions in `automationRuns`. Only set it to `true` after the account, targeting, message drafts, and quotas are correct. `AUTOMATION_DISABLED=true` is the emergency stop and also permits omitting `CRON_SECRET`.

The process can run a **built-in scheduler** that calls `GET /api/jobs/automation-tick` with `CRON_SECRET` (header `x-cron-secret` or `Authorization: Bearer …`). Job secret comparison is constant-time. Do not put `CRON_SECRET` in browser-facing URLs or public logs.

### Email

Local mode never sends Omentir marketing, founder, contact-form, or mailing-list email. Operational notifications can use your own Resend account. Without it, outreach still works and notification sends are skipped.

The same repository powers omentir.com and self-hosted installs. Hosted product identity (support addresses, welcome From lines, public contact channels) lives in `src/lib/hosted-identity.ts` as intentional defaults for cloud mode. Those paths are gated off when `RUN_LOCALLY=TRUE`. Self-hosters configure only their own `RESEND_FROM_EMAIL` (optional).

### Backups

The operator owns all data. Configure scheduled Firestore managed exports or Google Cloud backups, retain them outside the application project, and test restoration. Back up `.env` securely, never in Git. It holds `LINKEDIN_SESSION_KEY`, and a restored database is no use for LinkedIn without it: the `linkedinSessions` documents cannot be decrypted with any other key.

Firestore will also receive operational documents under collections such as `rateLimits` (shared request ceilings across app processes). These are not customer CRM data; include them in backups or allow them to rebuild naturally after restore.

### Upgrade and rollback

Install immutable release tags only:

```bash
git fetch --tags
git checkout v0.x.y
docker compose up --build -d
```

Rollback by checking out the previous known-good tag and rebuilding. Read each release note for schema or operational changes. At launch, only the latest release tag receives security fixes.

---

## Security defaults for self-hosters

This section documents protections that matter when you run Omentir yourself. Hosted omentir.com uses the same code paths where applicable, plus Clerk/Whop which local mode does not use.

### What is locked down

| Area | Behavior |
|---|---|
| Firestore clients | `firestore.rules` denies all browser/client read/write. Only the Admin SDK on the server can access data. |
| Secrets in the repo | `.env` is gitignored. Ship only blank `.env.example`. Never commit service-account JSON or API keys. |
| Local password | Required by default; open access needs an explicit `LOCAL_ALLOW_OPEN_ACCESS=true`. |
| LinkedIn sessions | Session cookies are encrypted with AES-256-GCM before they are stored. LinkedIn passwords are never stored or logged, and cookies are never returned to the browser. |
| Docker port | Bound to loopback (`127.0.0.1:3000`) by default. |
| Website analysis / preview APIs | Require a signed-in session. Unauthenticated callers cannot burn Gemini or use the server as an open website fetcher. |
| Lead preview API | Signed-in only, with rate limits and a bounded JSON body. |
| Agent API & MCP | Bearer agent tokens (hashed at rest). Per-token and global rate limits. Mutation bodies capped (~256 KB). |
| Shared rate limits | Process-local counters plus expiring Firestore-backed ceilings (`rateLimits`) so multiple containers cannot multiply quotas. |
| Job routes (`/api/jobs/*`) | Require `CRON_SECRET` / `AUTOMATION_JOB_SECRET` with constant-time comparison. |
| Login redirects | `?next=` is restricted to safe same-origin relative paths. |
| HTTP security headers | CSP (framing, `form-action`, `object-src`, `base-uri`, etc.), `X-Frame-Options: DENY`, HSTS, `nosniff`, referrer policy. |

### Cost and abuse controls you should expect

Even as the only user on a self-hosted box, the app still enforces ceilings so a leaked agent token, a buggy integration, or a compromised browser session cannot unlimitedly call Gemini or LinkedIn:

- **Website analysis** (`POST /api/website-analysis`): auth required; shared hourly rate limit.
- **Website preview** (`POST /api/website-preview`): auth required; shared hourly rate limit.
- **Onboarding lead preview** (`POST /api/onboarding/lead-preview`): auth required; shared hourly rate limit; body size capped.
- **Agent API** (`/api/agent/v1/*` including MCP): auth via `Authorization: Bearer omentir_agent_…`; shared per-minute rate limit; JSON bodies size-capped on write paths.
- **Surveys / webhooks / LinkedIn connect**: rate limited; webhooks require a shared secret or signature.

Website fetching for analysis still blocks private/reserved IPs (SSRF protections: DNS pin to validated public addresses, no credentialed URLs, redirect re-validation).

### Multi-process / multi-container notes

If you run more than one Node process or replica against the same Firestore project:

- Shared rate limits use the `rateLimits` collection so quotas apply across processes.
- Automation still relies on Firestore tick locks so only one automation tick advances work at a time.
- In-process maps (e.g. login attempt counters) are **per process** and reset on restart; treat them as soft protection, not the only control.
- LinkedIn sign-in and per-account request pacing also live in process memory. A sign-in that is waiting on a verification code keeps its browser open for up to ten minutes in the process that started it, so the follow-up request must reach that same process. One app process is the supported setup.

### What self-host does *not* include

- Multi-user SaaS auth (Clerk), billing (Whop), or Omentir marketing email.
- Automatic public exposure of the app — you must deliberately put a reverse proxy in front and open firewall ports.
- Offline / air-gapped operation: Firebase, LinkedIn, Gemini/Vertex, and Typesafe remain required for full functionality.

---

## Safety defaults (automation)

- Local mode uses signed, expiring sessions; password is required unless open access is explicitly enabled.
- Automation is dry-run unless `ENABLE_LIVE_AUTOMATION=true`.
- `AUTOMATION_DISABLED=true` prevents scheduler startup and manual tick execution.
- Commercial plan caps are removed locally, but invite spacing, daily quotas, retry ceilings, and per-tick send budgets remain enforced.
- Verification must not send real outreach. Use dry-run output and `automationRuns`.

---

## Development

```bash
bun install
bunx tsc --noEmit
bun run test
bun run build
```

Use `bun run test`, not a bare `bun test`. The script runs each test file in isolation; without that, module mocks leak between files and report failures that are not real.

Runtime configuration is validated when the server starts, so builds and contributor CI do not need secrets.

---

## Support

Use GitHub issues for reproducible defects in Omentir and feature proposals. Include the release tag, deployment method, sanitized logs, and reproduction steps.

Provider setup, billing, quotas, outages, and account restrictions belong to Firebase/Google Cloud, your proxy provider, LinkedIn, Gemini, Typesafe, or Resend support. The community may help, but the project cannot operate or debug third-party accounts for self-hosters.

Do not post secrets, customer data, access tokens, LinkedIn session cookies, service-account JSON, or private LinkedIn messages.

---

## License and trademark

MIT — see [LICENSE](LICENSE). The Omentir name and logo are not granted by the software license; forks should rebrand rather than present themselves as Omentir or omentir.com.

**Third-party notices:** production dependencies are predominantly MIT, Apache-2.0, BSD, or ISC. Notable non-MIT production licenses: Apache-2.0 (Google GenAI, Firebase Admin and related Google libraries, and `playwright-core`), LGPL-3.0-or-later (`@img/sharp-libvips-*`, dynamically linked platform binary), MPL-2.0 OR Apache-2.0 (`dompurify`, dual-licensed), and CC-BY-4.0 (`caniuse-lite`, transitive data attribution). `"private": true` in `package.json` only means "do not publish this package to the npm registry," not that the source is closed. Blog and marketing images under `public/` are project assets; forks that redistribute them should not imply affiliation with Omentir or omentir.com.
