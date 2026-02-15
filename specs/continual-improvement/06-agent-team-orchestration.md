# SPEC-CI-006: Agent Team Orchestration

**Status**: Draft v0.1
**Generated**: 2026-02-11
**Author**: Agent-assisted (Claude Opus 4.6)
**Context**: Thoughtbox Continual Self-Improvement System
**Parent**: [00-overview.md](./00-overview.md) -- Gap 6
**Dependencies**: [02-knowledge-accumulation-layer.md](./02-knowledge-accumulation-layer.md) (soft), [04-cross-session-continuity.md](./04-cross-session-continuity.md) (soft)

---

## Problem Statement

The agentic-dev-team-spec (`agentic-dev-team/agentic-dev-team-spec.md`) defines four roles for an engineering system that absorbs the costs a solo founder handles in series:

| Role | Cost Absorbed | Agent ID | Status |
|------|--------------|----------|--------|
| **Triage & Fix** | Technical cost of unexpected failures | `triage-fix-01` | Agent definition exists (`.claude/agents/triage-fix.md`) |
| **Research & Reality-Check** | Knowledge cost of unknown unknowns | `research-reality-01` | Partially implemented as `research-taste.md` + `dependency-verifier.md` |
| **Coordination & Momentum** | Coordination cost of parallel workstreams | `coordination-momentum-01` | Agent definition exists (`.claude/agents/coordination-momentum.md`) |
| **Verification & Validation (Judge)** | Verification cost of quality assurance | `verification-judge-01` | Agent definition exists (`.claude/agents/verification-judge.md`) |

These definitions exist as individual agent files, but there is no mechanism to:

1. **Spin up the full engineering system on demand.** Launching a team requires manually registering on the Hub, creating a workspace, decomposing problems, spawning each agent with the correct prompt, and verifying Hub integration within 90 seconds. This sequence has failed in 3 out of 5 proof runs (Run 001, 003, 004) due to missed steps.

2. **Coordinate through the Hub automatically.** The Hub provides workspaces, problems, proposals, reviews, channels, and consensus. But connecting agents to these primitives requires Thoughtbox bootstrap instructions in every spawn prompt, ToolSearch verification before spawning, and a post-spawn integration gate. When any step is skipped, agents work in isolation and the Hub trail is empty.

3. **Scale beyond 4-5 agents.** The current skill (`/deploy-team`) manages a small team through sequential spawning with manual verification. For larger problems (e.g., the "C compiler pattern" of 16 parallel agents), the coordination overhead of individual verification gates exceeds the value of parallel execution.

4. **Share discoveries across teammates.** Agents record thoughts via the Gateway and post to Hub channels, but there is no structured mechanism for one agent's discovery to influence another agent's work in real time. Channel messages require the consuming agent to poll `read_channel` on every problem, which does not scale.

5. **Persist team state across sessions.** The Observatory session store is in-memory only. When a team session ends, the coordination trail (who worked on what, what was decided, what remains) exists only in the Hub workspace -- which must be queried manually by the next session.

### Lessons from Proof Runs

Five proof runs (2026-02-07 through 2026-02-09) established empirically what works and what does not:

| Run | What Worked | What Failed | Root Cause |
|-----|------------|-------------|------------|
| 001 | Sub-agent identity isolation, cross-workspace visibility | Sequential spawning bottleneck | Used Task tool instead of TeamCreate |
| 003 | Hub data model for coordination | No inter-agent communication | Used Task sub-agents, not Agent Teams |
| 004 | Detailed spawn prompts with line numbers | Agents lacked MCP tool access | ToolSearch missing from agent frontmatter; agent definitions cached at session start |
| 005a | Team created, agents posted to Hub | Coordinator shut down first, stranding teammates | No shutdown protocol |
| 005b | 3 agents coordinating through Hub + Gateway simultaneously | Full lifecycle proof | Spawned as `general-purpose` with role instructions in prompt |

**The critical discovery from Run 005b**: Custom `subagent_type` values (`triage-fix`, `verification-judge`, etc.) do NOT receive ToolSearch in the Agent Teams context. Only `subagent_type: "general-purpose"` gets all tools, including ToolSearch. Role-specific behavior must be encoded in the spawn prompt, not the agent type.

---

## Architecture

### Design Principle: File-Based Coordination, Git-Based Sync

The team orchestration system follows the "C compiler pattern" observed in large-scale agent deployments: multiple agents work on independent units of work, coordinating through shared state in the filesystem and synchronizing through git. The Hub serves as the structured coordination layer on top of this pattern.

