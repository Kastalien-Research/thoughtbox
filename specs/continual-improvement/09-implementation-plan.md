# Implementation Plan: Continual Self-Improvement System

**Status**: Draft v0.1
**Generated**: 2026-02-11
**Dependencies**: Specs 01-08 in this directory

---

## Guiding Principles

### From the Carlini C Compiler Project

The Anthropic C compiler project (2000 sessions, 16 parallel agents, $20K) established the pattern for large-scale autonomous engineering:

1. **File-based external memory**: Progress docs, structured logs, session summaries that agents read at startup. Not conversation history — persistent files.
2. **Test-driven trajectory**: Replace synchronous human oversight with asynchronous test feedback. Tests are the oracle, not humans.
3. **Agent specialization**: General dev agents, code quality agents, performance agents, docs agents, design critic agents. Each owns a domain.
4. **Git-based synchronization**: Agents coordinate through git — branches, commits, lock files. The repo IS the shared state.
5. **The outer loop**: `while true; do claude -p "$(cat AGENT_PROMPT.md)"; done` — session crashes are expected, not exceptional.

### From This Project's Experience

- **Hooks are the nervous system**: 16 hooks already fire on every tool use, session start/end, compaction, and stop. New capabilities wire in as hooks.
- **Skills are the muscle memory**: 12 skills provide reusable workflows. New workflows are skills, not prose instructions.
- **Beads is the task tracker**: Don't reinvent issue tracking. Use `bd create`, `bd ready`, `bd close`.
- **The Hub is the communication bus**: Multi-agent coordination uses workspaces, problems, proposals, consensus, channels.
- **OODA is the cognitive model**: Every loop follows Observe → Orient → Decide → Act. Don't create new loop shapes.

---

## Phase 0: Foundation (Week 1)

**Goal**: Persistent state that survives session boundaries. Without this, nothing compounds.

### 0.1 Cross-Session Continuity (Spec 04)

**What to build**:

| Artifact | Type | Purpose |
|----------|------|---------|
| `session-handoff.json` schema | JSON Schema | Structured format for session summaries |
| Enhanced `session_start.sh` | Hook (edit existing) | Load previous session's handoff at startup |
| Enhanced `pre_compact.sh` | Hook (edit existing) | Extract and persist session summary before compaction |
| `/session-review` skill | Skill (new) | On-demand session summary for manual handoff |

**Implementation order**:
1. Define `session-handoff.json` schema (reasoning chains, open hypotheses, partial work, key decisions)
2. Enhance `pre_compact.sh` to extract session summary from transcript
3. Enhance `session_start.sh` to inject previous session's summary
4. Create `/session-review` skill for manual summaries

**Validation**: Start a session, do work, trigger compaction, verify new session loads previous context.

### 0.2 Knowledge Accumulation Layer (Spec 02)

**What to build**:

| Artifact | Type | Purpose |
|----------|------|---------|
| `knowledge-query` MCP operation | Gateway extension | Unified query across all knowledge stores |
| Store adapters | TypeScript modules | MEMORY.md adapter, Beads adapter, git history adapter |
| `/knowledge` skill | Skill (new) | Interactive knowledge query interface |

**Implementation order**:
1. Define unified query interface (search term → results from all stores with provenance)
2. Implement MEMORY.md adapter (grep-based, returns matches with line context)
3. Implement Beads adapter (wraps `bd search`)
4. Implement git history adapter (wraps `git log --grep`)
5. Wire adapters into gateway as new `knowledge_query` operation
6. Create `/knowledge` skill

**Validation**: Query "Hub" and get results from MEMORY.md, Beads issues, git commits, and Thoughtbox entities.

### 0.3 Assumption Registry (Spec 07)

**What to build**:

| Artifact | Type | Purpose |
|----------|------|---------|
| `.assumptions/` directory | File-based store | JSONL files for assumption records |
| `assumption-tracker.sh` | Hook (new) | Detect and log assumption-laden tool calls |
| `/assumptions` skill | Skill (new) | Query, verify, and manage assumptions |
| `verify-assumptions.yml` | GitHub Action | Weekly assumption re-verification |

