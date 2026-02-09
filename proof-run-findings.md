# Proof Run Findings: Hub + Agent Teams Integration

## Proof Run 001 (2026-02-09)

**Issue**: thoughtbox-twu — Gateway stage never resets for sub-agent MCP sessions
**Branch**: fix/sub-agent-stage-reset
**PR**: #109
**Hub Workspace**: 63f6cb07-a884-48d8-b8a5-4fc88389dc4e

### Team

| Role | Agent Type | Hub Access | Notes |
|------|-----------|-----------|-------|
| Coordinator | parent (team lead) | YES | Created workspace, problems, proposal, proxied findings |
| Researcher | dependency-verifier | YES | Registered independently (agentId fbd93263), posted findings directly |
| Triage | triage-fix | NO | Tool whitelist excluded ToolSearch/MCP tools |
| Judge | verification-judge | NO | Tool whitelist excluded ToolSearch/MCP tools |

### What Worked

1. **The bug got fixed.** Per-session stage tracking via `sessionStages` Map in GatewayHandler. 7 new tests, independently verified. This is the baseline: the system can execute, not just coordinate.

2. **Hub decision trail has unique value.** After the run, the Hub workspace contains: coordinator decisions (unblocking triage before research completed), assumption registry (5 assumptions tested with confidence scores), architectural rationale (why per-session Map works for both HTTP and stdio), constraint discovery (no-self-review). The Agent Teams task list contains: status fields only.

3. **Parallel agent spawning works.** Researcher and triage ran concurrently. Triage completed Phase 1 (reconnaissance) while researcher was still investigating. Coordinator made a real-time decision to unblock triage based on the robustness of the fix strategy.

4. **The judge found something the fixer missed.** Pre-existing memory leak: `clearSession()` is never called from production code. All per-session Maps grow unbounded. Filed as thoughtbox-32q.

### What Didn't Work

1. **Agent tool whitelists blocked Hub access.** triage-fix (`Read, Glob, Grep, Bash, Edit, Write`) and verification-judge (`Read, Glob, Grep, Bash`) had no path to MCP tools. The dependency-verifier worked because its broader tool list (`WebFetch, WebSearch`) apparently gave it access to ToolSearch. **Fix applied**: added ToolSearch to all four engineering agent definitions. Untested — requires new session.

2. **Coordinator-as-proxy collapses identity.** When triage couldn't access the Hub, coordinator proxied its findings. This works functionally but means Hub artifacts show one agentId where three agents contributed. The persistent trail loses attribution fidelity.

3. **No-self-review constraint + proxy = lifecycle gap.** Coordinator created the proposal (since triage couldn't). Coordinator then couldn't review its own proposal. Judge couldn't access Hub to review it. Proposal stayed in `open` status — the review/merge cycle never completed.

4. **Researcher used curl to test MCP server.** An agent connected to a server via MCP resorting to raw HTTP calls to investigate that server's behavior is a smell. It means the MCP protocol isn't the natural first choice for introspection.

5. **H1 was wrong.** We hypothesized sub-agents inherit parent stage state. Researcher discovered HTTP transport creates fresh servers per session — sub-agents start at Stage 0 by default. The bug manifests differently: sub-agents don't know they need to re-initialize. The fix (per-session tracking) is defense-in-depth for HTTP but essential for stdio transport.

### Structural Findings

- **Agent Teams handles**: spawning, real-time messaging, lifecycle (idle/shutdown), file I/O
- **Hub handles**: structured coordination artifacts (problems, proposals, reviews, consensus), persistent decision trail, identity management
- **The seam**: coordinator proxies between SendMessage (ephemeral, real-time) and Hub (persistent, structured). This works but is lossy.
- **The ideal**: every agent accesses the Hub directly. No proxy needed. Full identity attribution.

---

## Proof Run 002 (Proposed)

### Primary Goal

Validate that the ToolSearch fix resolves H5 and H6, then exercise the full proposal/review/merge lifecycle with genuine multi-agent attribution.

### Secondary Goal

Tackle a task that requires actual coordination — not just parallel independent work, but a design decision where proposal/review/merge matters because agents could reasonably disagree.

### Candidate Issue

**thoughtbox-g3r**: Flatten nested sub-operation arg shapes for session/notebook/mental_models

Why this is a good fit:

1. **Design decision required.** The current API uses double-nested args: `{ operation: 'session', args: { operation: 'list', args: { limit: 3 } } }`. The target is flat: `{ operation: 'session.list', limit: 3 }` or similar. There are multiple valid flattening strategies — dot notation, underscore, merged namespace. An architect agent should propose, others should review with substantive opinions.

2. **Multi-file, multi-handler impact.** Touches gateway-handler.ts (handleSession, handleNotebook, handleMentalModels), possibly the operations catalogs, and tests. Coordination-momentum has real work tracking file conflicts.

3. **Backward compatibility question.** Do we support both old and new formats? Break the old? Migration path? This forces a consensus marker on a real architectural choice.

4. **Testable.** Before: double-nested args required. After: flat args work. Existing tests as regression baseline.

### Hypotheses for Run 002

| ID | Hypothesis | Test |
|----|-----------|------|
| H5v2 | All agents register on Hub with distinct identities | `workspace_status` shows 3+ distinct agentIds |
| H6v2 | Full proposal/review/merge lifecycle completes | At least 1 proposal with status `merged`, with review from a different agentId than the proposer |
| H10 | Agents disagree productively | At least 1 review with verdict `request-changes` that leads to a revised proposal |
| H11 | Consensus marker captures a real architectural decision | Consensus marker references a specific design choice (e.g., dot notation vs. underscore) with reasoning |
| H12 | Cold reader can reconstruct the design decision | Hub workspace trail, read without agent context, explains why the chosen approach was selected over alternatives |

### Falsification Criteria

1. If all agents register but produce no reviews → Hub access works but coordination is still theater
2. If the design decision is rubber-stamped with no substantive review → proposal/review is ceremony, not judgment
3. If the feature doesn't ship → coordination overhead killed execution (same failure mode as run 001 risked)
