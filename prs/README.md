# PR Descriptions

Machine-readable PR descriptions used by the adversarial reviewer in CI.

## Format

One JSON file per PR, named after the branch with `/` replaced by `-`:

```
prs/feat-my-feature.json
prs/fix-auth-bug.json
```

The file must conform to `.schemas/pr-description-v1.json`.

## When to create it

Every PR targeting `main` must include a `prs/<branch>.json` file.
CI will fail at the validation step if this file is missing or malformed.

## What goes in it

- `branch` — the exact branch name
- `adrs` — list of ADR IDs this PR implements (e.g. `["ADR-020"]`). May be empty for non-architectural work.
- `summary` — one paragraph: what changed and why
- `claims` — one entry per claim being made about this PR's correctness. Each claim references an ADR claim by `adr_claim_id` and provides the evidence type and path.
- `attestation` — required if any claim uses `evidence_type: "human_attestation"`

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

See `.schemas/pr-description-v1.json` for the full JSON Schema.
See `.schemas/adr-v1.json` for the ADR JSON format that claims reference.
