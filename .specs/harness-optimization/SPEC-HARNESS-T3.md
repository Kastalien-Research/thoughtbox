# SPEC-HARNESS-T3: New Modules and Fixes — Tier 3

## Summary

Tier 3 adds the `tb.analyze.*` namespace for deterministic session analysis, fixes notebook SDK calling convention inconsistencies, standardizes knowledge module parameter naming to camelCase, and adds auto-extraction of learnings on session close. These changes complete the harness optimization initiative identified in the 46-thought capability audit (session 184c3381).

Tier 3 is the largest-scope tier. All four changes are independent of each other and can be implemented in parallel, though they share touchpoints in `execute-tool.ts` and `sdk-types.ts`.

---

## Changes

### 1. tb.analyze.* Namespace

**Problem:** Session analysis currently requires multiple round-trips — get session, filter thoughts by type, manually compute statistics. The audit showed agents spending 4-8 tool calls on analysis that could be a single deterministic function.

**Solution:** Create a new `src/analyze/` module exposing pure functions via the `tb.analyze` namespace in Code Mode.

#### New Files

| File | Purpose |
|------|---------|
| `src/analyze/types.ts` | Result types for all analysis operations |
| `src/analyze/extractors.ts` | `recommendations`, `decisions`, `pivots`, `beliefs` — extract structured data from typed thoughts |
| `src/analyze/structure.ts` | `topicShifts`, `velocity`, `lengthProfile`, `typeProgression` — session structure metrics |
| `src/analyze/relationships.ts` | `evolutionCandidates`, `clusters` — inter-thought relationship analysis |
| `src/analyze/summaries.ts` | `digest`, `diff` — compressed session summaries |
| `src/analyze/handler.ts` | Wires extractors/structure/relationships/summaries to `tb.analyze` namespace |
| `src/analyze/operations.ts` | Catalog entries for `thoughtbox_search` discovery |
| `src/analyze/index.ts` | Barrel export |

#### Operations

```typescript
tb.analyze.recommendations(sessionId: string): Promise<Recommendation[]>
// Extract numbered recommendations from reasoning thoughts.
// Scans thought text for numbered lists, "recommend", "suggest" patterns.

tb.analyze.decisions(sessionId: string): Promise<Decision[]>
// Extract decision_frame thoughts with options array and confidence.
// Returns: { thoughtNumber, thought, options, confidence, selected }

tb.analyze.pivots(sessionId: string): Promise<Pivot[]>
// Extract assumption_update thoughts where status flipped.
// Returns: { thoughtNumber, text, oldStatus, newStatus, trigger }

tb.analyze.beliefs(sessionId: string): Promise<BeliefProgression[]>
// Extract belief_snapshot progression over the session.
// Returns ordered list of belief states with entities, constraints, risks.

tb.analyze.topicShifts(sessionId: string, threshold?: number): Promise<TopicShift[]>
// Detect low-overlap transitions between consecutive thoughts.
// Default threshold: 0.3 (token overlap ratio). Pure lexical, no LLM.

tb.analyze.velocity(sessionId: string): Promise<VelocityPoint[]>
// Compute thoughts/minute over time using thought timestamps.
// Returns time-series points: { timestamp, thoughtsPerMinute, windowSize }

tb.analyze.evolutionCandidates(sessionId: string, thoughtNumber: number): Promise<EvolutionCandidate[]>
// Given a thought, find prior thoughts it should revise (A-Mem pattern).
// Uses: shared entity references, type compatibility, recency weighting.

tb.analyze.digest(sessionId: string): Promise<SessionDigest>
// Compressed summary targeting ~500 tokens.
// Returns: { title, thoughtCount, duration, keyDecisions, keyPivots, outcome }
```

All functions are **pure** — no LLM calls, no side effects. They retrieve session data via the storage layer and return structured results. The handler receives `ThoughtboxStorage` as a dependency, same as `SessionHandlers`.

#### Wiring

In `src/code-mode/execute-tool.ts`, add to `buildTbObject()`:

