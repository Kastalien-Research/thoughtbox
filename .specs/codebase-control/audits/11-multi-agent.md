Now I have enough data. Let me produce the comprehensive audit report:

---

# Multi-Agent Coordination & Meta-Controller Audit Report

## SUMMARY

This codebase implements a **sophisticated multi-agent coordination layer** with **partial meta-control**. The Hub module (3,269 LOC across 20 files) provides workspaces, problems, task allocation, communication, and consensus primitives. Progressive disclosure gates capability access. However, **explicit meta-control over cognition budget, model selection, and structured handoff semantics is largely absent from code** — these exist as procedures and organizational patterns rather than runtime systems.

---

## EXISTS (Fully Implemented)

### 1. Hub Coordination Infrastructure (`src/hub/`)

**Agent Identity & Registration**
- File: `src/hub/agent-identity.ts:29-76`
- UUID-based agent identity with optional name mapping
- Resolves agents from `THOUGHTBOX_AGENT_ID` / `THOUGHTBOX_AGENT_NAME` env vars
- Auto-registers new agents with contributor role

**Workspace Management (`src/hub/workspace.ts:23-46`)**
- Create workspaces with coordinator and contributor roles
- Presence tracking: online/offline status, lastSeenAt timestamps
- `joinWorkspace`, `listWorkspaces`, `workspaceStatus` with agent role enforcement
- Workspace agents list tracks currentWork (problem ID) per agent
- ~170 LOC, factory pattern `createWorkspaceManager(storage, thoughtStore)`

**Task Allocation (Problems Module) (`src/hub/problems.ts:14-56`)**
- `createProblem` restricted to coordinator role
- `claimProblem`: agents self-assign work, problem.assignedTo tracks owner
- `readyProblems` / `blockedProblems`: dependency-aware readiness queries
- Problem hierarchy: `parentId` field supports sub-problems
- Dependency tracking: `dependsOn` field (array of problem IDs)
- Status machine: open → in-progress → resolved → closed
- Associated channel auto-created per problem for async discussion
- ~307 LOC

**Communication (Channels Module) (`src/hub/channels.ts:12-29`)**
- Problems have associated channels for async agent communication
- `postMessage` / `postSystemMessage` with `agentId` attribution
- Messages include optional `ref` (sessionId, thoughtNumber, branchId) for traceability
- Pub/sub mechanism: `subscribe(uri, callback)` for real-time updates
- URI pattern: `thoughtbox://hub/{workspaceId}/channels/{problemId}`
- ~119 LOC

**Consensus & Review (`src/hub/consensus.ts:69` + `src/hub/proposals.ts:165`)**
- Proposals model code review: `open` → `reviewing` → `merged` | `rejected`
- Review verdict: approve, request-changes, comment
- ConsensusMarker: named agreements with `agreedBy` agent list + thoughtRef
- ReviewerID tracks who reviewed; thoughtRefs link to reasoning
- ~165 LOC (proposals), supports merge with thought number recording

**Progressive Disclosure** (`src/hub/hub-types.ts:195-212` + `src/hub/hub-handler.ts:34-38`)
- 3-stage capability model: Stage 0 (guest), Stage 1 (registered), Stage 2 (workspace member)
- `DisclosureStage` type: `0 | 1 | 2`
- `STAGE_OPERATIONS` map: each stage lists available operations
- Stage enforcement in hub-handler via `getDisclosureStage()` dispatcher
- Example:
  - Stage 0: `register`, `list_workspaces`, `quick_join`
  - Stage 1: `whoami`, `create_workspace`, `join_workspace`, `get_profile_prompt`
  - Stage 2: all problem/proposal/consensus/channel/consensus operations

### 2. Agent Profiles & Mental Model Injection

**Profile Registry** (`src/hub/profiles-registry.ts`, `src/hub/profiles-types.ts:12`)
- 6 profiles: MANAGER, ARCHITECT, DEBUGGER, SECURITY, RESEARCHER, REVIEWER
- Each profile has:
  - `description`: role semantics
  - `mentalModels`: domain knowledge references
  - `primaryGoal`: objective specialization
