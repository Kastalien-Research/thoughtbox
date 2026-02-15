# SPEC-SUM-001: Subagent Summarize Modes

> **Status**: Draft
> **Priority**: Medium
> **Phase**: Enhancement
> **Estimated Effort**: 4-6 hours
> **Source**: Thoughtbox session 8909365f-e2a3-474c-9224-9e68cae91541 (meta-evaluation)

## Summary

Add mode parameter to subagent-summarize workflow enabling different extraction templates optimized for specific use cases. Current implementation returns single format regardless of downstream need, losing valuable information types (rejected alternatives, open questions, assumptions, reasoning trajectory).

## Problem Statement

Current subagent-summarize returns ~400 words from a 95-thought session. While sufficient for basic overview, it loses:

1. **Rejected alternatives (X-types)**: Paths explored and dismissed with rationale
2. **Open questions (Q-types)**: Unresolved threads that may need continuation
3. **Assumptions (A-types)**: Unstated premises that underpin conclusions
4. **Branch synthesis**: How alternative paths compared
5. **Reasoning trajectory**: The shape of how thought evolved

Different downstream use cases need different information:

| Use Case | Primary Need | Currently Missing |
|----------|--------------|-------------------|
| Continuation | Open threads + assumptions | Q, A types |
| Cross-reference | Conclusions + evidence | Already present |
| Validation | Evidence + assumptions | A types |
| Learning | Rejected paths + trajectory | X types + evolution |
| Debugging | Everything | Full structure |

## Scope

### In Scope
1. Mode parameter for subagent-summarize prompt
2. Six extraction templates (one per mode)
3. Server-side cipher type parsing (Phase 2)
4. Type-based filter API for export

### Out of Scope
- UI for mode selection
- Automatic mode inference
- Changes to cipher vocabulary

## Requirements

### R1: Mode Parameter

Add `mode` argument to subagent-summarize:

```typescript
type SummaryMode =
  | 'overview'      // Default - what we have now
  | 'continuation'  // Open threads + assumptions
  | 'validation'    // Evidence + assumptions
  | 'learning'      // Rejected paths + trajectory
  | 'debug'         // Full structure + branching
  | 'comprehensive' // Everything

interface SubagentSummarizeArgs {
  sessionId: string;
  mode?: SummaryMode;  // Default: 'overview'
}
```

### R2: Mode Templates

Each mode has extraction template specifying:

```typescript
interface ModeTemplate {
  mode: SummaryMode;
  extractTypes: CipherType[];     // Which types to include
  includeBranches: boolean;       // Include branch analysis
  includeTrajectory: boolean;     // Include reasoning evolution
  maxLength: number;              // Target output length
  promptTemplate: string;         // Sub-agent instructions
}
```

#### Mode Definitions

**overview** (default):
- Types: C (conclusions), H (key hypotheses)
- Branches: No
- Trajectory: No
- Length: ~400 words
- Purpose: Quick understanding of outcomes

**continuation**:
- Types: Q (questions), A (assumptions), C (conclusions), P (plans)
- Branches: Yes (open threads)
- Trajectory: No
- Length: ~600 words
- Purpose: Resume work on session

**validation**:
- Types: E (evidence), A (assumptions), C (conclusions)
- Branches: No
- Trajectory: No
- Length: ~500 words
- Purpose: Check conclusions against evidence

**learning**:
- Types: X (rejected), H (hypotheses), C (conclusions)
- Branches: Yes (comparison)
- Trajectory: Yes
- Length: ~800 words
- Purpose: Understand what was learned and why

**debug**:
- Types: All
- Branches: Yes (full structure)
- Trajectory: Yes
- Length: ~1200 words
- Purpose: Diagnose session issues

**comprehensive**:
- Types: All
- Branches: Yes
- Trajectory: Yes
- Length: No limit
- Purpose: Full reconstruction

### R3: Server-Side Type Parsing (Phase 2)

