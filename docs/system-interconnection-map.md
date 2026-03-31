# System Interconnection Map

Generated 2026-03-24. Updated 2026-03-31.

> **Note (2026-03-31):** The directories `agentops/`, `dgm-specs/`, `agentic-dev-team/`, `self-improvement/`, `.specs/self-improvement-loop/`, and `.specs/patroy-one/` have been removed as part of the unified autonomy control plane cleanup. Systems 1, 4, and 6 below and the Self-Improvement Specs section are historical records of what existed at audit time. Cross-system references to those directories in other sections are now stale.

## Executive Summary

The project has substantial infrastructure for a self-improving, self-healing codebase. The individual components are well-built. **The problem is not missing pieces — it's broken connections between existing pieces.** Every system is wired but the junctions between them are severed.

The most consequential finding: **connecting SIL to Observatory requires ~35 lines of code across 2 files.** The entire ImprovementTracker → ThoughtEmitter → ImprovementEventStore → ScorecardAggregator → WebSocket pipeline is implemented and internally wired. The SIL loop simply never calls it.

### What's Actually Running

| System | Trigger | Status |
|--------|---------|--------|
| CI lint/typecheck/test | Every push/PR to main | Working |
| Artifact guard | Every push/PR to main | Working |
| Cycle check | Every push/PR to main | Working |
| Changelog update | Every merged PR | Working |
| Build (embed-templates, embed-loops) | Every build | Working |
| MCP publish | Every version tag | Working |
| Self-improvement loop | Weekly cron (Sun 2am UTC) + dispatch | Runs but Observatory wire is disconnected |

### What's Built But Disconnected

| Component | What it needs to work |
|-----------|----------------------|
| Observatory (ImprovementTracker → Store → Scorecard → WebSocket) | SIL to call `improvementTracker.track*()` (~35 lines) |
| Research-workflows MAP-Elites | Execution loop (all 11 workflows at seed/0.0) |
| ULC QD exploration | Fix broken column names in SQLite query |

---

## System 1: AgentOps (`agentops/`) — REMOVED 2026-03-31

### Purpose

Autonomous development workflow: collect signals from repo/arXiv/RSS/HTML → synthesize into ranked implementation proposals via LLM → create GitHub issue → on human approval label → trigger implementation run → create branch, commit, run tests, post evidence.

### Architecture

```
agentops/
├── runner/cli.ts              ← Entry point
│   ├── daily-dev-brief.ts     ← Signal → Synthesis → Issue
│   │   ├── lib/sources/collect.ts  ← Orchestrates 4 collectors
│   │   │   ├── repo.ts         (GitHub commits + issues via Octokit)
│   │   │   ├── arxiv.ts        (arXiv Atom API + fast-xml-parser)
│   │   │   ├── rss.ts          (RSS feeds via rss-parser)
│   │   │   └── html.ts         (HTML scraping via cheerio)
│   │   ├── lib/synthesis.ts     ← LLM call → JSON proposals
│   │   │   └── lib/llm/provider.ts  (Anthropic or OpenAI)
│   │   └── lib/template.ts     ← Mustache rendering + validation
│   └── implement.ts           ← Issue → Extract proposal → Branch → Code → Test → Evidence
├── signals/signal-store.ts    ← JSONL append-only event bus
├── config/dev_sources.yaml    ← Source enable/disable + limits
├── config/dev_brief_policy.yaml ← Quality gates + budget
├── prompts/                   ← Synthesizer + repair prompts
├── evals/                     ← Evaluator/rubric specs (NOT wired)
├── fixtures/proposals.example.json ← Fallback when no LLM key
└── templates/                 ← Issue + evidence comment templates
```

### Execution Paths

**Daily Brief (CI: `agentops_daily_thoughtbox_dev.yml`, cron 11:30 UTC):**
```
trigger → checkout → pnpm install
  → tsx agentops/runner/cli.ts daily-dev-brief
    → getLLMConfig() → returns null (no ANTHROPIC_API_KEY in CI env)
    → FALLBACK: read fixtures/proposals.example.json
    → loadTemplate(daily_thoughtbox_dev_brief_issue.md)
    → renderTemplate(template, context)
    → GitHubClient.createIssue(title, body, ['agentops','dev-brief'])
  → upload agentops/runs/* artifacts
```

**Implement (CI: `agentops_on_approval_label.yml`, issue labeled):**
```
trigger: issue labeled smoke:proposal-N or approved:proposal-N
  → detect-mode job: regex match → outputs should_run, mode, proposal_id
  → implement job (if should_run):
    → tsx agentops/runner/cli.ts implement --proposal-id X --issue-number N --mode SMOKE|REAL
      → GitHubClient.getIssue(N)
      → extractProposals(issue.body) → find proposal by ID
      → SMOKE: no-op, record result
      → REAL: git checkout -b → write marker.json → git commit → pnpm test
        → guardrail: filesChanged must include src/* (BUT marker path short-circuits this)
      → GitHubClient.createComment(issueNumber, evidenceBody)
```

