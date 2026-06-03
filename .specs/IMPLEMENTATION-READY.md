# Implementation-Ready Spec Checklist

This file defines what "implementation-ready" means for the current repo
workflow.

## A spec is implementation-ready when

1. It lives under `.specs/` and, if it governs implementation, uses YAML
   frontmatter matching `.schemas/spec-v1.json`.
2. It has a stable `spec_id` and falsifiable `claims` that a PR can reference as
   `SPEC-ID:cN`.
3. Its scope is explicit enough to turn into a branch plan without inventing new
   requirements during implementation.
4. It defines the evidence needed to verify each claim.
5. Any supporting notes, diagrams, or prompts are linked from the spec rather
   than acting as hidden authority.

## Minimum checklist

- [ ] `spec_id`, `title`, `status`, and `claims` are present in frontmatter
- [ ] Every claim has an `id`, `statement`, `type`, and `behavioral` flag
- [ ] Required evidence is described in plain language
- [ ] The intended branch or implementation unit is named or inferable
- [ ] Acceptance/validation commands are known or can be derived from current
      repo tooling
- [ ] Related docs or archived ADRs are linked when they matter

## Before implementation starts

Create or update:

- the governing spec under `.specs/`
- the PR description file under `prs/`
- any tracker or handoff artifact needed for multi-branch work

Implementation work should not rely on archived ADR text, brainstorm docs, or
scratch notes as the only authority when current source or current specs disagree.

## During implementation

- Update the spec in the same commit when behavior or scope changes.
- Keep claims narrow enough that review can verify them.
- Prefer deterministic checks and targeted tests as evidence.
- Use human attestation only when a behavioral claim genuinely requires it.

## PR claim mapping

Each PR should map its claims to spec claims in `prs/<branch>.json`.

Example references:

- `SPEC-CONTROL-PLANE:c1`
- `SPEC-REPO-CLEANUP:c5`

Use `__none__` only when a change truly has no governing spec claim.

## Related references

- `.schemas/spec-v1.json`
- `.schemas/pr-description-v1.json`
- `prs/README.md`
- `AGENTS.md`
