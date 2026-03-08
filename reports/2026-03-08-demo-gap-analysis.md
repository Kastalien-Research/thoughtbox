# Demo Gap Analysis: Agent Auditability Demo

**Date**: 2026-03-08
**Analyst**: Claude Opus 4.6
**Branch**: feat/auditability-mvp
**Context**: Preparing Thoughtbox for a demo where an agent refactors an MCP server (Python to TypeScript) while logging its intent and progress through Thoughtbox, with the full session visible in the Observatory afterward.

---

## Demo Scenario

1. Agent receives task (refactor MCP server from Python to TypeScript)
2. Agent creates a runbook/todo list in Thoughtbox (subtasks, plan)
3. Agent does external work, comes back, updates the runbook (marks subtasks done, adds reasoning about what it did and why)
4. This work-then-report loop repeats multiple times
5. Agent summarizes at the end
6. Human reviews the full record in the Observatory

---

## What Exists Today

### Backend Data Layer (implemented on this branch)

Three specs implemented with passing tests:

| Spec | Commit | What it does |
|------|--------|-------------|
| SPEC-AUDIT-001 | `fb8e478` | `thoughtType` required on every thought. Discriminated union: `reasoning`, `decision_frame`, `action_report`, `belief_snapshot`, `assumption_update`, `context_snapshot`. Each type requires specific structured metadata fields. |
| SPEC-AUDIT-002 | `616ae5e` | `read_thoughts` supports filtering by `thoughtType` and `confidence`. `deep_analysis` supports `audit_summary` analysis type that aggregates thought counts, decision confidence distribution, action success/fail/reversibility, assumption flips, gap detection, and critique analysis. |
| SPEC-AUDIT-003 | `94f8f75` | Auto-generates audit manifest at session close. `deep_analysis` supports `audit_manifest` analysis type. Manifest includes thought counts by type, decision/action/assumption aggregates, and detected gaps. |

Source of truth: `specs/agent-auditability/INDEX.md`

### Thought System

- Thoughts are persisted to disk via `FileSystemStorage` (default) at `~/.thoughtbox/projects/{project}/sessions/`
- Sessions auto-create on first thought, auto-close and auto-export when `nextThoughtNeeded: false`
- Branching, revision, and critique infrastructure all work
- `read_thoughts` supports querying by number, range, last-N, branch, thoughtType, and confidence
- `get_structure` returns session topology (chain length, branches, fork points, revision pairs) without thought content
- `deep_analysis` provides six analysis types: `patterns`, `cognitive_load`, `decision_points`, `full`, `audit_summary`, `audit_manifest`

### Notebook System

- Create/list/load/export notebooks via `thoughtbox_gateway { operation: "notebook" }`
- Cell types: title, markdown, code (JavaScript/TypeScript), package.json
- Code cells execute in isolated environments with stdout/stderr capture
- Cell operations: add_cell, update_cell, run_cell, list_cells, get_cell
- Templates available (e.g., `sequential-feynman`)

### Observatory

- HTTP server serving a self-contained HTML UI at `/` and `/observatory`
- WebSocket server with channels: reasoning, observatory, workspace
- REST API endpoints: `/api/health`, `/api/sessions`, `/api/sessions/:id`, `/api/hub/*`, `/api/improvements`, `/api/scorecard`
- Real-time thought events emitted via `thoughtEmitter` (session started/ended, thought added/revised/branched)
- Historical session access when persistent storage is configured
- Hub API for multi-agent workspace data

### `deep_analysis` — What It Actually Does

Pure aggregation over stored thoughts. No LLM inference, no semantic analysis. Specifically:

