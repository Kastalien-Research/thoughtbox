# Spec 05: Evaluation Harness

**Status**: Draft v0.1
**Generated**: 2026-02-11
**Context**: Thoughtbox Engineering System -- Kastalien Research
**Parent**: [00-overview.md](./00-overview.md) -- Gap 5
**Related Specs**: SPEC-SIL-100 (Benchmark Harness), SPEC-SIL-004 (Tiered Evaluator), SPEC-SIL-000 (Feedback Loop Validation), AgentOps 05 (Observability), AgentOps 08 (Eval Harness)

---

## Problem Statement

Autonomous improvement requires objective feedback. The system currently has no way to answer the question: "Did this change make things better?"

Three evaluation subsystems exist in various states of implementation:

| Component | Location | Status | Verdict |
|-----------|----------|--------|---------|
| **Benchmark harness** | `dgm-specs/harness/` | Implemented (4 files) | Runs 4 test configs via Claude Agent SDK. Baseline comparison works. But only measures duration, response size, and pass/fail -- no quality metrics, no pattern fitness, no session-level signals. |
| **Tiered evaluator** | `benchmarks/tiered-evaluator.ts` | Implemented (14 tests) | Executes smoke/regression/real-world tiers with early termination and cost tracking. But the real-world tier is a placeholder returning 0.75. No actual SWE-bench integration. |
| **AgentOps eval harness** | `agentops/specs/08-evaluation-harness.md` | Spec only (Draft) | Describes scenario-based evaluation with LangSmith A/B testing. Defines 5 metrics. Day-0 dataset of 10 scenarios. Zero implementation. |

These three are disconnected. The benchmark harness does not feed into the tiered evaluator. The tiered evaluator does not produce LangSmith traces. The AgentOps spec does not reference the SIL infrastructure that already exists.

Meanwhile, the pieces that would connect them are also incomplete:

- **LangSmith integration**: Env vars are documented in `agentops/specs/05-observability-and-tracing.md` but no code wraps tool calls or model calls as LangSmith spans.
- **Pattern fitness tracking**: The DGM evolution architecture is designed (`.claude/commands/meta/dgm-evolve.md`) but the fitness tracking files (`fitness.json`, `signals.jsonl`) do not exist. There is no automated connection between evaluation results and pattern fitness scores.
- **Decision gates**: The self-improvement loop workflow (`.github/workflows/self-improvement-loop.yml`) creates PRs but has no quality gates beyond "did the loop produce changes." The CI pipeline (`.github/workflows/ci.yml`) runs `npm test` -- it does not run the benchmark harness or tiered evaluator.
- **Session-level metrics**: The Observatory emitter fires events (`improvement:event`, `hub:event`) but nothing aggregates them into session-level quality metrics.
- **Hook infrastructure**: Post-tool-use hooks exist (`.claude/hooks/post_tool_use.sh`, `track_file_access.sh`, `memory_pattern_detector.sh`) but capture no quality signals. The session-end hook (`session_end_memory.sh`) prompts agents for subjective reflection but captures no objective metrics.

### What This Costs

Without an evaluation harness, every decision in the improvement system is faith-based:

1. **The SIL cannot close the loop.** It runs Discovery, Filter, Experiment -- then Evaluate has nothing to compare against. The SIL-010 orchestrator calls the tiered evaluator, but the tiered evaluator's real-world tier returns a hardcoded score.

2. **The AgentOps pipeline cannot assess proposals.** Daily proposals generate GitHub issues. Some get the `approved:proposal-N` label and trigger implementation. But there is no post-implementation evaluation -- no way to know if the implemented proposal actually helped.

3. **Patterns accumulate without selection pressure.** The continual calibration rule (`.claude/rules/continual-calibration.md`) defines HOT/WARM/COLD freshness tags but nothing computes them. Patterns are never promoted, demoted, or archived based on empirical evidence.

4. **Regressions go undetected.** The CI pipeline runs vitest. If tests pass, the PR is green. But behavioral regressions (slower thinking, worse reasoning quality, token bloat, broken progressive disclosure) are invisible to the test suite.

5. **No A/B comparison.** When a pattern variant is proposed, there is no protocol to test variant A against variant B under controlled conditions and select the winner based on data.

The evaluation harness is the test infrastructure from the C compiler project analogy in the overview. Without it, autonomous agents cannot receive objective feedback. Every change requires human review -- which is the exact bottleneck the improvement system is supposed to eliminate.

---

## Current State Analysis

### What Exists (Verified)

**Metric collection points (have data, no aggregation)**:

