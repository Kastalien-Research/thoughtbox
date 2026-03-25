# Spec 07: Assumption Registry

**Status**: Draft v0.1
**Generated**: 2026-02-11
**Context**: Thoughtbox Engineering System — Kastalien Research
**Parent**: [00-overview.md](./00-overview.md) — Gap 7
**Role Source**: Research & Reality-Check Agent (`agentic-dev-team/agentic-dev-team-spec.md`, Role 2)

---

## Problem Statement

External dependency failures are the single most costly recurring failure mode in the Thoughtbox engineering system. The agentic-dev-team-spec (Section: Design Rationale, point 4) explicitly identifies this:

> *"The most critical missing role for a solo AI-native developer is the Research & Reality-Check agent. Internal verification (tests pass, code works as specified) is necessary but insufficient. The assumption that external systems match their specifications has been the single most costly recurring failure mode."*

The Research & Reality-Check agent role defines the need to "maintain a living registry of verified and unverified assumptions" as a persistent artifact. That registry does not exist. Assumptions are currently tracked only in MEMORY.md as unstructured prose, discovered and recorded only after they fail.

### The Evidence: Assumption Failures in the Project Record

The following assumption failures are documented in MEMORY.md and `.claude/rules/`. Each was discovered the hard way -- by hitting it in production or during agent sessions -- rather than by proactive verification.

**MCP Knowledge API Gotchas** (MEMORY.md):
- `add_observation` params are `entity_id` + `content`, not `entityId`/`observation` -- Parameter naming assumption violated
- `create_relation` params are `from_id` + `to_id`, not `source_id`/`target_id` -- Parameter naming assumption violated
- `query_graph` param is `start_entity_id` and only follows OUTGOING relations -- Behavioral assumption violated
- `create_entity` returns existing entity on UNIQUE collision instead of erroring -- Error handling assumption violated
- Re-registering on Hub gives new agentId, losing coordinator role permanently -- State management assumption violated

**MCP Tool Access in Sub-Agents** (MEMORY.md):
- `mcpServers:` in agent frontmatter causes "Tool names must be unique" API errors (inherited + declared = duplicates) -- Framework behavior assumption violated
- Sub-agents inherit parent MCP tools automatically (no declaration needed) -- Discovery took multiple sessions
- Known Claude Code bugs: GH #10668, #10704, #21560 -- External bug assumptions unverified

**Agent Team Operational Assumptions** (MEMORY.md - Run 004/005):
- Agents MUST have ToolSearch in `tools:` frontmatter to load MCP tools at runtime -- Framework requirement unverified until failure
- Agent definitions are cached at session start; editing mid-session has no effect -- Behavioral assumption violated
- In-process teammates cannot be force-killed; they run until maxTurns exhaustion -- Resource management assumption violated
- Must spawn team agents as `subagent_type: "general-purpose"` for ToolSearch access -- Custom types silently lack tools

**Infrastructure Assumptions** (MEMORY.md):
- Observatory session store is in-memory only -- Persistence assumption violated on restart
- `.claude/hooks/` is write-protected; user must create hook files manually -- Permission assumption violated
- Docker builds from working directory (`context: .`) -- Build context assumption
- Pre-tool-use hook requires re-read before write to same file -- Framework constraint undocumented

**Workflow External Service Dependencies** (from `.github/workflows/`):
- `ci.yml`: Depends on `ANTHROPIC_API_KEY` secret, `actions/checkout@v4`, `actions/setup-node@v4`, npm registry
- `self-improvement-loop.yml`: Depends on Anthropic API, `gh` CLI, GitHub Actions compute, npm registry
- `agentops_daily_thoughtbox_dev.yml`: Depends on `LANGSMITH_API_KEY`, `LANGSMITH_ORG` secrets, LangSmith cloud service
- `agentops_on_approval_label.yml`: Depends on LangSmith, `GITHUB_TOKEN`, Anthropic API
- `publish-mcp.yml`: Depends on `NPM_TOKEN`, MCP Registry at `registry.modelcontextprotocol.io`, npm registry, `mcp-publisher` binary at a specific GitHub release URL
- `claude.yml`: Depends on `anthropics/claude-code-action@beta` -- a beta action that may change

**Package Dependencies** (from `package.json`):
- `@modelcontextprotocol/sdk` pinned at `1.25.3` -- MCP SDK API surface assumed stable
- `@smithery/sdk` at `^1.7.5` -- Smithery platform availability assumed
- `express` at `^5.1.0` -- Express 5 is a major version with breaking changes from v4
- `@anthropic-ai/claude-agent-sdk` at `^0.1.76` -- Agent SDK is pre-1.0, API surface unstable
- `better-sqlite3` at `^11.0.0` -- Native module, requires platform-specific compilation

### The Cost

Each of these assumption failures cost 30-120 minutes of debugging time. Several were discovered multiple times across different sessions because the first discovery was not recorded in a queryable, verifiable format. The MEMORY.md entries that capture these failures are prose -- no machine can parse them, schedule re-verification, or alert when an assumption might have changed.

The total documented cost from assumption failures in the project record is estimated at 20+ hours of wasted agent and human time across the first 6 weeks of development. This is conservative -- it only counts failures that were explicitly recorded.

---

## Architecture

### Core Abstraction: The Assumption Record

An assumption is a claim about the behavior of a system outside the project's control boundary. Every assumption has a lifecycle: it is captured (often implicitly), verified (or not), and eventually either confirmed, violated, or staled.

