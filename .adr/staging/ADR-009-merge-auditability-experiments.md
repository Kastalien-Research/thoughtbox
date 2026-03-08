# ADR-009: Merge Auditability Experiments and Fix read_thoughts Filter Bug

**Status**: Proposed
**Date**: 2026-03-08
**Branch**: feat/auditability-mvp

## Context

The `feat/auditability-mvp` branch has three AUDIT specs implemented and passing (SPEC-AUDIT-001 through 003). Two experiment branches were created from the same base commit to explore extensions:

- **exp/progress-thought-type** (f7272f8): Adds `progress` as a seventh thoughtType variant with a `progressData` structured field. Motivated by the gap analysis finding that `action_report` is too heavy for casual status updates (Gap 4 in the gap analysis).

- **exp/runbook-via-thoughts** (eb85b3e): Demonstrates a full 10-thought session exercising all thoughtTypes through a realistic refactoring scenario. This integration test uncovered a bug in `read_thoughts` where the default `last: 5` slice is applied before `thoughtType` filtering, causing silent data loss.

Both branches are disjoint -- they modify different files and were created from the same base. However, the runbook test currently works around the filter bug with `last: 100`, which masks the issue.

### Relationship to existing ADRs

- **ADR-001 (System Overview)**: Unchanged. The gateway pattern remains the single entry point.
- **ADR-002 (Key Patterns)**: Unchanged. Progressive disclosure model is unaffected.
- **ADR-003 (Observability)**: STILL VALID. Observatory emits thought events but NOT notebook events. Observatory UI work is deferred to ADR-010. The `progress` thoughtType adds no observatory-specific behavior -- it uses the same `thoughtEmitter.emitThoughtAdded` path as all other types.

## Decision

Merge both experiments sequentially into `feat/auditability-mvp`, fix the filter bug, and remove the workaround. The merge order is:

1. **exp/progress-thought-type first** -- adds the `progress` variant to the discriminated union, validation logic, and audit manifest aggregation.
2. **exp/runbook-via-thoughts second** -- adds the integration test that exercises all types including `progress`.
3. **Fix read_thoughts filter precedence** -- modify the `else` (default) branch in gateway-handler.ts to check for `thoughtType`/`confidence` filter presence before slicing to last 5.
4. **Remove workaround** -- strip `last: 100` from the runbook test, proving the fix works.

This order ensures type definitions exist before the integration test that depends on them, and the bug fix is applied after the test that exposes it is in place.

## Consequences

### Positive

- The `progress` thoughtType fills Gap 4 from the gap analysis -- lightweight status tracking without the overhead of `action_report`'s reversibility/tool/target fields.
- The filter bug fix makes `read_thoughts { thoughtType: 'X' }` work correctly on sessions of any size, returning all matching thoughts instead of only those in the last 5.
- The runbook integration test provides end-to-end coverage of the full AUDIT spec suite in a realistic scenario.

### Tradeoffs

- Adding a seventh thoughtType increases the discriminated union surface. Each new type requires a validation method and audit manifest counter. This is acceptable because `progress` serves a distinct purpose (status tracking) that existing types do not cover.
- The filter fix changes default behavior: callers that previously relied on `thoughtType` filtering within a last-5 window will now get all matching thoughts. This is a bug fix, not a behavior change -- no caller intentionally wanted filtered results from a silently truncated set.

### Follow-ups

- **ADR-010**: Observatory UI rendering for the `progress` thoughtType (deferred).
- SPEC-AUD-005 (if needed): Additional thoughtType variants as usage patterns emerge. The discriminated union is designed to be extensible.

## Hypotheses

### Hypothesis 1: `progress` thoughtType integrates cleanly with discriminated union

**Prediction**: After merging exp/progress-thought-type, `pnpm build` succeeds and all 6 progress-thought-type tests pass on the staging branch.
**Validation**: `pnpm build && pnpm test -- --grep "Progress ThoughtType"`
**Outcome**: PENDING

### Hypothesis 2: `read_thoughts` filter bug is a precedence issue

**Prediction**: Calling `read_thoughts { thoughtType: 'decision_frame' }` (no `last` parameter) on a 10-thought session containing 2 decision_frame thoughts returns count=2. Before the fix, it returns count<=2 depending on whether decision_frame thoughts fall in the last 5.
**Validation**: After fixing the `else` block in gateway-handler.ts, remove `last: 100` from all three `readThoughts` calls in `demo/test-runbook-session.ts` and run `pnpm test -- --grep "Thoughts-as-Runbook"`. All tests pass.
**Outcome**: PENDING

### Hypothesis 3: Both experiments merge without conflicts

**Prediction**: Sequential merge of exp/progress-thought-type then exp/runbook-via-thoughts produces zero conflicted files. The combined test suite passes.
**Validation**: `git merge exp/progress-thought-type` exits 0, `git merge exp/runbook-via-thoughts` exits 0, `pnpm test` passes.
**Outcome**: PENDING

## Spec

[SPEC-AUD-004: Merge Auditability Experiments](../specs/SPEC-AUD-004-merge-experiments.md)

## Links

- [SPEC-AUDIT-001: Structured Fields](specs/agent-auditability/SPEC-AUDIT-001-structured-fields.md)
- [SPEC-AUDIT-002: Query Operations](specs/agent-auditability/SPEC-AUDIT-002-query-operations.md)
- [SPEC-AUDIT-003: Session Manifest](specs/agent-auditability/SPEC-AUDIT-003-session-manifest.md)
- [ADR-001: System Overview](docs/adr/001-System-Overview.md)
- [ADR-003: Observability](docs/adr/003-Observability.md) -- disposition: STILL VALID
- Experiment branch: exp/progress-thought-type (commit f7272f8)
- Experiment branch: exp/runbook-via-thoughts (commit eb85b3e)
