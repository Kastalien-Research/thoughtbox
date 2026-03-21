---
name: hub-audit
description: Run an Agent-Native Architecture Audit using Thoughtbox Hub for multi-agent coordination. Spawns 3 auditor agents and 1 synthesizer that collaborate through structured channels, cross-reference findings, and build consensus on scores.
user_invocable: true
---

# Hub-Based Agent-Native Architecture Audit

Orchestrate a multi-agent audit of the codebase against 8 agent-native architecture principles, coordinated through Thoughtbox Hub.

## Usage

```
/hub-audit                     # Full audit (all 8 principles)
/hub-audit <principle>         # Single principle deep-dive
```

Single principle arguments: `action-parity`, `tools`, `context`, `shared-workspace`, `crud`, `ui`, `discovery`, `prompt-native`

## Architecture

4 agents collaborate through a shared Hub workspace:

| Agent | Profile | Principles | Investigation Surface |
|-------|---------|-----------|----------------------|
| **Auditor-A** | RESEARCHER | P1 Action Parity, P2 Tools as Primitives, P5 CRUD Completeness | Tool/API surface: tool definitions, route handlers, MCP schemas |
| **Auditor-B** | RESEARCHER | P3 Context Injection, P4 Shared Workspace, P8 Prompt-Native Features | Information flow: system prompts, data access, feature definitions |
| **Auditor-C** | RESEARCHER | P6 UI Integration, P7 Capability Discovery | User-facing: agent visibility in UI, discoverability |
| **Synthesizer** | REVIEWER | P9 Final Report | Reviews all proposals, calibrates scores, compiles report |

Sequential spawning (required per hub-collab findings) with 90-second verification gates.

## Structured Message Protocol

All `post_message` content MUST use one of these typed prefixes. This is the coordination backbone.

```
FINDING:  P<n> | HIGH|MEDIUM|LOW | <description with file:line refs>
EVIDENCE: P<n> | <file:line> | <what it shows>
GAP:      P<n> | <what's missing and why it matters>
SCORE:    P<n> | X/Y (Z%) | <rationale>
XREF:     P<n> | <finding relevant to another principle>
QUESTION: <addressed-to> | <question>
ANSWER:   re:P<n> | <answer>
STATUS:   STARTED|INVESTIGATING|SCORING|COMPLETE | <note>
```

### When to Post

| Event | Type | Channel |
|-------|------|---------|
| Start investigating a principle | `STATUS: STARTED` | That principle's problem |
| Find relevant code | `EVIDENCE` | That principle's problem |
| Identify a gap | `GAP` | That principle's problem |
| Find something relevant to another principle | `XREF` | BOTH own + target problem |
| Complete scoring | `SCORE` | That principle's problem |
| Need clarification from another agent | `QUESTION` | Relevant problem |
| Respond to a question | `ANSWER` | Same channel as question |
| Finish all assigned principles | `STATUS: COMPLETE` | Each assigned problem |

### Cross-Pollination Protocol

1. While investigating own principles, auditor finds code relevant to another principle
2. Posts `XREF` to BOTH own channel (recording discovery) AND target channel (delivering info)
3. Each auditor reads all other problem channels ONCE — after own investigation, before finalizing scores
4. If an XREF changes a score, auditor posts a `FINDING` referencing the XREF

Example:
```
# Auditor-A investigating P5 (CRUD), discovers no capability listing endpoint
# Relevant to P7 (Capability Discovery, owned by Auditor-C)

# Posts to P5 channel:
XREF: P7 | No "list_tools" or capability introspection endpoint. Relevant to discovery scoring.

# Posts to P7 channel:
XREF: P7 | [From Auditor-A/P5] No capability introspection endpoint. Tool list not programmatically queryable.

# Later, Auditor-C reads P7 channel before scoring, incorporates:
FINDING: P7 | HIGH | No programmatic capability discovery (confirmed by Auditor-A XREF from P5)
```

## Proposal Template (Per-Principle)

Each auditor creates one proposal per principle problem:

```markdown
## Principle [N]: [Name]

### Score: [X]/[Y] ([Z]%)

### Criteria Evaluated
| # | Criterion | Pass/Fail | Evidence |
|---|-----------|-----------|----------|
| 1 | [criterion] | PASS/FAIL | [file:line or description] |

### Key Findings
- [FINDING with severity and evidence]

### Gaps Identified
- [GAP with impact description]

### Cross-References Received
- [XREFs from other auditors that affected this score]

### Recommendations
1. [Actionable recommendation with estimated effort]
```

## Compiled Report Template (Synthesizer)

```markdown
## Agent-Native Architecture Audit Report

### Audit Target: [repository/project name]
### Date: [ISO date]
### Auditors: [agent names]

### Executive Summary
[2-3 sentences: overall posture, strongest and weakest areas]

### Overall Score: [total achieved] / [total possible] ([percentage]%)

### Principle Scores

| # | Principle | Score | % | Verdict |
|---|-----------|-------|---|---------|
| 1 | Action Parity | X/Y | Z% | STRONG/ADEQUATE/WEAK/MISSING |
| 2 | Tools as Primitives | X/Y | Z% | ... |
| 3 | Context Injection | X/Y | Z% | ... |
| 4 | Shared Workspace | X/Y | Z% | ... |
| 5 | CRUD Completeness | X/Y | Z% | ... |
| 6 | UI Integration | X/Y | Z% | ... |
| 7 | Capability Discovery | X/Y | Z% | ... |
| 8 | Prompt-Native Features | X/Y | Z% | ... |

### Cross-Cutting Themes
[Patterns that appeared across multiple principles]

### Top 5 Recommendations (Priority Order)
1. [Recommendation with principles affected and estimated effort]

### Methodology
- Each principle scored by independent auditor agent
- Cross-pollination via structured XREF messages on Thoughtbox Hub
- Scores reviewed and calibrated by Synthesizer
- Consensus recorded on Hub with thought references
```

## Execution Phases

### Phase 0: SETUP (Coordinator)

```
thoughtbox_hub { operation: "register", args: { name: "Audit-Coordinator", profile: "MANAGER" } }
```

Record the agentId. Then create workspace:

```
thoughtbox_hub { operation: "create_workspace", args: {
  name: "audit/<project-name>",
  description: "Agent-native architecture audit — 8 principles scored by 3 auditor agents with synthesizer"
} }
```

Create 9 problems (P1-P8 for principles, P9 for synthesis):

```
# P1 - Action Parity
thoughtbox_hub { operation: "create_problem", args: {
  workspaceId: "<ID>",
  title: "P1: Action Parity — Can agents do everything users can?",
  description: "Enumerate ALL user actions (API calls, UI interactions). Check which have corresponding agent tools. Score: agent can do X out of Y user actions."
} }

# P2 - Tools as Primitives
thoughtbox_hub { operation: "create_problem", args: {
  workspaceId: "<ID>",
  title: "P2: Tools as Primitives — Are tools atomic capabilities, not workflows?",
  description: "Find all agent tools. Classify each as PRIMITIVE (single capability) or WORKFLOW (embeds business logic). Score: X out of Y tools are proper primitives."
} }

# P3 - Context Injection
thoughtbox_hub { operation: "create_problem", args: {
  workspaceId: "<ID>",
  title: "P3: Context Injection — Does the system prompt include dynamic app state?",
  description: "Find context injection code. Check what dynamic state (resources, preferences, activity, capabilities) is injected vs what should be."
} }

# P4 - Shared Workspace
thoughtbox_hub { operation: "create_problem", args: {
  workspaceId: "<ID>",
  title: "P4: Shared Workspace — Do agents and users share the same data space?",
  description: "Identify all data stores. Check if agents read/write the SAME tables/stores as users. Flag sandbox isolation anti-patterns."
} }

# P5 - CRUD Completeness
thoughtbox_hub { operation: "create_problem", args: {
  workspaceId: "<ID>",
  title: "P5: CRUD Completeness — Does every entity have full CRUD for agents?",
  description: "Identify all entities/models. For each, check agent tools for Create, Read, Update, Delete. Score per entity and overall."
} }

# P6 - UI Integration
thoughtbox_hub { operation: "create_problem", args: {
  workspaceId: "<ID>",
  title: "P6: UI Integration — Are agent actions immediately reflected in UI?",
  description: "Check how agent writes propagate to frontend. Look for streaming, polling, shared state, event buses. Flag silent action anti-patterns."
} }

# P7 - Capability Discovery
thoughtbox_hub { operation: "create_problem", args: {
  workspaceId: "<ID>",
  title: "P7: Capability Discovery — Can users discover what agents can do?",
  description: "Check 7 discovery mechanisms: onboarding, help docs, UI hints, self-description, suggested prompts, empty state guidance, slash commands."
} }

# P8 - Prompt-Native Features
thoughtbox_hub { operation: "create_problem", args: {
  workspaceId: "<ID>",
  title: "P8: Prompt-Native Features — Are features prompts, not code?",
  description: "Read agent prompts. Classify features as PROMPT-defined (outcomes in natural language) or CODE-defined (hardcoded logic). Check if behavior changes need code changes."
} }

# P9 - Synthesis (depends on all above)
thoughtbox_hub { operation: "create_problem", args: {
  workspaceId: "<ID>",
  title: "P9: Synthesis — Compile final audit report",
  description: "Review all auditor proposals. Calibrate scores for cross-principle consistency. Compile the final Agent-Native Architecture Audit Report."
} }
```