```typescript
analyze: {
  recommendations: async (sessionId: string) =>
    unwrapToolResult(await analyzeHandler.handle({ operation: "analyze_recommendations", sessionId })),
  decisions: async (sessionId: string) =>
    unwrapToolResult(await analyzeHandler.handle({ operation: "analyze_decisions", sessionId })),
  // ... etc
}
```

In `src/code-mode/sdk-types.ts`, add the `analyze` namespace to the `TB` interface.

In `src/code-mode/search-index.ts`, add `analyze: indexOperations(ANALYZE_OPERATIONS)` to the catalog.

`ExecuteToolDeps` gains an `analyzeHandler` field. The handler is constructed during server bootstrap with the same `ThoughtboxStorage` instance used by sessions.

---

### 2. Notebook SDK Calling Convention Fix

**Problem:** The notebook SDK wrapper in `execute-tool.ts` has inconsistent calling conventions:

| Method | Current Signature | Issue |
|--------|-------------------|-------|
| `listCells` | `(notebookId: string)` | Bare positional arg |
| `getCell` | `(notebookId: string, cellId: string)` | Two positional args |
| `installDeps` | `(notebookId: string)` | Bare positional arg |
| `addCell` | `(args: Record<string, unknown>)` | Named object |
| `runCell` | `(args: Record<string, unknown>)` | Named object |
| `create` | `(args: Record<string, unknown>)` | Named object |

This mixed convention forces agents to remember which methods take positional args vs. objects.

**Solution:** Standardize ALL notebook SDK methods to accept a single args object. This matches the pattern used by `addCell`, `runCell`, `create`, `updateCell`, `load`, and `export`.

#### Changes to `execute-tool.ts`

```typescript
// BEFORE
listCells: async (notebookId: string) => ...
getCell: async (notebookId: string, cellId: string) => ...
installDeps: async (notebookId: string) => ...

// AFTER
listCells: async (args: { notebookId: string }) => ...
getCell: async (args: { notebookId: string; cellId: string }) => ...
installDeps: async (args: { notebookId: string }) => ...
```

#### Changes to `sdk-types.ts`

Update the `notebook` interface block:

```typescript
notebook: {
  create(args: { title: string; language: "javascript" | "typescript"; template?: "sequential-feynman" }): Promise<unknown>;
  list(): Promise<unknown>;
  load(args: { path?: string; content?: string }): Promise<unknown>;
  addCell(args: { notebookId: string; cellType: "title" | "markdown" | "code"; content: string; filename?: string; position?: number }): Promise<unknown>;
  updateCell(args: { notebookId: string; cellId: string; content: string }): Promise<unknown>;
  runCell(args: { notebookId: string; cellId: string }): Promise<unknown>;
  listCells(args: { notebookId: string }): Promise<unknown>;          // CHANGED
  getCell(args: { notebookId: string; cellId: string }): Promise<unknown>;  // CHANGED
  installDeps(args: { notebookId: string }): Promise<unknown>;        // CHANGED
  export(args: { notebookId: string; path?: string }): Promise<unknown>;
};
```

No changes to the underlying notebook engine (`src/notebook/`). The fix is purely at the SDK wrapper layer.

---

### 3. Parameter Naming Standardization

**Problem:** The knowledge module's Code Mode SDK uses snake_case parameter names (`entity_id`, `from_id`, `to_id`, `start_entity_id`, `source_session`, `added_by`, `created_by`, `name_pattern`, `created_after`, `created_before`, `relation_type`, `relation_types`, `max_depth`) while every other SDK namespace uses camelCase (`sessionId`, `thoughtNumber`, `notebookId`, `cellId`).

**Solution:** The `tb.knowledge.*` SDK accepts camelCase and translates to snake_case internally before forwarding to `KnowledgeTool.handle()`. The MCP-level `thoughtbox_knowledge` tool schema retains snake_case (no breaking change at the MCP protocol level).

#### Mapping Table

