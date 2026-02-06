# M11: Problem Dependencies & Ready Queue

## Context

M10 (per-session agent identity isolation) is complete and verified. Three independent MCP clients successfully registered distinct identities, collaborated in a shared workspace, and all messages were correctly attributed. The hardening code is merged on `feat/multi-agent-tdd`.

Post-M10 analysis identified four gaps in the hub's multi-agent capabilities:

1. **No workflow orchestration** — problems are a flat list with no dependency relationships
2. **No structured data exchange** — messages carry free text, not artifact references
3. **No real-time coordination** — agents must poll; no blocking or notification on status changes
4. **No branching discussions** — channels are flat per-problem, no hierarchy

A review by three agents (Claude, Roo Code, Gemini) converged on a key architectural insight: **three of the four gaps share the same root cause — problems don't relate to other problems.** Adding a dependency graph to the problem model unlocks orchestration, hierarchy, and implicit coordination in one move.

## The Beads Parallel

The project's issue tracker (Beads) already implements the exact mental model needed:

| Beads | Hub Equivalent | Status |
|---|---|---|
| `dep add` (issue depends on issue) | Problem depends on problem | **Missing** |
| `ready` (issues with no unresolved blockers) | Ready problems query | **Missing** |
| `blocked` (issues waiting on dependencies) | Blocked problems query | **Missing** |
| `epic` (parent with children) | Problem with sub-problems | **Missing** |
| `swarm` (coordinator molecule for a DAG) | Coordinator agent pattern | **Missing** |
| `gate` (async wait conditions) | — | Future |

Beads stores dependencies as **data** and provides **queries** over that data, but does not enforce ordering or drive transitions. Agents (or humans) read the ready queue and decide what to do. This is the correct layering for the hub.

## Agreed Architecture

```
Coordinator Agent (drives workflow, dispatches, creates follow-ups)
        ↓ reads ready queue, posts messages, creates problems
Hub (stores problems, dependencies, channels, identities)
        ↓ provides data and queries
Storage (persistence)
```

The hub gains two things:
1. A `dependsOn: string[]` field on `Problem` — dependency data
2. A `ready_problems` operation — query over dependency data

Everything else (workflow logic, dispatching, follow-up creation) stays in the agent layer. The hub stays unopinionated about how workflows run.

## Implementation Plan

### Step 1: Extend Problem model with dependencies

**`src/hub/hub-types.ts`** — Add to `Problem` interface:
```typescript
dependsOn?: string[];  // Problem IDs this problem depends on
parentId?: string;     // Parent problem ID (for hierarchy/sub-problems)
```

### Step 2: Add dependency operations to hub-handler

New operations routed through `thoughtbox_hub`:
- `add_dependency` — `{ workspaceId, problemId, dependsOnProblemId }` — adds a dependency edge
- `remove_dependency` — `{ workspaceId, problemId, dependsOnProblemId }` — removes a dependency edge
- `ready_problems` — `{ workspaceId }` — returns problems with all dependencies resolved/closed
- `blocked_problems` — `{ workspaceId }` — returns problems waiting on unresolved dependencies
- `create_sub_problem` — `{ workspaceId, parentId, title, description }` — creates a child problem

### Step 3: Extend message model with artifact references

**`src/hub/hub-types.ts`** — Add to channel `Message` interface:
```typescript
ref?: {
  sessionId?: string;
  thoughtNumber?: number;
  branchId?: string;
};
```

Update `post_message` to accept optional `ref` in args.

### Step 4: Add problem status change notifications

When a problem status changes (especially to `resolved`/`closed`), emit a resource update for the workspace so subscribing clients can react:
```typescript
server.server.sendResourceUpdated({
  uri: `thoughtbox://hub/${workspaceId}/status`,
});
```

### Step 5: Write tests (TDD)

Follow the existing hub TDD pattern:
- `src/hub/__tests__/dependencies.test.ts` — dependency CRUD, cycle detection, ready/blocked queries
- `src/hub/__tests__/sub-problems.test.ts` — parent-child relationships, hierarchy queries
- `src/hub/__tests__/artifact-refs.test.ts` — message artifact references

### Step 6: Validate with Coordinator Agent prototype

Build a simple coordinator agent that:
1. Connects to the hub
2. Creates a workspace with a problem graph (epic with sub-problems + dependencies)
3. Queries `ready_problems` to find the work frontier
4. Dispatches work to contributor agents
5. Reacts when problems resolve to check if new work is unblocked

This validates the "hub as substrate, agent as orchestrator" pattern without changing hub code beyond Steps 1-4.

## Key Files

- Hub types: `src/hub/hub-types.ts`
- Hub handler (operation routing): `src/hub/hub-handler.ts`
- Problems module: `src/hub/problems.ts`
- Hub tool handler (MCP interface): `src/hub/hub-tool-handler.ts`
- Server factory (tool registration): `src/server-factory.ts`
- Test helpers: `src/hub/__tests__/test-helpers.ts`
- Existing problem tests: `src/hub/__tests__/problems.test.ts`

## Branch

Continue on `feat/multi-agent-tdd`.

## Prior Art

- M10 commit: `8655ed3` — per-session identity isolation
- Beads CLI: `bd dep`, `bd ready`, `bd blocked`, `bd epic`, `bd swarm`
- ADR: `staging/docs/adr/002-mcp-hub-staging-adr.md`
