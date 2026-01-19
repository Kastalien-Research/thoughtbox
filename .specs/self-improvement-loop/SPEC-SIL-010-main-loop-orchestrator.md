# SPEC-SIL-010: Main Loop Orchestrator

> **Status**: Draft
> **Priority**: HIGH
> **Week**: 4 (Autonomous Loop)
> **Phase**: Integration
> **Estimated Effort**: 10-12 hours

## Summary

Implement the main autonomous improvement loop that orchestrates discovery, filtering, experimentation, evaluation, and integration phases with cost tracking and termination logic.

## Problem Statement

Individual components need orchestration:
- Discovery → Filter → Experiment → Evaluate → Integrate
- Each phase has cost tracking
- Early termination on failures saves budget
- Judge agent decides when to stop
- Results feed back to CLAUDE.md

## Scope

### In Scope
- Phase orchestration (5 phases)
- Cost tracking per phase
- Budget enforcement
- Termination logic (judge agent)
- Iteration history
- Integration with all component specs

### Out of Scope
- GitHub Actions workflow (SPEC-SIL-011)
- CLAUDE.md updates (SPEC-SIL-012)
- UI/dashboard

## Requirements

### R1: Loop Configuration
```typescript
interface LoopConfig {
  maxIterations: number;
  budgetTokens: number;
  costTracking: boolean;
  terminationRules: TerminationRule[];
}
```

### R2: Iteration Result
```typescript
interface IterationResult {
  type: 'improvement-found' | 'no-candidates' | 'no-improvements' | 'budget-exceeded';
  cost: PhaseCosts;
  modification?: CodeModification;
  duration: number;
}
```

### R3: Phase Costs
```typescript
interface PhaseCosts {
  discovery: number;
  filter: number;
  experiment: number;
  evaluate: number;
  integrate: number;
  total: number;
}
```

### R4: Termination Rules
```typescript
interface TerminationRule {
  type: 'consecutive-failures' | 'budget-exceeded' | 'rate-threshold';
  value: number;
}
```

## Technical Approach

### Implementation

