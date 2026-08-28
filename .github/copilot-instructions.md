# Copilot instructions for Omentir

Follow repo root `AGENTS.md` for all work.

## One localhost only

Never start a second `bun run dev`, `next dev`, or `next start`. Check terminals and ports 3000/3001/3002 first. If a Next.js server is already running, use that URL. Two processes corrupt the Turbopack cache in `.next`. If the existing server is dead, stop every `next` process, wipe `.next` only if the cache is corrupt, then start exactly one server.

## Marketing copy

When adding or editing user-facing text (SEO data files, blogs, guides, homepage, meta descriptions, FAQs, UI labels):

1. Read `.cursor/skills/omentir-marketing-copy/SKILL.md` and `.cursor/skills/humanizer/SKILL.md`.
2. Humanize every string before finishing. No AI-sounding hype, no em dashes.
3. Run `bun run lint:copy` and fix all violations.

Do not ship marketing strings without this pass.
