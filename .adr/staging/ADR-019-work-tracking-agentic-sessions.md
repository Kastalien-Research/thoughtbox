# ADR-019: Work Tracking and Agentic Session Management

**Status**: Proposed
**Date**: 2026-04-02
**Branch**: feat/project-as-api
**Owner**: Core MCP Architecture Workstream

## Context

Beads was removed from this project. Its data model was the failure — not the idea. The
idea (local structured work items that agents can navigate, with status, priority, and
close reasoning) is correct. The implementation needs to be native to this project and its
existing infrastructure.

Three gaps this ADR addresses:

1. **No work tracking.** Since Beads was removed, there is no structured way for agents to
   declare what they are working on before touching the codebase. Work happens without a
   scoping artifact, making provenance reconstruction difficult.

2. **Control plane execution gap.** ADR-017 deliberately excluded runtime execution
   tracking: the manifest declares workflow *definitions* but not *instances*. Work items
   are the missing instance layer — they are the running record of which execution of which
   workflow is happening, by which agent, in which session.

3. **Fragmented session scaffolding.** The project has agentic scripts in multiple
   locations (`scripts/agents/`, `automation-self-improvement/agentops/runner/`) with
   inconsistent structure. The Claude Agent SDK is already in use (`agent-harness.ts`,
   `ulc-meta-loop.ts`) but not organized around a coherent `scripts/agentic/` home for
   full workflow scripts. There is no Pi-native way to invoke these scripts or manage work
   items interactively.

## Decision

### Storage

Work items are stored in `.pi/work.jsonl` — one JSON object per line, append-only. `.pi/`
is git-tracked in this repo (established pattern: `.pi/multi-team/logs/pr-issues.jsonl`),
so work items persist across machines via normal git push/pull. No setup required.

### Work Item Schema

```typescript
type WorkItemWorkflow =
  | "daily_dev_brief"       // control-plane workflow IDs
  | "proposal_approval"
  | "improvement_loop"
  | "tool_pedagogy_batch"
  | "prompt_refinement_batch"
  | "ulysses"               // unexpected problem — surprise-gated debugging
  | "theseus";              // structural change — friction-gated refactoring

interface WorkItem {
  id: string;               // nanoid (8 chars)
  title: string;
  description?: string;
  workflowId: WorkItemWorkflow;  // required — no ad-hoc untyped items
  status: "open" | "in_progress" | "closed";
  priority: 1 | 2 | 3 | 4; // 1 = highest
  parentId?: string;        // populated when branching from a parent item
  linearIssueId?: string;   // populated on Linear sync
  openedAt: string;         // ISO-8601
  closedAt?: string;
  closeReason?: string;
  sessionIds: string[];     // Thoughtbox session IDs attributed to this item
}
```

`workflowId` is required for every item. Ad-hoc work (bugs discovered mid-session,
quick chores) maps to `ulysses` or `theseus` respectively — both protocols enforce
discipline proportional to actual scope, which is the correct default for work that
*seems* trivial. There is no free-form type field; the workflow ID carries the semantics.

### Delivery: Two Complementary Layers

#### Layer 1 — `scripts/agentic/work-session.ts`

A full agentic workflow script using `@anthropic-ai/claude-agent-sdk`. Designed for
automated or fresh-session use. Configures a Claude Code agent with:

- **In-process MCP server** (via `createSdkMcpServer()`) exposing work tracking tools:
  `work_list`, `work_create`, `work_update`, `work_branch`, `work_complete`
- **Thoughtbox MCP** (`thoughtbox-cloud-run` from `.mcp.json`)
- **Linear MCP** (`linear` from `.mcp.json`)
- **`PreToolUse` hook**: blocks any tool call that is not a work tracking tool until an
  item is in `in_progress` status. This is the session gate.
- **`SessionEnd` hook**: prompts close reason, completes active item, syncs Linear.