**Implementation order**:
1. Define assumption record schema
2. Seed registry from MEMORY.md gotchas (manually extract existing known assumptions)
3. Create `/assumptions` skill for CRUD operations
4. Create hook that detects external API calls and logs assumptions
5. Create GitHub Action for periodic verification

**Validation**: Run `/assumptions list --stale` and see assumptions that haven't been verified recently.

---

## Phase 1: Automation (Weeks 2-3)

**Goal**: Patterns evolve without manual invocation. The system tracks its own fitness.

### 1.1 Automated Pattern Evolution (Spec 03)

**What to build**:

| Artifact | Type | Purpose |
|----------|------|---------|
| `.dgm/fitness.json` | State file | Pattern fitness scores |
| `.dgm/niche-grid.json` | State file | CycleQD niche champions |
| `.dgm/lineage.json` | State file | Pattern ancestry tracking |
| `.dgm/graveyard/` | Archive dir | Retired patterns with resurrection conditions |
| `fitness-tracker.sh` | Hook (new) | Record pattern usage on every tool use |
| `dgm-evolve.yml` | GitHub Action | Weekly evolution cycle |
| Enhanced `/dgm-evolve` | Command (edit) | Wire to real tracking files |

**Implementation order**:
1. Create `.dgm/` directory with initial state files
2. Create `fitness-tracker.sh` hook that logs which MEMORY.md patterns were referenced
3. Enhance `/dgm-evolve` command to read/write real fitness files
4. Create GitHub Action that runs `/dgm-evolve` weekly
5. Implement stepping stone archive (`.dgm/graveyard/`)

**Validation**: Run several sessions, check that `.dgm/fitness.json` reflects actual pattern usage.

### 1.2 Evaluation Harness (Spec 05)

**What to build**:

| Artifact | Type | Purpose |
|----------|------|---------|
| `.eval/baselines.json` | State file | Baseline metrics for regression detection |
| `.eval/metrics/` | Metrics dir | Per-session metric snapshots |
| `eval-collector.sh` | Hook (new) | Collect metrics on session end |
| `eval-regression.yml` | GitHub Action | Check for metric regressions |
| `/eval` skill | Skill (new) | View metrics, set baselines, run comparisons |

**Implementation order**:
1. Define metric schema (code quality, test pass rate, session turns, token cost, pattern fitness)
2. Create `eval-collector.sh` session-end hook that captures metrics
3. Create baseline establishment workflow
4. Create `/eval` skill for interactive metric exploration
5. Create GitHub Action for regression detection

**Validation**: End a session, verify metrics captured in `.eval/metrics/`. Run `/eval compare --last 5` to see trends.

---

## Phase 2: Integration (Weeks 3-4)

**Goal**: The loops talk to each other. Knowledge flows between timescales.

### 2.1 Unified Loop Controller (Spec 01)

**What to build**:

| Artifact | Type | Purpose |
|----------|------|---------|
| `loop-controller.ts` | Agent SDK script | Outer loop that coordinates all three execution layers |
| `loop-state.json` | State file | Controller state machine |
| `loop-controller.yml` | GitHub Action | Scheduled controller invocation |
| `/loop-status` skill | Skill (new) | View controller state and recent loop activity |

**Implementation order**:
1. Define controller state machine (see 2.1.1 below)
2. Create `loop-state.json` with cross-loop knowledge routing rules
3. Implement `loop-controller.ts` as Agent SDK script (the "while true" outer loop)
4. Create GitHub Action that triggers controller on schedule (daily check, weekly full cycle)
5. Create `/loop-status` skill

**Validation**: Run controller, verify it picks up interactive session learnings and routes them to SIL discovery queue.

#### 2.1.1 Never-Idle Controller State Machine

The controller state machine has no terminal state. When all backlogs are empty and no regressions need attention, the controller enters **exploration mode** using the research-taste QD workflow library (`research-workflows/workflows.db`).