```
                    ┌────────────────────────────────────┐
                    │         CHIEF AGENTIC (Human)       │
                    │   Escalations ↑       ↓ Decisions   │
                    └────────────┬───────────┬────────────┘
                                 │           │
                    ┌────────────┴───────────┴────────────┐
                    │       TEAM ORCHESTRATOR SKILL        │
                    │                                      │
                    │  /team-deploy <spec> [--scale N]     │
                    │                                      │
                    │  1. Parse spec → problem graph       │
                    │  2. Create Hub workspace             │
                    │  3. Select team composition           │
                    │  4. Spawn agents (background)        │
                    │  5. Verify integration (90s gate)    │
                    │  6. Monitor + coordinate             │
                    │  7. Checkpoint + handoff             │
                    │  8. Shutdown (coordinator last)      │
                    └─┬──────┬──────┬──────┬──────┬───────┘
                      │      │      │      │      │
              ┌───────┴──┐ ┌─┴────┐ ┌┴─────┐ ┌───┴──┐ ┌───┴──┐
              │ Triage   │ │Resrch│ │Coord │ │Judge │ │ ...  │
              │ & Fix    │ │Realiy│ │Momnm │ │      │ │(N-4) │
              │          │ │Check │ │      │ │      │ │      │
              │ general- │ │gen-  │ │gen-  │ │gen-  │ │gen-  │
              │ purpose  │ │purp  │ │purp  │ │purp  │ │purp  │
              └────┬─────┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
                   │          │        │        │        │
              ┌────┴──────────┴────────┴────────┴────────┴────┐
              │              THOUGHTBOX HUB                    │
              │                                                │
              │  Workspace ─→ Problems (with deps) ─→          │
              │  Proposals (with reviews) ─→ Consensus         │
              │  Channels (structured dialectic)               │
              └────────────────────┬───────────────────────────┘
                                   │
              ┌────────────────────┴───────────────────────────┐
              │              THOUGHTBOX GATEWAY                 │
              │                                                │
              │  Thought chains ─→ Branches ─→ Deep analysis   │
              │  Cipher notation ─→ Mental model               │
              │  (per-agent reasoning, not shared by default)   │
              └────────────────────────────────────────────────┘
```

### Coordination Layers

The system uses three coordination layers, each at a different granularity:

| Layer | Mechanism | Granularity | Visibility |
|-------|-----------|-------------|------------|
| **Hub Workspace** | Problems, proposals, consensus, channels | Task-level (hours) | All workspace members |
| **Hub Channels** | Structured messages per problem | Update-level (minutes) | All workspace members |
| **Gateway Thoughts** | Private reasoning chains per agent | Decision-level (seconds) | Agent-only (unless shared via thought refs in proposals) |

Agents share discoveries through Hub channels and proposals. They do NOT share raw thought chains -- this preserves the isolation principle required by the Verification Judge (Role 4 in the agentic-dev-team-spec).

---

## Team Composition

### The Four Core Roles

Each role maps to a spawn prompt template with Hub bootstrap instructions. All agents spawn as `subagent_type: "general-purpose"` with role behavior encoded in the prompt.

#### Role 1: Triage & Fix

**When to deploy**: Test failures, build errors, integration breakdowns, runtime exceptions.

**Hub behavior**: Claims problems, posts diagnostic findings to channels, creates proposals with before/after evidence, updates problem status on resolution.

**Budget**: `maxTurns: 15`, timeout 30 minutes. Max 3 repair attempts before escalation.

**Spawn prompt includes**: Ulysses Protocol (time-boxed phases), spiral detection, boundary conditions from `agentic-dev-team-spec.md` Role 1.

#### Role 2: Research & Reality-Check

**When to deploy**: External dependency assumptions, spec vs. implementation gaps, ecosystem adoption questions.

**Hub behavior**: Creates investigation problems for each assumption, posts evidence to channels with confidence scores, escalates failed assumptions immediately via Hub messages.

**Budget**: `maxTurns: 20`, timeout 60 minutes. Per-assumption verification.

**Spawn prompt includes**: Fact-checking protocol, 3% rule (Virgil Protocol), confidence scoring, assumption registry updates.

**Implementation note**: This role is currently split across two agent definitions (`research-taste.md` for evaluation and `dependency-verifier.md` for verification). The team orchestrator merges their capabilities in a single spawn prompt for the Research & Reality-Check teammate.

#### Role 3: Coordination & Momentum

**When to deploy**: Always. This role runs for the full duration of a team session.

**Hub behavior**: Monitors `workspace_digest` periodically, posts status summaries to a coordination channel, detects conflicts between parallel workstreams, reorders task execution within priority constraints.

**Budget**: `maxTurns: 25`, timeout matches the team session duration.

**Spawn prompt includes**: OODA loop, queue processing, dependency graph analysis, spiral detection at the system level. Read-only (no Edit/Write tools).

**Critical constraint**: This agent MUST NOT re-prioritize work. It CAN reorder tasks within a priority level.

#### Role 4: Verification & Validation (Judge)

**When to deploy**: After implementation work is marked complete by another agent.