Add dependencies so P9 blocks until P1-P8 are resolved:

```
thoughtbox_hub { operation: "add_dependency", args: { workspaceId: "<ID>", problemId: "<P9_ID>", dependsOnId: "<P1_ID>" } }
# ... repeat for P2-P8
```

**Gate**: Verify with `workspace_digest` — 9 problems, P9 blocked by 8 dependencies.

### Phase 1: SPAWN AUDITORS (Sequential)

Spawn each auditor using the Agent tool with `subagent_type: "general-purpose"`. Use the auditor team prompt template (`.claude/team-prompts/auditor.md`) with these parameter substitutions:

**Auditor-A**:
- `{{AUDITOR_NAME}}`: "Auditor-A"
- `{{WORKSPACE_ID}}`: from Phase 0
- `{{PRINCIPLES}}`: P1 (Action Parity), P2 (Tools as Primitives), P5 (CRUD Completeness)
- `{{PROBLEM_IDS}}`: P1, P2, P5 IDs from Phase 0
- `{{OTHER_PROBLEM_IDS}}`: P3, P4, P6, P7, P8 IDs (for cross-pollination read)

Wait 90 seconds after spawn, then verify:
```
thoughtbox_hub { operation: "read_channel", args: { workspaceId: "<ID>", problemId: "<P1_ID>" } }
```
If no `STATUS: STARTED` message, send status query via `post_message`. Wait 30s more. If still nothing, kill and respawn.

**Auditor-B** (after A verified): P3, P4, P8. Same gate.
**Auditor-C** (after B verified): P6, P7. Same gate.

**Gate**: All 3 auditors posted `STATUS: STARTED`.

### Phase 2: AUDIT (Auditors work, Coordinator monitors)

While auditors work, the coordinator:

1. **Polls `workspace_digest`** every 3 minutes to track problem status and message counts
2. **Reads channels selectively** when digest shows new messages
3. **Relays QUESTION messages** if addressed to an agent on a channel they don't own — copy the message to one of the addressee's problem channels
4. **Detects stalls** — no messages from an auditor for 5 minutes → post status query to their channel
5. **Does NOT investigate the codebase** — coordinator orchestrates only

**Gate**: All P1-P8 problems have status "resolved" AND at least 8 proposals exist (one per principle).

### Phase 3: SPAWN SYNTHESIZER

Spawn Synthesizer using the Agent tool with `subagent_type: "general-purpose"`. Use the synthesizer team prompt template (`.claude/team-prompts/synthesizer.md`).

Same 90-second verification gate.

**Gate**: Synthesizer claims P9.

### Phase 4: SYNTHESIS

The Synthesizer (working autonomously):

1. Reads all 8 problem channels for context and cross-references
2. Lists and reads all auditor proposals
3. Reviews each proposal via `review_proposal`:
   - Evidence supports the claimed score?
   - XREFs from other auditors incorporated?
   - Consistent with related principles?
   - Verdict: `approve` or `request-changes` with reasoning