```
Assumption Record {
  id:               string           // Deterministic ID: sha256(source + claim)[:12]

  // What is being assumed
  claim:            string           // The specific, falsifiable claim
  category:         AssumptionCategory

  // Where the assumption comes from
  source: {
    type:           "documentation" | "specification" | "observation" | "inference" | "convention"
    reference:      string           // URL, file path, or description
    discovered_by:  string           // Agent ID, session ID, or "human"
    discovered_at:  string           // ISO 8601
  }

  // What depends on this assumption
  dependencies: {
    files:          string[]         // Files that rely on this assumption
    workflows:      string[]         // GitHub Actions that depend on it
    packages:       string[]         // npm packages involved
    agents:         string[]         // Agent roles that operate under this assumption
  }

  // Verification state
  verification: {
    status:         "unverified" | "verified" | "violated" | "stale"
    confidence:     number           // 0.0 to 1.0
    last_verified:  string | null    // ISO 8601
    verified_by:    string | null    // Agent ID, test name, or "human"
    evidence:       string | null    // What verified or violated it
    method:         "test" | "manual" | "smoke" | "inference" | null
  }

  // Failure history
  failures: Array<{
    occurred_at:    string           // ISO 8601
    description:    string           // What happened
    blast_radius:   "low" | "medium" | "high" | "critical"
    recovery_time:  string           // Duration (e.g., "45m", "2h")
    resolution:     string           // How it was resolved
    session_id:     string | null    // Session where failure was discovered
  }>

  // Schedule
  verification_schedule: {
    frequency:      "daily" | "weekly" | "monthly" | "on_change" | "manual"
    next_due:       string | null    // ISO 8601
    last_run:       string | null    // ISO 8601
  }

  // Metadata
  freshness:        "HOT" | "WARM" | "COLD"
  tags:             string[]
  notes:            string | null
  created_at:       string           // ISO 8601
  updated_at:       string           // ISO 8601
}

AssumptionCategory =
  | "api_behavior"       // External API/SDK behaves as documented
  | "api_parameter"      // API parameter names, types, and semantics
  | "framework_behavior" // Framework (Claude Code, Agent SDK) behavior
  | "service_availability" // External service is available and responsive
  | "platform_compat"    // Platform/OS/runtime compatibility
  | "package_stability"  // npm package API surface stability
  | "build_infra"        // Build, CI/CD, and deployment infrastructure
  | "permission_model"   // File system, API, and service permissions
  | "state_management"   // How state is persisted, shared, or lost
  | "protocol_compliance" // Spec/protocol compliance of external implementations
  | "convention"         // Naming conventions, directory structures, implicit contracts
```

### System Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                     Agent Session                                 │
│                                                                   │
│  1. Agent makes a claim about external system                     │
│  2. Capture hook detects assumption-like patterns                 │
│  3. Registry records or updates the assumption                    │
│  4. Agent can query registry before acting on assumptions         │
└──────────────┬────────────────────────────────────┬──────────────┘
               │                                    │
               ▼                                    ▼
┌──────────────────────────┐        ┌──────────────────────────────┐
│   ASSUMPTION REGISTRY     │        │  DEPENDENCY VERIFIER AGENT   │
│                           │        │  (research-reality-01)        │
│  Storage:                 │        │                               │
│  .assumptions/            │        │  Scheduled verification:      │
│    registry.jsonl         │        │  - Daily: service_availability│
│    index.json             │        │  - Weekly: api_behavior,      │
│    failures.jsonl         │        │    framework_behavior         │
│    verification-log.jsonl │        │  - Monthly: package_stability,│
│                           │        │    protocol_compliance        │
│  Query:                   │        │  - On change: build_infra     │
│  - By category            │        │                               │
│  - By status              │        │  Emits:                       │
│  - By confidence          │        │  - assumption_update signals  │
│  - By staleness           │        │  - Escalations on violation   │
│  - By blast radius        │        │                               │
└──────────────┬───────────┘        └───────────────┬──────────────┘
               │                                    │
               ▼                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                  INTEGRATION POINTS                                │
│                                                                   │
│  ULC Signal Store ← assumption_update signals                     │
│  KAL             ← assumption adapter for unified queries         │
│  Beads           ← issues created from assumption violations      │
│  MEMORY.md       ← high-severity violations recorded as gotchas   │
│  Escalation      ← critical violations escalate to Chief Agentic  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Storage

### Directory Structure

```
.assumptions/
├── registry.jsonl           # One assumption record per line, append-only
├── index.json               # Lightweight lookup index (ID → line number, category → IDs)
├── failures.jsonl           # Failure events, append-only
├── verification-log.jsonl   # Verification run results, append-only
└── snapshots/               # Periodic full-state snapshots for dashboard
    └── 2026-02-11.json      # Daily snapshot (generated by verification runs)
```

### Why JSONL

The same rationale as the ULC signal store (Spec 01, Component 1):
- Append-only writes are safe for concurrent access
- No database dependency (unlike Beads SQLite)
- Trivially readable in GitHub Actions, Agent SDK scripts, and Claude Code hooks
- Git-trackable for history and audit trail

### File Formats

**registry.jsonl**: Each line is a complete `AssumptionRecord` JSON object. New assumptions are appended. Updates rewrite the specific line (identified by `id`) in place. The file is expected to grow to 100-500 entries over the project lifetime.

**index.json**: Rebuilt on every write to `registry.jsonl`. Provides O(1) lookup:

```json
{
  "version": 1,
  "last_updated": "2026-02-11T12:00:00Z",
  "total": 47,
  "by_id": {
    "a1b2c3d4e5f6": { "line": 0, "category": "api_parameter", "status": "verified" },
    "f6e5d4c3b2a1": { "line": 1, "category": "framework_behavior", "status": "violated" }
  },
  "by_category": {
    "api_parameter": ["a1b2c3d4e5f6", "..."],
    "framework_behavior": ["f6e5d4c3b2a1", "..."]
  },
  "by_status": {
    "verified": ["a1b2c3d4e5f6"],
    "violated": ["f6e5d4c3b2a1"],
    "unverified": [],
    "stale": []
  },
  "summary": {
    "verified": 28,
    "violated": 5,
    "unverified": 8,
    "stale": 6,
    "mean_confidence": 0.72,
    "oldest_unverified_days": 14
  }
}
```