```
                ┌──────────────────────────────────────────┐
                │         CONTROLLER MAIN LOOP              │
                │                                           │
                │  while true:                              │
                │    1. CHECK BACKLOG                       │
                │       ├─ beads: bd ready                  │
                │       ├─ assumptions: stale count         │
                │       ├─ eval: regression sentinel        │
                │       └─ intake queue: pending entries     │
                │                                           │
                │    2. DISPATCH (if work found)             │
                │       ├─ Triage → triage-fix / hook-health│
                │       ├─ Research → dependency-verifier /  │
                │       │             assumption-auditor     │
                │       ├─ Coordinate → coordination /       │
                │       │               cost-governor        │
                │       └─ Verify → judge / sentinel         │
                │                                           │
                │    3. EXPLORE (if backlog empty)           │
                │       ├─ Select workflow from QD grid      │
                │       │  (MAP-Elites: pick least-explored  │
                │       │   niche, not highest fitness)       │
                │       ├─ Run research-taste with workflow   │
                │       ├─ If verdict = "proceed":           │
                │       │   → bd create (new improvement)    │
                │       │   → loop back to step 1            │
                │       ├─ If verdict = "defer"/"kill":      │
                │       │   → update workflow fitness         │
                │       │   → select next niche              │
                │       └─ Budget gate: stop after $N spent   │
                │                                           │
                │    4. CHECKPOINT                           │
                │       ├─ Write controller-state.json       │
                │       ├─ Update cost-governor metrics      │
                │       └─ Sleep until next trigger          │
                └──────────────────────────────────────────┘
```

**Exploration mode details**:

The QD workflow library provides behavioral diversity in how the system explores. Instead of always running the same research strategy, the controller selects workflows from under-explored niches in the 5D grid (`coord_scope × coord_domain_structure × coord_evidence_type × coord_time_horizon × coord_fidelity`).

Selection strategy per iteration:
1. Query `map_elites_grid` for cells with `times_used = 0` (unexplored niches first)
2. If all niches explored, select the niche with lowest `times_used / fitness_score` ratio (under-tested high-potential)
3. Run `research-taste` with the selected workflow as its strategy
4. Record outcome in `taste_evaluations` and `executions` tables
5. If taste verdict is "proceed", create a beads issue and the controller re-enters dispatch mode
6. If taste verdict is "kill" or "defer", update `fitness_score` via exponential moving average and try the next niche

**Budget gate**: Exploration mode has its own budget ceiling (configurable, default $5/day). The cost-governor agent enforces this. When the exploration budget is exhausted, the controller sleeps until the next scheduled trigger.

**The key property**: The system never asks "what should I do?" — it always has a next action. Work backlog items take priority. When the backlog is clear, the system explores for new improvement opportunities using diverse strategies. When exploration finds something, it becomes backlog. The loop is self-sustaining.

### 2.2 Compound Engineering Integration (Spec 08)

**What to build**:

| Artifact | Type | Purpose |
|----------|------|---------|
| Agent-to-loop mapping | Config file | Maps compound agents to improvement loop phases |
| `/compound-review` skill | Skill (new) | Invoke compound reviewers in loop context |
| Enhanced SIL scripts | Edit existing | Wire compound researchers into Discovery phase |

**Implementation order**:
1. Create mapping config: which compound agents serve which loop phases
2. Create `/compound-review` skill that invokes the right reviewers based on context
3. Wire compound researchers into SIL Discovery phase
4. Wire compound reviewers into SIL Evaluate phase
5. Test PLOW cycle integration with existing OODA loops

**Validation**: Run SIL Discovery phase, verify compound researchers are invoked and their findings enter the knowledge layer.

---

## Phase 3: Orchestration (Weeks 4-5)

**Goal**: The full engineering team spins up on demand.

### 3.1 Agent Team Orchestration (Spec 06)

**What to build**:

| Artifact | Type | Purpose |
|----------|------|---------|
| Enhanced `/team` skill | Skill (edit existing) | Single command to launch full engineering team |
| Team role configs | Config files | Per-role spawn prompts with file-based memory |
| `team-checkpoint.sh` | Hook (new) | Periodic team progress snapshots |
| `team-coordinator.ts` | Agent SDK script | Headless team coordinator (C compiler pattern) |