### Environment Variables

| Variable | Required | Used by |
|----------|----------|---------|
| `GITHUB_TOKEN` | Yes (CI) | github.ts |
| `GITHUB_REPOSITORY` | Yes (CI) | github.ts, collect.ts |
| `ANTHROPIC_API_KEY` | **Missing from CI** | llm/provider.ts |
| `OPENAI_API_KEY` | Alternative | llm/provider.ts |
| `LANGSMITH_API_KEY` | Optional | trace.ts (stub, no SDK calls) |

### Signal Store Schema (JSONL)

```typescript
{
  id: string;           // UUID v4
  source_loop: string;  // e.g. "fast-session"
  source_type: "fast" | "medium" | "slow";
  timestamp: string;    // ISO 8601
  category: "learning" | "proposal" | "approval" | "implementation"
           | "evaluation" | "pattern_fitness" | "regression"
           | "escalation" | "assumption_update";
  payload: Record<string, unknown>;
  consumed_by: string[];
  fitness_tag: "HOT" | "WARM" | "COLD";
  ttl_days: number;
}
```

### Issues

1. **No LLM API key in CI** — `ANTHROPIC_API_KEY` absent from `agentops_daily_thoughtbox_dev.yml` env block. Every run degrades to fixture mode.
2. **No environment gate on implement workflow** — `agentops_on_approval_label.yml` runs immediately on label without approval.
3. **Implement writes marker files, not code** — Day-0 stub; real implementation agent never wired.
4. **Signal store is filesystem-only** — violates Supabase-only persistence rule.
5. **Two test files permanently excluded from CI** — `phase1.2.test.ts` (uses Node `assert`), `integration.test.ts` (live network calls).
6. **Tracing is a stub** — `trace.ts` tracks spans locally, no actual LangSmith SDK calls.
7. **Eval rubric/evaluator/selection algorithm are design docs** — not wired into any code path.

### Connections to Other Systems

> Directory removed 2026-03-31. Former connections listed for historical reference.