**failures.jsonl**: Each line is a failure event linked to an assumption ID:

```json
{
  "assumption_id": "a1b2c3d4e5f6",
  "occurred_at": "2026-02-09T15:30:00Z",
  "description": "mcpServers in agent frontmatter causes 'Tool names must be unique' API error",
  "blast_radius": "high",
  "recovery_time": "120m",
  "resolution": "Removed mcpServers from all agent .md files; use ToolSearch at runtime instead",
  "session_id": "run-004",
  "files_affected": [".claude/agents/hub-coordinator.md", ".claude/agents/hub-architect.md", ".claude/agents/hub-debugger.md"],
  "cost_estimate_minutes": 120
}
```

**verification-log.jsonl**: Each line records a verification attempt:

```json
{
  "assumption_id": "a1b2c3d4e5f6",
  "verified_at": "2026-02-11T02:00:00Z",
  "verified_by": "dependency-verifier-daily",
  "method": "smoke",
  "result": "passed",
  "evidence": "MCP SDK 1.25.3 add_observation still accepts entity_id + content params",
  "duration_ms": 340
}
```

---

## Automatic Capture

### Capture Strategy

Assumptions enter the registry through three channels:

1. **Bulk seed**: One-time import of existing assumptions from MEMORY.md, `.claude/rules/`, and `package.json`.
2. **Session capture**: Hooks detect when agents make claims about external systems during sessions.
3. **Manual registration**: Agents or humans explicitly register assumptions via CLI or MCP tool.

### Channel 1: Bulk Seed (Bootstrap)

A bootstrap script (`scripts/assumption-seed.ts`) populates the registry from existing knowledge:

**From MEMORY.md**:
- Parse "MCP Knowledge API Gotchas" section into `api_parameter` assumptions
- Parse "MCP Tool Access in Sub-Agents" section into `framework_behavior` assumptions
- Parse "Run 004 Lessons" and "Run 005 Breakthrough" into `framework_behavior` assumptions
- Parse "Known Bugs" into `api_behavior` assumptions
- Parse "Gotchas" into mixed-category assumptions

**From `.claude/rules/`**:
- Each rule file encodes assumptions about how agents should behave. Extract assumptions about external system behavior (e.g., `ooda-foundation.md` assumes certain cognitive loop patterns work; `git-workflow.md` assumes `git push` semantics).
- Focus on rules that reference external tools or services.

**From `package.json`**:
- For each dependency, create a `package_stability` assumption: "{package}@{version_range} API surface is stable for our usage patterns."
- For pinned versions (exact match), flag that upstream may have breaking changes we are not tracking.
- For `^` ranges, flag that minor/patch updates may introduce subtle behavioral changes.

**From `.github/workflows/`**:
- For each workflow, extract external service dependencies:
  - GitHub Actions (`actions/checkout@v4`, `actions/setup-node@v4`, `anthropics/claude-code-action@beta`) -- `build_infra` assumptions
  - Secrets referenced (`ANTHROPIC_API_KEY`, `LANGSMITH_API_KEY`, `NPM_TOKEN`) -- `service_availability` assumptions
  - External binaries (`mcp-publisher` from GitHub releases URL) -- `build_infra` assumptions
  - Service endpoints (npm registry, MCP registry, LangSmith) -- `service_availability` assumptions

**Seed output**: The bootstrap script generates `registry.jsonl` with all assumptions in `unverified` status and sets verification schedules based on category defaults.

### Channel 2: Session Capture (Hooks)

A post-tool-use hook (`.claude/hooks/assumption_capture.sh`) inspects agent tool calls for assumption-like patterns:

**Detection heuristics**:

| Pattern | Category | Example |
|---------|----------|---------|
| Agent reads external API docs then makes a claim about behavior | `api_behavior` | "The MCP SDK supports resource subscriptions" |
| Agent references a package version constraint | `package_stability` | "Express 5 supports async error handlers" |
| Agent claims a GitHub Action or workflow will behave a certain way | `build_infra` | "actions/checkout@v4 fetches submodules by default" |
| Agent encounters an error from an external system and forms a hypothesis | `framework_behavior` | "ToolSearch must be in agent frontmatter for MCP access" |
| Agent reads a spec or RFC and assumes implementation compliance | `protocol_compliance` | "MCP servers implement the resources/subscribe method" |

**Implementation**: The hook is lightweight. It does not run an LLM. It pattern-matches on tool call outputs and error messages:

```bash
#!/usr/bin/env bash
set -euo pipefail

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')
tool_output=$(echo "$input_json" | jq -r '.tool_output // ""')

# Only trigger on WebFetch (external docs), Bash (package commands), or error outputs
case "$tool_name" in
  WebFetch|Bash)
    # Delegate to Node script for pattern matching
    echo "$input_json" | node .assumptions/capture-patterns.mjs 2>/dev/null || true
    ;;
esac

exit 0
```

The Node script (`capture-patterns.mjs`) checks for:
- npm/package version strings in tool output
- API error messages from external services
- URLs to external documentation
- GitHub Actions references
- Known assumption-adjacent keywords ("should", "expects", "assumes", "requires", "depends on")

When a potential assumption is detected, it writes a candidate to `.assumptions/candidates.jsonl` for human or agent review -- it does NOT auto-add to the registry. Auto-capture is intentionally conservative to avoid noise.