```typescript
// src/improvement/loop.ts

import { ImprovementReasoner } from './reasoner';
import { TieredEvaluator } from '../benchmarks/tiered-evaluator';
import { BenchmarkSampler } from '../benchmarks/sampler';
import { ContaminationDetector } from '../benchmarks/contamination';
import { improvementTracker } from '../observatory/improvement-tracker';

interface Discovery {
  id: string;
  title: string;
  summary: string;
  source: string;
  relevanceScore: number;
}

interface CodeModification {
  id: string;
  type: string;
  files: string[];
  diff: string;
}

interface PhaseCosts {
  discovery: number;
  filter: number;
  experiment: number;
  evaluate: number;
  integrate: number;
  total: number;
}

interface IterationResult {
  iterationNumber: number;
  type: 'improvement-found' | 'no-candidates' | 'no-improvements' | 'budget-exceeded' | 'error';
  cost: PhaseCosts;
  modification?: CodeModification;
  duration: number;
  timestamp: string;
  error?: string;
}

interface TerminationRule {
  type: 'consecutive-failures' | 'budget-exceeded' | 'rate-threshold' | 'max-iterations';
  value: number;
}

interface LoopConfig {
  maxIterations: number;
  budgetTokens: number;
  costTracking: boolean;
  terminationRules: TerminationRule[];
  phases: {
    discovery: { enabled: boolean; model: string };
    filter: { enabled: boolean; model: string; minRelevanceScore: number };
    experiment: { enabled: boolean; model: string; useBatchAPI: boolean };
    evaluate: { enabled: boolean };
    integrate: { enabled: boolean; requireApproval: boolean };
  };
}

const DEFAULT_CONFIG: LoopConfig = {
  maxIterations: 10,
  budgetTokens: 5000000,  // 5M tokens
  costTracking: true,
  terminationRules: [
    { type: 'consecutive-failures', value: 3 },
    { type: 'budget-exceeded', value: 1 },
    { type: 'rate-threshold', value: 0.1 }  // Min 10% improvement rate
  ],
  phases: {
    discovery: { enabled: true, model: 'claude-3-haiku' },
    filter: { enabled: true, model: 'claude-3-haiku', minRelevanceScore: 0.6 },
    experiment: { enabled: true, model: 'claude-3-sonnet', useBatchAPI: true },
    evaluate: { enabled: true },
    integrate: { enabled: true, requireApproval: false }
  }
};

export class AutonomousImprovementLoop {
  private config: LoopConfig;
  private reasoner: ImprovementReasoner;
  private evaluator: TieredEvaluator;
  private sampler: BenchmarkSampler;
  private contamination: ContaminationDetector;
  private history: IterationResult[] = [];
  private totalCostTokens = 0;
  private currentIteration = 0;

  constructor(config: Partial<LoopConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Initialize components - would be injected in practice
    this.reasoner = {} as ImprovementReasoner;
    this.evaluator = {} as TieredEvaluator;
    this.sampler = {} as BenchmarkSampler;
    this.contamination = {} as ContaminationDetector;
  }

  /**
   * Run the complete improvement loop until termination.
   */
  async run(): Promise<IterationResult[]> {
    improvementTracker.trackEvent({
      type: 'loop_started',
      iteration: 0,
      phase: 'orchestration',
      cost: 0,
      success: true,
      metadata: { config: this.config }
    });

    while (!this.shouldTerminate()) {
      this.currentIteration++;

      try {
        const result = await this.runIteration();
        this.history.push(result);
        this.totalCostTokens += result.cost.total;

        improvementTracker.trackEvent({
          type: 'iteration_completed',
          iteration: this.currentIteration,
          phase: 'orchestration',
          cost: result.cost.total,
          success: result.type === 'improvement-found',
          metadata: { resultType: result.type }
        });

      } catch (error) {
        const errorResult: IterationResult = {
          iterationNumber: this.currentIteration,
          type: 'error',
          cost: this.zeroCosts(),
          duration: 0,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        };
        this.history.push(errorResult);
      }
    }

    improvementTracker.trackEvent({
      type: 'loop_completed',
      iteration: this.currentIteration,
      phase: 'orchestration',
      cost: this.totalCostTokens,
      success: this.history.some(r => r.type === 'improvement-found'),
      metadata: {
        totalIterations: this.currentIteration,
        improvements: this.history.filter(r => r.type === 'improvement-found').length
      }
    });

    return this.history;
  }

  /**
   * Run a single iteration through all phases.
   */
  async runIteration(): Promise<IterationResult> {
    const startTime = Date.now();
    const costs: PhaseCosts = this.zeroCosts();

    // Phase 1: Discovery (cheap - Haiku)
    const discoveries = await this.discover();
    costs.discovery = discoveries.cost;

    if (discoveries.items.length === 0) {
      return this.makeResult('no-candidates', costs, startTime);
    }

    // Phase 2: Filter (cheap - Haiku relevance scoring)
    const filtered = await this.filter(discoveries.items);
    costs.filter = filtered.cost;

    if (filtered.items.length === 0) {
      return this.makeResult('no-candidates', costs, startTime);
    }

    // Phase 3: Experimentation (medium - Sonnet Batch API)
    for (const candidate of filtered.items) {
      // Check budget before expensive phase
      if (this.totalCostTokens + costs.total > this.config.budgetTokens) {
        return this.makeResult('budget-exceeded', costs, startTime);
      }

      const experiment = await this.experiment(candidate);
      costs.experiment += experiment.cost;

      // Phase 4: Evaluation (tiered - early termination on failure)
      const evaluation = await this.evaluate(experiment.modification);
      costs.evaluate += evaluation.cost;

      if (evaluation.passed) {
        // Phase 5: Integration
        const integration = await this.integrate(experiment.modification);
        costs.integrate = integration.cost;

        costs.total = this.sumCosts(costs);
        return {
          iterationNumber: this.currentIteration,
          type: 'improvement-found',
          cost: costs,
          modification: experiment.modification,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }
    }

    costs.total = this.sumCosts(costs);
    return this.makeResult('no-improvements', costs, startTime);
  }

  /**
   * Phase 1: Discovery - Find potential improvements.
   */
  private async discover(): Promise<{ items: Discovery[]; cost: number }> {
    if (!this.config.phases.discovery.enabled) {
      return { items: [], cost: 0 };
    }

    // In practice, this would:
    // - Analyze recent errors from logs
    // - Check benchmark gaps
    // - Review community issues
    // - Examine TODO comments

    improvementTracker.trackEvent({
      type: 'phase_started',
      iteration: this.currentIteration,
      phase: 'discovery',
      cost: 0,
      success: true,
      metadata: {}
    });

    // Placeholder - would call actual discovery logic
    const discoveries: Discovery[] = [];
    const cost = 10000;  // ~10K tokens for discovery

    return { items: discoveries, cost };
  }

  /**
   * Phase 2: Filter - Score and filter discoveries by relevance.
   */
  private async filter(discoveries: Discovery[]): Promise<{ items: Discovery[]; cost: number }> {
    if (!this.config.phases.filter.enabled) {
      return { items: discoveries, cost: 0 };
    }

    improvementTracker.trackEvent({
      type: 'phase_started',
      iteration: this.currentIteration,
      phase: 'filter',
      cost: 0,
      success: true,
      metadata: { candidateCount: discoveries.length }
    });

    // Score each discovery for relevance
    const scored = discoveries.map(d => ({
      ...d,
      relevanceScore: d.relevanceScore || 0.5  // Would be computed
    }));

    // Filter by minimum relevance
    const filtered = scored.filter(
      d => d.relevanceScore >= this.config.phases.filter.minRelevanceScore
    );

    const cost = discoveries.length * 1000;  // ~1K tokens per scoring

    return { items: filtered, cost };
  }

  /**
   * Phase 3: Experiment - Generate improvement implementation.
   */
  private async experiment(
    candidate: Discovery
  ): Promise<{ modification: CodeModification; cost: number }> {
    improvementTracker.trackEvent({
      type: 'phase_started',
      iteration: this.currentIteration,
      phase: 'experiment',
      cost: 0,
      success: true,
      metadata: { discoveryId: candidate.id }
    });

    // Use ImprovementReasoner to generate plan
    // Then implement the plan

    const modification: CodeModification = {
      id: `mod-${Date.now()}`,
      type: 'improvement',
      files: [],
      diff: ''
    };

    const cost = 100000;  // ~100K tokens for experimentation

    return { modification, cost };
  }

  /**
   * Phase 4: Evaluate - Run tiered evaluation.
   */
  private async evaluate(
    modification: CodeModification
  ): Promise<{ passed: boolean; cost: number }> {
    improvementTracker.trackEvent({
      type: 'phase_started',
      iteration: this.currentIteration,
      phase: 'evaluate',
      cost: 0,
      success: true,
      metadata: { modificationId: modification.id }
    });

    // Use TieredEvaluator
    const result = await this.evaluator.evaluate(modification);

    return {
      passed: result.passed,
      cost: result.totalCost * 1000  // Convert $ to tokens estimate
    };
  }

  /**
   * Phase 5: Integrate - Apply the improvement.
   */
  private async integrate(
    modification: CodeModification
  ): Promise<{ success: boolean; cost: number }> {
    improvementTracker.trackEvent({
      type: 'phase_started',
      iteration: this.currentIteration,
      phase: 'integrate',
      cost: 0,
      success: true,
      metadata: { modificationId: modification.id }
    });

    if (this.config.phases.integrate.requireApproval) {
      // Create PR for human review
      // Block until approved
    } else {
      // Auto-apply (testing/staging only)
    }

    return { success: true, cost: 5000 };
  }

  /**
   * Judge agent: determine if loop should terminate.
   */
  private shouldTerminate(): boolean {
    for (const rule of this.config.terminationRules) {
      switch (rule.type) {
        case 'max-iterations':
          if (this.currentIteration >= rule.value) {
            return true;
          }
          break;

        case 'consecutive-failures':
          const recent = this.history.slice(-rule.value);
          if (recent.length >= rule.value &&
              recent.every(r => r.type !== 'improvement-found')) {
            return true;
          }
          break;

        case 'budget-exceeded':
          if (this.totalCostTokens >= this.config.budgetTokens) {
            return true;
          }
          break;

        case 'rate-threshold':
          if (this.history.length >= 5) {
            const improvements = this.history.filter(r => r.type === 'improvement-found').length;
            const rate = improvements / this.history.length;
            if (rate < rule.value) {
              return true;
            }
          }
          break;
      }
    }

    // Also check max iterations from config
    if (this.currentIteration >= this.config.maxIterations) {
      return true;
    }

    return false;
  }

  /**
   * Create zero-initialized costs.
   */
  private zeroCosts(): PhaseCosts {
    return {
      discovery: 0,
      filter: 0,
      experiment: 0,
      evaluate: 0,
      integrate: 0,
      total: 0
    };
  }

  /**
   * Sum all phase costs.
   */
  private sumCosts(costs: PhaseCosts): number {
    return costs.discovery + costs.filter + costs.experiment +
           costs.evaluate + costs.integrate;
  }

  /**
   * Create iteration result helper.
   */
  private makeResult(
    type: IterationResult['type'],
    costs: PhaseCosts,
    startTime: number
  ): IterationResult {
    costs.total = this.sumCosts(costs);
    return {
      iterationNumber: this.currentIteration,
      type,
      cost: costs,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get loop statistics.
   */
  getStats(): {
    iterations: number;
    improvements: number;
    totalCost: number;
    improvementRate: number;
  } {
    const improvements = this.history.filter(r => r.type === 'improvement-found').length;
    return {
      iterations: this.history.length,
      improvements,
      totalCost: this.totalCostTokens,
      improvementRate: this.history.length > 0 ? improvements / this.history.length : 0
    };
  }
}

// Factory function for CLI usage
export function createImprovementLoop(config?: Partial<LoopConfig>): AutonomousImprovementLoop {
  return new AutonomousImprovementLoop(config);
}
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `src/improvement/loop.ts` | Main loop orchestration |
| `src/improvement/loop.test.ts` | Unit tests |
| `src/improvement/index.ts` | Module exports |

## Acceptance Criteria

- [ ] All 5 phases execute in order
- [ ] Cost tracking per phase
- [ ] Budget enforcement stops loop
- [ ] Consecutive failure termination works
- [ ] Rate threshold termination works
- [ ] Improvement found triggers integration
- [ ] History maintained for analysis
- [ ] Observable via improvement tracker

## Gates

### Entry Gate
- All component specs complete:
  - SPEC-SIL-001 (Observatory)
  - SPEC-SIL-004 (Tiered Evaluator)
  - SPEC-SIL-006 (Reasoner)
  - SPEC-SIL-007 (Proctor)
  - SPEC-SIL-009 (Contamination)

### Exit Gate
- Full integration test passes
- Cost tracking accurate
- Termination logic verified

## Dependencies

- SPEC-SIL-001 (Observatory Improvement Tracker)
- SPEC-SIL-003 (Anchor Point Sampler)
- SPEC-SIL-004 (Tiered Evaluator)
- SPEC-SIL-006 (Improvement Reasoner)
- SPEC-SIL-007 (Proctored Executor)
- SPEC-SIL-009 (Contamination Detection)

## Blocked By

- All above specs

## Blocks

- SPEC-SIL-011 (GitHub Actions - triggers loop)
- SPEC-SIL-012 (CLAUDE.md Updater - receives results)

---

**Created**: 2026-01-19
**Source**: PLAN Week 4, Section 4.1
