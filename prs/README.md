# PR Descriptions

Machine-readable PR descriptions used by CI validation and PR body sync.

## Format

One JSON file per PR, named after the branch with `/` replaced by `-`:

```text
prs/feat-my-feature.json
prs/fix-auth-bug.json
```

The file must conform to `.schemas/pr-description-v1.json`.

## When to create it

Every PR targeting `main` must include a `prs/<branch>.json` file.
CI will fail at the validation step if this file is missing or malformed.

## What goes in it

- `branch` — the exact branch name
- `specs` — list of spec IDs from spec frontmatter `spec_id` (e.g. `["SPEC-CONTROL-PLANE"]`). May be empty for non-spec work.
- `summary` — one paragraph: what changed and why
- `claims` — one entry per claim about this PR's correctness. Each claim references a spec claim as `spec_claim_id: "<spec_id>:<claim_id>"` (e.g. `SPEC-CONTROL-PLANE:c1`) and provides evidence type and path. Use `"__none__"` when no spec claim applies.
- `attestation` — required if any claim uses `evidence_type: "human_attestation"`

### Legacy ADR fields (migration only)

During migration, `adrs` and `adr_claim_id` remain accepted with warnings. Prefer `specs` and `spec_claim_id`. Archived ADR JSON lives under `docs/decisions/archive/`.

## Attestation

If you ran an agentic test manually or verified behavior in a terminal session, use:

```json
"attestation": {
  "attested_by": "human",
  "timestamp": "2026-04-02T12:00:00Z",
  "note": "Ran scripts/agentic/work-session.ts end-to-end, verified work item gating works"
}
```

## Schema reference

See `.schemas/pr-description-v1.json` for the PR description schema.
See `.schemas/spec-v1.json` for spec frontmatter claims that PRs reference.

## Validator fixtures

Branches used only by tests (not real PRs):

- `test/spec-fixture-valid` → `prs/test-spec-fixture-valid.json`
- `test/spec-fixture-missing-claim` → `prs/test-spec-fixture-missing-claim.json`
- `test/spec-fixture-behavioral-evidence` → `prs/test-spec-fixture-behavioral-evidence.json`
- `test/spec-fixture-dual-claim-ref` → `prs/test-spec-fixture-dual-claim-ref.json`
- `test/spec-fixture-missing-spec-list` → `prs/test-spec-fixture-missing-spec-list.json`
- `test/spec-fixture-unknown-spec` → `prs/test-spec-fixture-unknown-spec.json`

Run: `pnpm validate:pr --branch test/spec-fixture-valid`
