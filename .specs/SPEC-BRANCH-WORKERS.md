# SPEC: Parallel Branch Workers via MCP Lite Edge Functions

**Status**: Draft
**Thoughtbox Session**: `9efd0294-ca85-46a9-b78f-b0fd17e3c2c5` (38 thoughts)
**Date**: 2026-04-08

## Problem

The ThoughtHandler is a singleton with mutable in-memory state (`thoughtHistory`, `branches`, `currentSessionId`). Two concurrent agents writing to different branches race on this shared state. Parallel branch exploration — the most valuable use case for branching — is unsafe.

## Solution

Stateless MCP Lite edge function workers on Supabase, scoped to a single branch. Each worker writes directly to Postgres with branch-scoped numbering. No shared state, no concurrency hazard.

## Architecture

```
┌─────────────────────────┐
│  Parent Agent            │
│  (orchestrator)          │
├─────────────────────────┤
│  Main Thoughtbox MCP     │  ← Cloud Run (unchanged)
│  tb.branch.spawn()       │  ← Returns edge function URLs
│  tb.branch.merge()       │  ← Records synthesis, updates statuses
├─────────────────────────┤
│        ┌──────────┐ ┌──────────┐ ┌──────────┐
│        │ Subagent │ │ Subagent │ │ Subagent │
│        │    A     │ │    B     │ │    C     │
│        └────┬─────┘ └────┬─────┘ └────┬─────┘
│             │            │            │
│        ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
│        │tb-branch │ │tb-branch │ │tb-branch │  ← Supabase Edge Functions
│        │branch=a  │ │branch=b  │ │branch=c  │     (same function, different params)
│        └────┬─────┘ └────┬─────┘ └────┬─────┘
│             │            │            │
│        ┌────▼────────────▼────────────▼─────┐
│        │         Supabase Postgres           │  ← thoughts table, branches table
│        │  triggers · pgmq · realtime         │  ← reactive intelligence
│        └─────────────────────────────────────┘
```

## Components

### 1. Supabase Edge Function: `tb-branch`

Thin MCP Lite server. ~100 lines. Deployed once, parameterized per invocation.

**Tools:**
- `branch_thought` — write a thought to this branch (branch-scoped numbering)
- `branch_status` — read this branch's metadata (thought count, status)
- `branch_read` — read this branch's thoughts

**Auth:** HMAC-signed URL token. Main MCP signs `{ session_id, branch_id, workspace_id, branch_from_thought, expires_at }` using `SUPABASE_SERVICE_ROLE_KEY`. Edge function verifies signature, extracts context.

**DB access:** `supabase-js` with `SUPABASE_SERVICE_ROLE_KEY` (auto-available in edge functions).

**Numbering:** Branch-local counter starting at 1. On cold start, queries `MAX(thought_number)` for the branch from Postgres.

**Branch completion:** When `nextThoughtNeeded: false`, a Postgres trigger (`auto_complete_branch`) sets the branch status to `completed`.

### 2. Main MCP Branch Module

New `branch` module on Cloud Run. ~150 lines.

**Operations:**

| Operation | Input | Output | Effect |
|-----------|-------|--------|--------|
| `branch_spawn` | `sessionId, branchId, description, branchFromThought` | `{ branchId, workerUrl, status }` | Creates branch record, returns signed edge function URL |
| `branch_merge` | `sessionId, synthesis, selectedBranchId?, resolution` | `{ mergeThoughtNumber, updatedBranches }` | Records main-track synthesis thought, updates branch statuses |
| `branch_list` | `sessionId` | `{ branches: BranchMetadata[] }` | Lists all branches with status, thought count |
| `branch_get` | `sessionId, branchId` | `{ branch, thoughts }` | Returns branch metadata + all thoughts |

`resolution` values: `selected` (one branch wins), `synthesized` (combined insights), `abandoned` (none useful).

### 3. Schema: `branches` Table