| Signal Source | Data Available | Location | Aggregated? |
|--------------|---------------|----------|-------------|
| Vitest results | pass/fail per test, duration | `npm test` output | No (stdout only) |
| Benchmark harness | duration_ms, response_bytes, tokens_estimated, pass/fail per test | `dgm-specs/validation/baseline.json` | Baseline comparison only |
| Tiered evaluator | score per tier, cost per tier, early termination | `benchmarks/tiered-evaluator.ts` | In-memory only |
| Observatory events | improvement events, hub events | `src/observatory/emitter.ts` | No persistent aggregation |
| File access log | file paths, operation types, timestamps | `.claude/state/file_access.jsonl` | Pattern detection only |
| Memory calibration | coverage gaps, repeated issues | `.claude/state/memory-calibration.json` | JSON blob, no time series |
| Git history | commits, branches, PR merge times | `git log` | No |
| GitHub Actions | workflow run duration, success/failure | GitHub API | No local aggregation |
| LangSmith | traces (when enabled) | LangSmith cloud | Not wired to decisions |

**Decision-making hooks (fire, but make no decisions)**:

| Hook | Fires On | Could Gate? | Currently Gates? |
|------|----------|------------|-----------------|
| `session_start.sh` | Session open | Load quality context | No |
| `session_end_memory.sh` | Session close | Capture quality metrics | No (prompts only) |
| `post_tool_use.sh` | Every tool use | Flag risky operations | No (logs git only) |
| `track_file_access.sh` | Every file op | Track churn metrics | No (logs only) |
| `stop.sh` | Agent shutdown | Final quality snapshot | No |
| CI workflow | Push/PR to main | Block regressions | Only `npm test` |
| SIL workflow | Weekly/manual | Block bad improvements | No quality gates |

### What Does NOT Exist (Verified)

| Component | Expected Location | Status |
|-----------|------------------|--------|
| Metric aggregation store | `dgm-specs/metrics/` or `.claude/state/metrics/` | Does not exist |
| Quality time series | `dgm-specs/metrics/timeseries.jsonl` | Does not exist |
| A/B test protocol | Any spec or implementation | Does not exist |
| LangSmith evaluation wiring | Any `langsmith` import in source code | Does not exist |
| Pattern fitness computation | `.claude/rules/evolution/fitness.json` | Does not exist |
| Regression benchmark CI step | `.github/workflows/ci.yml` | Only has `npm test` |
| Post-session quality hook | `.claude/hooks/` | No objective metric capture |
| Decision gate configuration | Any config file | Does not exist |

---

## Design

### Architecture

```
                    ┌──────────────────────────────────────┐
                    │          METRIC COLLECTORS            │
                    │                                       │
                    │  Post-Session ─┐                      │
                    │  CI Pipeline ──┤                      │
                    │  SIL Evaluate ─┤── MetricEvent ──┐   │
                    │  AgentOps Run ─┤                 │   │
                    │  Manual Run ───┘                 │   │
                    └─────────────────────────────┬────┘   │
                                                  │        │
                    ┌─────────────────────────────┴────────┘
                    │         METRIC STORE
                    │
                    │  dgm-specs/metrics/timeseries.jsonl
                    │  dgm-specs/metrics/baselines/
                    │  dgm-specs/metrics/experiments/
                    └──────────────┬───────────────────────┐
                                   │                       │
                    ┌──────────────┴────────┐  ┌───────────┴──────────┐
                    │   REGRESSION DETECTOR  │  │   A/B COMPARATOR     │
                    │                        │  │                      │
                    │  Compare latest run    │  │  Compare experiment  │
                    │  against baseline.     │  │  A vs experiment B.  │
                    │  Flag violations.      │  │  Statistical test.   │
                    │  Emit verdict.         │  │  Emit verdict.       │
                    └──────────┬─────────────┘  └──────────┬───────────┘
                               │                           │
                    ┌──────────┴───────────────────────────┴──────────┐
                    │              DECISION GATES                       │
                    │                                                   │
                    │  Gate 1: CI regression check (block PR merge)     │
                    │  Gate 2: SIL evaluation check (block integration) │
                    │  Gate 3: Pattern fitness update (auto-promote)    │
                    │  Gate 4: Human escalation (cost/quality tradeoff) │
                    └──────────────────────┬──────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────────┐
                    │             OUTPUTS                               │
                    │                                                   │
                    │  - LangSmith experiment (A/B dashboard)           │
                    │  - GitHub PR status check (pass/fail)             │
                    │  - Pattern fitness.json update                    │
                    │  - MEMORY.md calibration entry                    │
                    │  - Human escalation issue (if threshold crossed)  │
                    └──────────────────────────────────────────────────┘
```