**Implementation order**:
1. Define team role configs with file-based memory pattern (progress.md per agent)
2. Enhance `/team` skill to handle full lifecycle: spawn → coordinate → checkpoint → handoff
3. Create `team-checkpoint.sh` hook for progress snapshots
4. Create `team-coordinator.ts` as the "while true" outer loop for headless team runs
5. Integrate with Hub workspaces for structured coordination

**Validation**: Run `/team deploy --roles triage-fix,verification-judge --task "fix test failures"`, verify agents coordinate through Hub and produce commits.

---

## Phase 4: Calibration (Ongoing)

**Goal**: The system calibrates itself. What works survives. What doesn't fades.

This phase has no discrete deliverables. It's the system operating. The measures of success:

| Signal | Measurement | Target |
|--------|-------------|--------|
| Pattern fitness convergence | `.dgm/fitness.json` scores stabilize | 80% patterns have stable scores after 4 weeks |
| Knowledge accumulation rate | New entities/observations per week | Monotonically increasing |
| Assumption verification | % of assumptions verified in last 30 days | >90% |
| Session continuity quality | Session start priming relevance (1-10 rating) | >7 average |
| Evaluation regression rate | False positive escalations per week | <2 |
| Cross-loop knowledge flow | Learnings from interactive that reach SIL | >50% within 1 week |

---

## Adversarial Subsystem

Two self-improving adversarial agents operate across all phases. They share a persistent playbook in the QD database (`research-workflows/workflows.db`) with two tables: `adversarial_findings` (what they found) and `attack_patterns` (which strategies work).

### Agents

| Agent | Role Type | Specialization | Model |
|-------|-----------|----------------|-------|
| `devils-advocate` | General adversarial | Logical gaps, missed edge cases, assumption mining, spec-implementation divergence | Opus |
| `silent-failure-hunter` | Pipeline adversarial | Error swallowing, default masking, early exits, schema mismatches, phantom reads | Sonnet |

### Self-Improvement Mechanism

Both agents improve through a shared feedback loop:

1. **Attack patterns** track hit rates across runs. High-hit-rate patterns are used first; zero-hit patterns after 5+ uses are deprioritized.
2. **The "Missed Bug" protocol**: When a real bug is found in production that a previous hunt should have caught, it's recorded as a miss. New attack patterns are derived from misses — this is the highest-value learning signal.
3. **Cross-agent learning**: The silent-failure-hunter reads devil's advocate findings to avoid duplicating work. Both agents read each other's pattern discoveries.
4. **Novel pattern quota**: Every run must try at least 2 new attack patterns. This prevents playbook stagnation.

### Integration Points

- **Pre-merge**: Run `devils-advocate` on any spec or plan before it moves from Draft to Implementation
- **Post-implementation**: Run `silent-failure-hunter` on all new hooks and state file pipelines
- **Weekly SIL Evaluate phase**: Both agents can be invoked as part of the compound review panel
- **Exploration mode**: When the ULC has no backlog, adversarial runs count as exploration (they may discover issues that become backlog items)

### SDK Scripts (not thin wrappers)

Unlike the other agent SDK scripts, `devils-advocate.ts` and `silent-failure-hunter.ts` are enriched wrappers that:
1. Initialize the playbook tables if they don't exist
2. Query past findings and pattern hit rates from the QD database
3. Inject playbook context into the agent prompt
4. The agent itself records new findings via `sqlite3` Bash calls during the run

---

## Dual-Invocation Architecture

Every agent in the system has two invocation paths that share the same data stores:

### Path 1: Claude Code Sub-Agents (Task tool)

For interactive/conversational use during a session. The parent agent reads the `.claude/agents/<name>.md` definition and passes its content to a `general-purpose` sub-agent:

```
Task(
  subagent_type: "general-purpose",  // gets all tools including ToolSearch
  prompt: "<agent .md body content> + <task-specific prompt>",
  run_in_background: true            // ALWAYS — enables force-kill
)
```

The 5 canonical agents also have dedicated sub-agent types (`triage-fix`, `dependency-verifier`, `research-taste`, `coordination-momentum`, `verification-judge`) but use `general-purpose` when MCP tool access is needed.

### Path 2: Agent SDK Scripts (`scripts/agents/`)