- Profiles are optional on agent registration

**Profile Priming** (`src/hub/profile-primer.ts:29-48`)
- `getProfilePriming(profile)` returns a resource block for injection
- Resource type: `application/markdown` with `audience: ["assistant"]` annotation
- Priority weight: 0.8 (high precedence for prompt attention)
- URI scheme: `thoughtbox://profile-priming/{profile}`
- Integrates with thought handler via resource blocks pattern

### 3. Handoff Artifacts & Session Continuity

**Session Handoff JSON** (`.claude/session-handoff.json`, committed)
- Schema (from validation script):
  - `version: "1.0.0"`
  - `session_date`, `branch`, `summary` (text narrative)
  - `completed_this_session`: nested object with work categories
  - `remaining_work`: P0 (blockers), stale_references, integration gaps
  - `git`: lastCommit.sha, uncommittedFiles count, stashCount
  - `migrations`, `enforcement_state`: infrastructure tracking
  - `critical_context`: service URLs, secrets location, generated types info
- Structure: bridges session state explicitly (not just implicit notes)
- Validates with `scripts/utils/validate-handoff.mjs` (version, timestamp, git ancestry)

**Cross-Session Continuity Spec** (`.specs/continual-improvement/04-cross-session-continuity.md`)
- Structured handoff as "contract between outgoing agent and incoming one"
- Complements MEMORY.md (durable knowledge) with ephemeral session state
- Pattern from Letta (reasoning trajectory capture) + Carlini C compiler (state files)
- Handoff includes: what was in progress, current OODA phase, hypotheses, partial work

### 4. Sampling & Autonomous Critique (Nascent Meta-Control)

**Sampling Handler** (`src/sampling/handler.ts:63-100`)
- MCP `sampling/createMessage` to request critique from external LLM
- ModelPreferences struct: `intelligencePriority` (0.9), `costPriority` (0.3) hints
- Hints system: specifies model preference (e.g., claude-sonnet-4-5)
- System prompt: "critical thinking expert" role for thought analysis
- Returns: critique text from sampled model
- ~100 LOC — shows the infrastructure for delegating cognition

**Evaluation Gatekeeper** (`src/observatory/evaluation-gatekeeper.ts:1-100`)
- Enforced evaluation gates before integrating improvements
- Tiered evaluation: smoke → regression → real-world
- Behavioral contracts: VARIANCE, CONTENT_COUPLED, TRACE_EXISTS, LLM_JUDGES
- Cost tracking per tier (cost field in TierResult)
- Gate result includes: passed bool, blockedBy field, reason
- Gating blocks integration if any gate fails

### 5. Escalation & Decision Thresholds

**Agentic Dev Team Spec** (`agentic-dev-team/agentic-dev-team-spec.md:32-47`)
- **Escalation Threshold Definition** (explicit):
  - Scope change: any product behavior modification
  - Prioritization conflict: competing critical-path tasks
  - External dependency failure: tool/API/spec discrepancy
  - Timeline impact: ship date shift
  - Irreversible action: deletions, merges to main, production deployments
  - Cost exceeding budget: token spend, API costs, compute time thresholds
  - Repeated failure: >3 attempts with different approaches
  - Shippability assessment: work complete and ready for release
- Everything below thresholds is autonomous; escalation paths structured

**Cost Governor Agent** (`specs/continual-improvement/agents/cost-governor.md:1-147`)
- Dedicated agent role for cost tracking and budget enforcement
- Data sources: Agent SDK logs, historical run logs, .eval/metrics/, git logs
- Weekly budget: $80, broken by category (SIL $15, AgentOps $10, Interactive $40, Compound $15)
- Cost anomaly detection: spikes >3x, runaway agents, drift, waste, starvation
- Boundary: MUST NOT modify budgets (recommends only), MUST escalate when overbudget
- Output: period, total spend, spend by category, efficiency metrics, anomalies, recommendations

---

## PARTIAL (Exists but Incomplete)

### 1. Model Selection & Compute Allocation

**Current State:**
- Sampling handler declares model preferences (intelligencePriority, costPriority) as hints
- Evaluation gatekeeper tracks cost per tier and total cost
- Cost Governor agent can detect and flag cost anomalies

