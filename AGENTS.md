These rules apply to every task in this project unless explicitly overridden.
Bias: caution over speed on non-trivial work. Use judgment on trivial tasks.

## Rule 1 — Think Before Coding
State assumptions explicitly. If uncertain, ask rather than guess.
Present multiple interpretations when ambiguity exists.
Push back when a simpler approach exists.
Stop when confused. Name what's unclear.

## Rule 2 — Simplicity First
Minimum code that solves the problem. Nothing speculative.
No features beyond what was asked. No abstractions for single-use code.
Test: would a senior engineer say this is overcomplicated? If yes, simplify.

## Rule 3 — Surgical Changes
Touch only what you must. Clean up only your own mess.
Don't "improve" adjacent code, comments, or formatting.
Don't refactor what isn't broken. Match existing style.

## Rule 4 — Goal-Driven Execution
Define success criteria. Loop until verified.
Don't follow steps. Define success and iterate.
Strong success criteria let you loop independently.

## Rule 5 — Use the model only for judgment calls
Use me for: classification, drafting, summarization, extraction.
Do NOT use me for: routing, retries, deterministic transforms.
If code can answer, code answers.

## Rule 6 — Token budgets are not advisory
Per-task: 10,000 tokens. Per-session: 60,000 tokens.
If approaching budget, summarize and start fresh.
Surface the breach. Do not silently overrun.

## Rule 7 — Surface conflicts, don't average them
If two patterns contradict, pick one (more recent / more tested).
Explain why. Flag the other for cleanup.
Don't blend conflicting patterns.

## Rule 8 — Read before you write
Before adding code, read exports, immediate callers, shared utilities.
"Looks orthogonal" is dangerous. If unsure why code is structured a way, ask.

## Rule 9 — Tests verify intent, not just behavior
Tests must encode WHY behavior matters, not just WHAT it does.
A test that can't fail when business logic changes is wrong.

## Rule 10 — Checkpoint after every significant step
Summarize what was done, what's verified, what's left.
Don't continue from a state you can't describe back.
If you lose track, stop and restate.

## Rule 11 — Match the codebase's conventions, even if you disagree
Conformance > taste inside the codebase.
If you genuinely think a convention is harmful, surface it. Don't fork silently.

## Rule 12 — Fail loud
"Completed" is wrong if anything was skipped silently.
"Tests pass" is wrong if any were skipped.
Default to surfacing uncertainty, not hiding it.

When i say "Push to Github", I mean push the code to github and sync all the 4 branches: main, testup, origin/main and origin/testup should be on the latest code.

Use no em dash ever.

## Marketing copy (all coding agents)

**Mandatory** whenever you add or edit user-facing text on omentir.com (SEO pages, blogs, guides, comparisons, features, meta descriptions, FAQs, hero copy, CTAs, UI labels).

1. Read the **omentir-marketing-copy** skill for your agent:
   - Cursor: `.cursor/skills/omentir-marketing-copy/SKILL.md`
   - Grok Build: `.grok/skills/omentir-marketing-copy/SKILL.md`
   - Claude Code: `.claude/skills/omentir-marketing-copy/SKILL.md`
   - GitHub Copilot: `.github/copilot-instructions.md`
2. Read **humanizer** patterns: `humanizer/SKILL.md` in the same skills directory (or `.cursor/skills/humanizer/SKILL.md`).
3. Humanize every string. Direct voice, honest tradeoffs, no AI hype, no em dashes.
4. Run `bun run lint:copy` and fix all violations before finishing.

Nested `src/AGENTS.md` applies when working under `src/`. Do not ship marketing copy without this pass.

## Cursor Cloud specific instructions

Omentir is a single Next.js 16 app (App Router) run with Bun 1.3.14. It is not a monorepo. The startup update script installs Bun (if missing) and runs `bun install --frozen-lockfile`. Bun lives at `~/.bun/bin` and is on PATH via `~/.bashrc`; if a command reports `bun: command not found`, use the full path `~/.bun/bin/bun`.

Standard commands (see `package.json` and `README.md` "Development"):
- Tests: `bun test --conditions=react-server tests/` (Bun test, no secrets needed).
- Typecheck: `bunx tsc --noEmit`.
- Build: `bun run build` (production-style, no secrets needed).
- Dev server: `bun run dev` on port 3000.
- CI-gated copy checks: `bun run lint:copy` and `bun run verify:pages`.

Non-obvious caveats:
- `bun run dev` and `bun start` validate ALL runtime env at boot via `src/instrumentation.ts` -> `validateRuntimeConfig()` (`src/lib/server/runtime-config.ts`). In self-host mode (`RUN_LOCALLY=TRUE`) the server will NOT boot without `LOCAL_SESSION_SECRET`, `LOCAL_APP_PASSWORD`, `FIREBASE_PROJECT_ID`, a `FIREBASE_SERVICE_ACCOUNT_KEY` whose `project_id` matches, `UNIPILE_DSN`/`UNIPILE_API_KEY`/`UNIPILE_WEBHOOK_SECRET`, and either `GEMINI_API_KEY` or `GOOGLE_CLOUD_PROJECT`+`GOOGLE_CLOUD_LOCATION`. Set `AUTOMATION_DISABLED=true` to skip the `CRON_SECRET` requirement. `build`, `test`, and `tsc` do NOT need any of this.
- Boot validation only checks format (valid JSON, entropy, no placeholders), not connectivity. You can boot dev with structurally-valid dummy secrets (`.env` is gitignored). The login flow then works fully, but any page that reads data (e.g. `/overview`) returns HTTP 500 with a Firestore `16 UNAUTHENTICATED` error until REAL Firebase/Unipile/Gemini credentials are supplied. That 500 after login is the external-service wall, not an app bug.
- Full `bun run lint` (the ESLint half) currently reports pre-existing errors in the repo and is intentionally NOT run in CI. CI (`.github/workflows/ci.yml`) runs `tsc --noEmit`, `lint:copy`, `verify:pages`, and `build`. Do not "fix" those lint errors as part of unrelated work.
- Self-host auth uses a signed `omentir_local_session` cookie (not Clerk). `POST /api/local-auth/login` requires the request `Origin` to equal `APP_BASE_URL`, so API-based login tests must send that header. In local mode marketing pages return 404; only `/login`, `/logout`, `/api/health`, and a few webhook/service prefixes are public before auth.