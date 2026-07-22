# Omentir

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Omentir is an open-source AI sales workspace for finding qualified LinkedIn prospects, drafting contextual outreach, running human-paced campaigns, and handling replies.

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

Open `.env` and fill in every uncommented blank value. Complete the provider setup below before starting the server. Generate `LOCAL_SESSION_SECRET` and `CRON_SECRET` independently with `openssl rand -base64 48`. For an initial setup with all automation disabled, leave `CRON_SECRET` blank and set `AUTOMATION_DISABLED=true` instead. Keep `ENABLE_LIVE_AUTOMATION=false` until dry-run output has been reviewed.

#### Run with Docker

Docker is the supported self-hosting path. Omentir runs on amd64 and arm64.

```bash
docker compose up --build -d
docker compose logs -f omentir
```

Open `http://localhost:3000`. Press `Ctrl+C` to exit the log view without stopping Omentir. Stop the server later with `docker compose down`.

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

Open `http://localhost:3000`. If `LOCAL_APP_PASSWORD` is configured, sign in with it. If it is blank, use the welcome screen to continue.

### 1. Provider setup

1. Create a dedicated Firebase project. Enable Firestore and create a service account. Never reuse the hosted Omentir project.
2. Deploy the required indexes with `firebase deploy --only firestore:indexes`, or create the indexes from Firestore error links. The source is `firestore.indexes.json`.
3. Create a Unipile account and obtain its DSN, API key, and webhook secret. Unipile is paid and LinkedIn can restrict automated accounts.
4. Create a Gemini API key. For Vertex instead, set `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, and `GOOGLE_APPLICATION_CREDENTIALS_JSON`, enable Vertex AI, and grant the service account Vertex AI User.

### 2. Configure

Copy `.env.example` to `.env`. Required local settings are validated at server startup:

| Variable | Scope | Secret | Runtime behavior |
|---|---|---:|---|
| `RUN_LOCALLY=TRUE` | local | no | Selects built-in single-workspace authentication |
| `APP_BASE_URL` | shared | no | Canonical server URL; HTTPS required off localhost |
| `LOCAL_APP_PASSWORD` | local | optional | Optional access protection; minimum 12 characters when configured |
| `LOCAL_SESSION_SECRET` | local | yes | Independent random value, minimum 32 characters |
| `FIREBASE_PROJECT_ID` | shared | no | Dedicated Firebase project |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | shared | yes | Service-account JSON; malformed JSON fails startup |
| `UNIPILE_DSN` / `UNIPILE_API_KEY` | shared | mixed | Unipile endpoint and credential |
| `UNIPILE_WEBHOOK_SECRET` | shared | yes | Authenticates callbacks |
| `GEMINI_API_KEY` | local/simple | yes | Gemini Developer API path |
| Vertex variables | shared/advanced | yes | Alternative to `GEMINI_API_KEY` |
| `CRON_SECRET` | shared | yes | Required unless automation is disabled |
| `ENABLE_LIVE_AUTOMATION` | local | no | Live sends remain off unless exactly `true` |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | optional | yes/mixed | Transactional notifications only in local mode |

Generate secrets with a cryptographically secure password manager or `openssl rand -base64 48`.

### 3. HTTPS and callbacks

`http://localhost` is supported for local browser use. Any LAN, VPS, tunnel, or internet deployment must use HTTPS. Put a reverse proxy such as Caddy or nginx in front of port 3000 and set `APP_BASE_URL` to the exact public origin. Do not expose port 3000 directly. Unipile connect and reply callbacks require a reachable HTTPS URL.

### 4. Enable automation safely

Keep `ENABLE_LIVE_AUTOMATION=false`, connect LinkedIn, and inspect dry-run decisions in `automationRuns`. Only set it to `true` after the account, targeting, message drafts, and quotas are correct. `AUTOMATION_DISABLED=true` is the emergency stop and also permits omitting `CRON_SECRET`.

### Email

Local mode never sends Omentir marketing, founder, contact-form, or mailing-list email. Operational notifications can use your own Resend account. Without it, outreach still works and notification sends are skipped.

The same repository powers omentir.com and self-hosted installs. Hosted product identity (support addresses, welcome From lines, public contact channels) lives in `src/lib/hosted-identity.ts` as intentional defaults for cloud mode. Those paths are gated off when `RUN_LOCALLY=TRUE`. Self-hosters configure only their own `RESEND_FROM_EMAIL` (optional).

### Backups

The operator owns all data. Configure scheduled Firestore managed exports or Google Cloud backups, retain them outside the application project, and test restoration. Back up `.env` securely, never in Git.

### Upgrade and rollback

Install immutable release tags only:

```bash
git fetch --tags
git checkout v0.x.y
docker compose up --build -d
```

Rollback by checking out the previous known-good tag and rebuilding. Read each release note for schema or operational changes. At launch, only the latest release tag receives security fixes.

---

## Safety defaults

- Local mode is password-protected and uses signed, expiring sessions.
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

---

## Support

Use GitHub issues for reproducible defects in Omentir and feature proposals. Include the release tag, deployment method, sanitized logs, and reproduction steps.

Provider setup, billing, quotas, outages, and account restrictions belong to Firebase/Google Cloud, Unipile, LinkedIn, Gemini, or Resend support. The community may help, but the project cannot operate or debug third-party accounts for self-hosters.

Do not post secrets, customer data, access tokens, service-account JSON, or private LinkedIn messages.

---

## License and trademark

MIT — see [LICENSE](LICENSE). The Omentir name and logo are not granted by the software license; forks should rebrand rather than present themselves as Omentir or omentir.com.

**Third-party notices:** production dependencies are predominantly MIT, Apache-2.0, BSD, or ISC. Notable non-MIT production licenses: Apache-2.0 (Google GenAI, Firebase Admin, and related Google libraries), LGPL-3.0-or-later (`@img/sharp-libvips-*`, dynamically linked platform binary), MPL-2.0 OR Apache-2.0 (`dompurify`, dual-licensed), and CC-BY-4.0 (`caniuse-lite`, transitive data attribution). `"private": true` in `package.json` only means "do not publish this package to the npm registry," not that the source is closed. Blog and marketing images under `public/` are project assets; forks that redistribute them should not imply affiliation with Omentir or omentir.com.