### Channel 3: Manual Registration

**MCP tool operation**:

```json
{
  "operation": "register_assumption",
  "args": {
    "claim": "The @modelcontextprotocol/sdk at 1.25.3 uses entity_id (not entityId) for add_observation",
    "category": "api_parameter",
    "source_type": "observation",
    "source_reference": "MEMORY.md: MCP Knowledge API Gotchas",
    "dependencies": {
      "files": ["src/knowledge/knowledge-handler.ts"],
      "packages": ["@modelcontextprotocol/sdk"]
    },
    "tags": ["mcp", "knowledge-graph"]
  }
}
```

**CLI**:

```bash
# Register a new assumption
assumption register \
  --claim "Express 5 async error handlers propagate to global handler" \
  --category api_behavior \
  --source-type documentation \
  --source-ref "https://expressjs.com/en/guide/error-handling.html" \
  --files "src/observatory/server.ts" \
  --packages "express"

# Register from a template (for bulk entry)
assumption register --from-file assumptions-to-add.json
```

---

## Verification Schedule

### Category Defaults

| Category | Default Frequency | Rationale |
|----------|-------------------|-----------|
| `service_availability` | daily | Services go down. Detect within 24 hours. |
| `api_behavior` | weekly | API behavior changes with releases. Weekly catches most. |
| `api_parameter` | weekly | Parameter names are stable but can change across major versions. |
| `framework_behavior` | weekly | Claude Code and Agent SDK update frequently. |
| `package_stability` | monthly | npm packages change on their own release cycles. |
| `protocol_compliance` | monthly | Specs evolve slowly. Monthly is sufficient. |
| `build_infra` | on_change | GitHub Actions versions, CI configs. Verify when workflow files change. |
| `platform_compat` | monthly | OS/runtime updates are infrequent. |
| `permission_model` | monthly | Permissions rarely change once established. |
| `state_management` | weekly | State bugs are high-impact. Weekly catches drift. |
| `convention` | manual | Conventions are human-defined. No automated check. |

### Staleness Rules

An assumption becomes `stale` when:
- `last_verified` is older than 2x the verification frequency (e.g., a weekly assumption not verified for 14 days)
- The assumption's `dependencies.packages` have had a version change since `last_verified`
- A related assumption in the same category has been violated (cascade staleness)

Stale assumptions are treated as `unverified` by the dependency-verifier agent and get priority in the next verification run.

### Verification Methods

| Method | Description | Automation Level |
|--------|-------------|------------------|
| `test` | A deterministic integration test runs against the actual dependency | Full -- runs in CI or locally |
| `smoke` | A lightweight check (HTTP ping, version query, import test) | Full -- runs in scripts |
| `manual` | A human or agent visually confirms the assumption | None -- requires session |
| `inference` | The assumption is inferred from a successful higher-level operation | Partial -- detected from test suite results |

### Verification Runner

**Location**: `scripts/assumption-verify.ts`

The verification runner iterates through all assumptions due for verification, executes the appropriate method, and records results.

```typescript
// scripts/assumption-verify.ts

interface VerificationPlan {
  assumption: AssumptionRecord;
  method: VerificationMethod;
  test: () => Promise<VerificationResult>;
}

interface VerificationResult {
  passed: boolean;
  evidence: string;
  duration_ms: number;
  error?: string;
}

// Built-in verification strategies per category
const strategies: Record<AssumptionCategory, VerificationStrategy> = {
  service_availability: async (assumption) => {
    // HTTP HEAD to service endpoint, check for 2xx or known healthy status
    // For secrets-dependent services, verify the secret exists in env
  },
  api_parameter: async (assumption) => {
    // Import the package, check that the function/method exists
    // For MCP tools, attempt a minimal call and check for parameter errors
  },
  package_stability: async (assumption) => {
    // npm view <package> version -- check if installed version is still latest in range
    // Check for breaking change indicators in changelog
  },
  build_infra: async (assumption) => {
    // Verify GitHub Action exists at the referenced version
    // Check that referenced binary URLs are still accessible
  },
  framework_behavior: async (assumption) => {
    // Run a minimal reproduction script that exercises the assumed behavior
    // Compare output against expected behavior recorded in the assumption
  },
  // ... other categories
};
```

**Scheduled execution**: The verification runner is invoked from two places:

1. **GitHub Action** (`.github/workflows/assumption-verify.yml`):
   ```yaml
   name: Assumption Verification
   on:
     schedule:
       - cron: '0 3 * * *'  # Daily at 3am UTC
     workflow_dispatch: {}
     push:
       paths:
         - '.github/workflows/**'
         - 'package.json'
         - 'package-lock.json'

   jobs:
     verify:
       runs-on: ubuntu-latest
       timeout-minutes: 10
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '22'
             cache: 'npm'
         - run: npm ci
         - name: Run daily verification
           run: npx tsx scripts/assumption-verify.ts --frequency daily
         - name: Run weekly verification (Sundays only)
           if: github.event.schedule && contains('0', steps.day.outputs.day)
           run: npx tsx scripts/assumption-verify.ts --frequency weekly
         - name: Run on-change verification
           if: github.event_name == 'push'
           run: npx tsx scripts/assumption-verify.ts --frequency on_change
         - name: Commit verification results
           run: |
             git config user.name "github-actions[bot]"
             git config user.email "github-actions[bot]@users.noreply.github.com"
             git add .assumptions/
             git diff --cached --quiet || git commit -m "chore(assumptions): verification run $(date +%Y-%m-%d)"
             git push || echo "Nothing to push"
   ```