---

## Metric Definitions

### Primary Metrics (Collected Every Run)

#### M1: Test Pass Rate

```typescript
interface TestPassRate {
  metric: "test_pass_rate";
  value: number;        // 0.0 - 1.0
  total_tests: number;
  passed_tests: number;
  failed_tests: string[]; // test IDs that failed
  source: "vitest" | "benchmark_harness" | "behavioral";
}
```

**Baseline**: 1.0 (all tests pass).
**Regression threshold**: Any value below 1.0 is a regression. Tests are binary -- they pass or they do not.
**Collection point**: CI pipeline, SIL evaluate phase, post-session hook.

#### M2: Benchmark Duration

```typescript
interface BenchmarkDuration {
  metric: "benchmark_duration";
  test_id: string;
  value_ms: number;
  baseline_ms: number;
  delta_percent: number;
  source: "benchmark_harness";
}
```

**Baseline**: Stored in `dgm-specs/validation/baseline.json` (already exists).
**Regression threshold**: >20% slower than baseline for any individual test. >10% slower across aggregate average.
**Collection point**: Benchmark harness run (`dgm-specs/harness/benchmark-runner.ts`).

#### M3: Response Size

```typescript
interface ResponseSize {
  metric: "response_size";
  test_id: string;
  value_bytes: number;
  baseline_bytes: number;
  delta_percent: number;
  source: "benchmark_harness";
}
```

**Baseline**: Stored in `dgm-specs/validation/baseline.json`.
**Regression threshold**: >10% larger than baseline. Response bloat indicates reasoning overhead or broken response formatting.
**Collection point**: Benchmark harness run.

#### M4: Token Cost

```typescript
interface TokenCost {
  metric: "token_cost";
  value_tokens: number;    // estimated from response_bytes / 4
  value_usd: number;       // estimated at $3/MTok input, $15/MTok output
  budget_remaining: number;
  source: "langsmith" | "estimated";
}
```

**Baseline**: Established from first 5 SIL runs (median).
**Regression threshold**: >50% cost increase for equivalent task. Cost correlates with reasoning quality -- an agent that uses 3x tokens to achieve the same result has degraded.
**Collection point**: LangSmith traces (when available), estimated from response sizes (fallback).

#### M5: Session Duration

```typescript
interface SessionDuration {
  metric: "session_duration";
  value_minutes: number;
  turns: number;
  tools_used: number;
  files_touched: number;
  source: "session_hooks";
}
```

**Baseline**: Median of last 20 sessions.
**Regression threshold**: Not a regression metric -- used for correlation analysis. Longer sessions with fewer outcomes indicate degraded reasoning.
**Collection point**: `session_start.sh` timestamp vs. `session_end_memory.sh` timestamp, file access log entry count.

### Secondary Metrics (Collected When Available)

#### M6: Pattern Fitness

```typescript
interface PatternFitness {
  metric: "pattern_fitness";
  pattern_id: string;       // e.g., "ooda-foundation", "spiral-detection"
  times_loaded: number;     // sessions where pattern was in context
  times_referenced: number; // sessions where agent explicitly used pattern
  success_rate: number;     // fraction of sessions with positive outcome
  freshness: "HOT" | "WARM" | "COLD";
  source: "dgm_evolution";
}
```

**Baseline**: N/A (relative metric).
**Promotion threshold**: Referenced in >60% of sessions loaded, success_rate > 0.7 -> HOT.
**Demotion threshold**: Referenced in <20% of sessions loaded after 10+ loads, or success_rate < 0.3 -> COLD.
**Archive threshold**: COLD for >30 days with no references -> graveyard.
**Collection point**: File access log (`.claude/state/file_access.jsonl` tracks which rules are read), session outcome from session-end hook.

#### M7: Progressive Disclosure Correctness

```typescript
interface ProgressiveDisclosure {
  metric: "progressive_disclosure";
  stage_violations: number;     // operations attempted at wrong stage
  total_operations: number;
  expected_stage_errors: number; // intentional stage boundary tests
  unexpected_errors: number;     // actual bugs
  source: "eval_scenarios";
}
```

**Baseline**: 0 unexpected errors.
**Regression threshold**: Any unexpected_errors > 0.
**Collection point**: Evaluation scenario runner (AgentOps eval harness scenarios).

#### M8: Reasoning Chain Quality