- **To scripts/**: `scripts/utils/bootstrap-signal-store.ts` wrote `agentops/signals/index.json`; `scripts/agents/ulc-meta-loop.ts` read `agentops/signals/*.jsonl`
- **To everything else**: None. AgentOps was fully self-contained.

---

## System 2: Self-Improvement Loop (`scripts/agents/sil-*`)

### Purpose

Autonomous improvement pipeline: discover issues in codebase → filter by priority → analyze with Thoughtbox-backed reasoning → experiment with code changes → evaluate against tests → integrate if passing → extract learnings → update CLAUDE.md.

### Architecture

```
scripts/agents/run-improvement-loop.ts    ← CLI entry point
  ├── sil-010-main-loop-orchestrator.ts   ← 5-phase loop (Discovery → Filter → Experiment → Evaluate → Integrate)
  │   └── sil-006-improvement-reasoner.ts ← Thoughtbox-backed multi-branch reasoning
  └── sil-012-claude-md-updater.ts        ← Learning extraction → CLAUDE.md update
```

### Execution Path

**CI: `self-improvement-loop.yml` (weekly Sun 2am UTC + dispatch):**
```
trigger → checkout → pnpm install → pnpm build
  → git checkout -b improvement/sil-<timestamp>
  → npx tsx scripts/agents/run-improvement-loop.ts
      --budget ${{ inputs.budget || '1.0' }}
      --max-iterations ${{ inputs.max_iterations || '3' }}
      --update-claude-md
    │
    ├── sil-010: runImprovementLoop(config)
    │   ├── Phase 1: Discovery
    │   │   └── runPhaseAgent(DISCOVERY_PROMPT, tools=[Read,Glob,Grep])
    │   │       → Claude scans codebase → JSON array of Discovery objects
    │   │       → MCP: thoughtbox_init, thoughtbox_thought (via mcpServers.thoughtbox HTTP)
    │   │
    │   ├── Phase 2: Filter
    │   │   └── runPhaseAgent(FILTER_PROMPT, tools=[])
    │   │       → Claude prioritizes → {prioritized:[], rejected:{}}
    │   │
    │   ├── Phase 2.5: Analyze (SIL-006)
    │   │   └── analyzeDiscovery(topDiscovery)
    │   │       → Claude spawns Thoughtbox session
    │   │       → Explores 2-3 approaches as thought branches
    │   │       → Returns ImprovementPlan with ranked approaches
    │   │
    │   ├── Phase 3: Experiment
    │   │   └── runPhaseAgent(EXPERIMENT_PROMPT, tools=[Read,Edit,Write,Glob,Grep])
    │   │       → Claude implements recommended approach
    │   │       → Returns {planId, approach, codeChanges[], success}
    │   │
    │   ├── Phase 4: Evaluate
    │   │   └── runPhaseAgent(EVALUATION_PROMPT, tools=[Bash,Read,Glob])
    │   │       → Claude runs tests → {experimentId, tier, passed, metrics}
    │   │
    │   └── Phase 5: Integrate (if evaluate passed)
    │       └── Accept changes, record outcome
    │
    ├── sil-012: updateClaudeMd(iterations)
    │   └── Claude extracts {whatWorks, whatDoesnt, capabilityGaps}
    │       → Reads CLAUDE.md → Merges into "## Improvement Loop Learnings" section
    │
    └── Write improvement-results.json
  │
  → Inline scorecard generation (npx tsx -e "import {ImprovementEventStore, ScorecardAggregator}...")
    → ALWAYS EMPTY (store never receives events)
  → Upload artifacts
  → If changes: git commit + push → gh pr create
```

### MCP Connection

All SIL phase agents connect to Thoughtbox at `http://localhost:1731/mcp` via:
```typescript
mcpServers: { thoughtbox: { type: "http", url: config.thoughtboxUrl } }
```
Tools used: `thoughtbox_init`, `thoughtbox_thought`, `thoughtbox_session`, `observability_gateway`

### The Broken Wire

**SIL-010 never calls ImprovementTracker.** The spec (SPEC-SIL-010) shows `improvementTracker.trackEvent()` calls at each phase boundary. When the implementation moved from `src/improvement/loop.ts` (spec path) to `scripts/agents/sil-010-main-loop-orchestrator.ts` (actual path), the tracker imports were not carried over.

**What's missing (8 calls, ~35 lines across 2 files):**

In `run-improvement-loop.ts`:
```typescript
import { defaultImprovementStore } from "../../src/observatory/improvement-store.js";
defaultImprovementStore.initialize();  // Start JSONL listener
```

In `sil-010-main-loop-orchestrator.ts`:
```typescript
import { improvementTracker } from "../../src/observatory/improvement-tracker.js";

// Before Discovery:
improvementTracker.startIteration({ loopId: config.loopId });
// After Discovery:
improvementTracker.trackDiscovery({ discoveriesFound: N }, cost, success);
// After Filter:
improvementTracker.trackFilter({ filteredCount: N }, cost, success);
// After Experiment:
improvementTracker.trackExperiment({ experimentId, hypothesis }, cost, success);
// After Evaluate:
improvementTracker.trackEvaluation(tier, score, passed, cost);
// After Integration:
improvementTracker.trackIntegration({ changesApplied: N }, cost, success);
// End:
improvementTracker.endIteration(overallSuccess, { totalCost });
```

### Behavioral Contract Verification (BCV)

`scripts/agents/behavioral-contracts.ts` implements 4 contract layers:
- **VARIANCE**: Same function, different inputs → must produce different outputs
- **CONTENT_COUPLED**: Output must reference input content (50% word match)
- **TRACE_EXISTS**: Thoughtbox session must have ≥3 thoughts with back-references
- **LLM_JUDGES**: Haiku scores 4 quality dimensions, all must be ≥6/10

`test-behavioral-contracts.ts` runs all 4 against SIL-006's `analyzeDiscovery`.
Triggered via `pnpm test:behavioral`. **Not in CI.**

### Environment Variables

| Variable | Required | Used by |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | All SIL agents (via Claude Agent SDK) |

---

## System 3: Observatory (`src/observatory/`)

### Purpose

Real-time monitoring, improvement event persistence, and scorecard computation. Provides WebSocket channels for live dashboards and REST endpoints for historical data.

### Architecture

```
src/observatory/
├── emitter.ts                    ← ThoughtEmitter (singleton EventEmitter)
│   Namespaces: thought:*, session:*, agent:*, task:*, hub:*, monitoring:*, improvement:event
│
├── improvement-tracker.ts        ← ImprovementTracker (singleton, wraps emitter)
│   API: startIteration, trackDiscovery, trackFilter, trackExperiment,
│        trackEvaluation, trackIntegration, endIteration
│   Accumulates per-phase costs in PhaseCosts struct
│
├── improvement-store.ts          ← ImprovementEventStore
│   Persists to: ~/.thoughtbox/improvement-history.jsonl (FILESYSTEM ONLY)
│   subscribe(): listens on emitter "improvement:event", batches 100ms, appendFile
│   listEvents(filter?): reads JSONL, parses, filters by type/iteration/date
│   summarize(): aggregates cycle_end events → totals
│
├── scorecard-aggregator.ts       ← ScorecardAggregator
│   Reads from ImprovementEventStore
│   computeScorecard(): successRate, evalPassRates, regressionCount, costPerSuccess
│   computeTrend(): improving/declining/stable (10% threshold)
│
├── server.ts                     ← HTTP + WebSocket server
│   REST: /api/health, /api/sessions, /api/sessions/:id, /api/improvements, /api/scorecard
│   WebSocket channels: reasoning:<sessionId>, observatory, workspace
│   Serves Observatory HTML dashboard at /
│
├── channels/
│   ├── observatory.ts            ← Broadcasts session:started/ended + improvement:event
│   ├── reasoning.ts              ← Per-session thought stream (add/revise/branch)
│   └── workspace.ts              ← Hub event bridge
│
├── storage-adapter.ts            ← Converts persistence types → observatory types
├── evaluation-gatekeeper.ts      ← Gate 1: tiered eval; Gate 2: BCV (STUB: always passes)
├── config.ts                     ← Env-based config (default port 1729)
├── schemas/                      ← Zod schemas for thoughts, events, manifests
└── ui/index.ts                   ← Dashboard HTML string
```

### Internal Pipeline (fully wired)

```
improvementTracker.track*()
    → ThoughtEmitter.emitImprovementEvent("improvement:event", data)
        → ImprovementEventStore.subscribe() handler
            → batch 100ms → fs.appendFile(~/.thoughtbox/improvement-history.jsonl)
        → channels/observatory.ts handler
            → wss.broadcast("observatory", "improvement:event", event)
                → WebSocket clients receive live update
```

**Every step of this chain exists and is connected.** The chain is never triggered because SIL never calls `improvementTracker`.

### Persistence Gap

ImprovementEventStore writes to `~/.thoughtbox/improvement-history.jsonl`. This is:
- Lost on Cloud Run container recycle (stateless containers)
- Not shared across instances (each has its own filesystem)
- Violates the Supabase-only persistence decision

Needs: `improvement_events` Supabase table + Supabase-backed store implementation.

---

## System 4: DGM Benchmark Harness (`dgm-specs/`) — REMOVED 2026-03-31

### Purpose

End-to-end benchmark runner that drives a live Thoughtbox MCP server through scripted agentic test scenarios via Claude Agent SDK, measures timing/size metrics, and compares against stored baselines to detect regressions.

### Architecture

```
dgm-specs/
├── harness/
│   ├── cli.ts                ← Entry: run | baseline | report | list
│   ├── benchmark-runner.ts   ← 4 scenarios via Claude Agent SDK → MCP
│   ├── baseline.ts           ← Load/save/compare baselines + history
│   └── types.ts              ← BenchmarkResult, BenchmarkRun, BaselineComparison
├── config.yaml               ← Budget limits (2M tokens/run, 10M/day)
├── validation/baseline.json  ← Stored baseline from 2026-01-21 (commit f5ae62c)
├── implementation-status.json ← Tracks 22 SIL specs (central status doc)
├── hypotheses/               ← Empty (active/ and tested/ have README only)
├── targets/                  ← Empty (README only)
├── benchmarks/registry.yaml  ← 4 benchmark definitions (swe-bench-lite, etc.)
├── history/runs/             ← Only .gitkeep (runs are gitignored)
├── SPEC-KNOWLEDGE-MEMORY.md  ← Knowledge graph spec (referenced by src/knowledge/)
└── AGENT-TEAMS-INTEGRATION-ANALYSIS.md ← Hub + Agent Teams design analysis
```

### The 4 Benchmark Scenarios

| ID | Toolhost | What it tests | Steps |
|----|----------|---------------|-------|
| `thoughtbox-basic` | thoughtbox | Basic thought progression | start_new → cipher → 3× thought |
| `mental-models-list` | mental_models | List all mental models | start_new → cipher → mental_models list |
| `mental-models-get` | mental_models | Get specific model (five-whys) | start_new → cipher → mental_models get |
| `init-state` | init | Server state retrieval | get_state |

Each spawns a Claude agent connecting to `http://localhost:1731/mcp`. Measures `duration_ms`, `response_bytes`, `tokens_estimated`. Regression thresholds: >20% duration increase, >10% response size increase.

### Stored Baseline (2026-01-21, commit f5ae62c)

| Test | duration_ms | response_bytes | tokens_est |
|------|-------------|---------------|------------|
| thoughtbox-basic | 21,956 | 603 | 151 |
| mental-models-list | 12,090 | 135 | 34 |
| mental-models-get | 12,008 | 112 | 28 |
| init-state | 5,966 | 74 | 19 |

### npm Scripts (functional, not in CI)

```json
"benchmark": "tsx dgm-specs/harness/cli.ts run",
"benchmark:baseline": "tsx dgm-specs/harness/cli.ts baseline",
"benchmark:report": "tsx dgm-specs/harness/cli.ts report"
```

### Issues

1. **Never triggered by CI** — no workflow calls benchmark scripts
2. **Baseline is 2 months stale** (commit f5ae62c, Jan 21)
3. **History runs gitignored** — `.gitignore` line `dgm-specs/history/runs/*.json`
4. **Metrics layer unimplemented** — `dgm-specs/metrics/` referenced in 5+ specs but doesn't exist
5. **Zero hypotheses tested** — both active/ and tested/ are empty
6. **Path mismatch** — `benchmarks/suite.yaml` points to `dgm-specs/history/baseline.json` but actual baseline is at `dgm-specs/validation/baseline.json`
7. **Relationship to agentops unresolved** — `reports/cleanup/CLEANUP.md` flagged "remove dgm-specs if superseded by agentops" but no decision made

### References from src/

Four files in `src/knowledge/` have `@see dgm-specs/SPEC-KNOWLEDGE-MEMORY.md` JSDoc comments (documentation cross-references only, no imports).

---

## System 5: Research Workflows (`research-workflows/`)

### Purpose

SQLite database serving two functions: (1) MAP-Elites quality-diversity library of research workflow templates, (2) adversarial agent playbook with attack pattern tracking.

### Schema (10 tables)

**Base schema (from `agentic-dev-team/research-workflows-REINIT-PLEASE/`):**
- `workflows` — 11 seed rows, 5 behavioral coordinate axes, 6 fitness dimensions
- `workflow_steps` — 52 ordered steps across 11 workflows
- `workflow_lineage` — parent/child relationships (0 rows)
- `executions` — task execution records (0 rows)
- `taste_evaluations` — research taste verdicts (0 rows)

**Runtime-added tables (via `CREATE TABLE IF NOT EXISTS` in agent scripts):**
- `adversarial_findings` — 6 rows (all unfixed, all real bugs)
- `attack_patterns` — 6 patterns (all 50% hit rate after 2 uses each)
- `verification_audits` — 0 rows
- `verification_failures` — 0 rows

### MAP-Elites Grid (5 axes, 1-5 each = 3,125 niches)

| Axis | 1 = | 5 = |
|------|-----|-----|
| Scope | Point question | Frontier mapping |
| Domain structure | Single field, established | Cross-domain analogy |
| Evidence type | Empirical data | Theoretical/first-principles |
| Time horizon | What's true now | Speculative future |
| Fidelity | Ballpark/directional | Rigorous/publication-grade |

**11 seed workflows across 5 archetypes:** exploratory (3), confirmatory (2), analytical (2), generative (2), applied (2). All at `fitness_score = 0.0`, `times_used = 0`. The evolutionary loop has never run.

### Adversarial Findings (all unfixed)

| ID | Pattern | Severity | Finding |
|----|---------|----------|---------|
| 1 | assumption-mining | critical | MEMORY.md size cap has no enforcement mechanism |
| 2 | temporal-breakage | major | 3+ GitHub Actions crons with no coordination → race conditions |
| 3 | integration-boundary-gaps | major | session-handoff.json never validated before read |
| 4 | unbounded-growth-silent | major | 4 state directories get append-only writes, no pruning |
| 5 | bootstrap-paradox | critical | ULC depends on outputs it's the only mechanism to invoke |
| 6 | reality-check-deps | minor | Plan treats everything as net-new, ignores existing hooks/skills |

### Agent-to-DB Relationship

| Agent | Reads | Writes |
|-------|-------|--------|
| devils-advocate (.ts + .md) | attack_patterns (top by hit_rate × severity), adversarial_findings (recent 14d) | adversarial_findings (INSERT), attack_patterns (UPSERT) |
| silent-failure-hunter (.ts + .md) | adversarial_findings (own 30d + DA 7d), attack_patterns (pipeline/hook types) | adversarial_findings (INSERT), attack_patterns (UPSERT) |
| verification-judge (.ts + .md) | verification_audits (recent 7d), verification_failures (frequency) | verification_audits (INSERT), verification_failures (INSERT) |
| research-taste (.md) | workflows (by coord, status) | taste_evaluations (INSERT) |
| research-task skill | workflows (all active/seed), workflow_steps (join) | executions (INSERT) |
| ULC loop prompt | adversarial_findings (count unfixed), workflows (QD exploration) | none |

### Known Bug

ULC QD exploration query uses wrong column names:
- Query says: `coord_domain`, `coord_evidence`, `coord_horizon`
- Actual columns: `coord_domain_structure`, `coord_evidence_type`, `coord_time_horizon`
- Present in both `.claude/skills/ulc-loop/ulc-prompt.md` and `.gemini/skills/ulc-loop/ulc-prompt.md`

### REINIT-PLEASE Gap

The reinit schema is missing the 4 runtime tables (`adversarial_findings`, `attack_patterns`, `verification_audits`, `verification_failures`). Reinitializing drops those tables until an agent first runs.

---

## System 6: Agentic Dev Team (`agentic-dev-team/`) — REMOVED 2026-03-31

### Purpose

Organizational spec (draft v0.1) defining 4 agent roles, escalation thresholds, and inter-agent communication schema. Not executable — reference document only.

### Four Roles

| Role | agent_id | Key constraint |
|------|----------|----------------|
| Triage & Fix | triage-fix-01 | Must not alter product scope; escalate after 3 repair attempts |
| Research & Reality-Check | research-reality-01 | Assumption verified only when tested against real implementation |
| Coordination & Momentum | coordination-momentum-01 | Cannot reprioritize, only reorder within priority level |
| Verification & Validation | verification-judge-01 | Isolated from producing agent; validates against spec, not intention |

### 8 Escalation Thresholds

Scope change, prioritization conflict, external dependency failure, timeline impact, irreversible action, cost exceeding budget, repeated failure (>3 attempts), shippability assessment.

### Skills (8, all superseded)

All 8 are byte-for-byte identical to `.claude/skills/` counterparts (only `research` vs `research-task` naming differs). `.claude/skills/` has 30+ additional skills not in agentic-dev-team.

### Rules (6, NOT in `.claude/rules/`)

`continual-calibration`, `escalation-protocol`, `git-workflow`, `ooda-foundation`, `post-edit`, `spiral-detection` — these live ONLY in `agentic-dev-team/rules/` and are not mirrored in `.claude/rules/`.

### Proof Run 001

Hypothesis doc for Hub + Agent Teams coordination proof on `fix/sub-agent-stage-reset`. 9 hypotheses (4 bug fix, 5 coordination proof). **Results section empty — never executed or recorded.**

### References

- `AGENTS.md` → `agentic-dev-team-spec.md` (escalation thresholds, team structure)
- Contains `research-workflows-REINIT-PLEASE/` with canonical DB schema + seed data

---

## System 7: Scripts (`scripts/`)

### Backbone (actually running)

| Script | Triggered by | What it does |
|--------|-------------|-------------|
| `embed-templates.ts` | Every build | Generates `src/notebook/templates.generated.ts` from `templates/*.src.md` |
| `embed-loops.ts` | Every build | Generates `src/resources/loops-content.ts` from `.claude/commands/loops/` |
| `check-cycles.sh` | `cycle-check.yml`, `publish-mcp.yml`, every build | Runs `madge --circular` on src/ |
| `check-artifacts.sh` | `artifact-guard.yml`, pre-commit hook | Blocks local-only files from commits |
| `changelog-update.ts` | `changelog.yml` on merged PRs | Parses conventional commits → CHANGELOG.md |
| `agents/run-improvement-loop.ts` | `self-improvement-loop.yml` weekly | SIL entry point |

### Agent Runner Infrastructure

| Script | Pattern |
|--------|---------|
| `run-agent-util.ts` | Shared: reads `.claude/agents/*.md`, parses frontmatter, calls Agent SDK `query()` |
| `run-agent.ts` | Generic: `--agent <name> --prompt "..."` |
| `agent-harness.ts` | Minimal: no `.md` file, direct `query()` with explicit tool list |
| 11 thin wrappers | Each calls `runAgentFile()` for a specific `.claude/agents/*.md` |
| 3 adversarial agents | Load DB context before spawning (devils-advocate, silent-failure-hunter, verification-judge) |
| `spec-implementer.ts` | Reads spec file, builds prompt inline, implements |

### Orphaned Scripts

| Script | Why orphaned |
|--------|-------------|
| `staged-hooks/` (entire dir, 11 files) | Hook staging area; all superseded by live `.claude/hooks/` |
| `db-migrate.sh` | References SQLite/Drizzle; superseded by Supabase |
| `utils/spec-index.mjs` | Targets `specs/` (old path), not `.specs/` |
| `utils/capture-handoff.mjs` | Intended for PreCompact/Stop hooks but never wired |
| `utils/validate-handoff.mjs` | Schema check would always fail (expects fields not written) |
| `utils/time-check.ts` | Standalone diagnostic, no trigger |
| `utils/bootstrap-signal-store.ts` | One-time setup, no trigger |
| `validate-server-json.cjs` | One-time MCP schema validation |
| `sync-secrets.sh`, `push-secrets.sh` | Manual GCP ops, no automation |
| `debug/reproduce_issue.sh`, `debug/reproduce_mcp_issue.sh` | One-off debugging |
| `demo/hub-collab-demo.sh` | Manual iTerm2 demo |
| `check-workspace-isolation.sh` | Manual Supabase audit |
| `test-remote-roundtrip.ts` | Manual Supabase verification |
| `test-mental-models.ts` | Manual handler test |
| `test-hook-error-surfacing.sh` | Manual hook test |

---

## System 8: CI Workflows (`.github/workflows/`)

### Complete Trigger Map

```
push/PR to main
├── ci.yml (lint + typecheck + test)
├── artifact-guard.yml (block local artifacts)
├── workflow-guard.yml (governance label check, PR-only)
├── cycle-check.yml (madge + full build)
└── mcp-diff.yml (MCP server surface diff)

push v* tag
├── publish-mcp.yml (npm + MCP registry publish)
└── mcp-diff.yml

PR merged to main
└── changelog.yml (conventional commits → CHANGELOG.md)

issues opened
├── claude-issue-triage.yml (Claude Code action)
├── claude-dedupe-issues.yml (Claude Code action)
├── issue-opened-dispatch.yml (external repo, silently fails if unconfigured)
└── log-issue-events.yml (Statsig, errors if no key)

issues labeled
└── agentops_on_approval_label.yml (smoke/approved label → implement)

issues closed
└── log-issue-events.yml (Statsig)

issue/PR comment containing @claude
└── claude.yml (Claude Code action)

schedule: Sun 2am UTC
└── self-improvement-loop.yml (production environment gate)

schedule: daily 11:30 UTC
└── agentops_daily_thoughtbox_dev.yml

schedule: daily 2pm UTC
└── lock-closed-issues.yml

schedule: Mon 9am UTC
└── verify-assumptions.yml (DISABLED: if: false)
```

### Silent Failure Risks

| Workflow | Risk |
|----------|------|
| `self-improvement-loop.yml` | SIL errors swallowed via `\|\| echo`; scorecard always empty |
| `agentops_daily_thoughtbox_dev.yml` | No ANTHROPIC_API_KEY → fixture mode, no visible error |
| `agentops_on_approval_label.yml` | No environment gate; label → immediate code commit |
| `workflow-guard.yml` | Exits 0 on push events; governance bypass on direct-to-main |
| `issue-opened-dispatch.yml` | Silences own failure via `\|\| { exit 0; }` |
| `verify-assumptions.yml` | `if: false` — schedule trigger exists but job never runs |
| `log-issue-events.yml` | Errors if `STATSIG_API_KEY` missing |

### Broken npm Script

`start:stateful` → `node dist/http-stateful.js` — source file `src/http-stateful.ts` does not exist. Always fails.

---

## Cross-System Connection Map

### Intended Flow (what the specs describe)

```
AgentOps (outer loop)
  → Collects signals (repo, arXiv, RSS, HTML)
  → Synthesizes proposals via LLM
  → Human approves via label
  → Implementation agent creates branch + code
      │
      ▼
SIL (inner loop)
  → Discovers issues in codebase
  → Filters by priority
  → SIL-006 analyzes via Thoughtbox branching
  → Experiments with code changes
  → Evaluates against benchmarks
      │                          │
      ▼                          ▼
  Observatory                DGM Benchmarks
  → ImprovementTracker       → Scenarios via Agent SDK
  → ThoughtEmitter            → Baseline comparison
  → ImprovementEventStore     → Regression detection
  → ScorecardAggregator
  → WebSocket dashboard
      │
      ▼
  Research Workflows DB
  → MAP-Elites grid (workflow evolution)
  → Adversarial playbook (attack patterns)
  → Verification audit trail
```

### Actual Flow (as of 2026-03-31 cleanup)

```
AgentOps ──── REMOVED (directory deleted)
DGM Benchmarks ──── REMOVED (directory deleted)
Agentic Dev Team ──── REMOVED (directory deleted)
self-improvement/ ──── REMOVED (directory deleted)

SIL ─── RUNS but ──→ ✗ Observatory (import missing, ~35 lines to fix)

Observatory ──── ALL INTERNAL WIRING COMPLETE ──── but never receives events

Research Workflows ──── SEEDED ──── but evolutionary loop never run
                   ──── 6 adversarial findings ──── all unfixed
```

### Junction Points (where connections break)

| From | To | Break point | Fix effort |
|------|----|-------------|-----------|
| SIL | Observatory | Missing import + 8 track calls in sil-010 | ~35 lines, 2 files |
| Observatory | Supabase | Store writes to filesystem JSONL | New table + Supabase store impl |
| ULC | Research DB | Wrong column names in QD query | Fix 3 column names in 2 skill files |

---

## Self-Improvement Loop: Spec Implementation Status

From `dgm-specs/implementation-status.json` + verified against filesystem:

| Spec | Status | Location | Notes |
|------|--------|----------|-------|
| SIL-000 | validated | dgm-specs/validation/ | Pre-flight: 41 behavioral tests |
| SIL-001 | implemented | src/observatory/improvement-tracker.ts | ImprovementTracker exists, never called by SIL |
| SIL-002 | implemented | benchmarks/suite.yaml | Config exists, loader uncertain |
| SIL-003 | not started | benchmarks/sampler.ts | Stratified sampling |
| SIL-004 | not started | benchmarks/tiered-evaluator.ts | Tiered eval with tracker wire |
| SIL-005 | not started | benchmarks/issue-scraper.ts | GitHub issue fetcher |
| SIL-006 | implemented | scripts/agents/sil-006-improvement-reasoner.ts | Spec said src/improvement/; actual in scripts/ |
| SIL-007 | not started | benchmarks/proctor.ts | Docker sandbox |
| SIL-008 | blocked | benchmarks/held-out-manager.ts | Needs SIL-003, SIL-005 |
| SIL-009 | blocked | benchmarks/contamination.ts | Needs SIL-003 |
| SIL-010 | partial | scripts/agents/sil-010-main-loop-orchestrator.ts | Loop runs; Observatory wire missing |
| SIL-011 | implemented | .github/workflows/self-improvement-loop.yml | Exists, errors swallowed |
| SIL-012 | implemented | scripts/agents/sil-012-claude-md-updater.ts | Works |
| SIL-100 | validated | dgm-specs/harness/ | Benchmark harness, baseline captured |
| SIL-101 | implemented | (minimal response format) | Done |
| SIL-102 | implemented | (server-assigned thought numbers) | Done |
| SIL-103 | implemented | (session continuity) | Done |
| SIL-104 | implemented | (event stream) | Done; `event-watcher.ts` referenced in spec but missing |
| SIL-BCV | implemented | scripts/agents/behavioral-contracts.ts | 4 contract layers |
| SPEC-KNOWLEDGE-MEMORY | validated | src/knowledge/ | Knowledge graph implementation |

---

## Self-Improvement Specs (`self-improvement/`) — REMOVED 2026-03-31

### Documents and What They Specify

| File | What it defines | Key gaps identified |
|------|----------------|---------------------|
| SPEC-current-state.md | Verified capabilities in the repo | Baseline of what exists |
| SPEC-gap-analysis.md | Comprehensive gap analysis | SIL→Observatory wire, persistence, automation |
| SPEC-target-architecture.md | Target: continuous improvement with deterministic gates | 6 components: event store, tracker wiring, SIL integration, eval gatekeeper, scorecard, automation |
| SPEC-evaluation-gates.md | Tiered evaluator + BCV as required gates | Gates exist as code but aren't enforced in the loop |
| SPEC-persistence.md | Persistence for improvement history | **Not written** — referenced but file doesn't define strategy |
| SPEC-automation.md | CI/cron triggers for continuous improvement | Workflow exists but swallows errors |
| PLAN-cost-effective-self-improvement-loop.md | Cost model: $1.70/iteration target | Budget tracking exists in SIL but not connected to Observatory |
| self-improving-codebase-arch.md | DGM survey + architecture options | Research document, not a spec |

### Relationship Map

```
self-improvement/ (specs: WHAT to build)
    ↓ describes
src/observatory/ (implementation: event pipeline)
    ↑ should be called by
scripts/agents/sil-* (execution: the actual loop)
    ↑ should feed results to
dgm-specs/ (validation: benchmark harness + runtime state)
```

---

## What We Have vs. What We Need

### Already built and working:
- ThoughtEmitter event bus
- ImprovementTracker with typed phase tracking
- ImprovementEventStore with JSONL persistence
- ScorecardAggregator with trend computation
- Observatory WebSocket server + 3 channels
- SIL 5-phase loop with Agent SDK + Thoughtbox MCP
- SIL-006 branching reasoner
- SIL-012 CLAUDE.md updater
- BCV 4-layer contract verification
- Research workflows DB with MAP-Elites grid + adversarial playbook
- 17 CI workflows covering lint, test, publish, triage, dedupe, changelog
- Agent runner infrastructure (generic + specialized + adversarial)

### Removed (2026-03-31):
- AgentOps signal collection, synthesis, and issue creation (`agentops/`)
- DGM benchmark harness (`dgm-specs/`)
- Agentic dev team spec (`agentic-dev-team/`)
- Self-improvement specs (`self-improvement/`)

### Broken connections to fix:
1. SIL → Observatory (~35 lines)
2. ULC QD query column names (3 columns in 2 files)

### Missing pieces:
1. Supabase persistence for improvement events (replaces JSONL)
2. Observatory evaluation gatekeeper Gate 2 (currently stub)
3. MAP-Elites evolutionary loop (seeded but never exercised)