2. **Session start hook**: When an interactive session starts, run a quick staleness check (no actual verification -- just flag stale assumptions in context):
   ```bash
   # In session_start hook
   STALE_COUNT=$(node -e "
     const idx = JSON.parse(require('fs').readFileSync('.assumptions/index.json', 'utf8'));
     console.log(idx.by_status.stale?.length || 0);
   " 2>/dev/null || echo "0")

   if [ "$STALE_COUNT" -gt "0" ]; then
     echo "WARNING: $STALE_COUNT stale assumptions need re-verification"
   fi
   ```

---

## Failure Tracking

### Blast Radius Assessment

When an assumption is violated, the blast radius is assessed automatically based on the assumption's `dependencies`:

| Blast Radius | Criteria |
|-------------|----------|
| `critical` | Affects 3+ workflows OR affects a production deployment path (publish-mcp.yml) OR affects data persistence |
| `high` | Affects 2+ files AND at least 1 workflow OR blocks agent team operations |
| `medium` | Affects 1-2 files OR affects 1 workflow OR affects a single agent role |
| `low` | Affects only documentation, conventions, or non-critical paths |

### Violation Response Protocol

When the verification runner detects a violation:

1. **Record the failure**: Append to `failures.jsonl` with full context.
2. **Update the assumption**: Set `verification.status` to `violated`, `verification.confidence` to 0.0.
3. **Cascade staleness**: Mark all assumptions in the same category with the same package/service as `stale`.
4. **Emit signal**: Write an `assumption_update` signal to the ULC signal store (Spec 01) for cross-loop visibility.
5. **Create Beads issue**: For `high` and `critical` blast radius, create a Beads issue with the violation details.
6. **Escalate**: For `critical` blast radius, trigger an immediate escalation to Chief Agentic following the escalation protocol:

```json
{
  "escalation_type": "external_dependency_failure",
  "situation": {
    "summary": "Assumption violated: <claim>",
    "impact": "Blast radius: critical. Affected: <files>, <workflows>",
    "what_has_been_tried": "Automated verification detected the violation. No fix attempted."
  },
  "options": [
    {
      "label": "Workaround",
      "description": "Implement a workaround that avoids the violated assumption",
      "tradeoff": "Fast but may accumulate technical debt",
      "risk_level": "medium"
    },
    {
      "label": "Upgrade/Pin",
      "description": "Update the dependency to a version where the assumption holds, or pin to prevent further drift",
      "tradeoff": "Clean fix but may introduce new assumption violations",
      "risk_level": "medium"
    },
    {
      "label": "Wait",
      "description": "The violation may be transient (service outage, temporary regression). Re-verify in 24 hours.",
      "tradeoff": "Low effort but blocks affected workstreams",
      "risk_level": "low"
    }
  ]
}
```

### Recovery Time Tracking

Every failure records `recovery_time` -- the duration from violation detection to resolution. This metric feeds into the meta-fitness tracker (Spec 01) and the dashboard (below). Trends in recovery time indicate whether the team is getting better or worse at handling assumption failures.

---

## Integration with Dependency-Verifier Agent

The Research & Reality-Check agent (`research-reality-01` from the agentic-dev-team-spec) is the primary consumer and producer of the assumption registry.

### Agent Responsibilities

| Responsibility | Registry Interaction |
|---------------|---------------------|
| Identify assumptions the system is making | Read `unverified` and `stale` assumptions; scan codebase for implicit assumptions |
| Test assumptions against reality | Run verification methods; update `verification` fields |
| Maintain the living registry | Add new assumptions; update evidence; set verification schedules |
| Escalate failures immediately | Trigger escalation protocol on violation |
| Produce impact assessments | Calculate blast radius; identify affected workstreams |

### Agent Session Protocol

When the dependency-verifier agent is spawned (either as a team member or standalone):

1. **Load registry state**: Read `index.json` for summary. Prioritize `stale` > `unverified` > `verified` (by oldest `last_verified`).
2. **Check for due verifications**: Filter by `verification_schedule.next_due <= now`.
3. **Run verification plan**: Execute verification strategies for due assumptions, starting with highest blast radius.
4. **Record results**: Append to `verification-log.jsonl`, update `registry.jsonl`.
5. **Report**: Emit `assumption_update` signals for each verification. Report summary to Hub workspace if running in a team context.

### Integration with Agent Teams

When an agent team is spawned (via `.claude/skills/deploy-team-hub/SKILL.md`), the coordinator should include assumption context:

```
Before starting implementation:
1. Query the assumption registry for assumptions related to your target files:
   assumption query --files src/hub/ --status stale,unverified
2. If any stale assumptions affect your work, flag them in the Hub workspace as a blocker.
3. If you discover a new assumption during implementation, register it.
```

This integrates with the coordination-momentum agent's dependency graph -- violated assumptions become blockers on workstreams that depend on them.

---

## Query Interface

### MCP Tool Operation

```json
{
  "name": "thoughtbox_assumptions",
  "description": "Query and manage the assumption registry",
  "inputSchema": {
    "type": "object",
    "properties": {
      "operation": {
        "type": "string",
        "enum": ["query", "register", "verify", "report", "dashboard"],
        "description": "Operation to perform"
      },
      "category": {
        "type": "string",
        "enum": ["api_behavior", "api_parameter", "framework_behavior", "service_availability", "platform_compat", "package_stability", "build_infra", "permission_model", "state_management", "protocol_compliance", "convention"]
      },
      "status": {
        "type": "string",
        "enum": ["unverified", "verified", "violated", "stale"]
      },
      "min_blast_radius": {
        "type": "string",
        "enum": ["low", "medium", "high", "critical"]
      },
      "files": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Filter by files that depend on the assumption"
      },
      "packages": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Filter by packages involved"
      },
      "sort": {
        "type": "string",
        "enum": ["confidence", "staleness", "blast_radius", "failure_count", "last_verified"],
        "description": "Sort order for results"
      },
      "limit": {
        "type": "number",
        "description": "Maximum results (default: 20)"
      }
    },
    "required": ["operation"]
  }
}
```