```typescript
interface ReasoningChainQuality {
  metric: "reasoning_chain_quality";
  session_id: string;
  thought_count: number;
  branch_count: number;
  revision_count: number;
  conclusion_reached: boolean;
  estimated_coherence: number;  // 0.0 - 1.0, LLM-judge scored
  source: "llm_judge";
}
```

**Baseline**: Median coherence score from last 20 sessions.
**Regression threshold**: Coherence dropping below 0.5 triggers investigation. This metric is expensive (requires LLM judge call) and should only run in SIL evaluate phase, not CI.
**Collection point**: Post-session LLM judge evaluation over exported Thoughtbox session.

---

## Baseline Establishment Protocol

### Step 1: Collect Initial Baseline (One-Time)

Run the benchmark harness 5 times consecutively to establish variance bounds:

```bash
# Run from project root
for i in {1..5}; do
  npx tsx dgm-specs/harness/cli.ts run --output "dgm-specs/metrics/baselines/run-$i.json"
done
```

Each run produces a `BenchmarkRun` (type from `dgm-specs/harness/types.ts`).

### Step 2: Compute Baseline Statistics

```typescript
// dgm-specs/metrics/compute-baseline.ts

interface BaselineStatistics {
  computed_at: string;
  git_commit: string;
  run_count: number;
  per_test: Record<string, {
    duration_ms: { mean: number; stddev: number; p50: number; p95: number };
    response_bytes: { mean: number; stddev: number; p50: number; p95: number };
    pass_rate: number;
  }>;
  aggregate: {
    total_duration_ms: { mean: number; stddev: number };
    total_tokens: { mean: number; stddev: number };
    pass_rate: number;
  };
}
```

Statistical baseline uses p50 (median) for thresholds, not mean, to resist outlier skew. The p95 value bounds the "normal" range -- anything beyond p95 + 20% is a regression.

### Step 3: Store Baseline

Write to `dgm-specs/metrics/baselines/current.json`. Previous baselines are archived with git commit in filename: `dgm-specs/metrics/baselines/baseline-{commit}.json`.

### Step 4: Re-Baseline Protocol

Baselines drift as the system evolves. Re-establish when:
- A major feature lands (new toolhost, new MCP operation, new agent capability)
- More than 20% of tests are added or removed
- Baseline is older than 30 days
- Manual trigger via `npx tsx dgm-specs/harness/cli.ts baseline --force`

---

## Regression Detection

### Automated Detection Flow

```
 New code change (PR or SIL improvement)
              │
              ▼
    ┌─────────────────┐
    │  Run test suite  │
    │  (npm test)      │
    └────────┬────────┘
             │
         All pass?
         │       │
        Yes      No ──→ FAIL: Block merge. Report failed tests.
         │
         ▼
    ┌─────────────────┐
    │  Run benchmark   │
    │  harness         │
    └────────┬────────┘
             │
         Compare to baseline
         │       │
        Within   Beyond ──→ FLAG: Report regressions.
        bounds            │    Gate decision (see Decision Gates).
         │                │
         ▼                ▼
    ┌─────────────────┐  ┌─────────────────┐
    │  PASS            │  │  Regression      │
    │  (merge allowed) │  │  Report          │
    └─────────────────┘  └─────────────────┘
```

### Regression Report Format

```typescript
interface RegressionReport {
  run_id: string;
  git_commit: string;
  baseline_commit: string;
  timestamp: string;
  verdict: "PASS" | "WARN" | "FAIL";
  regressions: Array<{
    test_id: string;
    metric: string;
    baseline_value: number;
    current_value: number;
    delta_percent: number;
    severity: "minor" | "major" | "critical";
    // minor: 10-20% worse. major: 20-50% worse. critical: >50% worse or new failure.
  }>;
  improvements: Array<{
    test_id: string;
    metric: string;
    baseline_value: number;
    current_value: number;
    delta_percent: number;
  }>;
  summary: string; // human-readable 1-2 sentence summary
}
```

Severity classification:
- **Minor** (10-20% degradation): Log warning, do not block.
- **Major** (20-50% degradation): Block merge, require human review.
- **Critical** (>50% degradation or new test failure): Block merge, create GitHub issue, escalate.

---

## A/B Testing Protocol

### When to A/B Test

A/B testing applies when the system has two competing approaches and needs empirical evidence to choose between them. Common triggers:

1. **Pattern variant proposed.** The DGM evolution engine generates a mutation of an existing pattern. Both original and mutant need evaluation.
2. **SIL improvement candidate.** The improvement reasoner proposes a code change. Pre-change vs. post-change performance must be compared.
3. **Configuration change.** A parameter (thinking budget, timeout, prompt template) is tuned. Before vs. after comparison needed.

