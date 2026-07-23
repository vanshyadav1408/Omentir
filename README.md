# Omentir

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Omentir is an open-source alternative to LinkedIn outreach and automation tools like [HeyReach](https://heyreach.io) and [Gojiberry](https://gojiberry.ai).

It's an AI sales workspace for finding qualified LinkedIn prospects, drafting contextual outreach, running human-paced campaigns, and handling replies — but you own the code and run it on your own infrastructure.

Use the managed product at [omentir.com](https://omentir.com), or self-host the same application code with your own Firebase, Gemini, and Unipile accounts.

**One codebase:** hosted cloud and self-host share this repo. `RUN_LOCALLY=TRUE` switches auth, billing, marketing, and hosted-only mail off. Public brand contacts for omentir.com stay in source on purpose (see `src/lib/hosted-identity.ts`); they are not used for self-hosted operation.

---

## Self-hosting

Omentir is self-hostable with external managed services. It is not offline or dependency-free. You provide Firebase/Firestore, Unipile, and either a Gemini API key or a Google Cloud Vertex AI project.

Self-hosting removes the Omentir subscription, but Firebase/Google AI and Unipile can still cost money.

### Quick start on localhost

Install Git and either Docker with Docker Compose, or Node.js 22 with npm. Then clone and configure the project:

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
- `UNIPILE_WEBHOOK_SECRET` (required for reply and relation webhooks)

For an initial setup with all automation disabled, leave `CRON_SECRET` blank and set `AUTOMATION_DISABLED=true` instead. Keep `ENABLE_LIVE_AUTOMATION=false` until dry-run output has been reviewed.

#### Run with Docker

Docker is the supported self-hosting path. Omentir runs on amd64 and arm64.

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

#### Run with Node.js

For local development:

```bash
npm ci
npm run dev
```

For a production-style local server:

```bash
npm ci
npm run build
npm start
```

Open `http://localhost:3000`. Sign in with `LOCAL_APP_PASSWORD` unless you opted into open access (see below).

### Access control (local login)

Self-host mode uses a **single workspace** and a signed, HTTP-only session cookie (`omentir_local_session`), not Clerk.

| Setting | Behavior |
|---|---|
| `LOCAL_APP_PASSWORD` set (12+ characters, high entropy) | Login form requires that password. **This is the default expectation.** |
| `LOCAL_APP_PASSWORD` blank and `LOCAL_ALLOW_OPEN_ACCESS` unset/false | **Startup fails.** Blank password is no longer enough to run an unprotected instance. |
| `LOCAL_ALLOW_OPEN_ACCESS=true` and blank password | Explicit opt-in: welcome screen with a “Continue to dashboard” button (no password). Use only on a trusted machine / private network. |
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
3. Create a Unipile account and obtain its DSN, API key, and webhook secret. Unipile is paid and LinkedIn can restrict automated accounts.
4. Create a Gemini API key. For Vertex instead, set `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, and `GOOGLE_APPLICATION_CREDENTIALS_JSON`, enable Vertex AI, and grant the service account Vertex AI User.

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
| `UNIPILE_DSN` / `UNIPILE_API_KEY` | shared | mixed | Unipile endpoint and credential |
| `UNIPILE_WEBHOOK_SECRET` | shared | yes | Authenticates reply and relation webhooks |
| `GEMINI_API_KEY` | local/simple | yes | Gemini Developer API path |
| Vertex variables | shared/advanced | yes | Alternative to `GEMINI_API_KEY` |
| `CRON_SECRET` | shared | yes | Required unless automation is disabled; used by the built-in scheduler and job routes |
| `ENABLE_LIVE_AUTOMATION` | local | no | Live sends remain off unless exactly `true` |
| `AUTOMATION_DISABLED` | shared | no | Emergency stop; skips scheduler and job execution |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | optional | yes/mixed | Transactional notifications only in local mode |
| `ALLOWED_DEV_ORIGINS` | dev only | no | Extra hostnames for Next.js HMR when using tunnels/proxies |

\* Treat `LOCAL_APP_PASSWORD` as a secret even though it is typed by a human.

Generate secrets with a cryptographically secure password manager or `openssl rand -base64 48`. Placeholder strings such as `replace-me` are rejected at startup.

### 3. HTTPS and callbacks

`http://localhost` is supported for local browser use. Any LAN, VPS, tunnel, or internet deployment must use HTTPS. Put a reverse proxy such as Caddy or nginx in front of port 3000 (prefer proxying to the loopback bind above) and set `APP_BASE_URL` to the exact public origin. Do not expose port 3000 on `0.0.0.0` without TLS and a password.

Unipile connect and reply callbacks require a reachable HTTPS URL that matches `APP_BASE_URL`.

#### LinkedIn connect notify callback

When a user connects LinkedIn, Omentir registers a **server-to-server** notify URL with Unipile:

```text
{APP_BASE_URL}/api/connect/callback
```

That endpoint requires a high-entropy, one-time connect token issued when the flow starts and consumed on success. It also verifies that the returned account exists in the configured Unipile account before saving it. Shared secrets are never placed in callback URLs.

Reply / relation webhooks use the separate Unipile webhook route and the same `UNIPILE_WEBHOOK_SECRET` (header `x-omentir-webhook-secret`).

### 4. Enable automation safely

Keep `ENABLE_LIVE_AUTOMATION=false`, connect LinkedIn, and inspect dry-run decisions in `automationRuns`. Only set it to `true` after the account, targeting, message drafts, and quotas are correct. `AUTOMATION_DISABLED=true` is the emergency stop and also permits omitting `CRON_SECRET`.

The process can run a **built-in scheduler** that calls `GET /api/jobs/automation-tick` with `CRON_SECRET` (header `x-cron-secret` or `Authorization: Bearer …`). Job secret comparison is constant-time. Do not put `CRON_SECRET` in browser-facing URLs or public logs.

### Email

Local mode never sends Omentir marketing, founder, contact-form, or mailing-list email. Operational notifications can use your own Resend account. Without it, outreach still works and notification sends are skipped.

The same repository powers omentir.com and self-hosted installs. Hosted product identity (support addresses, welcome From lines, public contact channels) lives in `src/lib/hosted-identity.ts` as intentional defaults for cloud mode. Those paths are gated off when `RUN_LOCALLY=TRUE`. Self-hosters configure only their own `RESEND_FROM_EMAIL` (optional).

### Backups

The operator owns all data. Configure scheduled Firestore managed exports or Google Cloud backups, retain them outside the application project, and test restoration. Back up `.env` securely, never in Git.

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
| Docker port | Bound to loopback (`127.0.0.1:3000`) by default. |
| Website analysis / preview APIs | Require a signed-in session. Unauthenticated callers cannot burn Gemini or use the server as an open website fetcher. |
| Lead preview API | Signed-in only, with rate limits and a bounded JSON body. |
| Agent API & MCP | Bearer agent tokens (hashed at rest). Per-token and global rate limits. Mutation bodies capped (~256 KB). |
| Shared rate limits | Process-local counters plus expiring Firestore-backed ceilings (`rateLimits`) so multiple containers cannot multiply quotas. |
| Job routes (`/api/jobs/*`) | Require `CRON_SECRET` / `AUTOMATION_JOB_SECRET` with constant-time comparison. |
| Login redirects | `?next=` is restricted to safe same-origin relative paths. |
| HTTP security headers | CSP (framing, `form-action`, `object-src`, `base-uri`, etc.), `X-Frame-Options: DENY`, HSTS, `nosniff`, referrer policy. |

### Cost and abuse controls you should expect

Even as the only user on a self-hosted box, the app still enforces ceilings so a leaked agent token, a buggy integration, or a compromised browser session cannot unlimitedly call Gemini or Unipile:

- **Website analysis** (`POST /api/website-analysis`): auth required; shared hourly rate limit.
- **Website preview** (`POST /api/website-preview`): auth required; shared hourly rate limit.
- **Onboarding lead preview** (`POST /api/onboarding/lead-preview`): auth required; shared hourly rate limit; body size capped.
- **Agent API** (`/api/agent/v1/*` including MCP): auth via `Authorization: Bearer omentir_agent_…`; shared per-minute rate limit; JSON bodies size-capped on write paths.
- **Surveys / Unipile webhooks / connect callback**: rate limited; webhooks require a shared secret and connect callbacks require a consume-once token.

Website fetching for analysis still blocks private/reserved IPs (SSRF protections: DNS pin to validated public addresses, no credentialed URLs, redirect re-validation).

### Multi-process / multi-container notes

If you run more than one Node process or replica against the same Firestore project:

- Shared rate limits use the `rateLimits` collection so quotas apply across processes.
- Automation still relies on Firestore tick locks so only one automation tick advances work at a time.
- In-process maps (e.g. login attempt counters) are **per process** and reset on restart; treat them as soft protection, not the only control.

### What self-host does *not* include

- Multi-user SaaS auth (Clerk), billing (Whop), or Omentir marketing email.
- Automatic public exposure of the app — you must deliberately put a reverse proxy in front and open firewall ports.
- Offline / air-gapped operation — Firebase, Unipile, and Gemini/Vertex remain required for full functionality.

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
npm ci
npm test
npx tsc --noEmit
npm run build
```

Runtime configuration is validated when the server starts, so builds and contributor CI do not need secrets.

Useful operator scripts:

| Script | Purpose |
|---|---|
| `npm test` | Unit / contract tests (including security hardening checks) |
| `npm run secrets:scan` | Local secret scan helper |
| `npm run snapshot:public` | Build a sanitized tree for review (excludes `.env`, private tooling paths, etc.) |

---

## Support

Use GitHub issues for reproducible defects in Omentir and feature proposals. Include the release tag, deployment method, sanitized logs, and reproduction steps.

Provider setup, billing, quotas, outages, and account restrictions belong to Firebase/Google Cloud, Unipile, LinkedIn, Gemini, or Resend support. The community may help, but the project cannot operate or debug third-party accounts for self-hosters.

Do not post secrets, customer data, access tokens, service-account JSON, or private LinkedIn messages.

---

## License and trademark

MIT — see [LICENSE](LICENSE). The Omentir name and logo are not granted by the software license; forks should rebrand rather than present themselves as Omentir or omentir.com.

**Third-party notices:** production dependencies are predominantly MIT, Apache-2.0, BSD, or ISC. Notable non-MIT production licenses: Apache-2.0 (Google GenAI, Firebase Admin, and related Google libraries), LGPL-3.0-or-later (`@img/sharp-libvips-*`, dynamically linked platform binary), MPL-2.0 OR Apache-2.0 (`dompurify`, dual-licensed), and CC-BY-4.0 (`caniuse-lite`, transitive data attribution). `"private": true` in `package.json` only means "do not publish this package to the npm registry," not that the source is closed. Blog and marketing images under `public/` are project assets; forks that redistribute them should not imply affiliation with Omentir or omentir.com.