4. Records per-principle consensus: `mark_consensus { name: "P<n> Score: X/Y", description: "<rationale>", thoughtRef: <N> }`
5. Creates compiled final report as proposal on P9
6. Resolves P9

**Fallback**: If Synthesizer has questions but auditor is no longer running, Synthesizer adjusts the score with documented reasoning and notes the adjustment in the final report.

**Gate**: P9 proposal exists.

### Phase 5: FINALIZE (Coordinator)

1. Read Synthesizer's proposal on P9
2. Review proposal: `review_proposal` with verdict `approve`
3. Mark final consensus: `mark_consensus { name: "Audit Complete", description: "All 8 principles scored and calibrated" }`
4. Merge: `merge_proposal` for the P9 proposal
5. Extract the compiled report text and present to the user
6. Shutdown: Synthesizer first, coordinator last

## Principle Investigation Guide

### P1: Action Parity
Search for all user-facing routes/endpoints (`src/routes/`, API handlers, form submissions). For each, check if a corresponding MCP tool or agent action exists. Count matches and gaps. Search tool registrations, MCP schema files, agent tool definitions.

### P2: Tools as Primitives
List all MCP tools (search for tool registration, `z.object` schemas, handler definitions). For each: does it do one atomic thing (read, write, list, delete)? Or does it embed multi-step workflow logic, conditionals, or orchestration? Classify as PRIMITIVE or WORKFLOW.

### P3: Context Injection
Find system prompt construction (search for "system", "context", "inject", prompt template files). Check what dynamic state gets injected: available resources, user preferences, recent activity, available capabilities, session history, workspace state. Compare to what's available.

### P4: Shared Workspace
Identify all data stores (database tables, file stores, in-memory caches). Check if agents read/write the SAME stores as users/UI. Look for agent-only tables, sandboxed data, or separate state that creates an isolation anti-pattern.

### P5: CRUD Completeness
Identify all major entities (users, projects, documents, sessions, etc.). For each, check if agent-accessible tools exist for Create, Read, Update, Delete. Score per entity (0-4 operations) and compute overall percentage.

### P6: UI Integration
Check how agent-initiated changes propagate to the UI. Look for: WebSocket/SSE streaming, polling endpoints, shared reactive state, event buses, optimistic updates. Identify "silent actions" where agents change state but UI doesn't reflect it.

### P7: Capability Discovery
Check for these 7 mechanisms: (1) onboarding flow showing agent capabilities, (2) help documentation, (3) capability hints in UI, (4) agent self-describes in responses, (5) suggested prompts/actions, (6) empty state guidance, (7) slash commands or help commands. Score against 7.

### P8: Prompt-Native Features
Read agent prompts and system messages. Classify each feature/behavior: is it defined in PROMPT (natural language outcome description, changeable by editing prompt) or CODE (hardcoded logic, requires code change to modify)? Score the ratio.

## Single-Principle Mode

When invoked with a single principle argument, skip the multi-agent orchestration:

1. Coordinator registers and creates workspace with just 1 problem + P9
2. Spawn 1 auditor for that principle
3. Spawn synthesizer after auditor completes (or coordinator synthesizes directly)
4. Present detailed single-principle report

This runs in ~10 minutes vs ~30 minutes for the full audit.

## Timing Estimate

| Phase | Duration |
|-------|----------|
| Phase 0: Setup | ~2 min |
| Phase 1: Spawn Auditors | ~5 min (90s gate x3) |
| Phase 2: Audit | ~10-15 min |
| Phase 3: Spawn Synthesizer | ~2 min |
| Phase 4: Synthesis | ~5-8 min |
| Phase 5: Finalize | ~2 min |
| **Total** | **~25-35 min** |

## Lessons Incorporated

- Sequential spawning, not parallel (hub-collab: identity overwrites on shared MCP connection)
- `subagent_type: "general-purpose"` always (deploy-team-hub: custom types lose ToolSearch)
- ToolSearch in spawn prompts (Run 004: agents can't access MCP tools without it)
- 90-second verification gate (deploy-team-hub: unverified agents waste the entire run)
- Coordinator shuts down LAST (deploy-team-hub: shutting down first strands teammates)
- Re-registering loses coordinator identity (hub-collab: creates new agentId)
