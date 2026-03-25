# Audit Prompt: SPEC-CI-002 Knowledge Accumulation Layer

Use this prompt in a fresh session to get an honest gap analysis.

---

## Task

Perform a precise audit of SPEC-CI-002 (Knowledge Accumulation Layer) against what actually exists in the codebase. For every claim you make, cite the file path and line number. If something doesn't exist, say so. Do NOT speculate.

## The Spec

Read `specs/continual-improvement/02-knowledge-accumulation-layer.md` in full. This is the source of truth for what should be built.

## What to Audit

For each item below, verify whether it exists, is partial, or is missing. Show your work.

### 1. Entity Type Extensions

The spec adds 4 cross-reference entity types: `Issue`, `Commit`, `HubWorkspace`, `RunTrace`.

- Check `src/knowledge/types.ts` — does the `EntityType` union include these?
- Check `src/knowledge/operations.ts` — do the `create_entity` and `list_entities` schemas reference these types in their enums?

### 2. Store Adapters

The spec calls for 6 adapter files in `src/knowledge/adapters/`:

| File | Purpose |
|------|---------|
| `types.ts` | `KnowledgeStoreAdapter` interface, `KnowledgeResult`, `FreshnessProperties` |
| `kg-adapter.ts` | Wraps existing KG storage |
| `memory-adapter.ts` | Parses MEMORY.md files |
| `beads-adapter.ts` | Reads `.beads/issues.jsonl` |
| `git-adapter.ts` | Wraps `git log` |
| `hub-adapter.ts` | Uses `HubStorage` interface from `src/hub/hub-types.ts` |
| `langsmith-adapter.ts` | Calls LangSmith REST API |

- Check whether `src/knowledge/adapters/` directory exists
- Check each file individually

### 3. Unified Search

The spec calls for `src/knowledge/unified-search.ts` — query router, parallel dispatch, result merging with source weights, cross-reference resolution.

- Check whether this file exists
- If not, check whether equivalent logic exists elsewhere (e.g., in handler.ts or a skill)

### 4. Freshness System

The spec calls for `src/knowledge/freshness.ts` — HOT/WARM/COLD decay, usage recording, importance score recalculation.

- Check whether this file exists
- Check whether freshness properties appear anywhere in the existing entity types

### 5. New Knowledge Actions

The spec adds 4 actions to the handler:

| Action | Purpose |
|--------|---------|
| `unified_search` | Search all stores in parallel |
| `record_usage` | Track entity usage for freshness |
| `ingest` | Create cross-reference entities from external stores |
| `decay_freshness` | Run freshness decay cycle |

- Check `src/knowledge/operations.ts` `KNOWLEDGE_OPERATIONS` array for these
- Check `src/knowledge/handler.ts` `KnowledgeAction` type and switch cases

### 6. The `/knowledge` Skill

- Read `.claude/skills/knowledge/SKILL.md`
- Compare what it does (prompt-time grep/search) vs what the spec describes (MCP gateway operations)
- Is the skill a workaround, a complement, or the intended implementation?

### 7. Tests

The spec calls for 8 test files in `src/knowledge/__tests__/`:

- `unified-search.test.ts`
- `memory-adapter.test.ts`
- `beads-adapter.test.ts`
- `git-adapter.test.ts`
- `hub-adapter.test.ts`
- `langsmith-adapter.test.ts`
- `cross-reference.test.ts`
- `freshness.test.ts`

Check which exist.

### 8. ULC Integration

The spec says the ULC triggers `ingest` and `decay_freshness` daily.

- Read `.claude/skills/ulc-loop/ulc-prompt.md` — does it reference KAL actions?
- Read `scripts/agents/ulc-meta-loop.ts` — does it call knowledge operations?
- The ULC exists and works. The question is whether it has any KAL wiring.

## Output Format

Produce a table:

| Spec Item | Status | Evidence |
|-----------|--------|----------|
| Cross-ref entity types in types.ts | Missing / Partial / Complete | `src/knowledge/types.ts:46` — only 5 core types |
| ... | ... | ... |

Then a summary: what percentage of the spec is implemented, what's the critical path for Phase 1, and what can be skipped or deferred.