| SDK (camelCase) | Internal (snake_case) |
|---|---|
| `entityId` | `entity_id` |
| `fromId` | `from_id` |
| `toId` | `to_id` |
| `startEntityId` | `start_entity_id` |
| `sourceSession` | `source_session` |
| `addedBy` | `added_by` |
| `createdBy` | `created_by` |
| `namePattern` | `name_pattern` |
| `createdAfter` | `created_after` |
| `createdBefore` | `created_before` |
| `relationType` | `relation_type` |
| `relationTypes` | `relation_types` |
| `maxDepth` | `max_depth` |

#### Changes to `execute-tool.ts`

Add a translation helper:

```typescript
function camelToSnake(args: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    entityId: "entity_id",
    fromId: "from_id",
    toId: "to_id",
    startEntityId: "start_entity_id",
    sourceSession: "source_session",
    addedBy: "added_by",
    createdBy: "created_by",
    namePattern: "name_pattern",
    createdAfter: "created_after",
    createdBefore: "created_before",
    relationType: "relation_type",
    relationTypes: "relation_types",
    maxDepth: "max_depth",
  };
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    result[map[k] ?? k] = v;
  }
  return result;
}
```

Update the `knowledge` namespace in `buildTbObject()`:

```typescript
knowledge: {
  createEntity: async (args: Record<string, unknown>) =>
    unwrapToolResult(await knowledgeTool.handle({
      operation: "knowledge_create_entity", ...camelToSnake(args),
    } as KnowledgeToolInput)),
  getEntity: async (args: { entityId: string }) =>
    unwrapToolResult(await knowledgeTool.handle({
      operation: "knowledge_get_entity", entity_id: args.entityId,
    } as KnowledgeToolInput)),
  // ... etc — all methods accept camelCase args objects
}
```

#### Changes to `sdk-types.ts`

Update all knowledge type signatures to use camelCase:

```typescript
knowledge: {
  createEntity(args: { name: string; type: "Insight" | "Concept" | "Workflow" | "Decision" | "Agent"; label: string; properties?: Record<string, unknown>; createdBy?: string; visibility?: "public" | "agent-private" | "user-private" | "team-private" }): Promise<unknown>;
  getEntity(args: { entityId: string }): Promise<unknown>;
  listEntities(args?: { types?: string[]; namePattern?: string; createdAfter?: string; createdBefore?: string; limit?: number; offset?: number }): Promise<unknown>;
  addObservation(args: { entityId: string; content: string; sourceSession?: string; addedBy?: string }): Promise<unknown>;
  createRelation(args: { fromId: string; toId: string; relationType: "RELATES_TO" | "BUILDS_ON" | "CONTRADICTS" | "EXTRACTED_FROM" | "APPLIED_IN" | "LEARNED_BY" | "DEPENDS_ON" | "SUPERSEDES" | "MERGED_FROM"; properties?: Record<string, unknown> }): Promise<unknown>;
  queryGraph(args: { startEntityId: string; relationTypes?: string[]; maxDepth?: number; filter?: Record<string, unknown> }): Promise<unknown>;
  stats(): Promise<unknown>;
};
```

#### Migration: Accept Both (Temporary)

During a transition period, the `camelToSnake` helper passes through keys that are already snake_case. This means both `{ entityId: "x" }` and `{ entity_id: "x" }` work. The snake_case variants are undocumented in sdk-types.ts (agents see only camelCase) but won't break existing code in notebooks or saved scripts.

Remove snake_case passthrough after one release cycle.

---

### 4. Auto-Extract Learnings on Session Close

**Problem:** Learnings from `decision_frame` and `assumption_update` thoughts are only extracted when agents explicitly call `tb.session.extractLearnings()`. Most sessions close without extraction, losing valuable signal.

**Solution:** When `nextThoughtNeeded: false` closes a session, automatically extract learnings from typed thoughts (`decision_frame`, `assumption_update`, `belief_snapshot`). Include the results in the session close response.

#### Changes to `src/thought-handler.ts`

In the `!validatedInput.nextThoughtNeeded && this.currentSessionId` block (line 969), after the audit manifest generation and before auto-export:

```typescript
// Auto-extract learnings from typed thoughts
let autoLearnings: ExtractedLearning[] | undefined;
if (!validatedInput.skipAutoExtract) {
  try {
    const typedThoughts = this.thoughtHistory.filter(
      (t) => t.thoughtType === 'decision_frame' ||
             t.thoughtType === 'assumption_update' ||
             t.thoughtType === 'belief_snapshot'
    );
    if (typedThoughts.length > 0) {
      // Build key moments from typed thoughts for signal extraction
      const keyMoments = typedThoughts.map((t) => ({
        thoughtNumber: t.thoughtNumber,
        type: t.thoughtType === 'decision_frame' ? 'decision'
            : t.thoughtType === 'assumption_update' ? 'pivot'
            : 'insight',
      }));
      const result = await sessionHandlers.handleExtractLearnings({
        sessionId: this.currentSessionId!,
        keyMoments,
        targetTypes: ['signal'],
      });
      autoLearnings = result.learnings;
    }
  } catch (err) {
    console.warn('[AUTO-EXTRACT] Learning extraction failed:', (err as Error).message);
  }
}
```

Include `autoLearnings` in the session close response JSON alongside the existing `auditManifest` and `exportPath`.

#### New Input Field

Add `skipAutoExtract?: boolean` to `ThoughtData` interface in `thought-handler.ts` (line 19) and to the thought tool's Zod schema.

Add to `sdk-types.ts` thought input:
```typescript
skipAutoExtract?: boolean;  // Skip auto-extraction of learnings on session close
```

#### Performance Constraint

The extraction must complete in <500ms. This is achievable because:
1. We filter to typed thoughts only (typically <10% of session)
2. `handleExtractLearnings` with `targetTypes: ['signal']` skips pattern/anti-pattern extraction (which requires `keyMoments` with significance scores)
3. Signal extraction uses `handleAnalyze` which is pure computation over in-memory data

If extraction exceeds 500ms, it should be skipped with a warning log rather than blocking the session close response.

#### Dependency

`ThoughtHandler` needs access to `SessionHandlers` to call `handleExtractLearnings`. This is currently not wired — `ThoughtHandler` owns the storage but doesn't hold a reference to `SessionHandlers`. Options:

1. **Inject `SessionHandlers` into `ThoughtHandler`** — circular dependency risk since `SessionHandlers` already depends on `ThoughtHandler` (line 15 of `handlers.ts`).
2. **Extract `handleExtractLearnings` into a standalone function** that takes `(storage, sessionId, keyMoments, targetTypes)` and call it directly from both `SessionHandlers` and `ThoughtHandler`. This is the recommended approach — it breaks the circular dependency and makes the extraction logic independently testable.

Recommended: Option 2. Create `src/sessions/extract-learnings.ts` with the pure extraction logic, imported by both `SessionHandlers.handleExtractLearnings()` and `ThoughtHandler`'s session close block.

---

## Files Modified

### New Files
| File | Change |
|------|--------|
| `src/analyze/types.ts` | Result types for analysis operations |
| `src/analyze/extractors.ts` | recommendations, decisions, pivots, beliefs extraction |
| `src/analyze/structure.ts` | topicShifts, velocity, lengthProfile, typeProgression |
| `src/analyze/relationships.ts` | evolutionCandidates, clusters |
| `src/analyze/summaries.ts` | digest, diff |
| `src/analyze/handler.ts` | AnalyzeHandler class wiring operations |
| `src/analyze/operations.ts` | Catalog entries for search index |
| `src/analyze/index.ts` | Barrel export |
| `src/sessions/extract-learnings.ts` | Extracted standalone learning extraction logic |

### Modified Files
| File | Change |
|------|--------|
| `src/code-mode/execute-tool.ts` | Add `analyze` namespace, fix notebook signatures, add `camelToSnake` helper, update knowledge namespace |
| `src/code-mode/sdk-types.ts` | Add `analyze` interface, fix notebook signatures, update knowledge to camelCase |
| `src/code-mode/search-index.ts` | Add `analyze` to catalog |
| `src/thought-handler.ts` | Add `skipAutoExtract` field, add auto-extraction on session close |
| `src/sessions/handlers.ts` | Delegate to extracted `extract-learnings.ts` |

