# Agent Teams Integration Analysis

> Thoughtbox as a coordination substrate for Anthropic's Agent Teams feature in Claude Code.
>
> Date: 2026-02-08

## Context

Anthropic released [Agent Teams](https://code.claude.com/docs/en/agent-teams) for Claude Code — a system where a lead agent spawns teammate agents that work in parallel via git worktrees, communicate through a mailbox, and coordinate through a shared task list. This document analyzes how Thoughtbox fits as a shared, Git-like apparatus supporting Agent Teams, enabling N-participant structured deliberation on a substrate familiar to developers collaborating on GitHub.

## Structural Fit

The mapping between Agent Teams primitives and Thoughtbox Hub primitives is close:

| Agent Teams | Thoughtbox Hub | What Thoughtbox Adds |
|---|---|---|
| Team | Workspace | Persistent reasoning context, agent presence tracking |
| Task list | Problems (with dependencies) | Hierarchical decomposition, cycle detection, blocking analysis |
| Task claiming (file locks) | `claim_problem` (returns branchId) | Branches reasoning at the claim point — captures the *why* of the work |
| Mailbox (message / broadcast) | Channels (problem-scoped) | Discussion scoped to problems, MCP resource subscriptions for push updates |
| Lead decides "done" | Consensus markers + endorsement | Agreement is explicit, multi-party, recorded |
| Teammates edit files directly | Proposals with review workflow | approve / request-changes / merge semantics |
| Task dependencies | Problem dependencies | Equivalent — both support blocking and auto-unblocking |
| No reasoning trace | Numbered, persistent thought chains | **Fundamental value-add** |

Agent Teams' "competing hypotheses" pattern — spawn N agents to investigate, have them debate — is precisely what Thoughtbox's Hub was designed for. But Agent Teams implements it with free-form messages; Thoughtbox implements it with `CLAIM:`/`REFUTE:` semantics, cross-branch conflict detection, and merge-based resolution.

## Necessary Conditions (What Must Be True)

### 1. Shared instance accessibility

All teammates must connect to the same Thoughtbox MCP server. This works today: Thoughtbox runs as an HTTP server on port 1731. Every teammate Claude Code spawns can mount it as an MCP server. According to the [Agent Teams documentation](https://code.claude.com/docs/en/agent-teams), teammates inherit the lead's MCP server configuration from CLAUDE.md / `.claude/settings.json`, though this behavior should be verified in practice before relying on it for production use.

**Status:** Architecturally ready. No changes required, but config inheritance should be tested with actual Agent Teams workflows.

### 2. Agent identity resolution

Each teammate needs a unique, stable identity. Thoughtbox supports `THOUGHTBOX_AGENT_ID` and `THOUGHTBOX_AGENT_NAME` environment variables. However, Agent Teams doesn't currently expose per-teammate environment variable configuration at spawn time. Workaround: agents self-register via `hub register` using names derived from their spawn prompt.

**Status:** Workaround available. Clean solution requires Agent Teams to support per-teammate env vars, or Thoughtbox to support identity-from-prompt.

### 3. Single source of coordination truth

Running two task systems — Agent Teams' task list *and* Thoughtbox's problems — creates ambiguity about which is authoritative. These must have a clear boundary:

- **Agent Teams** owns lifecycle orchestration: spawn, idle, shutdown, resource limits
- **Thoughtbox** owns semantic coordination: what the work means, how it relates, what was decided, why

Attempting to unify them would require modifying Agent Teams itself, which is outside scope.

**Status:** Requires clear documentation and conventions. No code changes, but cognitive overhead for the lead agent.

### 4. Bootstrap path

Teammates don't inherit the lead's conversation history. They receive CLAUDE.md, MCP servers, and a spawn prompt. The teammate must:

1. Connect to Thoughtbox MCP server
2. Register identity (`hub register`)
3. Progress through disclosure stages 0 → 1 → 2
4. Join the workspace (`hub join_workspace`)
5. Begin hub operations

This is 5+ tool calls before substantive work begins. The CLAUDE.md instructions and spawn prompt must make this sequence reliable and automatic.

**Status:** Achievable with careful CLAUDE.md authoring. Fragile if instructions are ambiguous.

### 5. Concurrent write safety

Multiple agents writing thoughts to the same Thoughtbox instance simultaneously must not corrupt state. `FileSystemStorage` uses atomic writes (write-to-temp, rename). Hub operations are workspace-scoped.

**Status:** Architecturally safe. Not yet load-tested with 5+ concurrent agents making rapid calls. Needs stress testing.

## Sufficient Conditions for Highest Effectiveness (What Ought to Be True)

### 1. Reasoning chain as coordination mechanism, not sidecar

The optimal design doesn't have Thoughtbox sitting alongside Agent Teams as an additional tool. Instead, Thoughtbox's workspace *is* the shared context. When an agent claims a problem, the branch it creates isn't just a record — it's the medium through which its exploration is visible to all other agents. When it proposes a solution, the proposal contains the reasoning that justifies it, not just a status change.

### 2. Profile-driven team composition

Thoughtbox has four built-in agent profiles: MANAGER, ARCHITECT, DEBUGGER, SECURITY. Each comes with bound mental models and behavioral priming. Instead of the lead writing ad-hoc spawn prompts, it should pull profile prompts from Thoughtbox and use them to configure teammates. This makes specialization reproducible rather than prompt-dependent.

### 3. Proactive conflict detection

The most valuable moment to detect contradictions is *before* they become code conflicts. Thoughtbox's `conflict-detection.ts` can find when Agent A's reasoning contradicts Agent B's reasoning across branches. If this runs as agents work (via channels or lead polling), contradictions surface and resolve through structured debate rather than being discovered at merge time.

### 4. Consensus as the gate for completion

Agent Teams relies on the lead to decide when work is done. This creates anchoring bias — the lead forms an opinion early and judges subsequent work against it. Thoughtbox's consensus markers provide an alternative: the lead marks a decision point, each contributing agent endorses it (or doesn't), and completion requires explicit multi-party agreement.

### 5. Observatory as team war room

The WebSocket Observatory (port 1729) renders reasoning graphs in real time. Extended to multi-agent scenarios, it can show all agents' branches simultaneously — which are converging, which diverging, where conflicts exist. This gives the human operator a cognitive map of the team's state that no amount of task-list checking provides.

### 6. Structured channel signals

Agent Teams' mailbox passes free-form text. Thoughtbox channels are problem-scoped and support MCP resource subscriptions (`resourceUpdated` notifications). An agent can subscribe to a problem's channel and receive structured updates when proposals are submitted, reviews posted, or consensus marked — without polling.

## Capabilities the Optimal Implementation Affords Beyond Native Agent Teams

### 1. Auditable decision provenance

Agent Teams produces a task list with status changes. Thoughtbox produces a numbered reasoning graph with branches, revisions, claims, refutations, and consensus markers. You can reconstruct not just *what* was decided but *why*, *who disagreed*, *what alternatives were considered*, and *what evidence was dispositive*.

This is the difference between a changelog and a deliberation record.

### 2. Structured dialectic

Agent Teams suggests spawning agents to "try to disprove each other's theories, like a scientific debate." The actual mechanism is messages. Thoughtbox provides:

- `CLAIM:` / `REFUTE:` semantics that are machine-parseable
- Cross-branch conflict detection that finds contradictions automatically
- Consensus markers that record when debate resolved

This turns "like a scientific debate" into an actual protocol.

### 3. Merge-based integration with review gates

Agent Teams warns "avoid file conflicts" and suggests breaking work so each teammate owns different files. This is fragile. Thoughtbox's proposal → review → merge workflow provides structured integration:

1. Agent proposes (from a reasoning branch)
2. Peers review (approve / request-changes)
3. Coordinator merges
4. Merge thought links the branch back to the main chain

A pull-request workflow for reasoning, not just code.

### 4. Persistence across session failures

Agent Teams cannot resume in-process teammates. When a teammate crashes, its context is lost. With Thoughtbox, the teammate's reasoning is persisted as thoughts on a branch. A new teammate can be spawned, pointed at the workspace, and read the branch to continue where the previous agent stopped.

The reasoning is durable even when the agent is not.

### 5. Profile-informed specialization

Agent Teams' specialization is entirely prompt-driven. Thoughtbox profiles bind specific mental models to roles: a DEBUGGER gets Five Whys and root-cause analysis scaffolding; an ARCHITECT gets decomposition and trade-off matrices. This isn't just a persona — it's cognitive tooling that shapes how the agent approaches problems.

### 6. Progressive disclosure as safety mechanism

Agent Teams gives all teammates full permissions from the lead. Thoughtbox's progressive disclosure requires agents to progress through initialization stages before accessing advanced operations. This prevents a misbehaving or under-contextualized agent from performing operations it hasn't been prepared for.

### 7. Cross-branch reasoning analysis

No equivalent exists in Agent Teams. Thoughtbox compares reasoning across branches using content hashing and conflict detection to find when two agents work from incompatible assumptions. This catches *reasoning conflicts* — upstream of code conflicts and far more expensive to fix after the fact.

## Key Challenges

### 1. Double coordination overhead

Agent Teams already costs significantly more tokens than single-session work. Adding Thoughtbox reasoning calls on top of every decision point increases this further. The design must be disciplined about *when* agents record thoughts: not every action, but every decision point, assumption, and conclusion.

### 2. Two systems of record

The lead uses Agent Teams tools to manage team lifecycle and Thoughtbox tools to manage reasoning. These need a clear contract boundary, or the lead spends tokens coordinating coordination.

### 3. Bootstrap complexity

The 5-step bootstrap sequence (connect → register → disclose → join → work) must be reliable across different spawn prompt formulations. Failure at any step leaves the teammate disconnected from the reasoning substrate.

### 4. No nested teams

Agent Teams doesn't allow teammates to spawn sub-teams. This limits Thoughtbox's hierarchical problem decomposition — a teammate can't delegate sub-problems to sub-agents that participate in the hub. Subagents (which teammates *can* spawn) report to their parent, not to the workspace.

### 5. Lead fixity

Both systems have fixed leadership. The session that creates the team/workspace is lead/coordinator permanently. This works when leadership is stable but limits adaptive reorganization when the problem structure shifts.

## Implementation Path (Minimal Viable Integration)

No changes to Agent Teams itself are required:

1. **Thoughtbox runs as a shared HTTP MCP server.** All teammates connect to the same instance via the `mcpServers` configuration (inherited from CLAUDE.md according to Agent Teams documentation).

2. **The lead creates a workspace** on Thoughtbox before spawning teammates. The workspace ID is included in each teammate's spawn prompt.

3. **Each teammate registers, joins, and uses hub operations.** CLAUDE.md instructions guide the bootstrap sequence.

4. **The lead uses Thoughtbox's structure view** to monitor reasoning across branches, detect conflicts, and mark consensus — in addition to Agent Teams' native task management.

5. **Proposals and reviews happen through the hub**, providing structured integration points beyond the task list.

**Result:** Agent Teams handles process orchestration (who's running, what's their status). Thoughtbox handles epistemic orchestration (what do we know, where do we disagree, what have we decided). The developer gets both a task board and a deliberation record.

## Open Questions

1. **Latency budget.** How many Thoughtbox calls per teammate-turn are acceptable before throughput degrades noticeably?
2. **Thought granularity.** What's the right granularity for recording thoughts in a team context — every reasoning step, or only decision points and conclusions?
3. **Observatory scaling.** Can the Observatory UI remain useful when rendering 5+ agents' branches simultaneously, or does it need filtering/aggregation?
4. **Task list bridge.** Should there be an explicit adapter that syncs Agent Teams task status with Thoughtbox problem status, or is the two-system boundary acceptable?
5. **Profile expansion.** The current four profiles (MANAGER, ARCHITECT, DEBUGGER, SECURITY) cover common roles. Agent Teams patterns suggest additional profiles: RESEARCHER, REVIEWER, OPTIMIZER. Should the profile registry be extensible?
