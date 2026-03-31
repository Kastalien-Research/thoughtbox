# Agent Auditability Backend Specifications

> **Status**: Draft
> **Created**: 2026-03-01
> **Branch**: feat/auditability-mvp
> **Source**: [pain/3am-auditability.md](../../pain/3am-auditability.md)

## Problem

A 3-person team debugging an agent failure at 3 AM needs to answer "What did the agent do, and why did it go wrong?" in under 60 seconds. Thoughtbox tracks reasoning (thoughts) but the auditability data is either missing or embedded in free-text prose rather than machine-readable fields.

The existing `.specs/auditability/` directory contains five **Observatory UI specs** (SPEC-AUD-001 through 005) that define how to *render* audit data in a frontend. Those specs assume structured backend data exists — but the backend data layer has never been specified. This directory fills that gap.

## Design Rationale

### `thoughtType` is required (breaking change)

Every thought must declare what kind of reasoning step it represents. A `reasoning` catch-all type exists for backward compatibility — it requires no extra fields beyond `thought` and `nextThoughtNeeded`. This means existing callers just need to add `thoughtType: "reasoning"` to continue working.

Why required? Optional fields get omitted. When `thoughtType` is optional, most thoughts arrive without it, and the audit trail degrades to the same untyped blob we have today. Making it required ensures every thought is queryable by type from day one.

### Discriminated union on `thoughtType`

The `thoughtType` field determines which structured fields are required on a thought. This is the TypeScript discriminated union pattern applied to MCP tool input:

- `reasoning` — no extra fields (general-purpose thinking)
- `decision_frame` — confidence level, options considered, selection rationale
- `action_report` — success/failure, reversibility, tool used, side effects
- `belief_snapshot` — entity states, constraints, risks
- `assumption_update` — what changed, old/new status, downstream impact

Each type adds **structured metadata** alongside the existing `thought` prose field. The prose remains the human-readable narrative; the structured fields are the machine-readable index into it.

### Prose + structured (not either/or)

The `thought` field is not replaced or deprecated. It remains the primary content for general reasoning. Structured fields annotate the thought for programmatic filtering and rendering — they don't duplicate the prose.

### No agent-side code

The server's MCP input schema *is* the contract. Agents interact via standard MCP `thoughtbox_gateway` tool calls. This spec defines what the server accepts and stores, not how agents should reason.

### Replace, don't deprecate

No backward-compatibility shim for the old optional `thoughtType`. Callers that omit it get a validation error. Tests that don't include it fail until updated. This is an intentional ratchet to ensure audit coverage.

## Dependency Graph

```
SPEC-AUDIT-001 (Structured Fields)
        │
        ▼
SPEC-AUDIT-002 (Query Operations)
        │
        ▼
SPEC-AUDIT-003 (Session Manifest)
```

Each spec is independently shippable. AUDIT-002 depends on the data model from AUDIT-001. AUDIT-003 aggregates data using patterns from both.

## Relationship to `.specs/auditability/`

| This directory (`specs/agent-auditability/`) | `.specs/auditability/` |
|----------------------------------------------|------------------------|
| **Backend data model** — what fields exist on ThoughtData | **Frontend rendering** — how Observatory displays those fields |
| **Query operations** — how to filter and aggregate audit data | **UI cards** — visual treatment per thoughtType |
| **Session manifest** — machine-readable session summary | **Fault attribution** — UI for classifying failure modes |

After all three AUDIT specs are implemented, the SPEC-AUD-001 through 005 Observatory specs have the backend data contract they depend on.

## Implementation Order

1. **SPEC-AUDIT-001** — Data model changes (discriminated union on ThoughtData)
2. **SPEC-AUDIT-002** — Query operations (thoughtType filter, audit_summary analysis)
3. **SPEC-AUDIT-003** — Session manifest (auto-generated summary at session close)

## Specs

| ID | Title | File |
|----|-------|------|
| SPEC-AUDIT-001 | Structured Audit Fields on ThoughtData | [SPEC-AUDIT-001-structured-fields.md](./SPEC-AUDIT-001-structured-fields.md) |
| SPEC-AUDIT-002 | Audit Query Operations | [SPEC-AUDIT-002-query-operations.md](./SPEC-AUDIT-002-query-operations.md) |
| SPEC-AUDIT-003 | Session Audit Manifest | [SPEC-AUDIT-003-session-manifest.md](./SPEC-AUDIT-003-session-manifest.md) |
