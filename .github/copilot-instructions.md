# Copilot instructions for Omentir

Follow repo root `AGENTS.md` for all work.

## Marketing copy

When adding or editing user-facing text (SEO data files, blogs, guides, homepage, meta descriptions, FAQs, UI labels):

1. Read `.cursor/skills/omentir-marketing-copy/SKILL.md` and `.cursor/skills/humanizer/SKILL.md`.
2. Humanize every string before finishing. No AI-sounding hype, no em dashes.
3. Run `bun run lint:copy` and fix all violations.

Do not ship marketing strings without this pass.
