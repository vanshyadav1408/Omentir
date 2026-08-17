# Source and marketing content

When working under `src/`, follow repo root `AGENTS.md` plus this file.

## User-facing copy

`src/app/` holds marketing pages, blogs, guides, and SEO data. Before adding or editing any visible text:

1. Read **omentir-marketing-copy** for your agent:
   - Cursor: `.cursor/skills/omentir-marketing-copy/SKILL.md`
   - Grok Build: `.grok/skills/omentir-marketing-copy/SKILL.md`
   - Claude Code: `.claude/skills/omentir-marketing-copy/SKILL.md`
2. Read **humanizer** patterns in the matching `humanizer/SKILL.md` under the same skills directory.
3. Run `bun run lint:copy` before finishing.

Note: `src/app/agents.md/` is a public HTTP route (`/agents.md`), not agent instructions. Do not replace it.