### CLI Interface

```bash
# Query assumptions
assumption query                              # All assumptions, sorted by staleness
assumption query --status violated            # Only violated assumptions
assumption query --category api_behavior      # Filter by category
assumption query --files src/hub/             # Assumptions affecting hub files
assumption query --packages express           # Assumptions about express
assumption query --sort blast_radius          # Sorted by blast radius (critical first)

# Register new assumption
assumption register --claim "..." --category api_behavior --source-type observation

# Run verification
assumption verify                             # Verify all due assumptions
assumption verify --id a1b2c3d4e5f6           # Verify a specific assumption
assumption verify --frequency daily           # Only daily-frequency assumptions
assumption verify --category service_availability  # Only service availability

# Dashboard
assumption dashboard                          # Print summary report
assumption dashboard --format json            # Machine-readable output

# Report
assumption report --since 7d                  # Failures in last 7 days
assumption report --blast-radius critical     # Only critical failures
```

---

## Dashboard

### Summary Report

The dashboard command generates a structured report sorted by urgency:

```
ASSUMPTION REGISTRY DASHBOARD
==============================
Generated: 2026-02-11T12:00:00Z

SUMMARY
  Total assumptions:    47
  Verified:             28 (59.6%)
  Unverified:            8 (17.0%)
  Stale:                 6 (12.8%)
  Violated:              5 (10.6%)
  Mean confidence:       0.72
  Oldest unverified:    14 days

VIOLATED (Action Required)
  [CRIT] a1b2: mcpServers in agent frontmatter causes duplicate tool errors
         Category: framework_behavior | Failed: 2026-02-08 | Recovery: 120m
         Affects: .claude/agents/*.md, agent teams

  [HIGH] c3d4: Re-registering on Hub loses coordinator role permanently
         Category: state_management | Failed: 2026-02-08 | Recovery: 45m
         Affects: src/hub/identity.ts, multi-agent demos

  [MED]  e5f6: Observatory session store is in-memory only
         Category: state_management | Failed: 2026-02-09 | Recovery: ongoing
         Affects: src/observatory/channels/reasoning.ts

STALE (Verification Overdue)
  [HIGH] g7h8: @anthropic-ai/claude-agent-sdk@^0.1.76 API surface stable
         Category: package_stability | Last verified: 2026-01-28 | Due: 2026-02-11
         Affects: scripts/agents/, agentops/runner/

  [MED]  i9j0: MCP Registry at registry.modelcontextprotocol.io is available
         Category: service_availability | Last verified: 2026-02-04 | Due: 2026-02-11
         Affects: .github/workflows/publish-mcp.yml

UNVERIFIED (Never Tested)
  [HIGH] k1l2: Express 5 async error handlers propagate correctly
         Category: api_behavior | Registered: 2026-02-11
         Affects: src/observatory/server.ts

  (... sorted by blast radius, then age)

FAILURE TRENDS (Last 30 Days)
  Total failures:        5
  Mean recovery time:    68 minutes
  Most failing category: framework_behavior (3 failures)
  Most failing package:  @anthropic-ai/claude-agent-sdk (2 failures)
```

### Dashboard Data for Other Specs

The dashboard data (`snapshots/YYYY-MM-DD.json`) is consumed by:

- **Spec 01 (ULC)**: Meta-fitness tracker includes `assumptions_violated_count` and `mean_recovery_time_minutes` as system health metrics.
- **Spec 02 (KAL)**: The assumption registry is a KAL store adapter, so `kal query "MCP parameter"` returns matching assumptions alongside MEMORY.md, KG, and Beads results.
- **Spec 05 (Evaluation Harness)**: Assumption verification results are evaluation data points -- a violated assumption that affects test infrastructure should trigger regression investigation.

---

## Bootstrap: Seeding from Existing Knowledge

The bootstrap process imports the project's existing assumption knowledge into the registry. This is a one-time operation run via `npx tsx scripts/assumption-seed.ts`.

### Seed Inventory

The following assumptions are extracted from MEMORY.md and seeded with `verification.status: "verified"` (since they were verified by failure):

| ID | Claim | Category | Status | Source |
|----|-------|----------|--------|--------|
| `mcp-param-01` | `add_observation` params are `entity_id` + `content` (not entityId/observation) | `api_parameter` | `verified` | MEMORY.md: MCP Knowledge API Gotchas |
| `mcp-param-02` | `create_relation` params are `from_id` + `to_id` (not source_id/target_id) | `api_parameter` | `verified` | MEMORY.md: MCP Knowledge API Gotchas |
| `mcp-behav-01` | `query_graph` param is `start_entity_id`; only follows OUTGOING relations | `api_behavior` | `verified` | MEMORY.md: MCP Knowledge API Gotchas |
| `mcp-behav-02` | `create_entity` returns existing entity on UNIQUE(name,type) collision | `api_behavior` | `verified` | MEMORY.md: MCP Knowledge API Gotchas |
| `hub-state-01` | Re-registering on Hub gives new agentId; coordinator role lost permanently | `state_management` | `verified` | MEMORY.md: MCP Knowledge API Gotchas |
| `cc-frame-01` | `mcpServers:` in agent frontmatter causes duplicate tool name API errors | `framework_behavior` | `verified` | MEMORY.md: MCP Tool Access in Sub-Agents |
| `cc-frame-02` | Sub-agents inherit parent MCP tools automatically (no declaration needed) | `framework_behavior` | `verified` | MEMORY.md: MCP Tool Access in Sub-Agents |
| `cc-frame-03` | Agent definitions are cached at session start; mid-session edits have no effect | `framework_behavior` | `verified` | MEMORY.md: Run 004 Lessons |
| `cc-frame-04` | In-process foreground teammates run until maxTurns exhaustion; cannot be killed | `framework_behavior` | `verified` | MEMORY.md: Run 004 Lessons |
| `cc-frame-05` | Only `subagent_type: "general-purpose"` gets ToolSearch in Agent Teams | `framework_behavior` | `verified` | MEMORY.md: Run 005 Breakthrough |
| `cc-frame-06` | New agent files created mid-session are not discoverable by Task tool | `framework_behavior` | `verified` | MEMORY.md: MCP Tool Access in Sub-Agents |
| `cc-perm-01` | `.claude/hooks/` is write-protected; user must create hook files manually | `permission_model` | `verified` | MEMORY.md: Gotchas |
| `cc-perm-02` | Pre-tool-use hook requires re-read before second write to same file | `framework_behavior` | `verified` | MEMORY.md: Gotchas |
| `obs-state-01` | Observatory session store is in-memory only; lost on restart | `state_management` | `verified` | MEMORY.md: Observatory Native Primitives |
| `docker-01` | `docker-compose.yml` uses `context: .`; checkout right branch before building | `build_infra` | `verified` | MEMORY.md: Gotchas |