The in-process MCP server reads and writes `.pi/work.jsonl` directly. Linear sync is
performed via direct GraphQL API calls using `LINEAR_API_KEY` from the environment — no
Linear CLI needed, no dependency on the Linear MCP being reachable.

Active item state is maintained as a stack in the script process: `string[]` of item IDs.
When `work_branch` is called, the new child item ID is pushed onto the stack and becomes
active. When `work_complete` is called on a child item, the stack pops and the parent item
reactivates — the session continues running, the agent resumes work on the parent. A
`steer()` message is injected to reorient the agent to the parent item's context.

#### Layer 2 — `.pi/extensions/agentic-launcher.ts`

A Pi extension that bridges the agentic scripts into interactive Pi sessions. Designed for
interactive use (like the current session) where spawning a full nested SDK agent would
be redundant.

**Registers:**
- `/agentic` command: human-facing selector for available scripts in `scripts/agentic/`
- `launch_agentic_script` tool: AI-callable, spawns a script from `scripts/agentic/` as
  a child process and streams output. This is how I can invoke workflow scripts from within
  a Pi session without the human doing it manually.
- `work_list`, `work_create`, `work_update`, `work_branch`, `work_complete` tools:
  direct work item operations against `.pi/work.jsonl`, without spawning a subprocess.
  Linear sync is included (same GraphQL calls as the in-process MCP server).

**On `session_start`**: optionally prompts for an active work item via `ctx.ui.select()`
if none is currently `in_progress`. Non-blocking — the agent can proceed without one if
the session is exploratory/diagnostic.

### Three-Level Branching

When a bug or structural deviation is discovered mid-session:

```
Work item level (.pi/work.jsonl):
  item-001 { workflowId: "improvement_loop", status: "in_progress" }
    └── item-002 { workflowId: "ulysses", parentId: "item-001", status: "in_progress" }

Thoughtbox level (session trace):
  thought 1..N (main branch)
    └── branch from N+1 { branchId: "ulysses-item-002" }

Linear level:
  Issue LIN-42 (parent)
    └── Sub-issue LIN-43 { parent: LIN-42 }
```

All three levels are managed independently but linked by convention:
- Work item `parentId` → Linear sub-issue `parent`
- Child work item `sessionIds` → Thoughtbox session IDs used during the branch
- The agent calls `tb.thought({ branchFromThought: N })` independently; the extension/
  script tracks which Thoughtbox session IDs were opened while each item was active

### `scripts/agentic/` Directory

Established as the home for full agentic workflow scripts. Existing scripts move:

| Current location | New location |
|---|---|
| `scripts/agents/run-improvement-loop.ts` | `scripts/agentic/improvement-loop.ts` |
| `scripts/agents/ulc-meta-loop.ts` | `scripts/agentic/ulc-meta-loop.ts` |
| *(new)* | `scripts/agentic/work-session.ts` |

`scripts/agents/` retains: individual agent definitions, SIL components (`sil-*.ts`),
shared utilities (`types.ts`, `behavioral-contracts.ts`, `index.ts`), and the generic
harness (`agent-harness.ts`, `run-agent.ts`, `run-agent-util.ts`).

`automation-self-improvement/agentops/runner/` is untouched.

## Decision Summary

| Dimension | Decision |
|---|---|
| Storage | `.pi/work.jsonl` — git-tracked JSONL, zero setup |
| Schema | `WorkItem` with required `workflowId`, optional `parentId`, `linearIssueId`, `sessionIds[]` |
| Workflow types | 5 control-plane IDs + `ulysses` + `theseus` — no free-form types |
| Session gate | `PreToolUse` hook in `work-session.ts` — blocks until item is `in_progress` |
| Branching | Parent/child work items ↔ Linear sub-issues; Thoughtbox branching linked by convention |
| In-place conversion | Child item pushed onto stack; parent reactivates when child closes |
| Linear sync | Direct GraphQL API calls; `linearIssueId` stored on item |
| Pi integration | `.pi/extensions/agentic-launcher.ts` — interactive tools + script launcher |
| Script location | `scripts/agentic/work-session.ts` (+ moved `improvement-loop.ts`, `ulc-meta-loop.ts`) |
| `agentops/runner/` | Untouched |
| Control plane link | Work items are execution instances of manifest-declared workflows |
| Linear sync requirement | Nice-to-have in Phase 1; extension point, not hard dependency |

