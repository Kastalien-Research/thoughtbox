# Governance

This file documents the guardrails that protect project integrity. Changes to
this file are protected by CODEOWNERS and CI checks.

## Protected Areas

- `.github/**` (workflows, CODEOWNERS)
- `CLAUDE.md`
- `AGENTS.md`
- `GOVERNANCE.md`

## Enforcement

- Branch protection requires code owner review.
- Required status checks must pass before merge.
- Governance deletions are blocked by CI.

## Change Policy

Changes to governance require explicit approval and should include a short
reason in the PR description.

## Governance Checklist

- Branch protection on `main` (no force pushes, linear history).
- Required status checks include build and tests.
- Code owner review required for governance paths.
- Workflow guard blocks governance changes without approval label.
- CI runs on every PR and push.
- Dependabot configured for npm dependencies.
- SECURITY policy present and up to date.
