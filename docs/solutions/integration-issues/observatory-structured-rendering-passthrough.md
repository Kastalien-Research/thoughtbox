---
title: "Observatory Structured Rendering — Data Passthrough Gap"
date: "2026-03-08"
category: "integration-issues"
severity: "medium"
component: "observatory"
tags:
  - observatory
  - structured-rendering
  - thought-types
  - passthrough
  - data-mapping
related_adrs:
  - ADR-009
  - ADR-010
related_specs:
  - SPEC-AUD-010-observatory-structured-rendering
---

# Observatory Structured Rendering — Data Passthrough Gap

## Problem

The Observatory UI rendered all thoughts as identical plain text blocks, ignoring structured thoughtType data (decision_frame, action_report, belief_snapshot, assumption_update, context_snapshot, progress). Structured fields like confidence, options, actionResult, beliefs were present in the persistence layer but silently dropped at three intermediate layers before reaching the browser.

**Symptom**: Every thought in the Observatory looked the same — no confidence badges, no options lists, no action success/failure indicators. thoughtType showed as null in the UI.

## Root Cause

Three layers independently dropped structured fields:

1. **thought-handler.ts:788** — The observatoryThought object was manually constructed with only base fields. Structured fields (thoughtType, confidence, options, actionResult, beliefs, assumptionChange, contextData) were never copied from validatedInput.

2. **storage-adapter.ts:35** — toObservatoryThought() mapped only 10 base fields from ThoughtData to Thought, dropping all structured audit fields. Historical sessions arrived without any type information.

3. **observatory.html** — No rendering logic existed for different thought types. renderCommitDetail() constructed mcpData with only 5 fields.

4. **schemas/thought.ts** — ThoughtSchema was missing the 'progress' enum value and progressData field that existed in the persistence layer.

This is the same "data passthrough gap" pattern documented in ADR-009: each layer that constructs an object by cherry-picking fields is a drift risk when new fields are added upstream.

## Solution

### thought-handler.ts (~line 788)

Added structured fields to the observatoryThought construction:

```typescript
const observatoryThought: ObservatoryThought = {
  // ...base fields...
  thoughtType: validatedInput.thoughtType,
  confidence: validatedInput.confidence,
  options: validatedInput.options,
  actionResult: validatedInput.actionResult,
  beliefs: validatedInput.beliefs,
  assumptionChange: validatedInput.assumptionChange,
  contextData: validatedInput.contextData,
};
```

### storage-adapter.ts (~line 35)

Extended toObservatoryThought() to pass through all structured fields:

```typescript
return {
  // ...base fields...
  thoughtType: td.thoughtType,
  confidence: td.confidence,
  options: td.options,
  actionResult: td.actionResult,
  beliefs: td.beliefs,
  assumptionChange: td.assumptionChange,
  contextData: td.contextData,
  progressData: td.progressData,
};
```

### observatory.html (~line 1873)

Added renderStructuredCard dispatcher routing to 6 type-specific renderers:

| Function | Line | Renders |
|----------|------|---------|
| renderStructuredCard | 1873 | Dispatcher — switches on thoughtType |
| renderDecisionCard | 1895 | Confidence badge + options list |
| renderActionCard | 1920 | Success/fail badge, reversibility, tool/target |
| renderProgressCard | 1947 | Task name, status badge, optional note |
| renderBeliefCard | 1964 | Entity list with name/state, constraints, risks |
| renderAssumptionCard | 1988 | Status change with old/new status and trigger |
| renderContextCard | 2017 | Tools available, model ID, constraints |

Called from main render path at line 2058. Untyped thoughts fall through to plain text display.

### schemas/thought.ts

Added 'progress' to the thoughtType enum and full Zod schemas for all structured sub-fields.

## Prevention

### Pattern: Data Passthrough Gap

A field is added at the source layer but intermediate layers construct objects by cherry-picking fields rather than forwarding the full type. New fields silently disappear at each manual mapping boundary.

### Prevention Strategies

- **Derive, don't duplicate.** Mapper functions should spread the source and override only what differs rather than constructing field-by-field.
- **Single canonical type.** ThoughtData should be defined once and imported by handler, adapter, schema, and UI contract.
- **Make the compiler enforce completeness.** Use `satisfies Record<keyof ThoughtData, unknown>` at each boundary so adding a field produces a compile error in every mapper.
- **Ban manual object construction in mappers.** Any toX() function that constructs an object literal from a typed input is a drift risk.

### Detection Strategies

- **Structural diff test.** Compare Object.keys() of the source type's fixture against mapper output. Missing keys fail the test.
- **End-to-end field roundtrip test.** Send a thought with all optional fields through the gateway and assert the WebSocket message contains every field.
- **Schema-level regression guard.** Validate the Observatory Zod schema against the persistence schema in CI.

## Related Documentation

- [ADR-009: Merge Auditability Experiments](../../../.adr/accepted/ADR-009-merge-auditability-experiments.md) — Predecessor; established the gateway passthrough pattern
- [ADR-010: Observatory Structured Rendering](../../../.adr/accepted/ADR-010-observatory-structured-rendering.md) — This work's decision record
- [SPEC-AUD-010](../../../.specs/auditability/SPEC-AUD-010-observatory-structured-rendering.md) — Detailed specification
- [SPEC-AUD-001: Timeline Structured Decisions](../../../.specs/auditability/SPEC-AUD-001-timeline-structured-decisions.md) — Card-based UI design
- [SPEC-AUD-002: Branch Point Visualization](../../../.specs/auditability/SPEC-AUD-002-branch-point-visualization.md) — Follow-up building on card rendering
- [TypeScript Strict Mode & SDK Union Type](../build-errors/typescript-strict-mode-sdk-union-type.md) — Related type narrowing solution