### A/B Test Structure

```typescript
interface ABTest {
  id: string;                    // e.g., "ab-20260211-ooda-variant"
  hypothesis: string;            // what we expect to observe
  variant_a: {
    label: string;               // "baseline" or descriptive name
    git_ref: string;             // commit, branch, or tag
    config_overrides?: Record<string, unknown>;
  };
  variant_b: {
    label: string;
    git_ref: string;
    config_overrides?: Record<string, unknown>;
  };
  metrics: string[];             // which metrics to compare
  sample_size: number;           // runs per variant (minimum 5)
  acceptance_criteria: {
    metric: string;
    direction: "higher_better" | "lower_better";
    min_improvement_percent: number;  // must improve by at least this much
  }[];
  status: "planned" | "running" | "complete" | "abandoned";
  results?: ABTestResults;
}

interface ABTestResults {
  variant_a_runs: string[];      // run IDs
  variant_b_runs: string[];      // run IDs
  per_metric: Record<string, {
    a_mean: number;
    a_stddev: number;
    b_mean: number;
    b_stddev: number;
    delta_percent: number;
    significant: boolean;        // true if non-overlapping stddev ranges
    winner: "a" | "b" | "inconclusive";
  }>;
  overall_verdict: "a_wins" | "b_wins" | "inconclusive" | "both_regressed";
  recommendation: string;        // human-readable recommendation
}
```

### A/B Test Execution

```
1. Define test       ──→  dgm-specs/metrics/experiments/{id}.json
2. Run variant A     ──→  N benchmark runs on variant A git ref
3. Run variant B     ──→  N benchmark runs on variant B git ref
4. Collect metrics   ──→  Append to timeseries.jsonl with experiment tag
5. Compute results   ──→  Mean, stddev, delta per metric
6. Apply decision    ──→  Gate rules (see Decision Gates)
7. Archive results   ──→  dgm-specs/metrics/experiments/{id}-results.json
```

Minimum sample size: 5 runs per variant. Significance test: non-overlapping 1-sigma ranges (for small N, this is more practical than a p-value test). If ranges overlap, verdict is "inconclusive" and the test either needs more runs or the difference is too small to matter.

### A/B Test via LangSmith

When LangSmith is configured, each variant run becomes a LangSmith experiment:

```typescript
// Pseudocode -- actual implementation in eval-harness/langsmith.ts

import { Client } from "langsmith";

const client = new Client();

// Create dataset from benchmark scenarios
const dataset = await client.createDataset("thoughtbox-eval-v1", {
  description: "Thoughtbox behavioral evaluation scenarios",
});

// Run experiment A
const experimentA = await client.runOnDataset(dataset.id, targetFunctionA, {
  experimentPrefix: `${abTest.id}-variant-a`,
  metadata: { variant: "a", git_ref: abTest.variant_a.git_ref },
});

// Run experiment B
const experimentB = await client.runOnDataset(dataset.id, targetFunctionB, {
  experimentPrefix: `${abTest.id}-variant-b`,
  metadata: { variant: "b", git_ref: abTest.variant_b.git_ref },
});

// Compare in LangSmith dashboard:
// https://smith.langchain.com/projects/<project>/compare?experiments=A,B
```

The LangSmith integration provides:
- Visual comparison dashboards (no code needed)
- Per-example drill-down for failure analysis
- Trace trees for debugging slow or incorrect runs
- Historical experiment tracking

---

## LangSmith Integration

### Wiring Plan

LangSmith integration follows the tracing standard defined in `agentops/specs/05-observability-and-tracing.md`.

#### Environment Variables

```bash
# Required
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2_...

# Optional (defaults)
LANGSMITH_PROJECT=thoughtbox-eval    # separates eval traces from dev traces
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
```

#### Trace Structure

Every evaluation run produces a trace tree:

```
eval-run-{id}                          # root span
├── benchmark-{test-id}                # per-test span
│   ├── mcp-call: start_new            # tool span
│   ├── mcp-call: cipher               # tool span
│   ├── mcp-call: thought              # tool span (repeats)
│   └── assertion-check                # evaluator span
├── regression-check                   # analysis span
│   ├── load-baseline                  # io span
│   └── compare-metrics                # compute span
└── verdict                            # output span
```

#### Evaluators

LangSmith evaluators score each run:

```typescript
// Deterministic evaluators (cheap, always run)
const passFailEvaluator = {
  evaluatorType: "custom",
  evaluateRun: (run, example) => ({
    key: "pass_fail",
    score: run.outputs?.passed ? 1 : 0,
  }),
};

const latencyEvaluator = {
  evaluatorType: "custom",
  evaluateRun: (run, example) => ({
    key: "latency_ok",
    score: run.outputs?.duration_ms < example.outputs?.max_duration_ms ? 1 : 0,
  }),
};

// LLM-judge evaluator (expensive, SIL evaluate phase only)
const qualityJudge = {
  evaluatorType: "llm",
  prompt: `Evaluate the reasoning quality of this Thoughtbox session.
Score from 0.0 to 1.0 based on:
- Logical coherence of the thought chain
- Appropriate use of branching and revision
- Conclusion reached and justified
- No circular reasoning or repetition

Session transcript:
{output}

Score:`,
};
```

#### Dataset Management

Evaluation scenarios are stored as LangSmith datasets:

| Dataset | Source | Size | Purpose |
|---------|--------|------|---------|
| `thoughtbox-smoke` | `dgm-specs/harness/benchmark-runner.ts` TEST_CONFIGS | 4 scenarios | Quick sanity check |
| `thoughtbox-behavioral` | `src/resources/behavioral-tests-content.ts` | 41 scenarios | Full behavioral coverage |
| `thoughtbox-regression` | `agentops/specs/08-evaluation-harness.md` Day 0 set | 10 scenarios | Stage transitions, export, observatory |
| `thoughtbox-quality` | Manual curation | 5 scenarios | Reasoning quality assessment (LLM-judge) |

Datasets are versioned. When scenarios change, a new dataset version is created. Old versions are preserved for historical comparison.

---

## Decision Gates

### Gate 1: CI Regression Gate (Automated)

**Trigger**: Every push to main, every PR.
**Checks**:
- `npm test` passes (existing)
- Benchmark harness passes with no critical regressions (new)

**Actions**:
| Outcome | Action |
|---------|--------|
| All pass, no regressions | Green check, merge allowed |
| Tests pass, minor regressions (10-20%) | Yellow warning, merge allowed with comment |
| Any test failure | Red block, merge prevented |
| Major regression (20-50%) | Red block, merge prevented, regression report posted as PR comment |
| Critical regression (>50% or new failure) | Red block, GitHub issue created, tagged `regression` |

**Implementation**: Add step to `.github/workflows/ci.yml`:

```yaml
- name: Run benchmark harness
  run: npx tsx dgm-specs/harness/cli.ts run --ci --baseline dgm-specs/metrics/baselines/current.json

- name: Check regression
  run: npx tsx dgm-specs/metrics/check-regression.ts --report regression-report.json

- name: Comment on PR
  if: github.event_name == 'pull_request' && steps.check-regression.outputs.has_warnings == 'true'
  uses: actions/github-script@v7
  with:
    script: |
      const report = require('./regression-report.json');
      await github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: formatRegressionComment(report)
      });
```

### Gate 2: SIL Evaluation Gate (Automated)

**Trigger**: SIL evaluate phase (after experiment).
**Checks**:
- Tiered evaluator passes all required tiers
- Benchmark delta vs. pre-improvement baseline is positive or neutral
- Token cost is within budget