These seeded assumptions carry their failure history from the MEMORY.md prose, converted to structured `failures` entries.

---

## Implementation Plan

### Phase 0: Bootstrap (3 hours)

1. Create `.assumptions/` directory structure.
2. Define TypeScript types in `src/assumptions/types.ts`.
3. Implement `scripts/assumption-seed.ts` -- parse MEMORY.md, generate seed `registry.jsonl`.
4. Implement basic `index.json` builder.
5. Run seed script, verify output.

**Exit criteria**: `.assumptions/registry.jsonl` contains 15+ seeded assumptions. `index.json` is accurate.

### Phase 1: Query Interface (4 hours)

6. Implement `src/assumptions/registry.ts` -- read/write/query operations on JSONL.
7. Implement `scripts/assumption-cli.ts` -- CLI wrapper with `query`, `register`, `dashboard` commands.
8. Add `assumption` to `package.json` bin scripts.
9. Tests: query by category, status, files, packages. Sort correctness.

**Exit criteria**: `assumption query --status violated` returns the seeded violated assumptions. `assumption dashboard` prints a readable report.

### Phase 2: Verification Runner (6 hours)

10. Implement `scripts/assumption-verify.ts` -- verification runner with pluggable strategies.
11. Implement verification strategies for `service_availability` (HTTP checks) and `package_stability` (npm view).
12. Implement `api_parameter` strategy (import + function signature check).
13. Implement `framework_behavior` strategy (minimal reproduction scripts).
14. Create `.github/workflows/assumption-verify.yml` GitHub Action.
15. Tests: mock verification of each strategy type.

**Exit criteria**: `assumption verify --frequency daily` runs, verifies service availability assumptions, and records results in `verification-log.jsonl`.

### Phase 3: Capture and Integration (4 hours)

16. Implement `.claude/hooks/assumption_capture.sh` and `capture-patterns.mjs`.
17. Wire `assumption_update` signal emission to ULC signal store (Spec 01).
18. Wire violation → Beads issue creation.
19. Wire critical violation → escalation protocol.
20. Add assumption registry adapter to KAL (Spec 02) if KAL exists.

**Exit criteria**: A simulated violation triggers Beads issue creation and ULC signal emission. The capture hook detects at least one assumption-like pattern in a test session.

### Phase 4: Dashboard and Steady State (2 hours)

21. Implement daily snapshot generation (`snapshots/YYYY-MM-DD.json`).
22. Implement `assumption report` command with failure trends.
23. Wire dashboard metrics to Spec 01 meta-fitness tracker.
24. Document the registry in CLAUDE.md / AGENTS.md for agent awareness.

**Exit criteria**: `assumption dashboard` shows accurate metrics. Snapshots are generated daily. Agents are aware of the registry via documentation.

---

## Success Criteria

### Functional Requirements

| ID | Requirement | Verification |
|----|-------------|-------------|
| F1 | All assumptions from MEMORY.md gotchas are in the registry | Seed script output + count check |
| F2 | Assumptions can be queried by category, status, files, packages, and blast radius | CLI test with each filter |
| F3 | Verification runner executes appropriate strategy per category | Mock verification + log check |
| F4 | Violated assumptions trigger Beads issue creation | Integration test |
| F5 | Critical violations trigger escalation protocol | Integration test |
| F6 | `assumption_update` signals flow to ULC signal store | Signal store read after violation |
| F7 | Session capture hook detects at least one assumption pattern per session | Manual session test |
| F8 | Dashboard accurately reflects registry state | Dashboard vs. raw JSONL comparison |

### Quantitative Targets (6-month horizon)

| Metric | Baseline (current) | Target |
|--------|-------------------|--------|
| Assumptions in registry | 0 | 50+ |
| Assumption verification coverage | 0% | > 70% verified or explicitly `manual` |
| Mean time to detect violation | Days to weeks (discovered accidentally) | < 24 hours (detected by scheduled verification) |
| Repeated assumption failures | Common (MEMORY.md has duplicates) | < 5% (same assumption fails twice without registry update) |
| Recovery time trend | Unknown | Decreasing month-over-month |
| Unverified assumptions older than 30 days | All of them | < 10% |

---

## Risks

### R1: Registry Becomes a Write-Only Store

**Risk**: Assumptions are registered but never queried or verified. The registry accumulates stale entries that nobody reads.