For headless/scheduled invocation via `npx tsx scripts/agents/<name>.ts --prompt "..."`. Uses `@anthropic-ai/claude-agent-sdk` `query()` function with the same agent definition as system prompt.

### Shared Data Stores

Both paths read/write to the same locations:

| Store | Path | Agents |
|-------|------|--------|
| QD/MAP-Elites database | `research-workflows/workflows.db` | research-taste, devils-advocate, silent-failure-hunter, ULC |
| Adversarial playbook | `research-workflows/workflows.db` (adversarial_findings, attack_patterns tables) | devils-advocate, silent-failure-hunter |
| Pattern fitness | `.dgm/fitness.json` | hook-health, regression-sentinel, ULC |
| Eval metrics | `.eval/metrics/` | eval-collector, regression-sentinel, cost-governor |
| Assumption registry | `.assumptions/registry.jsonl` | assumption-auditor |
| AgentOps cost data | `agentops/runs/` | cost-governor |
| Beads issue tracker | `.beads/` | all agents (via `bd` CLI) |

### Enriched vs Thin Wrappers

Most SDK scripts are **thin wrappers** — they call `runAgentFile()` which reads the `.claude/agents/<name>.md` and passes it through. These are functionally identical to the sub-agent path.

Two scripts are **enriched wrappers** — `devils-advocate.ts` and `silent-failure-hunter.ts` — which pre-load context from the QD database before spawning the agent. For the sub-agent path, this context is loaded by the agent itself during execution (the `.md` definitions include SQLite queries the agent runs via Bash).

### Why Both Paths

| Concern | Sub-Agent (Task) | SDK Script |
|---------|------------------|------------|
| Interactive use | Yes — conversational, parent monitors | No — fire and forget |
| Scheduled/headless | No — requires active session | Yes — cron, GitHub Actions |
| MCP tool access | Via ToolSearch | Via ToolSearch |
| Cost tracking | Parent sees cost | `Result:` line in stdout |
| Force-kill | Yes (TaskStop) | Yes (process signal) |
| LangSmith tracing | Inherited from parent session | Instrumented via `wrapClaudeAgentSDK` |
| Playbook injection | Agent loads via Bash at runtime | Script pre-loads and injects |

---

## LangSmith Integration

### Current State

LangSmith is already partially configured:

- **Claude Code session tracing**: `.claude/hooks/stop.sh` (957 lines) traces complete sessions to LangSmith
- **Environment variables**: `.env` has `LANGSMITH_API_KEY`, `LANGSMITH_ORG_ID`, `LANGSMITH_WORKSPACE_ID`, `LANGSMITH_PROJECT`
- **AgentOps TracingClient**: `agentops/runner/lib/trace.ts` is a stub — local-only logging, no HTTP transport to LangSmith

### Integration Plan

#### Phase L1: Validate Existing Setup

1. Confirm `stop.sh` hook is producing traces in the LangSmith project
2. Check trace completeness — are tool calls, durations, and costs captured?
3. Establish baseline: what data is already available for analysis?

#### Phase L2: Instrument Agent SDK Scripts

The official Claude Agent SDK integration is available:

```typescript
import { wrapClaudeAgentSDK } from "langsmith/experimental/anthropic";
```

Add LangSmith wrapping to `run-agent-util.ts` so all SDK scripts automatically trace:

```typescript
// In runAgentFile():
const tracedQuery = wrapClaudeAgentSDK(query);
const q = tracedQuery({ prompt, options });
```

Each agent run becomes a traced experiment in LangSmith with:
- Agent type as run name
- Input prompt as input
- Cost, turns, and output as metadata
- Full tool call chain as child spans

#### Phase L3: Create Adversarial Evaluation Datasets

Use LangSmith Datasets to create adversarial test cases:

1. **Spec-implementation divergence dataset**: Known spec violations paired with the code that violates them
2. **Silent failure dataset**: Known silent failures paired with the code paths that produce them
3. **Regression dataset**: Historical metric snapshots paired with known regressions

These datasets feed adversarial agent evaluations — run the agent, compare output against known answers.

#### Phase L4: Experiment-Based SIL

Wire LangSmith experiments into the Self-Improvement Loop:

1. SIL Discovery phase creates experiments (hypothesis → agent run → results)
2. SIL Evaluate phase compares experiment results against baselines
3. SIL Decide phase uses LangSmith's comparison UI for human review
4. Results feed back into the QD database as fitness signals

#### Phase L5: Online Monitoring

Use LangSmith's monitoring for production agent health:

- Alert on cost spikes (replaces/augments cost-governor)
- Track agent success rates over time
- Detect prompt drift via trace comparison
- Dashboard for system-wide agent activity

### LangSmith Budget

LangSmith tracing adds ~5-10% overhead to API calls. This is within acceptable margins for the observability it provides. The cost-governor should track LangSmith costs as a separate line item.

---

## Robustness Strategy

### Against Context Rot

Context rot = when context window fills with stale or irrelevant information, crowding out useful signal.

**Defenses**:
1. **MEMORY.md size cap**: The auto memory directory has a 200-line truncation rule. Enforce it.
2. **Freshness tags**: HOT/WARM/COLD on all persistent patterns. COLD patterns archived, not loaded.
3. **Session handoff compression**: The handoff protocol extracts key decisions, not full transcripts.
4. **Hook output minimization**: Hooks output structured JSON, not prose. `hookSpecificOutput` is small.
5. **Knowledge graph over flat files**: Queries return targeted results, not full dumps.

### Against Drift

Drift = when the system's behavior gradually diverges from intended behavior without detection.

**Defenses**:
1. **Evaluation baselines**: Metrics compared against baselines catch gradual degradation.
2. **Assumption verification**: Stale assumptions are re-tested before they cause failures.
3. **CODEOWNERS on governance**: Human approval required for changes to rules, hooks, governance files.
4. **DGM fitness tracking**: Patterns that stop working get demoted automatically.
5. **Spiral detection**: Built into every loop — catches thrashing before it compounds.

### Against Fragmentation

Fragmentation = when knowledge exists but can't be found because it's in the wrong store.

**Defenses**:
1. **Unified knowledge query**: Single query searches all stores.
2. **Cross-referencing protocol**: Entities in one store link to entities in another.
3. **Ingestion pipeline**: Every loop phase deposits findings in the knowledge layer, not just local state.
4. **Session handoff includes knowledge references**: Not just "what I did" but "what I found and where I stored it."

---

## Instantiation Artifacts Summary

### New Skills (`.claude/skills/`)

| Skill | Invocation | Purpose |
|-------|------------|---------|
| Session Review | `/session-review` | Generate structured session summary on demand |
| Knowledge Query | `/knowledge` | Unified cross-store knowledge query |
| Assumptions | `/assumptions` | Manage assumption registry |
| Eval | `/eval` | View metrics, baselines, comparisons |
| Loop Status | `/loop-status` | View unified loop controller state |
| Compound Review | `/compound-review` | Invoke compound reviewers in loop context |

### New/Enhanced Hooks (`.claude/hooks/`)

| Hook | Event | Purpose |
|------|-------|---------|
| `session_start.sh` (enhanced) | SessionStart | Load previous session handoff |
| `pre_compact.sh` (enhanced) | PreCompact | Extract and persist session summary |
| `fitness-tracker.sh` (new) | PostToolUse | Track pattern usage for DGM |
| `assumption-tracker.sh` (new) | PostToolUse | Detect assumption-laden external calls |
| `eval-collector.sh` (new) | Stop | Capture session metrics |
| `team-checkpoint.sh` (new) | SubagentStop | Snapshot team progress |

### New Agent Definitions (`.claude/agents/`)

| Agent | Role Type | agent_id | Purpose |
|-------|-----------|----------|---------|
| `hook-health.md` | Triage & Fix | triage-fix-02 | Diagnose hook failures, silent data corruption, schema mismatches |
| `assumption-auditor.md` | Research & Reality-Check | dependency-verifier-02 | Proactive assumption registry auditing on schedule |
| `cost-governor.md` | Coordination & Momentum | coordination-momentum-02 | Aggregate cost tracking and budget enforcement |
| `regression-sentinel.md` | Verification & Validation | verification-judge-02 | Longitudinal metric trend analysis and regression detection |
| `devils-advocate.md` | Adversarial | adversarial-01 | General adversarial review with self-improving playbook |
| `silent-failure-hunter.md` | Adversarial | adversarial-02 | Silent failure detection across data pipelines and hooks |

