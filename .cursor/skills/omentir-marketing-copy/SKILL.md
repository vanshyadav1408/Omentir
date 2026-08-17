---
name: omentir-marketing-copy
description: >-
  Enforces human, non-AI writing for all Omentir user-facing text. Applies the
  humanizer workflow before writing or editing marketing copy, SEO pages, blogs,
  guides, comparisons, features, alternatives, use cases, integrations, homepage
  text, meta descriptions, titles, FAQs, hero copy, CTAs, and any string shown
  on omentir.com. Use automatically whenever creating, drafting, revising, or
  reviewing visible site content in this repository.
---

# Omentir marketing copy

**Mandatory for every user-facing string in this repo.** Do not finish a content task until this workflow is done.

## When this applies

Any time you add or change text that a visitor, buyer, or search engine will read:

- `src/app/**/*-data.ts` (comparisons, features, alternatives, use cases, integrations, blogs index)
- `src/app/guides/**`
- `src/app/blogs/**`
- `src/app/page.tsx`, `src/app/marketing-*.tsx`, `src/app/feature-*.tsx`
- `src/lib/public-page-markdown.ts`
- Meta titles, descriptions, FAQs, hero copy, CTAs, alt text, Open Graph strings

If it ships to the site, humanize it.

## Workflow

1. **Read** the humanizer pattern list. Path depends on your agent:
   - Cursor: [humanizer/SKILL.md](../humanizer/SKILL.md)
   - Grok Build: `.grok/skills/humanizer/SKILL.md`
   - Claude Code: `.claude/skills/humanizer/SKILL.md`
   - Codex / Copilot: `.cursor/skills/humanizer/SKILL.md` or root `AGENTS.md`
2. **Draft** the copy.
3. **Humanizer pass**: scan for AI tells, rewrite, preserve every fact. Do not invent claims.
4. **Voice check** (Omentir):
   - Direct, specific, honest tradeoffs. No hype.
   - Short sentences. Name who does what.
   - No em dashes (— or –). Use periods, commas, or colons.
   - Ban: delve, landscape, pivotal, robust, seamless, leverage, comprehensive, cutting-edge, game-changer, unlock, empower, streamline, "In today's...", "It's not just X, it's Y", "Let's dive in", "Here's what you need to know".
5. **Read aloud**. If it sounds like a chatbot or press release, rewrite again.
6. **Validate**: run `bun run lint:copy`. Fix every violation before marking the task done.

## Do not ship without this pass

Skipping the humanizer pass or lint is not optional for marketing content in this project.
