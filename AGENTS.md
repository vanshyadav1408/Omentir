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

## Rule 13 — One localhost only
Never start a second `bun run dev`, `next dev`, or `next start`.
Check terminals and ports 3000/3001/3002 first. If a Next.js server is already running, use that URL.
Two processes share `.next` and corrupt the Turbopack cache (missing `.sst` files, `/_app` panics, 500s).
If the existing server is dead: stop every `next` process, wipe `.next` only if the cache is corrupt, then start exactly one server.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
