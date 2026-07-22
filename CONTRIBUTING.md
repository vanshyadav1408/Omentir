# Contributing to Omentir

Thank you for contributing. Keep changes focused, explain why they matter, and preserve the existing codebase conventions.

## Before you start

- Open an issue before substantial behavior or architecture changes.
- Never use real LinkedIn sends to test a contribution. Use dry-run behavior and inspect `automationRuns`.
- Never commit credentials, provider tokens, customer data, private messages, production logs, or local environment files.
- Keep hosted and self-hosted behavior in one codebase. Runtime mode flags, not missing credentials, define which integrations run.

## Development

Use Node.js 22, then run:

```bash
npm ci
npm test
npx tsc --noEmit --pretty false
npm run lint:baseline
npm run build
```

Report every skipped or unavailable check in the pull request.

## Commits and pull requests

1. Create a focused branch.
2. Make the smallest change that solves the issue.
3. Add tests that encode why the behavior matters.
4. Sign off every commit with `git commit -s` to certify the [Developer Certificate of Origin](https://developercertificate.org/).
5. Describe the evidence used, the behavior changed, and exactly what was verified.

By contributing, you agree that your contribution is licensed under the repository's MIT License.