## Consequences

- `.pi/work.jsonl` is a new tracked file; an initial empty file or `.gitkeep` is needed.
- `.pi/extensions/` directory is created (currently `.pi/` only has `multi-team/`).
- `scripts/agentic/` directory is created; two scripts move from `scripts/agents/`.
- `package.json` gets new `scripts` entries: `work:session`, `agentic:improvement-loop`,
  `agentic:ulc-meta-loop`.
- The `run-improvement-loop` and `ulc-meta-loop` entries in `package.json` (if any)
  update to new paths.
- `@anthropic-ai/claude-agent-sdk` is already a dependency; `nanoid` may be needed for
  ID generation (or use `crypto.randomUUID()` with an 8-char prefix).
- Linear GraphQL calls require `LINEAR_API_KEY` in the environment; the key is already in
  `.mcp.json` and accessible to the extension via `process.env`.
- ADR-018 (project-as-api) is not a prerequisite for ADR-019; work tracking can ship
  independently. The `tp.work.*` namespace (exposing work items via Thoughtbox MCP) is
  explicitly deferred and will be addressed in a follow-on spec once the local system is
  validated.
- The `session_start` gate in the Pi extension is advisory (non-blocking) by design. The
  hard gate lives in `work-session.ts` for automated sessions. This avoids blocking
  exploratory/diagnostic Pi sessions unnecessarily.

## Hypotheses

### Hypothesis 1: JSONL storage is sufficient for project-scale work item volume
**Prediction**: `.pi/work.jsonl` with in-memory indexing handles the expected volume
(< 500 items over 12 months) with sub-10ms read times for all `work_list` queries.

### Hypothesis 2: `workflowId` required eliminates scope ambiguity
**Prediction**: After implementation, every closed work item has a `workflowId` that
correctly classifies the nature of the work. Zero items are closed with "wrong"
workflow ID in the first 30 sessions (measured by retrospective review).

### Hypothesis 3: `PreToolUse` hook is sufficient for session gating
**Prediction**: An agent running `work-session.ts` cannot make a codebase edit, run a
CLI command, or call any non-work-tracking MCP tool without first having an `in_progress`
work item. Zero bypass cases in automated testing.

### Hypothesis 4: Pi extension `launch_agentic_script` is usable from within Pi
**Prediction**: I (as AI running in Pi) can call `launch_agentic_script` to start a
`work-session` workflow without human intervention. The spawned script runs, outputs to
the Pi session, and completes without requiring manual terminal interaction.

### Hypothesis 5: Three-level branching is correctly maintained without explicit coordination
**Prediction**: After a `work_branch` + Ulysses protocol cycle, the parent work item
correctly resumes with the child item's `sessionIds` recorded, the Linear sub-issue
closed, and the Thoughtbox session's branch merged back. No manual reconciliation needed.

## Spec

**Spec**: [Work Tracking and Agentic Sessions](/.specs/work-tracking/00-index.md)

## Links

- ADR-018: `.adr/staging/ADR-018-project-as-api.md` (parallel; independent of this ADR)
- Existing SDK usage: `scripts/agents/agent-harness.ts`, `scripts/agents/ulc-meta-loop.ts`
- Existing JSONL pattern: `.pi/multi-team/logs/pr-issues.jsonl`
- Control plane manifest: `automation-self-improvement/control-plane/manifest.yaml`
- Claude Agent SDK: `@anthropic-ai/claude-agent-sdk`