### New Agent SDK Scripts (`scripts/agents/`)

| Script | Schedule | Purpose |
|--------|----------|---------|
| `loop-controller.ts` | Daily + Weekly | Unified loop controller outer loop |
| `team-coordinator.ts` | On-demand | Headless team coordinator (C compiler pattern) |
| `hook-health.ts` | On-demand / session-end | Hook infrastructure diagnosis |
| `assumption-auditor.ts` | Weekly (GitHub Action) | Assumption registry staleness audit |
| `cost-governor.ts` | Daily rollup | Agent spend tracking and budget enforcement |
| `regression-sentinel.ts` | Post-session / daily | Eval metric trend analysis |
| `devils-advocate.ts` | Pre-merge / on-demand | Adversarial review (enriched wrapper with playbook injection) |
| `silent-failure-hunter.ts` | Post-implementation / weekly | Silent failure scanning (enriched wrapper with playbook injection) |

### New GitHub Actions (`.github/workflows/`)

| Action | Trigger | Purpose |
|--------|---------|---------|
| `dgm-evolve.yml` | Weekly (cron) | Automated pattern evolution cycle |
| `eval-regression.yml` | On PR + Weekly | Metric regression detection |
| `verify-assumptions.yml` | Weekly (cron) | Assumption re-verification |

### New State Directories

| Directory | Contents | Purpose |
|-----------|----------|---------|
| `.dgm/` | fitness.json, niche-grid.json, lineage.json, graveyard/ | Pattern evolution state |
| `.eval/` | baselines.json, metrics/ | Evaluation harness state |
| `.assumptions/` | assumption records (JSONL) | Assumption registry |
| `.sessions/` | session-handoff JSON files | Cross-session continuity |

---

## Dependency Graph

```
Phase 0 (Foundation):
  04-cross-session ──────────────────────────────────────────┐
  02-knowledge-layer ────────────────────────────────────────┤
  07-assumption-registry ────────────────────────────────────┤
                                                              │
Phase 1 (Automation):                                         ▼
  03-pattern-evolution ──── depends on: 02 (knowledge layer) ┤
  05-evaluation-harness ── depends on: 04 (session metrics)  ┤
                                                              │
Phase 2 (Integration):                                        ▼
  01-unified-loop ──────── depends on: 02, 03, 04, 05       ┤
  08-compound-integration ─ depends on: 01 (loop phases)     ┤
                                                              │
Phase 3 (Orchestration):                                      ▼
  06-agent-teams ──────── depends on: 01, 02, 04, 05
```

---

## Reusability: The "Another Agent" Test

The workflow should pass this test: **Can another agent, in another project, use these patterns to build a complex application end-to-end?**

### What transfers directly:
- Hook patterns (session start/end, pattern detection, fitness tracking)
- Skill templates (SKILL.md format with OODA phases)
- DGM fitness tracking (pattern evolution is project-agnostic)
- Session handoff protocol (any project benefits from session continuity)
- Evaluation harness (metrics schema is customizable per project)
- Agent team orchestration (role configs are project-specific, lifecycle is generic)

### What requires project-specific configuration:
- Knowledge store adapters (different projects have different stores)
- Assumption categories (different projects depend on different external systems)
- Evaluation metrics (different projects measure different things)
- SIL spec registry (different projects have different improvement specs)
- Compound agent mapping (different projects use different compound agents)

### The Bootstrap Pattern

To use this system in a new project:

1. Copy `.claude/hooks/`, `.claude/skills/`, `.claude/rules/` as templates
2. Create `.dgm/`, `.eval/`, `.assumptions/`, `.sessions/` directories
3. Configure `settings.json` to wire hooks to events
4. Seed `.assumptions/` with known external dependencies
5. Seed `.dgm/fitness.json` with initial pattern population
6. Run `/session-review` at end of first session to establish baseline
7. The system bootstraps from there — each session adds knowledge, patterns evolve, assumptions get verified
