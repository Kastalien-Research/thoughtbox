# ADR Directory

Architectural Decision Records for the Thoughtbox project.

## Two formats, one lifecycle

### Legacy: Markdown (`.adr/staging/ADR-*.md`, `.adr/accepted/ADR-*.md`)

ADRs authored before the adversarial review system (ADR-020) are markdown files.
They follow the existing narrative format with status, context, decision, consequences,
and hypotheses sections. **These are not being migrated.**

### Current: JSON (`.adr/staging/ADR-*.json`, `.adr/accepted/ADR-*.json`)

ADRs authored after ADR-020 are JSON files conforming to `.schemas/adr-v1.json`.

The JSON format makes claims machine-readable so the adversarial reviewer can:
- Parse the claims an ADR makes
- Cross-reference them against the PR description (`prs/<branch>.json`)
- Verify that evidence for each claim actually exists in the codebase

### Which format should I use?

If you're writing a new ADR: **JSON**.
If you're amending an existing markdown ADR: **stay in markdown**.

## Lifecycle

```
.adr/staging/    — proposed, under review
.adr/accepted/   — accepted, implementation in progress or complete
.adr/rejected/   — rejected with rationale preserved
.adr/superseded/ — replaced by a later ADR
```

Moving an ADR from `staging/` to `accepted/` is a governance action that requires
explicit human review (see `.github/CODEOWNERS`).

## Schema

JSON ADR schema: `.schemas/adr-v1.json`
PR description schema: `.schemas/pr-description-v1.json`
