# SPEC-AUD-004: Merge Auditability Experiments

> **Status**: Draft
> **Created**: 2026-03-08
> **Branch**: feat/auditability-mvp
> **Depends on**: SPEC-AUDIT-001, SPEC-AUDIT-002, SPEC-AUDIT-003

## Scope

Merge two experiment branches into `feat/auditability-mvp` and fix the `read_thoughts` filter precedence bug. This spec defines the data structures being added, the bug fix contract, and the merge plan.

## 1. Data Structures: `progress` thoughtType

### 1.1 ThoughtData union extension

The `thoughtType` discriminated union on `ThoughtData` gains a new variant:

```typescript
// src/persistence/types.ts -- ThoughtData.thoughtType
thoughtType: 'reasoning' | 'decision_frame' | 'action_report'
           | 'belief_snapshot' | 'assumption_update' | 'context_snapshot'
           | 'progress';
```

When `thoughtType === 'progress'`, the following field is required:

```typescript
// src/persistence/types.ts -- ThoughtData
progressData?: {
  task: string;
  status: 'pending' | 'in_progress' | 'done' | 'blocked';
  note?: string;
};
```

### 1.2 ThoughtHandler validation

`src/thought-handler.ts` adds a `validateProgress` method that enforces:
- `progressData` is a non-null object
- `progressData.task` is a non-empty string
- `progressData.status` is one of `'pending' | 'in_progress' | 'done' | 'blocked'`

The `validateStructuredFields` switch statement gains a `case 'progress'` arm dispatching to `validateProgress`.

### 1.3 AuditManifest extension

`AuditManifest.thoughtCounts` gains a `progress: number` field. The `manifest-generator.ts` `THOUGHT_TYPES` array includes `'progress'`, and `countByType` returns it.

### 1.4 ThoughtHandler field mapping

Both `loadSession` and `restoreFromSession` map `progressData` from storage into the in-memory `ThoughtData` interface. The `ThoughtData` interface in `thought-handler.ts` includes `progressData` as an optional field.

### 1.5 Gateway passthrough

`src/gateway/gateway-handler.ts` must forward `progressData` from MCP args to `ThoughtHandler.processThought()`. The `thoughtType` union cast must include `'progress'`. Without this, the handler-level integration works but the MCP API silently drops `progressData`.

### 1.6 MCP tool schema

`src/gateway/operations.ts` declares the `thoughtType` enum in two tool schemas (`thought` at line 78, `read_thoughts` at line 198). Both must include `'progress'`. Without this, strict MCP clients may reject `thoughtType: 'progress'` at the schema validation layer before the call reaches the handler.

## 2. Bug Fix: `read_thoughts` filter precedence

### 2.1 Current behavior (buggy)

In `src/gateway/gateway-handler.ts` (lines 694-712), the `read_thoughts` handler resolves the thought set in this order:

1. If `thoughtNumber` provided: fetch single thought
2. If `branchId` provided: fetch branch
3. If `last` provided: fetch last N
4. If `range` provided: fetch range
5. **Else (no query params): fetch all thoughts, slice to last 5**

The `thoughtType` filter (lines 714-735) is applied **after** the thought set is resolved. When a caller provides `thoughtType` but no `last`/`range`/`branchId`, the handler falls through to case 5, slices to last 5 thoughts, then filters within that window. This silently drops matching thoughts outside the last 5.

### 2.2 Required behavior (fixed)

When any filter parameter (`thoughtType` or `confidence`) is provided **without** an explicit query parameter (`last`, `range`, `branchId`, `thoughtNumber`), the handler fetches **all** thoughts from the session, then applies the filter.

The default `last: 5` slice applies only when **no** query parameters **and no** filter parameters are provided.

### 2.3 Implementation contract

In the `else` block (line 708), check whether `thoughtType` or `confidence` filters are present in `args`. If either is present, skip the `.slice(-5)` and use all thoughts:

```
// No query parameters
else {
  const allThoughts = await this.storage.getThoughts(sessionId);
  const hasFilters = args?.thoughtType || args?.confidence;
  if (hasFilters) {
    thoughts = allThoughts;
    queryDescription = 'all thoughts (filter-driven)';
  } else {
    thoughts = allThoughts.slice(-5);
    queryDescription = 'last 5 thoughts (default)';
  }
}
```

### 2.4 Workaround removal

After the fix, remove the `last: 100` workaround from `demo/test-runbook-session.ts` in all three `readThoughts` calls (lines 239-243, 254-258, 269-273). Each call should omit the `last` parameter entirely.

## 3. Merge Plan

### 3.1 Files from exp/progress-thought-type (commit f7272f8)

| File | Change |
|------|--------|
| `src/persistence/types.ts` | Add `'progress'` to thoughtType union, add `progressData` field, add `progress` to AuditManifest.thoughtCounts |
| `src/thought-handler.ts` | Add `'progress'` to ThoughtData.thoughtType, add `progressData` field, add `validateProgress` method, add `case 'progress'` to switch |
| `src/audit/manifest-generator.ts` | Add `'progress'` to THOUGHT_TYPES array, add `progress` to countByType return, add `progress` to AuditData.thoughtCounts |
| `src/gateway/__tests__/progress-thought-type.test.ts` | New test file (6 test cases) |

### 3.2 Files from exp/runbook-via-thoughts (commit eb85b3e)

| File | Change |
|------|--------|
| `demo/test-runbook-session.ts` | New integration test (6 test cases, 10-thought session) |
| `demo/runbook-via-thoughts.md` | Design document for thoughts-as-runbook pattern |
| `vitest.config.ts` | Updated include patterns to cover `demo/**/*.ts` |

### 3.3 Merge sequence

The two experiment branches are disjoint (no shared files). Merge order does not affect correctness. Convention: type/validation changes before test additions.

1. Merge `exp/progress-thought-type` first (type definitions and validation logic)
2. Merge `exp/runbook-via-thoughts` second (integration test and demo docs)
3. Apply `read_thoughts` filter fix (modifies gateway-handler.ts)
4. Remove `last: 100` workaround from `demo/test-runbook-session.ts`

## 4. Acceptance Criteria

| ID | Criterion | Validation |
|----|-----------|------------|
| AC-1 | `pnpm build` succeeds with no type errors | `pnpm build && echo PASS` |
| AC-2 | `pnpm test` passes all existing tests | `pnpm test` |
| AC-3 | Progress thought type tests pass | `pnpm test -- --grep "Progress ThoughtType"` |
| AC-4 | Runbook integration tests pass | `pnpm test -- --grep "Thoughts-as-Runbook"` |
| AC-5 | `read_thoughts { thoughtType: 'decision_frame' }` (no `last`) returns all matching thoughts from a 10-thought session | Verified by runbook test after workaround removal |
| AC-6 | No `last: 100` workaround remains in `demo/test-runbook-session.ts` | `grep -c 'last: 100' demo/test-runbook-session.ts` returns 0 |
| AC-7 | `read_thoughts` with no params and no filters still returns last 5 (default behavior preserved) | Existing read_thoughts tests pass |
| AC-8 | Zero merge conflicts from sequential merge of both experiments | `git merge` exits 0 for both branches |
| AC-9 | `progress` thought accepted via live MCP gateway (not just handler) | `thoughtbox_gateway { operation: "thought", args: { thoughtType: "progress", progressData: {...} } }` succeeds |
| AC-10 | Gateway `thoughtType` union includes `'progress'` | Grep `gateway-handler.ts` for `'progress'` in type cast |

## 5. Testing Rule

**Gateway boundary test requirement**: Any new field that flows through `gateway-handler.ts` to `ThoughtHandler.processThought()` must have at least one test that exercises the full gateway path — not just the handler directly. The gateway does explicit arg destructuring; new fields are silently dropped unless forwarded. Handler-level tests alone create false coverage.