**Gap:**
- No runtime meta-controller that decides: "Use Haiku for this task" vs "Use Sonnet for that"
- No explicit ONE-SHOT vs STRUCTURED-SEARCH selection logic in code
- No verifier invocation protocol (when to call evaluation gatekeeper vs skip)
- Cost hints are advisory; no hard enforcement or circuit-breaker patterns
- File: `src/sampling/handler.ts:89-92` has `costPriority: 0.3` but no downstream logic to enforce it

**Where This Should Live:**
- New module: `src/meta-control/` with:
  - `CognitionBudget` interface (total tokens, cost cap, time budget)
  - `ModelSelector` (risk level, speed, cost constraints → model choice)
  - `InferenceMode` enum (one-shot, chain-of-thought, sampling, verification)
  - `DecisionGate` (when to use sampling, when to escalate, when to verify)

### 2. Structured Handoff for Uncertainty & Safety Context

**Current State:**
- Session handoff JSON captures work state, branch, git ancestry
- Handoff validates schema but doesn't enforce content completeness
- MEMORY.md captures learned knowledge and gotchas

**Gap:**
- Handoff schema has NO fields for:
  - Uncertainty summary (what we don't know, confidence levels)
  - Open assumptions (what must be true for work to succeed)
  - Safety context (what could go wrong, prerequisites for safety)
  - Terminal conditions (how to recognize success; acceptance criteria)
  - Known blockers (dependencies, external waits, escalations pending)
- Session handoff is manually curated; no structure forces capture of these fields
- No "handoff validation" that checks: "Did you document your assumptions?"

**Example Missing Structure:**
```typescript
interface HandoffUncertainty {
  topics: Array<{
    subject: string;
    confidence: 0-1;
    risks: string[];
    mitigations: string[];
  }>;
}

interface HandoffAssumptions {
  items: Array<{
    statement: string;
    whyItMatters: string;
    howToVerify: string;
    consequence_if_false: string;
  }>;
}
```

**Where This Should Live:**
- Extend: `.claude/session-handoff.json` schema with `uncertainty`, `assumptions`, `safety_context`, `terminal_conditions`
- Add: validation hook that rejects incomplete handoffs
- Document in: `.claude/rules/handoff-protocol.md`

### 3. Task Dependency Resolution & Readiness Logic

**Current State:**
- Problems have `dependsOn: string[]` field (problem IDs)
- Hub provides `readyProblems` / `blockedProblems` query operations
- Workspace digest includes problem count

**Gap:**
- No explicit taskgraph solver or critical-path analysis
- No automatic wait-for-dependency mechanisms
- No "estimated remaining time" or "blocking chain" visualization
- Readiness is binary (all deps resolved = ready); no partial credit
- No priority reordering when higher-priority blocker is discovered

**Where This Should Live:**
- `src/hub/task-graph.ts` with:
  - `computeReadiness(problemId)` → detailed readiness state
  - `findBlockingChain(problemId)` → list of problems blocking this one
  - `estimateCriticalPath(workspaceId)` → bottleneck analysis

### 4. Communication Bandwidth & Cognitive Load Optimization

**Current State:**
- Channels exist for async discussion
- Messages include optional refs (sessionId, thoughtNumber, branchId)
- Workspace digest exists for status overview

**Gap:**
- No explicit compression or information filtering
- Channel messages are stored as strings; no structured summary mechanism
- No "latest N messages only" or "summarize channel for catch-up"
- No cognitive load tracking (how many active channels per agent, message volume)
- Workspace digest only counts; doesn't rank or prioritize information

**Where This Should Live:**
- `src/hub/channel-digest.ts` with:
  - `summarizeChannel(problemId, maxMessages)` → AI-generated summary
  - `filterChannelByAgent(agentId, since)` → messages relevant to this agent
  - `computeCognitiveLoad(agentId)` → # active problems, msg throughput, priority conflicts

### 5. Verifier & Guard Rail Invocation

**Current State:**
- EvaluationGatekeeper exists and can be called
- Sampling handler can request LLM critique
- Hub operations enforce role-based access

**Gap:**
- No meta-control logic that decides: "This change is risky; invoke verifier"
- No risk classification system (low/medium/high)
- No automatic verification trigger based on:
  - Scope of change (lines of code, files affected)
  - Domain (security, core logic, API contract)
  - Confidence level of proposing agent
  - Cost of verification vs. cost of failure
- Gatekeeper is a *capability*; no orchestrator that *invokes* it conditionally

**Where This Should Live:**
- `src/meta-control/verification-router.ts` with:
  - `shouldVerify(proposal, context)` → boolean with reasoning
  - `selectVerifier(domain, risk_level)` → which gatekeeper to use
  - `computeVerificationCost(scope)` → estimated token spend

---

## ABSENT (Not Found)

### 1. Explicit Meta-Controller Runtime

**What's Missing:**
- No system that observes task execution and decides (at runtime) whether to:
  - Continue with current plan
  - Sample multiple candidate approaches
  - Invoke a verifier
  - Ask the human
  - Escalate
  - Retry with different compute budget
- No `MetaController` interface that takes (situation, resources, time_remaining) and returns (decision, rationale)

**Why It Matters (Paragon):**
> "The stack has a meta-controller that decides which model to use, whether to use one-shot inference or structured search, how many candidate plans to sample, whether to invoke a verifier, whether to retrieve memory, whether to ask the user, whether to escalate, how much compute to spend now versus later."

**Current Behavior:** These decisions are baked into agent role definitions (AGENTS.md, team prompts) and escalation thresholds (agentic-dev-team spec), but there is no runtime system that *executes* these decisions.

**Proposed Home:**
- `src/meta-control/meta-controller.ts` (new)
- Interface:
  ```typescript
  interface MetaController {
    decideInferenceMode(situation): InferenceMode;
    decideTrustLevel(proposal): 0-1;
    selectModel(task, budget): ModelHint;
    decideVerification(change): VerificationDecision;
    decideEscalation(situation): EscalationDecision | null;
  }
  ```

### 2. Value-of-Information Framework

**What's Missing:**
- No calculation of: "Is it worth spending $5 to verify this change, given the cost of failure?"
- No ROI model for asking the human vs. trying autonomously
- No escalation cost/benefit analysis

**Why It Matters (Paragon):**
> "Human interaction as optimal intervention (value of information)"

**Current Behavior:** Escalation thresholds exist, but are always enforced. No dynamic "cost now vs. risk later" trade-off.

**Proposed Home:**
- `src/meta-control/voi-calculator.ts` (new)
- Interface:
  ```typescript
  interface VOICalculator {
    askHumanVsAuto(situation): { askCost, autoCost, failureCost };
    verifyVsShip(change): { verifyCost, failureCost, confidence };
    sampleVsCommit(options): { sampleCost, commitRisk };
  }
  ```

### 3. Explicit Inference Mode Negotiation

**What's Missing:**
- No protocol for task → inference mode matching
- No structured representation of (one-shot, chain-of-thought, sampling, verification, nested agents)

**Why It Matters (Paragon):**
> "Cheap cognition for low-risk, high-frequency situations. Expensive cognition for high-stakes, low-confidence, or irreversible situations."

**Current Behavior:** Sampling handler exists. Evaluation gatekeeper exists. But no layer that says "this task needs sampling" or "this task should use one-shot".

**Proposed Home:**
- `src/meta-control/inference-modes.ts` (new)
- Types:
  ```typescript
  type InferenceMode = 
    | { type: 'one-shot', model: string }
    | { type: 'chain-of-thought', model: string, steps: number }
    | { type: 'sampling', candidates: number, model: string }
    | { type: 'verification', gatekeeper: string }
    | { type: 'nested-agent', role: string };
  ```

### 4. Resource-Aware Scheduling

**What's Missing:**
- No scheduler that decides task order based on:
  - Remaining compute budget
  - Deadline pressure
  - Dependency graph
  - Agent availability
  - Workspace load

**Why It Matters (Paragon):**
> "Bandwidth, latency, and cognitive interference are real resources"

**Current Behavior:** Problems have `readyProblems` query, but no queue or scheduler.

**Proposed Home:**
- `src/meta-control/resource-aware-scheduler.ts` (new)
- Interface:
  ```typescript
  interface Scheduler {
    nextTask(workspace): Problem | null;
    allocateAgent(problem, candidates): AgentAllocation;
    computeLoad(workspace): WorkspaceLoad;
  }
  ```

### 5. Observability of Meta-Control Decisions

**What's Missing:**
- No trace or audit log of meta-control decisions
- Sampling requests happen in code but aren't recorded
- Verifier invocations aren't tracked
- Model selection hints are created but their effect is invisible

**Why It Matters (Paragon):**
> "A coordinator handles shared objective decomposition, task allocation, communication budget, and consensus on shared facts."

**Current Behavior:** Individual decisions (problem claims, proposal merges) are recorded. But meta-control decisions (why we used Sonnet instead of Haiku, why we escalated, why we verified) are not.

**Proposed Home:**
- `src/meta-control/decision-recorder.ts` (new)
- Record to: Thoughtbox Hub as consensus markers, or knowledge graph as Decision entities
- Field: `MetaControlDecision` → {decision_type, rationale, outcome, context}

### 6. Progressive Disclosure of Reasoning

**What's Missing:**
- Progressive disclosure in hub-handler (Stage 0/1/2) controls *capability* access
- No parallel system for progressive disclosure of *reasoning* or *explanation detail*
- No "explain your reasoning more" mode for high-stakes decisions

**Why It Matters (Paragon):**
> "Progressive disclosure as meta-control"

**Current Behavior:** Stage system is all-or-nothing; agents either have access to an operation or don't. No "limited explanation" vs "full reasoning trace" mode.

**Proposed Home:**
- `src/meta-control/explanation-levels.ts` (new)
- Types:
  ```typescript
  type ExplanationLevel = 'summary' | 'detailed' | 'full-trace';
  interface ReasoningRequest {
    topic: string;
    level: ExplanationLevel;
    audience: 'agent' | 'human' | 'audit';
  }
  ```

---

## ARCHITECTURE NOTES

### Where New Meta-Control Components Should Go

**Directory Structure:**
```
src/
├── meta-control/                    (NEW)
│   ├── index.ts
│   ├── meta-controller.ts           (main orchestrator)
│   ├── model-selector.ts            (model choice logic)
│   ├── verification-router.ts       (when to verify)
│   ├── inference-modes.ts           (one-shot vs sampling vs etc)
│   ├── voi-calculator.ts            (value of information)
│   ├── resource-aware-scheduler.ts  (task ordering)
│   ├── decision-recorder.ts         (audit trail)
│   ├── explanation-levels.ts        (reasoning disclosure)
│   └── __tests__/
└── hub/                             (EXTEND)
    ├── hub-handler.ts               (add meta-control hooks)
    ├── task-graph.ts                (NEW - dependency resolution)
    ├── channel-digest.ts            (NEW - information compression)
    └── __tests__/
```

### Integration Points

1. **Hub Handler** (`src/hub/hub-handler.ts:60-150`)
   - Call MetaController before claiming problem: "Is this agent the right choice?"
   - Call VOICalculator before merging proposal: "Is verification worth it?"
   - Record decisions via decision-recorder

2. **Sampling Handler** (`src/sampling/handler.ts:76-100`)
   - Query MetaController: "Should we sample this, or one-shot?"
   - Pass model hints from model-selector, not hardcoded

3. **Evaluation Gatekeeper** (`src/observatory/evaluation-gatekeeper.ts`)
   - Invoked by verification-router (not directly)
   - Cost data feeds into budget tracker

4. **Session Handoff** (`.claude/session-handoff.json`)
   - Extend schema to capture: `uncertainty`, `assumptions`, `safety_context`, `terminal_conditions`
   - Validate completeness before allowing session end

5. **Cost Governor** (`specs/continual-improvement/agents/cost-governor.md`)
   - Consumes decision-recorder audit trail
   - Recommends budget reallocation based on meta-control patterns

### Invariants to Maintain

1. **Coordinator Role Remains Required**
   - Only workspace coordinators can create problems, define acceptance criteria
   - Meta-control decisions respect coordinator authority

2. **Progressive Disclosure Layering**
   - Stage gates (Stages 0/1/2) stay in hub-handler
   - Explanation levels (summary/detailed/trace) added as *optional* overlay
   - Backward compat: agents not requesting explanation get summary by default

3. **Hub as System of Record**
   - All meta-control decisions recorded as hub artifacts (consensus markers or channels)
   - Knowledge graph tracks decision entities (`Decision` type)
   - No side-channel decision logs

4. **Cost Transparency**
   - Every meta-control decision logs its compute cost estimate
   - Verifiable against actual token spend in Agent SDK outputs
   - Cost Governor can audit compliance

---

## SUMMARY TABLE

| Component | Status | File(s) | Lines | Completeness |
|-----------|--------|---------|-------|--------------|
| **Agent Identity** | EXISTS | `agent-identity.ts` | 76 | 100% |
| **Workspace Mgmt** | EXISTS | `workspace.ts` | 170 | 100% |
| **Task Allocation** | EXISTS | `problems.ts` | 307 | 85% (no scheduler) |
| **Communication** | EXISTS | `channels.ts` | 119 | 85% (no compression) |
| **Consensus/Review** | EXISTS | `proposals.ts`, `consensus.ts` | 234 | 95% |
| **Progressive Disclosure** | EXISTS | `hub-types.ts`, `hub-handler.ts` | 68 | 100% (capability gates only) |
| **Agent Profiles** | EXISTS | `profiles-registry.ts` | 104 | 95% (no capability detection) |
| **Profile Priming** | EXISTS | `profile-primer.ts` | 48 | 100% |
| **Handoff Artifacts** | EXISTS | `.claude/session-handoff.json` | N/A | 70% (missing uncertainty/assumptions fields) |
| **Sampling & Critique** | EXISTS | `src/sampling/handler.ts` | 100 | 60% (hints only, no enforcement) |
| **Evaluation Gatekeeper** | EXISTS | `evaluation-gatekeeper.ts` | 100+ | 80% (no auto-invocation logic) |
| **Escalation Thresholds** | EXISTS | `agentic-dev-team-spec.md` | N/A | 100% (process, not code) |
| **Cost Governance** | EXISTS | `cost-governor.md` | N/A | 90% (agent skill, not runtime) |
| **Meta-Controller** | ABSENT | — | 0 | 0% |
| **Model Selector** | ABSENT | — | 0 | 0% |
| **Verification Router** | ABSENT | — | 0 | 0% |
| **VOI Calculator** | ABSENT | — | 0 | 0% |
| **Decision Recorder** | ABSENT | — | 0 | 0% |
| **Resource-Aware Scheduler** | ABSENT | — | 0 | 0% |
| **Explanation Levels** | ABSENT | — | 0 | 0% |

---

## FINAL ASSESSMENT

**Strength:** This codebase has **world-class multi-agent coordination infrastructure**. The Hub is a mature, well-tested system for workspace isolation, task allocation, dependency tracking, asynchronous communication, and consensus. Progressive disclosure is elegant. Profile-based behavioral specialization is implemented. Handoff artifacts exist.

**Gap:** **Meta-control is *procedural* (in specs and roles) rather than *executable* (in code).** The paragon's vision—a runtime system that chooses models, invokes verifiers, asks humans, manages compute budgets, and records all decisions—exists as philosophy and documentation, not as a runnable layer. The cost-governor is a *skill* (an agent that reviews logs), not a *system* (runtime budget enforcement). Sampling hints exist but are not consumed. Escalation thresholds are rules, not guarded decisions.

**Recommendation:** Build `src/meta-control/` as a pluggable layer between hub operations and execution. Model it as a small decision engine (< 500 LOC core) that:
1. Observes task context (scope, risk, cost, confidence)
2. Applies decision rules (via Cost Governor patterns)
3. Selects inference mode and model
4. Records decision for audit
5. Returns to calling code with choice + rationale

This keeps meta-control **observable, auditable, and under coordinator authority** while making it **executable by runtime code**.