```sql
CREATE TABLE branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  branch_id text NOT NULL,
  description text,
  branch_from_thought integer NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','merged','rejected','abandoned')),
  spawned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  merge_thought_number integer,
  created_by text,
  UNIQUE(session_id, branch_id)
);

CREATE INDEX idx_branches_session ON branches(session_id);
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE branches;
```

### 4. Schema: Thought Numbering Indexes

Enforce branch-scoped uniqueness:

```sql
-- Main track: unique per session
CREATE UNIQUE INDEX thoughts_main_track_unique
  ON thoughts(session_id, thought_number)
  WHERE branch_id IS NULL;

-- Per branch: unique per session + branch
CREATE UNIQUE INDEX thoughts_branch_unique
  ON thoughts(session_id, branch_id, thought_number)
  WHERE branch_id IS NOT NULL;
```

### 5. Postgres Trigger: Auto-Complete Branch

```sql
CREATE OR REPLACE FUNCTION auto_complete_branch()
RETURNS trigger AS $$
BEGIN
  IF NEW.branch_id IS NOT NULL AND NEW.next_thought_needed = false THEN
    UPDATE branches
    SET status = 'completed', completed_at = now()
    WHERE session_id = NEW.session_id
      AND branch_id = NEW.branch_id
      AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_complete_branch
  AFTER INSERT ON thoughts
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_branch();
```

## Agent Flow

```
1. Agent calls tb.branch.spawn({ sessionId, branchId: "approach-a", ... })
   → Returns workerUrl: https://<ref>.supabase.co/functions/v1/tb-branch/mcp?token=<signed>

2. Agent spawns subagent with:
   - Branch worker MCP (workerUrl) for writing thoughts
   - Main Thoughtbox MCP for reading knowledge graph, sessions, resources

3. Subagent explores independently:
   - Calls branch_thought() to record reasoning
   - Reads knowledge graph via main MCP
   - Finishes with nextThoughtNeeded: false

4. Postgres trigger auto-completes branch status

5. Parent agent collects all subagent results, calls:
   tb.branch.merge({ sessionId, synthesis: "After exploring all three...",
     selectedBranchId: "approach-a", resolution: "selected" })
```

## What We Don't Touch

- `ThoughtHandler` — the singleton stays as-is for main-track thoughts
- Existing session/knowledge/protocol/notebook operations
- Cloud Run service configuration
- Existing inline branching via `tb.thought({ branchFromThought, branchId })` — still works for sequential branching

## Integration with Existing System

- `session.get()` already calls `getAllThoughts()` and groups by branch — no change needed
- `session.analyze()` — minor fix: query branches table for branch count instead of in-memory state
- `session.export()` — branch sections render with scoped numbering
- Knowledge graph — branch thoughts can create entities same as main thoughts
- Observability — edge function writes land in same Supabase tables, visible to any Supabase-side intelligence

## Future Extensions

The edge function pattern extends beyond branching:
- **tb-eval** — evaluation workers scoring thought chains
- **tb-extract** — knowledge extraction from completed sessions
- **tb-notebook** — data analysis notebooks with direct Postgres access

Each is a thin, stateless, data-local MCP worker deployed as a Supabase Edge Function.

## Implementation Units

| Unit | Scope | ~Lines | Depends On |
|------|-------|--------|------------|
| 1. branches table migration | SQL | 40 | — |
| 2. tb-branch edge function | Deno/TypeScript | 100 | Unit 1 |
| 3. branch module (main MCP) | TypeScript | 150 | Unit 1 |
| 4. SDK types update | TypeScript | 20 | Unit 3 |
| 5. execute-tool wiring | TypeScript | 15 | Unit 3 |
| 6. catalog registration | TypeScript | 30 | Unit 3 |
| 7. session.analyze() fix | TypeScript | 5 | Unit 1 |

## Open Questions

1. **V1 auth**: HMAC-signed tokens or simpler API-key-in-URL for first iteration?
2. **Thought budget**: Enforce max thoughts per branch in edge function, or leave to agent?
3. **Merge thought type**: New `synthesis` thoughtType, or use existing `reasoning`?