**Hub behavior**: Reviews proposals independently (no access to producing agent's reasoning chain), runs deterministic verification first, posts verdict to Hub with structured pass/fail evidence.

**Budget**: `maxTurns: 10`, timeout 15 minutes. Max 3 verification iterations.

**Spawn prompt includes**: Verification hierarchy (deterministic then judgment-based), multi-perspective review (Logician, Architect, Security Guardian, Implementer), isolation requirement.

**Critical constraint**: This agent MUST NOT share context with producing agents. It validates against specs, not intentions.

### Team Composition Templates

Not every task requires all four roles. The orchestrator selects a composition based on the task type:

| Task Type | Agents | Rationale |
|-----------|--------|-----------|
| **Bug fix** | Triage-Fix + Judge | Fix the problem, verify it's actually fixed |
| **Feature implementation** | Triage-Fix + Judge + Coordination | Implement, verify, keep momentum on other work |
| **Dependency investigation** | Research + Triage-Fix | Verify assumptions, fix what's broken |
| **Full project sprint** | All 4 roles | Absorb all cost types simultaneously |
| **Review-heavy** | Judge + Coordination | Validate existing work, manage workstreams |
| **Research spike** | Research + Research (x2) | Parallel hypothesis investigation, no implementation |

### Scaling: The C Compiler Pattern

For large problem spaces (10+ independent units of work), the team scales horizontally:

```
Problem Graph:
  P1 ──→ P4
  P2 ──→ P4
  P3 ──→ P5
  P4 ──→ P6
  P5 ──→ P6

Phase 1 (parallel): Triage-Fix-A(P1), Triage-Fix-B(P2), Triage-Fix-C(P3)
Phase 2 (parallel): Triage-Fix-A(P4), Triage-Fix-B(P5)   [P1,P2,P3 resolved]
Phase 3 (serial):   Triage-Fix-A(P6)                       [P4,P5 resolved]

Throughout: Coordination agent monitors dependency graph
After each phase: Judge verifies completed work
```

**Key principles for scale**:

1. **Parallelize by problem, not by role.** Each independent problem gets its own Triage-Fix agent. The Coordination agent manages the dependency graph. The Judge verifies completed phases.

2. **File-based partitioning.** Each agent works on a defined set of files. The Coordination agent detects file-level conflicts before they become merge conflicts. Agents that need to modify the same file are serialized via Hub problem dependencies.

3. **Git-based sync.** Agents commit their changes on the same branch. The Coordination agent runs `git pull --rebase` periodically and flags conflicts for resolution. This is the same pattern used by human engineering teams.

4. **Checkpoint between phases.** After each phase, the orchestrator creates a Hub consensus marker recording what was completed, verified, and remains. This enables session handoff (see Lifecycle below).

---

## Team Lifecycle

### Phase 1: Bootstrap

```
┌──────────────────────────────────────────────────────────────┐
│  Orchestrator (human invokes /team-deploy)                    │
│                                                               │
│  1. Parse task → identify problem graph                       │
│  2. Select team composition (from templates above)            │
│  3. Verify prerequisites:                                     │
│     a. ToolSearch in all agent definitions (grep check)       │
│     b. Commit any uncommitted agent changes                   │
│     c. Docker/MCP server accessible                           │
│  4. Register on Hub as MANAGER                                │
│  5. Create workspace with descriptive name                    │
│  6. Decompose task into Hub problems with dependency edges    │
│  7. Record initial hypotheses as thoughts                     │
└──────────────────────────────────────────────────────────────┘
```

### Phase 2: Spawn

```
┌──────────────────────────────────────────────────────────────┐
│  For each agent in the selected composition:                  │
│                                                               │
│  1. Build spawn prompt from:                                  │
│     a. Role template (.claude/team-prompts/*)                 │
│     b. Thoughtbox process (_thoughtbox-process.md)            │
│     c. Workspace ID + problem IDs                             │
│     d. Task-specific instructions                             │
│                                                               │
│  2. Spawn with TeamCreate:                                    │
│     - subagent_type: "general-purpose"  ← MANDATORY           │
│     - run_in_background: true           ← MANDATORY           │
│     - Prompt includes 4-step Thoughtbox bootstrap             │
│                                                               │
│  3. Record task_id for later monitoring/kill                  │
└──────────────────────────────────────────────────────────────┘
```

**Spawn prompt structure** (every agent, regardless of role):

```markdown
# {{ROLE_NAME}} Teammate

You are a {{ROLE_NAME}} in an Agent Team. Your workspace ID is: `{{WORKSPACE_ID}}`

## Step 1: Bootstrap Thoughtbox (DO THIS FIRST)

Use ToolSearch to load mcp__thoughtbox__thoughtbox_hub AND mcp__thoughtbox__thoughtbox_gateway.
Then run ALL FOUR of these calls:

1. thoughtbox_hub { operation: "quick_join", args: { name: "{{AGENT_NAME}}", workspaceId: "{{WORKSPACE_ID}}", profile: "{{PROFILE}}" } }
2. thoughtbox_gateway { operation: "cipher" }
3. thoughtbox_gateway { operation: "thought", args: { content: "Starting work on {{TASK}}" } }
4. thoughtbox_hub { operation: "post_message", args: { workspaceId: "{{WORKSPACE_ID}}", problemId: "{{PROBLEM_ID}}", content: "{{AGENT_NAME}} joined. Starting {{TASK}}." } }

DO NOT proceed to Step 2 until all four calls succeed.

## Step 2: Your Assignment

{{ROLE-SPECIFIC INSTRUCTIONS}}

## Step 3: During Work

- Record key decisions as thoughts via thoughtbox_gateway { operation: "thought" }
- Post progress updates to hub channels via thoughtbox_hub { operation: "post_message" }
- Use cipher notation (loaded via cipher operation above)
- Check workspace_digest before starting new work to avoid duplication

## Step 4: Completion

1. Record a final thought with summary and outcome
2. Post completion report to Hub channel
3. Report to team-lead via SendMessage

## IMPORTANT

- subagent_type must be "general-purpose" — you have full tool access
- Use ToolSearch to load any MCP tools you need
- DO NOT skip the Thoughtbox bootstrap in Step 1
```

### Phase 3: Integration Gate (90 seconds)

```
┌──────────────────────────────────────────────────────────────┐
│  Wait 90 seconds after final spawn, then:                     │
│                                                               │
│  1. Check workspace members:                                  │
│     thoughtbox_hub { operation: "list_members",               │
│                      args: { workspaceId: "..." } }           │
│                                                               │
│  2. Check channel activity:                                   │
│     thoughtbox_hub { operation: "read_channel",               │
│                      args: { workspaceId: "...",              │
│                              problemId: "..." } }             │
│                                                               │
│  For each agent NOT on the hub:                               │
│     a. Send inbox message asking for status                   │
│     b. Wait 30 more seconds                                   │
│     c. If still absent: kill and respawn with same prompt     │
│                                                               │
│  DO NOT proceed until all agents confirmed on hub.            │
└──────────────────────────────────────────────────────────────┘
```

This gate is non-negotiable. The purpose of Agent Teams is Hub coordination. An agent that is not on the Hub is not contributing to the coordination trail.

### Phase 4: Monitor & Coordinate

```
┌──────────────────────────────────────────────────────────────┐
│  Periodic loop (every 2-5 minutes):                           │
│                                                               │
│  1. workspace_digest → current state of all problems          │
│  2. Check for pending proposals → review or delegate review   │
│  3. Check for escalations in channels → handle or escalate    │
│  4. Check for dependency unlocks → notify blocked agents      │
│  5. Check for file conflicts → alert Coordination agent       │
│                                                               │
│  If Coordination agent is active, delegate monitoring to it.  │
│  Orchestrator focuses on escalations and consensus.           │
└──────────────────────────────────────────────────────────────┘
```

### Phase 5: Checkpoint

```
┌──────────────────────────────────────────────────────────────┐
│  At natural breakpoints (phase completion, time budget):      │
│                                                               │
│  1. Create Hub consensus marker:                              │
│     thoughtbox_hub { operation: "create_consensus",           │
│       args: {                                                 │
│         workspaceId: "...",                                   │
│         name: "Phase N checkpoint",                           │
│         description: "Completed: ..., Remaining: ...",        │
│         agreedBy: ["agent1", "agent2", ...] } }              │
│                                                               │
│  2. Record checkpoint thought with full status                │
│                                                               │
│  3. Emit signal to signal store (if ULC is active):           │
│     { category: "implementation",                             │
│       payload: { phase: N, completed: [...],                  │
│                  remaining: [...], blockers: [...] } }        │
│                                                               │
│  4. Git commit + push current state                           │
└──────────────────────────────────────────────────────────────┘
```

### Phase 6: Handoff

When a team session ends (budget exhausted, all problems resolved, or human decision to stop):

```
┌──────────────────────────────────────────────────────────────┐
│  1. Final workspace_digest → capture end state               │
│                                                               │
│  2. Create handoff consensus:                                 │
│     - What was completed (with evidence)                      │
│     - What remains (with dependency state)                    │
│     - What was learned (link to key thoughts)                 │
│     - Recommended next steps                                  │
│                                                               │
│  3. Update MEMORY.md with team session summary                │
│                                                               │
│  4. Create Beads issues for remaining work                    │
│                                                               │
│  5. Emit handoff signal (if ULC is active):                   │
│     { category: "learning",                                   │
│       payload: { type: "team_handoff",                        │
│                  workspace_id: "...",                          │
│                  completed: N, remaining: M,                   │
│                  key_decisions: [...] } }                      │
└──────────────────────────────────────────────────────────────┘
```

### Phase 7: Shutdown

**Order matters.** Shutting down the coordinator first strands other agents (Run 005a failure).

```
Shutdown sequence:
  1. Send shutdown_request to all Triage-Fix agents
  2. Wait for confirmations (or maxTurns exhaustion)
  3. Send shutdown_request to Research agents
  4. Wait for confirmations
  5. Send shutdown_request to Judge agent
  6. Wait for confirmation
  7. Send shutdown_request to Coordination agent
  8. Wait for confirmation
  9. Coordinator (orchestrator) shuts down LAST

  If an agent does not respond to shutdown_request:
    - Agents spawned with run_in_background: true will
      eventually exhaust their maxTurns budget
    - Do NOT force-kill mid-session — in-process teammates
      cannot be force-killed (they run until maxTurns)
    - Log the unresponsive agent in the handoff consensus
```

---

## Agent Memory Sharing

### The Sharing Problem

Each agent has its own Gateway thought chain. These chains are private by design (the Judge requires isolation). But agents working on related problems need to share discoveries without:
- Duplicating investigation work
- Breaking the Judge's isolation
- Creating a polling bottleneck on channels

### The Sharing Protocol

```
Discovery Sharing (pull-based, via Hub):

  Agent A discovers something relevant to Agent B's problem:
    1. Agent A records thought (private reasoning)
    2. Agent A posts to Hub channel on Agent B's problem:
       { content: "Found that X. Thought ref: #42. This affects your problem because Y." }
    3. Agent B reads channel updates during its next OODA observe phase
    4. Agent B incorporates the finding (or ignores it with reasoning)

  The Hub channel is the shared memory layer.
  Thoughts remain private.
  Channels are the curated, shareable surface.

Exceptions:
  - The Judge MUST NOT read channels from producing agents' problems
    during verification. It reads only the proposal + spec.
  - The Coordination agent reads ALL channels (it needs full visibility).
```

### Discovery Broadcast

For discoveries that affect multiple agents (e.g., a breaking API change):

```
Agent A discovers a cross-cutting concern:
  1. Record thought with full analysis
  2. Post to EVERY affected problem's channel
  3. If the discovery changes the problem graph:
     a. Post to workspace-level channel (if available)
     b. OR send message to Coordination agent via Hub
  4. Coordination agent updates the dependency graph
```

### What NOT to Share

Following the CLAUDE.md guidelines on thought recording:

- DO share: key decisions, hypotheses, investigation conclusions, unexpected findings
- DO NOT share: routine file reads, intermediate steps, information already in the codebase
- DO NOT share: raw thought content (use thought refs in channel messages instead)

---

## Agent Specialization vs. Generalization

### When to Use Specialists

Deploy role-specific agents when:

1. **The task has clear cost-type boundaries.** A failing test suite generates technical cost (Triage-Fix), not knowledge cost (Research). Deploying the right specialist absorbs the right cost type.

2. **Isolation is required.** The Judge MUST be isolated from producing agents. This is a hard requirement from the agentic-dev-team-spec, not a preference.

3. **The team session runs long enough for specialization to pay off.** A 15-minute session does not justify spawning 4 specialists. A 2-hour project sprint does.

4. **Budget allows it.** Each agent consumes turns. Four agents with 15 turns each = 60 turns total. If the task can be solved in 20 turns by a single generalist, specialization wastes budget.

### When to Use Generalists

Deploy a single general-purpose agent (or a smaller team) when:

1. **The task is well-scoped and independent.** No dependency graph, no parallel workstreams, no external assumptions to verify.

2. **Fast iteration matters more than thoroughness.** A quick fix to a known bug does not need an independent judge.

3. **The session is short.** Interactive sessions under 30 minutes rarely benefit from team overhead.

4. **Previous runs have established the pattern.** If proof runs have verified the approach, a generalist can follow the established recipe without needing role separation.

### The Hybrid: Escalation-Triggered Specialization

The most practical pattern for a solo founder is:

```
1. Start with a generalist (or 2-agent team)
2. If the generalist hits an escalation threshold:
   a. External dependency failure → spawn Research agent
   b. Verification needed → spawn Judge
   c. Parallel workstreams accumulating → spawn Coordination agent
   d. Multiple failures → spawn Triage-Fix specialist
3. The original agent continues while the specialist absorbs the specific cost
```

This avoids paying the overhead of a full team for simple tasks while ensuring specialists are available when the cost type demands them.

---

## Implementation

### Component 1: Team Orchestrator Skill

**Location**: `.claude/skills/team-deploy/SKILL.md` (new skill, replacing/extending `.claude/skills/deploy-team-hub/SKILL.md`)

This skill codifies the full lifecycle from Phase 1 through Phase 7. It is invoked as `/team-deploy <task-description> [--composition <template>] [--scale N]`.

**Behavior**:

```
/team-deploy "Fix all failing observatory tests" --composition bug-fix

  1. Parses "Fix all failing observatory tests"
  2. Selects "bug-fix" composition: Triage-Fix + Judge
  3. Runs prerequisites check (ToolSearch in agent definitions, Docker up)
  4. Registers on Hub, creates workspace "fix-observatory-tests"
  5. Runs `npm test` to identify failing tests
  6. Creates one Hub problem per failing test group
  7. Adds dependency edges where tests share fixtures
  8. Spawns Triage-Fix (general-purpose, run_in_background: true)
  9. Spawns Judge (general-purpose, run_in_background: true)
  10. Runs 90-second integration gate
  11. Monitors via workspace_digest
  12. When Triage-Fix marks problems resolved → Judge verifies
  13. Checkpoints after each verification pass
  14. Handoff when all problems resolved or budget exhausted
  15. Shutdown: Triage-Fix → Judge → Coordinator (last)
```

**Flags**:

| Flag | Default | Purpose |
|------|---------|---------|
| `--composition` | `full` | Team template: `bug-fix`, `feature`, `research`, `full`, `review` |
| `--scale` | `1` | Number of parallel Triage-Fix agents for horizontal scaling |
| `--budget` | `50` | Total turn budget across all agents |
| `--dry-run` | `false` | Print the problem graph and team composition without spawning |
| `--workspace` | (auto) | Resume in an existing Hub workspace instead of creating a new one |

### Component 2: Spawn Prompt Builder

**Location**: `.claude/skills/team-deploy/build-prompt.ts` (new file)

A TypeScript module that assembles spawn prompts from templates. This replaces the manual template variable substitution currently done inline in skill files.

**Inputs**:
- Role template (from `.claude/team-prompts/`)
- Thoughtbox process template (from `.claude/team-prompts/_thoughtbox-process.md`)
- Workspace ID, problem IDs, agent name
- Task-specific instructions

**Output**: A complete spawn prompt string ready for TeamCreate.

```typescript
interface SpawnPromptConfig {
  role: "triage-fix" | "research-reality" | "coordination-momentum" | "verification-judge";
  agentName: string;
  workspaceId: string;
  problemIds: string[];      // Problems this agent should work on
  taskInstructions: string;  // Role-specific task details
  profile: "DEBUGGER" | "ARCHITECT" | "RESEARCHER" | "REVIEWER" | "COORDINATOR";
}

function buildSpawnPrompt(config: SpawnPromptConfig): string {
  // 1. Load role template
  // 2. Load _thoughtbox-process.md
  // 3. Substitute template variables
  // 4. Prepend Thoughtbox bootstrap (4-step sequence)
  // 5. Append role-specific boundary conditions
  // 6. Return assembled prompt
}
```

### Component 3: Integration Gate

**Location**: `.claude/skills/team-deploy/integration-gate.ts` (new file)

Encapsulates the 90-second verification logic so it is not reimplemented in every invocation.

```typescript
interface GateResult {
  allAgentsOnHub: boolean;
  agentStatuses: Array<{
    name: string;
    onHub: boolean;
    firstMessage: string | null;
    joinedAt: string | null;
  }>;
  failedAgents: string[];    // Names of agents that need respawning
}

async function runIntegrationGate(
  workspaceId: string,
  expectedAgents: string[],
  timeoutMs?: number         // Default 90000
): Promise<GateResult>;
```

### Component 4: Team Configuration Registry

**Location**: `.claude/teams/compositions.json` (new file)

A declarative registry of team compositions, replacing the ad-hoc selection logic.

```json
{
  "compositions": {
    "bug-fix": {
      "description": "Fix failures and verify fixes",
      "roles": ["triage-fix", "verification-judge"],
      "scalable_role": "triage-fix",
      "max_scale": 5,
      "estimated_turns": 25,
      "hub_profiles": ["DEBUGGER", "REVIEWER"]
    },
    "feature": {
      "description": "Implement a feature with coordination and verification",
      "roles": ["triage-fix", "coordination-momentum", "verification-judge"],
      "scalable_role": "triage-fix",
      "max_scale": 8,
      "estimated_turns": 50,
      "hub_profiles": ["ARCHITECT", "COORDINATOR", "REVIEWER"]
    },
    "research": {
      "description": "Investigate assumptions and external dependencies",
      "roles": ["research-reality", "triage-fix"],
      "scalable_role": "research-reality",
      "max_scale": 3,
      "estimated_turns": 40,
      "hub_profiles": ["RESEARCHER", "DEBUGGER"]
    },
    "full": {
      "description": "Full engineering system with all four roles",
      "roles": ["triage-fix", "research-reality", "coordination-momentum", "verification-judge"],
      "scalable_role": "triage-fix",
      "max_scale": 12,
      "estimated_turns": 75,
      "hub_profiles": ["DEBUGGER", "RESEARCHER", "COORDINATOR", "REVIEWER"]
    },
    "review": {
      "description": "Validate existing work and manage workstreams",
      "roles": ["verification-judge", "coordination-momentum"],
      "scalable_role": null,
      "max_scale": 1,
      "estimated_turns": 35,
      "hub_profiles": ["REVIEWER", "COORDINATOR"]
    }
  }
}
```

### Component 5: Hub Workspace Resume

**Location**: Modification to Hub `quick_join` behavior + skill flag

When `--workspace <id>` is provided, the orchestrator skips workspace creation and instead:

1. Calls `workspace_digest` on the existing workspace
2. Identifies unresolved problems
3. Reads the most recent consensus marker for handoff context
4. Spawns agents assigned to remaining problems only
5. Sets up monitoring from the current state

This enables multi-session team work: a team session that runs out of budget creates a handoff consensus, and the next invocation of `/team-deploy --workspace <id>` picks up where it left off.

---

## Team Spawn Sequence Diagram

```
Human                  Orchestrator               Hub                    Agent A              Agent B              Agent C
  │                        │                       │                       │                    │                    │
  │  /team-deploy "task"   │                       │                       │                    │                    │
  │───────────────────────→│                       │                       │                    │                    │
  │                        │                       │                       │                    │                    │
  │                        │── verify prereqs ────→│                       │                    │                    │
  │                        │   (ToolSearch check)  │                       │                    │                    │
  │                        │                       │                       │                    │                    │
  │                        │── register(MANAGER) ─→│                       │                    │                    │
  │                        │←── agentId ───────────│                       │                    │                    │
  │                        │                       │                       │                    │                    │
  │                        │── create_workspace ──→│                       │                    │                    │
  │                        │←── workspaceId ───────│                       │                    │                    │
  │                        │                       │                       │                    │                    │
  │                        │── create_problem(P1)─→│                       │                    │                    │
  │                        │── create_problem(P2)─→│                       │                    │                    │
  │                        │── add_dependency ────→│                       │                    │                    │
  │                        │                       │                       │                    │                    │
  │                        │── TeamCreate(A, bg) ──────────────────────────→│                    │                    │
  │                        │── TeamCreate(B, bg) ─────────────────────────────────────────────→ │                    │
  │                        │── TeamCreate(C, bg) ────────────────────────────────────────────────────────────────── →│
  │                        │                       │                       │                    │                    │
  │                        │                       │                 ToolSearch(hub,gw)          │                    │
  │                        │                       │                       │                    │                    │
  │                        │                       │←── quick_join(A) ─────│                    │                    │
  │                        │                       │←── cipher ────────────│                    │                    │
  │                        │                       │←── thought("start") ──│                    │                    │
  │                        │                       │←── post_message ──────│              ToolSearch(hub,gw)         │
  │                        │                       │                       │                    │                    │
  │                        │                       │←── quick_join(B) ────────────────────────── │                    │
  │                        │                       │←── post_message ──────────────────────────  │              ToolSearch(hub,gw)
  │                        │                       │                       │                    │                    │
  │                        │                       │←── quick_join(C) ──────────────────────────────────────────────│
  │                        │                       │←── post_message ───────────────────────────────────────────────│
  │                        │                       │                       │                    │                    │
  │                        │  ┌──── 90s gate ────┐ │                       │                    │                    │
  │                        │  │ list_members     │→│                       │                    │                    │
  │                        │  │ read_channel     │→│                       │                    │                    │
  │                        │  │ all present? ────│ │                       │                    │                    │
  │                        │  └──── PASS ────────┘ │                       │                    │                    │
  │                        │                       │                       │                    │                    │
  │                        │←── workspace_digest ──│                       │                    │                    │
  │  "Team active: 3       │                       │                       │                    │                    │
  │   agents on hub"       │                       │                       │                    │                    │
  │←───────────────────────│                       │                       │                    │                    │
  │                        │                       │                       │                    │                    │
  │                        │  ┌── monitor loop ──┐ │     ┌── work ──┐     │   ┌── work ──┐    │    ┌── work ──┐   │
  │                        │  │ digest every 3m  │ │     │ claim P1 │     │   │ claim P2 │    │    │ verify   │   │
  │                        │  │ check proposals  │ │     │ diagnose │     │   │ research │    │    │ specs    │   │
  │                        │  │ handle escalate  │ │     │ fix      │     │   │ evidence │    │    │ review   │   │
  │                        │  └──────────────────┘ │     │ propose  │     │   │ propose  │    │    │ judge    │   │
  │                        │                       │     └──────────┘     │   └──────────┘    │    └──────────┘   │
  │                        │                       │                       │                    │                    │
  │                        │                       │←── create_proposal ───│                    │                    │
  │                        │                       │                       │                    │                    │
  │                        │                       │←── review_proposal ──────────────────────────────────────────── │
  │                        │                       │                       │                    │                    │
  │                        │── create_consensus ──→│                       │                    │                    │
  │                        │   (checkpoint)        │                       │                    │                    │
  │                        │                       │                       │                    │                    │
  │                        │── shutdown(A) ────────────────────────────────→│                    │                    │
  │                        │── shutdown(B) ───────────────────────────────────────────────────→ │                    │
  │                        │── shutdown(C) ──────────────────────────────────────────────────────────────────────── →│
  │                        │                       │                       │                    │                    │
  │  "Team complete.       │                       │                       │                    │                    │
  │   Handoff recorded."   │                       │                       │                    │                    │
  │←───────────────────────│                       │                       │                    │                    │
```

---

## Governance & Safety

### Budget Boundaries

| Scope | Limit | Enforcement |
|-------|-------|-------------|
| Single agent | maxTurns from composition config | Claude Code Agent Teams maxTurns parameter |
| Team session total | `--budget` flag (default 50 turns) | Orchestrator tracks cumulative turns |
| API cost per session | $5 default | Agent SDK budget tracking |
| Concurrent agents | max_scale from composition | Orchestrator caps TeamCreate calls |

### Escalation Chain

```
Agent → Hub Channel → Coordination Agent → Orchestrator → Human

Level 1: Agent posts to channel (info only)
Level 2: Agent sends escalation message to Coordination agent
Level 3: Coordination agent cannot resolve → escalates to Orchestrator
Level 4: Orchestrator cannot resolve → escalates to Human

Format (all levels): Situation, Impact, What was tried, Options, Recommendation
```

### Scope Constraints

The team orchestrator inherits all escalation thresholds from the agentic-dev-team-spec:

- Scope change: escalate
- Prioritization conflict: escalate
- External dependency failure: escalate (or delegate to Research agent)
- Timeline impact: escalate
- Irreversible action (merge to main, deploy): escalate
- Cost exceeding budget: stop + escalate
- Repeated failure (3+ attempts): stop + escalate

The orchestrator additionally enforces:
- **No agent spawns without ToolSearch verification.** Prerequisite check in Phase 1.
- **No agent spawns without `run_in_background: true`.** Hard-coded in the skill.
- **No `subagent_type` other than `"general-purpose"`.** Hard-coded in the skill.
- **Coordinator shuts down last.** Enforced by shutdown sequence.
- **Integration gate before monitoring.** The 90-second gate cannot be skipped.

### Human Approval Gates

The team orchestrator requires human approval for:
- Merging to main (inherited from agentic-dev-team-spec)
- Deploying to production (inherited)
- Scope changes discovered during the team session
- Budget extensions beyond the initial `--budget` allocation

The orchestrator does NOT require human approval for:
- Workspace creation
- Problem decomposition
- Agent spawning (within configured compositions)
- Internal coordination (reordering, dependency resolution)
- Checkpointing and handoff

---

## Success Criteria

### Phase 1: Single-Command Team Launch (1 week)

- [ ] `/team-deploy "task"` creates a Hub workspace and spawns at least 2 agents
- [ ] All spawned agents pass the 90-second integration gate
- [ ] Agents produce Hub artifacts (channel messages, proposals) during their work
- [ ] Shutdown sequence completes without stranded agents

### Phase 2: Team Compositions (1 week)

- [ ] All 5 composition templates (`bug-fix`, `feature`, `research`, `full`, `review`) produce working teams
- [ ] `--dry-run` outputs the problem graph and composition without spawning
- [ ] `--composition` flag correctly selects the team template

### Phase 3: Horizontal Scaling (2 weeks)

- [ ] `--scale 3` produces 3 parallel Triage-Fix agents working on independent problems
- [ ] Coordination agent detects and prevents file-level conflicts
- [ ] Dependency graph phasing works: agents wait for blockers to resolve before starting dependent work

### Phase 4: Session Continuity (2 weeks)

- [ ] `--workspace <id>` resumes work in an existing Hub workspace
- [ ] Handoff consensus from previous session is consumed by resumed session
- [ ] Remaining problems are correctly identified and assigned to new agents

### Phase 5: Steady State (ongoing)

- [ ] Team launch success rate > 90% (integration gate pass on first attempt)
- [ ] Mean time from `/team-deploy` to first agent channel post < 3 minutes
- [ ] Hub workspace contains actionable coordination trail after every session
- [ ] No proof run failures attributable to spawn prompt or integration issues

---

## Dependencies

### Required (blocks implementation)

| Dependency | Why | Status |
|-----------|-----|--------|
| Agent Teams (TeamCreate) | Spawning mechanism for teammates | Available in Claude Code |
| Thoughtbox Hub | Coordination substrate (workspaces, problems, proposals, channels, consensus) | Implemented (`src/hub/`) |
| Thoughtbox Gateway | Reasoning substrate (thoughts, cipher, branches) | Implemented |
| `.claude/team-prompts/` | Spawn prompt templates | Exist (architect, debugger, researcher, reviewer) |
| ToolSearch | MCP tool discovery at runtime | Available in Claude Code |
| `run_in_background: true` | Non-blocking agent spawning | Available in Claude Code |

### Soft (enhances but does not block)

| Dependency | Why | Status |
|-----------|-----|--------|
| [01-unified-loop-controller.md](./01-unified-loop-controller.md) | Signal emission from team checkpoints | Not yet implemented |
| [02-knowledge-accumulation-layer.md](./02-knowledge-accumulation-layer.md) | Richer context for spawn prompts | Not yet implemented |
| [04-cross-session-continuity.md](./04-cross-session-continuity.md) | Persistent session state for workspace resume | Not yet implemented |
| [07-assumption-registry.md](./07-assumption-registry.md) | Research agent writes verified assumptions to registry | Not yet implemented |
| Observatory session persistence | Durable team session traces | In-memory only (known limitation) |
| Beads CLI (`bd`) | Issue creation for remaining work at handoff | Available locally |

---

## Risks

### Risk 1: Agent Definition Caching

**Threat**: Agent definitions (`.claude/agents/*.md`) are cached at session start. Changes to these files mid-session have no effect on running or subsequently spawned agents.

**Mitigation**: The orchestrator reads agent definitions at skill invocation time and injects all role-specific behavior into the spawn prompt. It does NOT rely on agent definition files being read by the spawned agents.

### Risk 2: MCP Tool Availability

**Threat**: ToolSearch fails to find `thoughtbox_hub` or `thoughtbox_gateway`, causing the entire Thoughtbox bootstrap to fail silently.

**Mitigation**: The prerequisite check in Phase 1 includes a ToolSearch probe for both MCP tools. If either fails, the orchestrator reports the failure and aborts before spawning any agents.

### Risk 3: Hub Server Availability

**Threat**: The Docker container running the Thoughtbox MCP server is down or unreachable.

**Mitigation**: Phase 1 includes a health check (`register` call). If registration fails, the orchestrator reports the error and suggests `docker compose up -d`.

### Risk 4: Turn Budget Exhaustion

**Threat**: Agents exhaust their `maxTurns` budget before completing their assigned problems, leaving work incomplete without a handoff.

**Mitigation**: Each agent's spawn prompt includes instructions to create a handoff thought and Hub message when approaching budget limits (turn N-2). The Coordination agent monitors for agents that stop posting without resolution and flags them in the next digest.

### Risk 5: Merge Conflicts Under Scale

**Threat**: Multiple Triage-Fix agents working on the same branch modify overlapping files, creating git merge conflicts.

**Mitigation**:
- The Coordination agent monitors `git status` and `git diff` for conflict signals.
- Problem dependencies encode file-level constraints: problems that modify the same files are connected by dependency edges and serialized.
- At scale > 4, the orchestrator assigns each agent a problem set with non-overlapping file targets when possible.

### Risk 6: Unresponsive Agents

**Threat**: An agent spawned with `run_in_background: true` becomes unresponsive (no Hub posts, no task completion) and consumes turns without producing value.

**Mitigation**: The integration gate catches this within 90 seconds for new agents. For agents that become unresponsive mid-session, the Coordination agent's monitoring loop detects stalled agents (no channel activity for 5+ minutes) and reports them to the orchestrator.

---

## Appendix A: Mapping Agentic-Dev-Team-Spec to Implementation

| Spec Concept | Implementation |
|-------------|----------------|
| Chief Agentic | Human operator invoking `/team-deploy` and receiving escalations |
| Triage & Fix Agent | `general-purpose` teammate with triage-fix prompt + `.claude/agents/triage-fix.md` behavior |
| Research & Reality-Check Agent | `general-purpose` teammate with research prompt combining `research-taste.md` + `dependency-verifier.md` |
| Coordination & Momentum Agent | `general-purpose` teammate with coordination prompt + `.claude/agents/coordination-momentum.md` behavior |
| Verification & Validation Agent | `general-purpose` teammate with judge prompt + `.claude/agents/verification-judge.md` behavior |
| Inter-Agent Communication Protocol | Hub channels (structured messages) + Hub proposals (with reviews) |
| Escalation Message Format | Hub channel posts following escalation protocol format |
| Engineering System boundary | Orchestrator skill encapsulating the full lifecycle |

## Appendix B: Comparison with Existing Skills

| Skill | Scope | Limitation |
|-------|-------|------------|
| `/deploy-team` (`.claude/skills/deploy-team-hub/SKILL.md`) | Step-by-step Hub integration guide | Manual execution, no composition templates, no scaling, no integration gate |
| `/team` (`.claude/skills/team/SKILL.md`) | Lightweight team orchestration | No prerequisite verification, no shutdown protocol, no checkpoint/handoff |
| `/hub-collab` (`.claude/skills/hub-collab/SKILL.md`) | Hub collaboration demo (3 agents) | Demo-focused, sequential Task spawning, no Agent Teams |

The `/team-deploy` skill proposed in this spec subsumes all three by automating the full lifecycle with prerequisite checks, composition templates, integration gates, checkpoint/handoff, and correct shutdown ordering.

## Appendix C: Critical Implementation Constraints

These constraints are derived from empirical proof runs and MUST NOT be violated:

1. **`subagent_type: "general-purpose"` only.** Custom types lose ToolSearch. Non-negotiable.
2. **`run_in_background: true` always.** Without this, you cannot obtain a task_id and cannot monitor or kill the agent.
3. **Agent definitions cached at session start.** Do not edit `.claude/agents/*.md` mid-session expecting changes to take effect. All behavior goes in the spawn prompt.
4. **ToolSearch before MCP calls.** Every agent must run `ToolSearch("thoughtbox hub")` and `ToolSearch("thoughtbox gateway")` before any `thoughtbox_hub` or `thoughtbox_gateway` calls.
5. **Coordinator shuts down last.** The coordinator orchestrates shutdown of other teammates. Shutting it down first strands the team.
6. **90-second integration gate is non-negotiable.** Agents not on the Hub within 90 seconds must be respawned.
7. **Never claim something works without testing.** Previous instance summaries are unreliable. Verify Hub integration empirically on every run.
