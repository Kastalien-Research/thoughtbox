# Implementation Plan: Cost-Effective Self-Improvement Loop for Thoughtbox

> **Created**: 2026-01-19
> **Status**: Ready for Implementation
> **Estimated Effort**: 3-4 weeks for MVP, iterative refinement ongoing

## Key Components

| Component | Description |
|-----------|-------------|
| **Thoughtbox** | MCP server providing structured reasoning with branching |
| **Distbook** | Fork of Srcbook with MCP peer capabilities (client + server) |
| **Observatory** | Event streaming and observability layer |

---

## Executive Summary

This plan implements an autonomous self-improvement loop for Thoughtbox that addresses two critical challenges:

1. **Cost Reduction**: SICA's $7,000/15 iterations is prohibitive. This plan achieves **~99% cost reduction** through anchor-point sampling, batch API usage, and tiered evaluation.

2. **Gaming Prevention**: DGM was caught hallucinating improvements. This plan uses **real-world validation** via SWE-bench Verified methodology and held-out test sets.

The architecture leverages Thoughtbox's existing branching/reasoning infrastructure as the cognitive backbone for a Compound Engineering-style improvement loop.

---

## Distbook: The Execution Environment

**[Distbook](https://github.com/Kastalien-Research/distbook)** is our fork of [Srcbook](https://github.com/srcbookdev/srcbook) enhanced with MCP peer capabilities. The name reflects its distributed nature - it's both an MCP **server** (exposing notebook execution to agents) and an MCP **client** (consuming tools from Thoughtbox and other servers).

### Why Distbook for Benchmark Execution

| Capability | Benefit for Benchmarks |
|------------|------------------------|
| **Structured cell execution** | Returns `stdout`, `stderr`, `exitCode`, `executionTime` - perfect for scoring |
| **MCP server interface** | Improvement loop can invoke `cell_execute` remotely |
| **MCP client to Thoughtbox** | Notebooks can use Thoughtbox reasoning during test execution |
| **Task management** | Long-running benchmarks with progress tracking |
| **TypeScript/JavaScript** | Native execution environment for JS/TS codebases |

### MCP Peer Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DISTBOOK (MCP Peer)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────┐     ┌─────────────────────────┐       │
│  │     MCP SERVER          │     │      MCP CLIENT         │       │
│  │  (Exposes to agents)    │     │  (Consumes from ecosystem)│      │
│  │                         │     │                         │       │
│  │  Tools:                 │     │  Connected to:          │       │
│  │  • notebook_create      │     │  • Thoughtbox           │       │
│  │  • cell_create          │     │  • Firecrawl            │       │
│  │  • cell_execute  ←──────┼─────┼──• Context7             │       │
│  │  • deps_install         │     │  • Exa                  │       │
│  │                         │     │                         │       │
│  │  Resources:             │     │  Can invoke:            │       │
│  │  • Notebook state       │     │  • thoughtbox_gateway   │       │
│  │  • Cell outputs         │     │  • firecrawl_scrape     │       │
│  │  • Dependencies         │     │  • etc.                 │       │
│  └─────────────────────────┘     └─────────────────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| MCP Server scaffolding | ✅ Complete | 12 tools registered |
| `cell_execute` tool | ⚠️ Stub | Returns task ID but doesn't execute |
| MCP Client scaffolding | ✅ Complete | Connection management ready |
| Client transport | ⚠️ Incomplete | "not yet fully implemented" |
| Thoughtbox config | ✅ Ready | In `.mcp.json` at `localhost:1731` |

### Phase 0 Prerequisite: Complete Distbook Execution

Before the improvement loop can use Distbook for benchmarks:

1. **Wire `cell_execute`** to actual notebook cell execution
2. **Complete client transport** for consuming Thoughtbox
3. **Test round-trip**: Agent → Distbook → execute → structured results

This is a prerequisite but can be developed in parallel with other phases.

---

## Part 1: Research Findings Summary

### 1.1 Existing Thoughtbox Infrastructure (Leverage Points)

| Component | Location | Relevance |
|-----------|----------|-----------|
| **Agentic Testing Framework** | `scripts/agentic-test.ts` | Claude Agent SDK behavioral tests - extend for benchmark evaluation |
| **Observatory** | `src/observatory/server.ts` | Fire-and-forget event emission - use for improvement tracking |
| **Sampling Handler** | `src/sampling/handler.ts` | Cost-optimized critiques (maxTokens: 1000, last 5 thoughts) |
| **DGM Evolution System** | `.claude/rules/evolution/` | fitness.json, lineage.json, niches.json - pattern evolution infrastructure |
| **Progressive Disclosure** | `src/tool-registry.ts` | 4-stage tool gating - extend for capability evaluation |
| **Branching Reasoning** | `src/thought-handler.ts` | branchFromThought/branchId - cognitive backbone for alternatives |

### 1.2 Cost Reduction Strategies (Research-Backed)

| Strategy | Cost Reduction | Source | Implementation Effort |
|----------|---------------|--------|----------------------|
| **Batch API** | 50% | Anthropic docs | Low - API flag change |
| **Anchor Points (1% Sampling)** | 99% | SWE-bench practice | Medium - benchmark design |
| **Tiered Evaluation** | 80-90% | Letta-evals pattern | Medium - pipeline design |
| **Cached Results** | Variable | JSONL incremental | Low - already in codebase |
| **Claude Haiku for Filtering** | 10x per call | Model selection | Low - config change |

### 1.3 Gaming Prevention Strategies (Research-Backed)

| Strategy | Effectiveness | Source | Implementation Effort |
|----------|--------------|--------|----------------------|
| **SWE-bench Verified** | High | Human-validated issues | Medium - benchmark selection |
| **Held-out Test Sets** | High | Standard ML practice | Low - data partitioning |
| **Proctored Evaluation** | Very High | DGM lessons learned | High - sandboxing |
| **Contamination Detection** | Medium | LiveCodeBench pattern | Medium - fingerprinting |
| **Real GitHub Issues** | High | User request | Low - issue scraping |

---

## Part 2: Architecture Design

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS IMPROVEMENT LOOP                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────────┐         │
│  │  DISCOVERY  │────▶│   FILTER     │────▶│  EXPERIMENTATION │         │
│  │   Phase     │     │   Phase      │     │     Phase        │         │
│  │             │     │              │     │                  │         │
│  │ - ArXiv     │     │ - Haiku      │     │ - Thoughtbox     │         │
│  │ - GitHub    │     │   scoring    │     │   branching      │         │
│  │ - Issues    │     │ - Relevance  │     │ - Code mods      │         │
│  └─────────────┘     │   threshold  │     │ - Docker sandbox │         │
│                      └──────────────┘     └────────┬─────────┘         │
│                                                    │                    │
│                                                    ▼                    │
│  ┌─────────────────┐     ┌──────────────┐     ┌────────────────┐       │
│  │   INTEGRATION   │◀────│   EVALUATE   │◀────│    SAMPLE      │       │
│  │     Phase       │     │    Phase     │     │    Phase       │       │
│  │                 │     │              │     │                │       │
│  │ - Claude Code   │     │ - Tiered     │     │ - 1% anchor    │       │
│  │   Action        │     │   gates      │     │   points       │       │
│  │ - PR creation   │     │ - Real-world │     │ - Batch API    │       │
│  │ - Review loop   │     │   validation │     │                │       │
│  └─────────────────┘     └──────────────┘     └────────────────┘       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    THOUGHTBOX REASONING BACKBONE                 │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐       │   │
│  │  │Thought 1│───▶│Thought 2│───▶│Thought 3│    │Branch A │       │   │
│  │  └─────────┘    └────┬────┘    └─────────┘    └────┬────┘       │   │
│  │                      │                              │            │   │
│  │                      └──────────Fork Point──────────┘            │   │
│  │                                     │                            │   │
│  │                               ┌─────┴─────┐                      │   │
│  │                               │ Branch B  │                      │   │
│  │                               └───────────┘                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Benchmark Architecture (Gaming-Resistant)

```
┌─────────────────────────────────────────────────────────────────┐
│                    BENCHMARK ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TRAINING SET (Visible to Agent)     TEST SET (Held Out)        │
│  ┌─────────────────────────────┐     ┌────────────────────────┐ │
│  │                             │     │                        │ │
│  │  Known SWE-bench Issues     │     │  Rotated Monthly       │ │
│  │  - langchain/issues/1234    │     │  - Fresh GitHub issues │ │
│  │  - langchain/issues/5678    │     │  - Human-validated     │ │
│  │                             │     │  - Never seen before   │ │
│  │  Self-Benchmark Suite       │     │                        │ │
│  │  - scripts/agentic-test.ts  │     │  Proctored Execution   │ │
│  │  - Existing behavioral      │     │  - Docker sandbox      │ │
│  │    tests                    │     │  - No network access   │ │
│  │                             │     │  - Log verification    │ │
│  └─────────────────────────────┘     └────────────────────────┘ │
│                                                                  │
│  CONTAMINATION DETECTION                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  - Hash training set issues at session start                ││
│  │  - Compare agent outputs against known solutions            ││
│  │  - Flag suspiciously fast solves (< expected time)          ││
│  │  - Rotate held-out set monthly to prevent memorization      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Cost Model (Before vs After)

| Phase | SICA Approach | Our Approach | Savings |
|-------|---------------|--------------|---------|
| **Discovery** | N/A | Haiku @ $0.25/1M | - |
| **Filtering** | Full evaluation | Haiku relevance scoring | 10x |
| **Experimentation** | Full Sonnet | Batch API (50% off) | 2x |
| **Sampling** | 100% of issues | 1% anchor points | 100x |
| **Evaluation** | Full benchmark | Tiered (cheap→expensive) | 5-10x |
| **Integration** | Manual PR | Claude Code Action | 1x |

**Estimated Cost per Iteration**: $7,000 → **~$70-150** (50-100x reduction)

---

## Part 3: Implementation Phases

### Phase 1: Foundation (Week 1)

#### 1.1 Extend Observatory for Improvement Tracking

**File**: `src/observatory/improvement-tracker.ts` (new)

```typescript
interface ImprovementEvent {
  type: 'discovery' | 'filter' | 'experiment' | 'evaluate' | 'integrate';
  timestamp: string;
  iteration: number;
  cost: number;
  success: boolean;
  metadata: Record<string, unknown>;
}

// Emit to existing Observatory server
export function trackImprovement(event: ImprovementEvent): void {
  observatoryEmit('improvement', event);
}
```

#### 1.2 Create Benchmark Suite Configuration

**File**: `benchmarks/suite.yaml` (new)

```yaml
name: thoughtbox-improvement
version: "1.0"

# Tiered evaluation - cheap gates first
tiers:
  - name: smoke-test
    cost: $0.10
    pass_threshold: 0.8
    evaluations:
      - behavioral-tests

  - name: regression
    cost: $1.00
    pass_threshold: 0.9
    evaluations:
      - full-test-suite

  - name: real-world
    cost: $10.00
    pass_threshold: 0.7
    evaluations:
      - swe-bench-sample

# Anchor points for sampling
anchor_points:
  sample_rate: 0.01  # 1% of issues
  selection: stratified  # Across difficulty levels
  rotation: monthly

# Gaming prevention
proctoring:
  sandbox: docker
  network: disabled
  log_verification: true
  contamination_check: true
```

#### 1.3 Integrate with Existing DGM Evolution System

**Modify**: `.claude/rules/evolution/fitness.json`

Add improvement-loop specific metrics:

```json
{
  "patterns": {
    "improvement-loop/discovery": {
      "usage": 0,
      "success_rate": 0,
      "cost_per_iteration": null,
      "last_used": null
    }
  }
}
```

### Phase 2: Benchmark Infrastructure (Week 2)

#### 2.1 Implement Anchor Point Sampling

**File**: `benchmarks/sampler.ts` (new)

```typescript
interface AnchorPointConfig {
  sampleRate: number;  // 0.01 = 1%
  stratification: 'difficulty' | 'category' | 'random';
  rotationPeriod: 'weekly' | 'monthly';
}

export class BenchmarkSampler {
  // Select representative subset that predicts full benchmark performance
  selectAnchorPoints(fullBenchmark: Issue[], config: AnchorPointConfig): Issue[] {
    // Stratified sampling across difficulty levels
    const strata = this.stratifyByDifficulty(fullBenchmark);
    return strata.flatMap(stratum =>
      this.randomSample(stratum, Math.ceil(stratum.length * config.sampleRate))
    );
  }

  // Correlation validation: do anchor points predict full results?
  validateCorrelation(anchorResults: Result[], fullResults: Result[]): number {
    // Should be > 0.9 for anchor points to be reliable
    return this.pearsonCorrelation(anchorResults, fullResults);
  }
}
```

#### 2.2 Implement Tiered Evaluation Pipeline

**File**: `benchmarks/tiered-evaluator.ts` (new)

```typescript
interface EvaluationTier {
  name: string;
  cost: number;
  passThreshold: number;
  evaluator: () => Promise<EvaluationResult>;
}

export class TieredEvaluator {
  private tiers: EvaluationTier[];

  async evaluate(modification: CodeModification): Promise<EvaluationResult> {
    let totalCost = 0;

    for (const tier of this.tiers) {
      const result = await tier.evaluator();
      totalCost += tier.cost;

      if (result.score < tier.passThreshold) {
        // Early termination - failed cheap gate
        return {
          passed: false,
          failedAt: tier.name,
          cost: totalCost,
          reason: `Failed ${tier.name} with score ${result.score} < ${tier.passThreshold}`
        };
      }
    }

    return { passed: true, cost: totalCost };
  }
}
```

#### 2.3 Real-World Issue Scraping

**File**: `benchmarks/issue-scraper.ts` (new)

```typescript
// Target repos with high agentic user bases (per user request)
const TARGET_REPOS = [
  'langchain-ai/langchain',
  'langchain-ai/langgraph',
  'All-Hands-AI/OpenHands',
  'Aider-AI/aider',
  'anthropics/anthropic-cookbook'
];

export class IssueScraper {
  // Fetch recent issues that look like agentic user problems
  async scrapeAgenticIssues(repo: string, since: Date): Promise<Issue[]> {
    const issues = await this.github.issues.listForRepo({
      owner: repo.split('/')[0],
      repo: repo.split('/')[1],
      since: since.toISOString(),
      state: 'closed',  // Need ground truth (resolution)
      labels: 'bug'
    });

    // Filter for issues that have clear reproduction + fix
    return issues.filter(issue =>
      this.hasReproductionSteps(issue) &&
      this.hasVerifiedFix(issue)
    );
  }
}
```

### Phase 3: Thoughtbox Integration (Week 3)

#### 3.1 Improvement Reasoning as Thoughtbox Session

**File**: `src/improvement/reasoner.ts` (new)

```typescript
import { ThoughtHandler } from '../thought-handler';

export class ImprovementReasoner {
  private thoughtHandler: ThoughtHandler;

  async reasonAboutImprovement(
    discovery: Discovery,
    currentCapabilities: Capabilities
  ): Promise<ImprovementPlan> {

    // Start new reasoning session for this improvement
    const session = await this.thoughtHandler.startSession({
      title: `Improvement: ${discovery.title}`,
      tags: ['improvement-loop', discovery.source]
    });

    // Main reasoning chain
    await this.thoughtHandler.addThought({
      thought: `Analyzing discovery: ${discovery.summary}`,
      thoughtNumber: 1
    });

    // Branch to explore implementation approaches
    await this.thoughtHandler.addThought({
      thought: `Approach A: Direct integration...`,
      branchFromThought: 1,
      branchId: 'approach-a'
    });

    await this.thoughtHandler.addThought({
      thought: `Approach B: Wrapper pattern...`,
      branchFromThought: 1,
      branchId: 'approach-b'
    });

    // Synthesis
    const synthesis = await this.thoughtHandler.addThought({
      thought: `Comparing approaches and selecting...`,
      thoughtNumber: 4
    });

    return this.extractPlan(synthesis);
  }
}
```

#### 3.2 Connect to Existing Sampling Handler

**Modify**: `src/sampling/handler.ts`

Add improvement-specific critique prompts:

```typescript
const IMPROVEMENT_CRITIQUE_PROMPT = `
You are evaluating a proposed code improvement.

Current capabilities: {currentCapabilities}
Proposed change: {proposedChange}
Benchmark results: {benchmarkResults}

Critique this improvement on:
1. Does it genuinely improve the metric, or is this potentially gamed?
2. Are there edge cases not covered by the benchmark?
3. What's the risk of regression in other areas?
4. Is the cost/benefit ratio favorable?

Be skeptical. DGM was caught hallucinating improvements.
`;
```

### Phase 4: Autonomous Loop (Week 4)

#### 4.1 Main Loop Orchestration

**File**: `src/improvement/loop.ts` (new)

```typescript
import { ImprovementReasoner } from './reasoner';
import { TieredEvaluator } from '../benchmarks/tiered-evaluator';
import { BenchmarkSampler } from '../benchmarks/sampler';

export class AutonomousImprovementLoop {
  private config: LoopConfig;
  private reasoner: ImprovementReasoner;
  private evaluator: TieredEvaluator;
  private sampler: BenchmarkSampler;

  async runIteration(): Promise<IterationResult> {
    const iterationCost = { discovery: 0, filter: 0, experiment: 0, evaluate: 0 };

    // Phase 1: Discovery (cheap - Haiku)
    const discoveries = await this.discover();
    iterationCost.discovery = discoveries.cost;

    // Phase 2: Filter (cheap - Haiku relevance scoring)
    const filtered = await this.filter(discoveries.items);
    iterationCost.filter = filtered.cost;

    if (filtered.items.length === 0) {
      return { type: 'no-candidates', cost: iterationCost };
    }

    // Phase 3: Experimentation (medium - Sonnet Batch API)
    for (const candidate of filtered.items) {
      const experiment = await this.experiment(candidate);
      iterationCost.experiment += experiment.cost;

      // Phase 4: Evaluation (tiered - early termination on failure)
      const evaluation = await this.evaluator.evaluate(experiment.modification);
      iterationCost.evaluate += evaluation.cost;

      if (evaluation.passed) {
        // Phase 5: Integration
        await this.integrate(experiment.modification);
        return {
          type: 'improvement-found',
          cost: iterationCost,
          modification: experiment.modification
        };
      }
    }

    return { type: 'no-improvements', cost: iterationCost };
  }

  // Judge agent: should we continue or stop?
  async shouldContinue(history: IterationResult[]): Promise<boolean> {
    // Stop conditions:
    // - 3 consecutive iterations with no candidates
    // - Cost budget exceeded
    // - Improvement rate below threshold
    const recentNoImprovements = history.slice(-3).every(r => r.type !== 'improvement-found');
    const totalCost = history.reduce((sum, r) => sum + this.sumCosts(r.cost), 0);

    return !recentNoImprovements && totalCost < this.config.maxBudget;
  }
}
```

#### 4.2 GitHub Actions Integration

**File**: `.github/workflows/improvement-loop.yml` (new)

```yaml
name: Autonomous Improvement Loop

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:
    inputs:
      max_iterations:
        description: 'Maximum iterations'
        default: '5'
      budget_usd:
        description: 'Budget in USD'
        default: '50'

jobs:
  improve:
    runs-on: ubuntu-latest
    timeout-minutes: 120

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run improvement loop
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          npm run improvement-loop -- \
            --max-iterations ${{ inputs.max_iterations || 5 }} \
            --budget ${{ inputs.budget_usd || 50 }}

      - name: Create PR if improvements found
        if: steps.improve.outputs.improvements_found == 'true'
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          task: |
            Review the improvements in this branch and create a PR.
            Run the full test suite and summarize changes.
```

---

## Part 4: Gaming Prevention Implementation

### 4.1 Proctored Execution Environment

**File**: `benchmarks/proctor.ts` (new)

```typescript
import Docker from 'dockerode';

export class ProctoredExecutor {
  private docker: Docker;

  async executeProctored(
    code: string,
    testCase: TestCase
  ): Promise<ProctoredResult> {

    const container = await this.docker.createContainer({
      Image: 'thoughtbox-sandbox:latest',
      NetworkDisabled: true,  // No network access
      HostConfig: {
        Memory: 512 * 1024 * 1024,  // 512MB limit
        CpuPeriod: 100000,
        CpuQuota: 50000,  // 50% CPU
        ReadonlyRootfs: true
      }
    });

    // Execute with comprehensive logging
    const execution = await container.exec({
      Cmd: ['node', 'run-test.js'],
      AttachStdout: true,
      AttachStderr: true
    });

    const logs = await this.captureFullLogs(execution);

    // Verify logs are consistent (detect fabrication)
    const verification = this.verifyLogConsistency(logs, testCase);

    return {
      passed: verification.consistent && logs.exitCode === 0,
      logs,
      verification
    };
  }

  private verifyLogConsistency(logs: ExecutionLogs, testCase: TestCase): Verification {
    // Check that test execution actually occurred
    const hasTestStart = logs.stdout.includes(`Running: ${testCase.name}`);
    const hasTestEnd = logs.stdout.includes(`Completed: ${testCase.name}`);
    const timingConsistent = this.checkTimingConsistency(logs, testCase.expectedDuration);

    return {
      consistent: hasTestStart && hasTestEnd && timingConsistent,
      flags: []
    };
  }
}
```

### 4.2 Held-Out Test Set Rotation

**File**: `benchmarks/held-out-manager.ts` (new)

```typescript
export class HeldOutManager {
  private currentRotation: Date;
  private heldOutSet: Issue[];

  async rotateHeldOutSet(): Promise<void> {
    // Monthly rotation
    const newRotation = new Date();
    newRotation.setDate(1);  // First of month

    if (newRotation > this.currentRotation) {
      // Move current held-out to training
      await this.promoteToTraining(this.heldOutSet);

      // Select new held-out from fresh issues
      const freshIssues = await this.scrapeFreshIssues();
      this.heldOutSet = await this.selectForHeldOut(freshIssues, {
        count: 50,
        humanValidate: true  // Require human verification
      });

      this.currentRotation = newRotation;
    }
  }

  async selectForHeldOut(
    candidates: Issue[],
    config: HeldOutConfig
  ): Promise<Issue[]> {
    // Stratified selection to ensure coverage
    const selected = this.stratifiedSample(candidates, config.count);

    if (config.humanValidate) {
      // Create GitHub issue for human validation
      await this.createValidationIssue(selected);
      // Block until validated
      return await this.awaitValidation(selected);
    }

    return selected;
  }
}
```

### 4.3 Contamination Detection

**File**: `benchmarks/contamination.ts` (new)

```typescript
export class ContaminationDetector {
  private trainingSetHashes: Map<string, string>;

  async checkContamination(
    agentOutput: string,
    testCase: TestCase
  ): Promise<ContaminationResult> {

    // Check 1: Output similarity to known solutions
    const knownSolution = await this.getKnownSolution(testCase);
    const similarity = this.computeSimilarity(agentOutput, knownSolution);

    if (similarity > 0.95) {
      return {
        contaminated: true,
        reason: 'Output too similar to known solution',
        similarity
      };
    }

    // Check 2: Suspiciously fast solve time
    const expectedTime = this.getExpectedSolveTime(testCase.difficulty);
    const actualTime = testCase.solveTime;

    if (actualTime < expectedTime * 0.1) {
      return {
        contaminated: true,
        reason: 'Solve time suspiciously fast',
        expectedTime,
        actualTime
      };
    }

    // Check 3: Reasoning chain analysis
    const reasoningAnalysis = await this.analyzeReasoning(testCase.thoughtChain);
    if (reasoningAnalysis.jumpsToSolution) {
      return {
        contaminated: true,
        reason: 'Reasoning chain jumps directly to solution without exploration'
      };
    }

    return { contaminated: false };
  }
}
```

---

## Part 5: Success Metrics

### 5.1 Cost Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cost per iteration | < $150 | Observatory tracking |
| Cost reduction vs SICA | > 90% | (7000 - actual) / 7000 |
| Anchor point correlation | > 0.9 | Validation runs |

### 5.2 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Gaming detection rate | > 95% | Proctored execution |
| False positive rate | < 5% | Human review of flags |
| Held-out set performance | Matches training | Correlation analysis |

### 5.3 Improvement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Genuine improvements per week | > 1 | Human-validated PRs |
| Benchmark score improvement | > 10% per month | Tiered evaluation |
| Regression rate | < 5% | Full test suite |

---

## Part 6: Implementation Timeline

### Week 1: Foundation
- [ ] Extend Observatory for improvement tracking
- [ ] Create benchmark suite configuration (suite.yaml)
- [ ] Integrate with existing DGM evolution system
- [ ] Set up cost tracking infrastructure

### Week 2: Benchmark Infrastructure
- [ ] Implement anchor point sampling
- [ ] Implement tiered evaluation pipeline
- [ ] Build real-world issue scraper for target repos
- [ ] Create proctored execution environment

### Week 3: Thoughtbox Integration
- [ ] Implement ImprovementReasoner using Thoughtbox branching
- [ ] Connect to existing Sampling Handler
- [ ] Add improvement-specific critique prompts
- [ ] Test branching-based improvement reasoning

### Week 4: Autonomous Loop
- [ ] Implement main loop orchestration
- [ ] Add judge agent for cycle termination
- [ ] Set up GitHub Actions workflow
- [ ] Create held-out test set rotation
- [ ] Implement contamination detection

### Week 5+: Iteration & Refinement
- [ ] Run first autonomous improvement cycle
- [ ] Analyze cost and quality metrics
- [ ] Tune anchor point selection
- [ ] Expand target repo set
- [ ] Human review of first improvements

---

## Part 7: Risk Mitigation

### 7.1 Gaming Risks

| Risk | Mitigation |
|------|------------|
| Agent learns to detect proctoring | Vary sandbox configuration randomly |
| Memorization of held-out set | Monthly rotation + fresh issues |
| Fabricated test outputs | Log consistency verification |
| Optimizing for wrong metric | Multiple orthogonal benchmarks |

### 7.2 Cost Risks

| Risk | Mitigation |
|------|------------|
| Anchor points don't correlate | Validation runs before deployment |
| Tiered gates too lenient | Conservative initial thresholds |
| Discovery phase runaway cost | Hard budget caps per phase |

### 7.3 Quality Risks

| Risk | Mitigation |
|------|------------|
| Improvements break existing features | Full regression suite before merge |
| Improvements don't generalize | Diverse benchmark set |
| Over-fitting to benchmark | Real-world validation on target repos |

---

## Appendix A: Target Repository Selection

Based on user request for "repos with high agentic user bases":

| Repository | Stars | Rationale |
|------------|-------|-----------|
| langchain-ai/langchain | 100k+ | Core LLM framework, high agentic usage |
| langchain-ai/langgraph | 10k+ | Agent-specific patterns |
| All-Hands-AI/OpenHands | 20k+ | Direct competitor, relevant issues |
| Aider-AI/aider | 25k+ | Coding agent, relevant problems |
| anthropics/anthropic-cookbook | 5k+ | Claude-specific patterns |

## Appendix B: File Index

### Thoughtbox Files

| File | Status | Purpose |
|------|--------|---------|
| `src/observatory/improvement-tracker.ts` | New | Track improvement events |
| `benchmarks/suite.yaml` | New | Benchmark configuration |
| `benchmarks/sampler.ts` | New | Anchor point sampling |
| `benchmarks/tiered-evaluator.ts` | New | Tiered evaluation pipeline |
| `benchmarks/issue-scraper.ts` | New | Real-world issue scraping |
| `benchmarks/proctor.ts` | New | Proctored execution |
| `benchmarks/held-out-manager.ts` | New | Held-out set rotation |
| `benchmarks/contamination.ts` | New | Contamination detection |
| `src/improvement/reasoner.ts` | New | Thoughtbox-based reasoning |
| `src/improvement/loop.ts` | New | Main loop orchestration |
| `src/sampling/handler.ts` | Modify | Add improvement critique prompts |
| `.claude/rules/evolution/fitness.json` | Modify | Add improvement metrics |
| `.github/workflows/improvement-loop.yml` | New | GitHub Actions automation |

### Distbook Files (Phase 0)

| File | Status | Purpose |
|------|--------|---------|
| `packages/api/mcp/server/tools.mts` | Modify | Wire `cell_execute` to actual execution |
| `packages/api/mcp/server/index.mts` | Existing | MCP server initialization |
| `packages/api/mcp/client/index.mts` | Modify | Complete transport implementation |
| `packages/api/mcp/client/tools.mts` | Existing | Tool invocation for Thoughtbox |
| `.mcp.json` | Existing | Server configuration (Thoughtbox at :1731) |

## Appendix C: Cost Estimation Detail

### Per-Iteration Breakdown (Estimated)

| Phase | Model | Tokens (avg) | Cost/1M | Phase Cost |
|-------|-------|--------------|---------|------------|
| Discovery | Haiku | 50,000 | $0.25 | $0.01 |
| Filter | Haiku | 100,000 | $0.25 | $0.03 |
| Experiment | Sonnet (Batch) | 500,000 | $1.50 | $0.75 |
| Evaluate T1 | Haiku | 50,000 | $0.25 | $0.01 |
| Evaluate T2 | Sonnet | 200,000 | $3.00 | $0.60 |
| Evaluate T3 | Sonnet (1%) | 1,000,000 | $3.00 | $0.30 |
| **Total** | | | | **~$1.70** |

With 50% early termination at cheap gates: **~$0.85-1.20 per iteration**

Compare to SICA: **$467 per iteration** (7000/15)

**Savings: 99.7%**

---

*Plan generated by Compound Engineering workflow*
*Based on research from Darwin Gödel Machine, Letta-evals, SWE-bench, and Thoughtbox codebase analysis*

## Glossary

| Term | Definition |
|------|------------|
| **Thoughtbox** | MCP server providing structured reasoning with branching thought chains |
| **Distbook** | [Fork of Srcbook](https://github.com/Kastalien-Research/distbook) with MCP peer capabilities - can both expose and consume MCP tools |
| **MCP Peer** | A system that acts as both MCP client and server simultaneously |
| **Observatory** | Fire-and-forget event streaming infrastructure for observability |
| **Anchor Points** | Representative subset of benchmark issues that predict full benchmark performance |
| **Tiered Evaluation** | Progressive gates (cheap → expensive) with early termination on failure |
| **DGM** | Darwin Gödel Machine - self-improvement through empirical validation |
| **CycleQD** | Quality Diversity algorithm maintaining diverse population across niches |