**Mitigation**: The verification runner is automated (GitHub Action). The session start hook surfaces stale counts. The dashboard is wired into the meta-fitness tracker. If `mean_confidence` drops below 0.5 or `stale` count exceeds 20% of total, the meta-fitness tracker flags it as a regression.

### R2: Capture Hook Generates Noise

**Risk**: The automatic capture hook detects false positives -- tool outputs that look like assumptions but are not. Agents waste time reviewing candidates.

**Mitigation**: Auto-capture writes to `candidates.jsonl`, not `registry.jsonl`. Candidates require explicit promotion. The capture heuristics start conservative and are tuned based on the `candidates promoted / candidates generated` ratio. If the ratio drops below 10%, tighten the heuristics.

### R3: Verification Strategies Are Incomplete

**Risk**: Not all assumption categories have deterministic verification methods. `convention` and `protocol_compliance` assumptions may require LLM judgment, which adds cost and non-determinism.

**Mitigation**: Phase 2 implements strategies for the categories that can be automated (`service_availability`, `package_stability`, `api_parameter`). Other categories default to `method: "manual"` until automated strategies are developed. The verification runner skips assumptions with no strategy rather than failing.

### R4: Blast Radius Assessment Is Wrong

**Risk**: The automated blast radius calculation under-counts affected files or workflows because dependency tracking is incomplete. A "low" blast radius assumption violation turns out to be critical.

**Mitigation**: Blast radius is computed from explicitly listed `dependencies`, not from deep analysis. This means it is a lower bound. The initial seed includes manual blast radius overrides for known high-impact assumptions. The dashboard includes a "failures by blast radius accuracy" metric -- if a `low`-rated assumption causes > 1 hour recovery time, the blast radius is automatically escalated.

### R5: Registry and MEMORY.md Drift Apart

**Risk**: MEMORY.md continues to be the primary place agents record gotchas. The registry falls behind because agents forget to register assumptions.

**Mitigation**: The ingestion pipeline (Spec 02 KAL, or a standalone cron job) periodically scans MEMORY.md for new gotcha entries that do not have corresponding registry entries. New findings are added as `candidates.jsonl` entries for review. The session end hook checks if any MEMORY.md sections were modified and triggers a diff-based scan.

---

## Dependencies

### Required

| Dependency | Why | Status |
|-----------|-----|--------|
| `.assumptions/` directory | Storage location | Created by bootstrap |
| Node.js runtime | For TypeScript scripts | Available (22.x) |
| `package.json` | For dependency scanning | Exists |
| `.github/workflows/` | For workflow dependency extraction | Exists |
| MEMORY.md | For bootstrap seed data | Exists |

### Soft (Enhances but Does Not Block)

| Dependency | Why | Status |
|-----------|-----|--------|
| [01-unified-loop-controller.md](./01-unified-loop-controller.md) | `assumption_update` signal emission | Not yet implemented |
| [02-knowledge-accumulation-layer.md](./02-knowledge-accumulation-layer.md) | Assumption registry as KAL store adapter | Not yet implemented |
| [06-agent-team-orchestration.md](./06-agent-team-orchestration.md) | Dependency-verifier agent spawning | Not yet implemented |
| Beads CLI (`bd`) | Issue creation from violations | Available locally |
| Thoughtbox Hub | Team context for verification reporting | Available |

---

## Appendix A: Relationship to Other Specs

| Spec | Relationship |
|------|-------------|
| [01-unified-loop-controller.md](./01-unified-loop-controller.md) | Assumption violations emit `assumption_update` signals. Meta-fitness tracker consumes registry dashboard metrics. |
| [02-knowledge-accumulation-layer.md](./02-knowledge-accumulation-layer.md) | Assumption registry is a KAL store adapter (`assumptions` source). Cross-references link assumptions to KG entities, MEMORY.md sections, and Beads issues. |
| [03-automated-pattern-evolution.md](./03-automated-pattern-evolution.md) | Assumption failures that affect patterns feed into DGM fitness scoring. A pattern built on a violated assumption gets demoted. |
| [04-cross-session-continuity.md](./04-cross-session-continuity.md) | Session handoff includes assumption registry state (stale count, recent violations) so the next session starts with awareness. |
| [05-evaluation-harness.md](./05-evaluation-harness.md) | Assumption verification results are evaluation data. A violated assumption that breaks a test is a regression signal. |
| [06-agent-team-orchestration.md](./06-agent-team-orchestration.md) | The dependency-verifier agent role is the primary operator of the assumption registry. The coordination-momentum agent treats violated assumptions as workstream blockers. |

## Appendix B: File Inventory (New Files)

```
.assumptions/
├── registry.jsonl               # Assumption records (one per line)
├── index.json                   # Lookup index
├── failures.jsonl               # Failure events
├── verification-log.jsonl       # Verification run results
├── candidates.jsonl             # Auto-captured candidates (not yet promoted)
├── capture-patterns.mjs         # Node script for session capture hook
└── snapshots/                   # Daily dashboard snapshots
    └── .gitkeep

src/assumptions/
├── types.ts                     # AssumptionRecord, AssumptionCategory, etc.
├── registry.ts                  # Read/write/query operations
├── verifier.ts                  # Verification strategies per category
├── blast-radius.ts              # Blast radius assessment logic
└── __tests__/
    ├── registry.test.ts
    ├── verifier.test.ts
    └── blast-radius.test.ts

scripts/
├── assumption-seed.ts           # One-time bootstrap from MEMORY.md
├── assumption-verify.ts         # Verification runner (CLI + CI)
└── assumption-cli.ts            # CLI wrapper

.claude/hooks/
└── assumption_capture.sh        # Post-tool-use capture hook

.github/workflows/
└── assumption-verify.yml        # Scheduled verification workflow
```