- **`patterns`**: Counts total thoughts, revisions, branches, average thought length
- **`cognitive_load`**: Heuristic scores — `min(100, thoughtCount*5 + tagCount*10)`, max thought number, unique branch count
- **`decision_points`**: Filters thoughts with `isRevision` or `branchFromThought` — does NOT use `thoughtType: decision_frame`
- **`full`**: Combines patterns + cognitive_load + decision_points
- **`audit_summary`**: Counts by thoughtType, decision confidence distribution, action success/reversibility, assumption flips, gap detection (decision without action in next 5 thoughts), critique word-overlap analysis
- **`audit_manifest`**: Same as audit_summary but flattened for storage
- **`includeTimeline`** (optional): Adds createdAt, updatedAt, and a hardcoded `~thoughtCount*2 minutes` estimate

This is intentional — Thoughtbox is infrastructure, not intelligence. Intelligence is on the client side.

---

## Gaps Between Current State and Demo Requirements

### Gap 1: No runbook/task-list primitive

**Current state**: Notebooks have markdown cells with no concept of task status. To simulate a runbook, the agent would write markdown like `## Task 1\nStatus: pending`, then call `update_cell` to overwrite the entire cell content with `## Task 1\nStatus: done`. There is no `mark_complete` operation, no checklist semantics, no `delete_cell` operation, and no way to query "what's remaining."

**Impact on demo**: Mechanically possible but clunky. The agent has to read the cell, rewrite the markdown, and push it back for every status update. The demo narrative of "agent updates its runbook" works but feels like a workaround rather than a designed workflow.

**Alternatives**:
- **Use thoughts instead of notebooks**: Record the plan as a `reasoning` thought, then record progress as subsequent thoughts. Works today with zero code changes. Loses the editable-document feel but gains Observatory visibility.
- **Add a lightweight runbook notebook template**: A template with checklist-aware operations (`add_task`, `complete_task`, `list_remaining`). Medium effort.
- **Add a `status_update` or `progress` thoughtType**: A lightweight type between casual logging and structured audit. Low effort.

### Gap 2: Notebooks are invisible to the Observatory

**Current state**: The Observatory has zero awareness of notebooks. Grepping for "notebook" in `src/observatory/` returns no results. The Observatory sees reasoning sessions (thoughts, branches) and hub activity (workspaces, problems, proposals). If the agent creates a runbook notebook and updates it throughout the session, none of that is visible in the Observatory.

**Impact on demo**: If the demo uses notebooks for the runbook, the human watching the Observatory sees nothing about it. They see thoughts flowing by (if the agent records them), but the runbook artifact — the thing showing the plan and its progress — is invisible.

**What would fix it**: Add `/api/notebooks` endpoint to the Observatory server and a UI panel to display active notebooks and their cells. Medium effort.

### Gap 3: No linkage between notebook cells and thoughts

**Current state**: Thoughts and notebooks are completely separate subsystems. A thought can't reference a notebook cell. A notebook cell can't link to the thought explaining why it was done.

**Impact on demo**: When the agent updates the runbook AND records a thought, these are disconnected. In the Observatory, you can't see "thought #4 was about completing runbook item #2."

**What would fix it**: Add optional `notebookRef`/`cellRef` fields to ThoughtData, or have notebooks emit events to the Observatory emitter. Low effort for the field addition; medium effort for event emission.

### Gap 4: `action_report` schema is heavy for casual progress updates

**Current state**: The `action_report` thoughtType requires `actionResult` with `success` (boolean), `reversible` (yes/no/partial), `tool` (string), and `target` (string) — all required. For a demo where the agent says "I just converted the handlers module to TypeScript," this is overkill. The agent will probably default to `thoughtType: "reasoning"` for everything, which defeats the structured auditability.

**Impact on demo**: The audit_summary at the end shows all thoughts as `reasoning` type. The structured decision/action breakdown the auditability feature was designed to produce is empty.

**What would fix it**: Add a lighter `progress` or `status_update` thoughtType that captures task completion without requiring full action metadata. Low effort.

### Gap 5: Observatory UI doesn't render structured thought types

**Current state**: Five Observatory UI specs exist (SPEC-AUD-001 through 005 in `.specs/auditability/`) defining how to render decision frames, action reports, belief snapshots, etc. as structured visual cards. None are implemented. The Observatory renders all thoughts identically as text blocks.