Add `cipherType` field to ThoughtNode schema:

```typescript
type CipherType = 'H' | 'E' | 'C' | 'Q' | 'A' | 'X' | 'P' | 'R';

interface ThoughtNode {
  // Existing fields...
  thought: string;
  thoughtNumber: number;
  // ...

  // NEW: Parsed cipher type (null if no cipher prefix detected)
  cipherType: CipherType | null;
}
```

Parse cipher prefix on storage:

```typescript
function parseCipherType(thought: string): CipherType | null {
  // Match patterns like "S1|H|..." or "1|E|..." or just "H|..."
  const match = thought.match(/^S?\d*\|?([HECQAXPR])\|/);
  return match ? match[1] as CipherType : null;
}
```

**Untyped Thought Handling**:
- Thoughts without cipher prefix get `cipherType: null`
- Summary modes should include untyped thoughts by default (they may contain important content)
- Filter API accepts `null` as valid filter value: `types: ['C', null]` includes conclusions AND untyped
- Backfill strategy: Parse on-demand when loading existing sessions (no migration needed)

### R4: Filter API

Add type filter to export/retrieval:

```typescript
interface ExportOptions {
  sessionId: string;
  types?: (CipherType | null)[];  // Filter by type (null = untyped thoughts)
  includeUntyped?: boolean;       // Default: true - include thoughts without cipher prefix
}
```

**Filter Behavior**:
- `types: undefined` → all thoughts (default)
- `types: ['C', 'H']` → only conclusions and hypotheses
- `types: ['C', null]` → conclusions AND untyped thoughts
- `includeUntyped: false` → exclude thoughts without cipher prefix

## Implementation

### Phase 1: Prompt-Only (Quick Win)

1. Add mode parameter to subagent-summarize resource
2. Create prompt template per mode with explicit regex instructions
3. Sub-agent parses cipher from raw text using provided regex

**Files to modify:**
- `src/resources/subagent-summarize-content.ts` - Add mode handling and templates
- `src/resources/summary-mode-templates.ts` - New file for mode-specific prompts

### Phase 2: Server-Side Parsing

1. Add `cipherType` field to ThoughtNode
2. Parse on storage in `thought-handler.ts`
3. Update export to include type field
4. Add filter parameter to session tool

**Files to modify:**
- `src/persistence/types.ts` - Add cipherType field
- `src/thought-handler.ts` - Parse on storage
- `src/sessions/index.ts` - Filter API

## Migration Path

- Phase 1 is backward compatible (mode defaults to 'overview')
- Phase 2 adds optional field (existing sessions work without type)
- No breaking changes to existing exports

## Acceptance Criteria

1. [ ] Mode parameter accepted by subagent-summarize
2. [ ] Each mode produces meaningfully different output
3. [ ] 'continuation' mode surfaces Q and A types
4. [ ] 'learning' mode surfaces X types with rejection rationale
5. [ ] 'debug' mode includes branch structure
6. [ ] (Phase 2) cipherType parsed and stored
7. [ ] (Phase 2) Export supports type filtering

## Connection to Knowledge Zone

Server-side type parsing (R3) also enables Knowledge Zone's auto-extraction of conclusions. If implemented, the same infrastructure serves both:

- Summary modes: Filter by type for extraction templates
- Knowledge Zone: Auto-surface C-type thoughts at init

This creates shared value from one implementation.

## Test Cases

### T1: Mode Differentiation
Given a session with types [H, E, X, C, Q, A]:
- 'overview' should return C, key H
- 'continuation' should return Q, A, C
- 'learning' should return X with rationale

### T2: Branch Handling
Given a session with 2 branches:
- 'overview' should ignore branches
- 'debug' should show branch comparison

### T3: Backward Compatibility
Calling subagent-summarize without mode should behave identically to current implementation.

---

**Derived from**: Thoughtbox session 8909365f-e2a3-474c-9224-9e68cae91541
**Created**: 2026-01-20
