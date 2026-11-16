# Contributing to Omentir

Thank you for contributing. Keep changes focused, explain why they matter, and preserve the existing codebase conventions.

## Before you start

- Open an issue before substantial behavior or architecture changes.
- Never use real LinkedIn sends to test a contribution. Use dry-run behavior and inspect `automationRuns`.
- Omentir talks to LinkedIn through its own client in `src/lib/server/linkedin-own/`. Tests for it run on invented fixtures. Never commit a real session cookie (`li_at`, `JSESSIONID`), a captured LinkedIn response, or a real person's profile data as a fixture.
- Never commit credentials, provider tokens, LinkedIn session cookies, customer data, private messages, production logs, or local environment files.
- Keep hosted and self-hosted behavior in one codebase. Runtime mode flags, not missing credentials, define which integrations run.

## Development

Use Bun 1.3, then run:

```bash
bun install
bunx tsc --noEmit --pretty false
bun run lint
bun run test
bun run build
```

Run tests with `bun run test`, not a bare `bun test`: the script isolates each test file, and without that module mocks leak between files and report failures that are not real.

Report every skipped or unavailable check in the pull request.

## Marketing copy

Any change to user-facing site text must follow the humanizer workflow in `AGENTS.md` and pass `bun run lint:copy`.

## Commits and pull requests

1. Create a focused branch.
2. Make the smallest change that solves the issue.
3. Add tests that encode why the behavior matters.
4. Sign off every commit with `git commit -s` to certify the [Developer Certificate of Origin](https://developercertificate.org/).
5. Describe the evidence used, the behavior changed, and exactly what was verified.

By contributing, you agree that your contribution is licensed under the repository's MIT License.