### NOT Modified
| File | Reason |
|------|--------|
| `src/notebook/*.ts` | Notebook engine unchanged; fix is SDK wrapper only |
| `src/knowledge/tool.ts` | MCP-level schema stays snake_case |
| `src/knowledge/handler.ts` | Internal handler unchanged |

---

## Testing Plan

### 1. tb.analyze.* Namespace

- **Unit tests** (`src/analyze/*.test.ts`): Each extractor function tested with fixture sessions containing known typed thoughts. Test edge cases: empty session, session with no typed thoughts, session with only one thought type.
- **Integration test**: Create a session via `tb.thought()`, submit typed thoughts, then call each `tb.analyze.*` function and verify structured output.
- **Performance test**: `tb.analyze.digest()` on a 100-thought session completes in <200ms.

### 2. Notebook SDK Fix

- **Regression test**: Existing notebook behavioral tests (`test-notebook` prompt) must pass with updated signatures.
- **Migration test**: Verify that `tb.notebook.listCells({ notebookId: "x" })` works (new signature) and that the old `tb.notebook.listCells("x")` now produces a clear error (not a silent wrong result).

### 3. Parameter Naming

- **Compatibility test**: Both `{ entityId: "x" }` and `{ entity_id: "x" }` resolve correctly during the transition period.
- **Regression test**: Existing knowledge behavioral tests (`test-memory` prompt) pass with camelCase SDK signatures.
- **Type test**: `tsc --noEmit` confirms sdk-types.ts compiles with no errors.

### 4. Auto-Extract Learnings

- **Unit test**: Session close with typed thoughts produces `autoLearnings` in response.
- **Unit test**: Session close with `skipAutoExtract: true` produces no learnings.
- **Unit test**: Session close with no typed thoughts skips extraction (no error, no empty array).
- **Performance test**: Auto-extraction on a 50-thought session (5 typed) completes in <500ms.
- **Error resilience test**: Extraction failure does not prevent session close.

---

## Migration / Compatibility

| Change | Breaking? | Migration Path |
|--------|-----------|----------------|
| `tb.analyze.*` | No | New namespace, no existing code affected |
| Notebook SDK fix | **Yes** (Code Mode only) | Old positional signatures for `listCells`, `getCell`, `installDeps` stop working. Saved notebooks using old signatures need updating. |
| Knowledge camelCase | **No** (during transition) | Both camelCase and snake_case accepted. After one release cycle, snake_case removed from SDK (MCP-level stays snake_case permanently). |
| Auto-extract | No | Opt-out via `skipAutoExtract: true`. Default behavior adds data to response, doesn't remove any. |

### Breaking Change Mitigation (Notebook)

The notebook fix is intentionally breaking at the Code Mode SDK level. The inconsistency is a bug, not a feature. Since Code Mode scripts are LLM-generated (not user-authored), the LLM will immediately use the correct signature from `sdk-types.ts`. No migration shim needed.

---

## Rollback Plan

Each change is independent and can be rolled back individually:

1. **tb.analyze.***: Remove `analyze` from `buildTbObject()`, `search-index.ts`, and `sdk-types.ts`. Delete `src/analyze/`. No other code depends on it.
2. **Notebook SDK fix**: Revert `execute-tool.ts` and `sdk-types.ts` to positional signatures for the three affected methods.
3. **Knowledge camelCase**: Remove `camelToSnake` helper, revert knowledge namespace in `buildTbObject()` and `sdk-types.ts` to snake_case with positional args.
4. **Auto-extract**: Remove the auto-extraction block from `thought-handler.ts`, remove `skipAutoExtract` from `ThoughtData` and Zod schema. `extract-learnings.ts` can remain as a refactor or be inlined back into `handlers.ts`.