**Actions**:
| Outcome | Action |
|---------|--------|
| All tiers pass, positive delta | Auto-integrate, create PR |
| All tiers pass, neutral delta | Log, skip integration (improvement didn't help) |
| Smoke tier fails | Reject immediately, log reason |
| Regression tier fails | Reject, archive as stepping stone |
| Budget exceeded | Reject, log cost data |

### Gate 3: Pattern Fitness Gate (Automated, Weekly)

**Trigger**: Weekly, after SIL run or manually.
**Checks**:
- Compute M6 (Pattern Fitness) for all active patterns
- Compare against promotion/demotion thresholds

**Actions**:
| Outcome | Action |
|---------|--------|
| Pattern referenced >60%, success >0.7 | Promote to HOT, add to `fitness.json` |
| Pattern referenced <20% after 10+ loads | Demote to COLD, flag for review |
| Pattern COLD for >30 days | Archive to graveyard, log stepping stone |
| New pattern emerges from A/B test | Add to niche grid with initial WARM status |

### Gate 4: Human Escalation Gate

**Trigger**: Any of the following.
**Conditions**:
- Cost of a single improvement attempt exceeds $5 USD
- A/B test is inconclusive after maximum sample size (10 runs each)
- Pattern demotion affects a governance file (`.claude/rules/`, `CLAUDE.md`, `AGENTS.md`)
- Regression detected in production session (not just CI)
- Three consecutive SIL iterations produce no improvements

**Format** (per escalation protocol in `.claude/rules/escalation-protocol.md`):
1. **Situation**: What metric triggered the escalation
2. **Impact**: What this means for system quality
3. **What was tried**: Which automated gates fired and their verdicts
4. **Options**: At least 2 (e.g., "accept regression with rationale" vs. "revert and investigate")
5. **Recommendation**: Which option the system favors and why

---

## Implementation Plan

### Phase 1: Metric Store and Collection (Week 1)

**Files to create:**

| File | Purpose |
|------|---------|
| `dgm-specs/metrics/types.ts` | TypeScript interfaces for all metrics (M1-M8) |
| `dgm-specs/metrics/store.ts` | Append-only JSONL metric store with query functions |
| `dgm-specs/metrics/collect-session.ts` | Post-session metric collector (wired to session-end hook) |
| `dgm-specs/metrics/baselines/current.json` | Current baseline (bootstrapped from existing `baseline.json`) |

**Files to modify:**

| File | Change |
|------|--------|
| `.claude/hooks/session_end_memory.sh` | Add objective metric capture (test count, duration, file churn) before subjective prompt |
| `dgm-specs/harness/benchmark-runner.ts` | Emit MetricEvents to store after each run |
| `package.json` | Add `eval:collect`, `eval:baseline`, `eval:compare` scripts |

**Metric store format** (JSONL for append-only, grep-friendly):

```jsonl
{"timestamp":"2026-02-11T14:30:00Z","metric":"test_pass_rate","value":1.0,"total_tests":41,"source":"vitest","git_commit":"abc1234","run_id":"ci-12345"}
{"timestamp":"2026-02-11T14:30:05Z","metric":"benchmark_duration","test_id":"thoughtbox-basic","value_ms":3200,"baseline_ms":2800,"delta_percent":14.3,"source":"benchmark_harness","git_commit":"abc1234"}
```

### Phase 2: Regression Detection and CI Gate (Week 2)

**Files to create:**

| File | Purpose |
|------|---------|
| `dgm-specs/metrics/check-regression.ts` | Compare latest run against baseline, produce RegressionReport |
| `dgm-specs/metrics/compute-baseline.ts` | Compute BaselineStatistics from multiple runs |

**Files to modify:**

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | Add benchmark harness step and regression check |
| `dgm-specs/harness/cli.ts` | Add `--ci` flag (JSON output, exit code based on verdict) |

### Phase 3: A/B Testing Framework (Week 3)

**Files to create:**

| File | Purpose |
|------|---------|
| `dgm-specs/metrics/ab-test.ts` | A/B test definition, execution, and result computation |
| `dgm-specs/metrics/experiments/` | Directory for experiment definitions and results |

**Files to modify:**

| File | Change |
|------|--------|
| `benchmarks/tiered-evaluator.ts` | Wire real-world tier to A/B test results instead of hardcoded 0.75 |

### Phase 4: LangSmith Integration (Week 3-4)

**Files to create:**

| File | Purpose |
|------|---------|
| `dgm-specs/metrics/langsmith.ts` | LangSmith client wrapper, dataset management, evaluator definitions |
| `dgm-specs/metrics/langsmith-sync.ts` | Sync local metric store to LangSmith experiments |

**Files to modify:**

| File | Change |
|------|--------|
| `dgm-specs/harness/benchmark-runner.ts` | Wrap MCP calls as LangSmith tool spans |
| `.github/workflows/self-improvement-loop.yml` | Add LangSmith env vars, upload experiment results |

**Dependency**: `langsmith` npm package.

### Phase 5: Pattern Fitness and Decision Gates (Week 4)

**Files to create:**

| File | Purpose |
|------|---------|
| `dgm-specs/metrics/fitness.ts` | Compute pattern fitness from file access logs + session outcomes |
| `.claude/rules/evolution/fitness.json` | Persisted fitness scores per pattern |
| `.claude/rules/evolution/signals.jsonl` | Raw signal log for fitness computation |
| `dgm-specs/metrics/gates.ts` | Decision gate configuration and evaluation |

**Files to modify:**

| File | Change |
|------|--------|
| `.github/workflows/self-improvement-loop.yml` | Add Gate 2 (SIL evaluation) and Gate 3 (pattern fitness) steps |
| `.claude/hooks/session_end_memory.sh` | Emit session outcome signal to `signals.jsonl` |

---

## Threshold Reference

Quick reference for all thresholds used across the system:

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Test pass rate | 1.0 | N/A | <1.0 |
| Benchmark duration (per test) | <10% slower | 10-20% slower | >20% slower |
| Benchmark duration (aggregate) | <5% slower | 5-10% slower | >10% slower |
| Response size (per test) | <5% larger | 5-10% larger | >10% larger |
| Token cost (per task) | <$1 | $1-5 | >$5 (escalate) |
| Pattern reference rate | >60% (promote) | 20-60% (maintain) | <20% (demote) |
| Pattern success rate | >0.7 (HOT) | 0.3-0.7 (WARM) | <0.3 (COLD) |
| A/B test improvement | >10% better (adopt) | 0-10% (inconclusive) | Worse (reject) |
| Reasoning coherence | >0.7 | 0.5-0.7 | <0.5 (investigate) |
| SIL consecutive failures | 0-1 | 2 | 3+ (escalate) |

---

## Dependencies

### Upstream (This Spec Depends On)

| Dependency | Status | What We Need |
|------------|--------|--------------|
| `dgm-specs/harness/` (SIL-100) | Implemented | Benchmark runner, baseline comparison, types |
| `benchmarks/tiered-evaluator.ts` (SIL-004) | Implemented | Tiered execution with cost tracking |
| `benchmarks/config-loader.ts` (SIL-002) | Implemented | Suite configuration from YAML |
| `.github/workflows/ci.yml` | Implemented | CI pipeline to add regression step |
| `.github/workflows/self-improvement-loop.yml` | Implemented | SIL workflow to add evaluation gates |
| `.claude/hooks/session_end_memory.sh` | Implemented | Session-end hook to add metric capture |
| `.claude/state/file_access.jsonl` | Active | Raw data for pattern fitness computation |

### Downstream (Depends On This Spec)

| Component | What It Gets |
|-----------|-------------|
| Spec 01 (Unified Loop Controller) | Quality metrics to coordinate across timescales |
| Spec 03 (Automated Pattern Evolution) | Pattern fitness scores for DGM evolution |
| Spec 06 (Agent Team Orchestration) | Quality gates for agent-produced changes |
| SIL-010 (Main Loop Orchestrator) | Evaluation phase implementation |
| AgentOps daily pipeline | Post-implementation quality assessment |

### External Dependencies

| Dependency | Required? | Fallback |
|------------|-----------|----------|
| LangSmith API (`langsmith` npm package) | No | Local JSONL store + CLI reports |
| GitHub Actions | No (for CI gate) | Manual `npx tsx` invocation |
| Anthropic API | Yes (for LLM-judge metric M8) | Skip M8, use deterministic metrics only |

---

## Acceptance Criteria

- [ ] Metric store exists at `dgm-specs/metrics/timeseries.jsonl` and accepts append-only writes
- [ ] `npm run eval:baseline` establishes a baseline from 5 benchmark runs
- [ ] `npm run eval:compare` produces a RegressionReport comparing latest run to baseline
- [ ] CI pipeline blocks PRs with critical regressions (>50% degradation or test failure)
- [ ] CI pipeline posts regression report as PR comment when warnings exist
- [ ] SIL evaluate phase uses the evaluation harness instead of placeholder scores
- [ ] A/B test can be defined, executed, and produces a verdict
- [ ] LangSmith traces are emitted when `LANGSMITH_TRACING=true` (graceful no-op when not set)
- [ ] Pattern fitness scores are computed from file access logs and session outcomes
- [ ] Decision gates fire correctly for all 4 gate types
- [ ] Regression report includes severity classification (minor/major/critical)
- [ ] At least one A/B test has been run end-to-end and archived in `dgm-specs/metrics/experiments/`

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Benchmark variance masks real regressions | Medium | High | Use median (p50) not mean; require 5+ runs for baseline |
| LangSmith rate limits or downtime | Low | Low | Local JSONL store is primary; LangSmith is supplementary |
| LLM-judge scores are noisy | High | Medium | Only use for M8 (reasoning quality); all gating decisions use deterministic metrics |
| Baseline drift causes false positives | Medium | Medium | Re-baseline protocol every 30 days or after major features |
| Pattern fitness gaming (agent reads pattern files to inflate reference count) | Low | Medium | Cross-reference file reads with actual pattern usage in reasoning |
| Over-gating slows down development | Medium | Medium | Start with WARN-only for first 2 weeks; enable blocking after threshold calibration |

---

**Created**: 2026-02-11
**Source**: Gap analysis from [00-overview.md](./00-overview.md), existing implementations in `dgm-specs/harness/`, `benchmarks/`, `agentops/specs/`, and `.github/workflows/`