**Impact on demo**: Even if the agent records perfectly structured `decision_frame` and `action_report` thoughts, the Observatory shows them as plain text. The 3AM auditability vision — structured cards with confidence badges, reversibility indicators, blast radius maps — doesn't exist in the UI.

**What would fix it**: Implement SPEC-AUD-001 at minimum (thoughtType-aware card rendering). The backend data is ready; the UI needs to parse and display it. Medium-high effort for all five specs; SPEC-AUD-001 alone is 3-5 hours per the spec estimate.

### Gap 6: No timeline view showing work-then-report rhythm

**Current state**: The Observatory REST API returns thoughts as a flat list. The `includeTimeline` option on deep_analysis produces only `createdAt`, `updatedAt`, and a fake duration estimate. There's no visualization of the temporal gaps between thoughts — the periods where the agent was doing external work.

**Impact on demo**: After the demo, showing "here's when the agent planned, here's the gap where it worked, here's when it came back" requires reading timestamps manually. The rhythm of the work-report loop isn't visible.

**What would fix it**: Timestamp-gap visualization in the Observatory UI. The data exists (each thought has a timestamp); the rendering doesn't. Low-medium effort.

---

## Spec Inventory

### Implemented (backend data layer)

| Location | Spec | Status |
|----------|------|--------|
| `specs/agent-auditability/SPEC-AUDIT-001-structured-fields.md` | Discriminated union on ThoughtData | Implemented |
| `specs/agent-auditability/SPEC-AUDIT-002-query-operations.md` | read_thoughts filters + audit_summary | Implemented |
| `specs/agent-auditability/SPEC-AUDIT-003-session-manifest.md` | Auto-generated manifest at session close | Implemented |

### Not implemented (Observatory UI layer)

| Location | Spec | Status |
|----------|------|--------|
| `.specs/auditability/SPEC-AUD-001-timeline-structured-decisions.md` | Structured visual cards per thoughtType | Draft |
| `.specs/auditability/SPEC-AUD-002-branch-point-visualization.md` | Decision node visualization | Draft |
| `.specs/auditability/SPEC-AUD-003-confidence-trail.md` | Confidence badges, critique display | Draft |
| `.specs/auditability/SPEC-AUD-004-external-actions.md` | Actions view, blast radius, gap detection | Draft |
| `.specs/auditability/SPEC-AUD-005-session-context-fault-attribution.md` | Fault attribution checklist | Draft |

### Origin document

`pain/3am-auditability.md` — "The Five Things" that a sleep-deprived engineer needs to see in 60 seconds.

---

## Minimum Viable Path for the Demo

The lowest-effort path that still demonstrates the value:

1. **Skip notebooks entirely. Use thoughts as the runbook.** The agent records its plan as a `reasoning` thought, does work, records what it did as another `reasoning` thought, repeats. This works today with zero code changes. The Observatory shows all thoughts. `deep_analysis { analysisType: "audit_summary" }` produces the session summary.

2. **Coach the demo agent to use structured thoughtTypes.** Even though the Observatory won't render them as cards, the data is captured. The `audit_summary` at the end shows the breakdown. You can narrate over it: "Here we can see 3 decisions were made, 5 actions were taken, all successful, all reversible."

3. **Use `read_thoughts` with filters for the post-demo walkthrough.** Show `read_thoughts { thoughtType: "decision_frame" }` to pull just the decisions. Show `read_thoughts { thoughtType: "action_report" }` for just the actions. This demonstrates the queryability even without UI cards.

4. **End with `deep_analysis { analysisType: "audit_summary" }`.** The structured summary is the punchline: here's the machine-readable audit trail of everything the agent did.

**What this gives up**: The visual experience. The Observatory shows plain text instead of structured cards. The runbook-as-editable-document narrative is replaced by runbook-as-thought-sequence. There's no notebook artifact to point to.

**What this preserves**: The core value proposition — an agent that logs its reasoning as structured data, queryable after the fact, with a machine-readable audit trail.
