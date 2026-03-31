# SPEC-SIL-001: Observatory Improvement Tracker

> **Status**: Draft
> **Priority**: HIGH
> **Week**: 1 (Foundation)
> **Phase**: Discovery/Tracking
> **Estimated Effort**: 4-6 hours

## Summary

Extend the existing Observatory infrastructure to track improvement loop events, providing observability into the autonomous improvement process.

## Problem Statement

The self-improvement loop needs visibility into:
- What discoveries are being made
- Which candidates pass filtering
- What experiments are running
- Evaluation results and costs
- Integration success/failure

Without tracking, we can't:
- Debug issues in the loop
- Measure cost per iteration
- Identify bottlenecks
- Audit what changes were made and why

## Scope

### In Scope
- Create `src/observatory/improvement-tracker.ts`
- Define `ImprovementEvent` interface
- Emit events to existing Observatory server
- Track cost per phase
- Track iteration progress

### Out of Scope
- UI dashboard (future)
- Alerting (future)
- Historical analysis tools (future)

## Requirements

### R1: Event Types
```typescript
type ImprovementEventType =
  | 'discovery'      // New paper/repo/issue found
  | 'filter'         // Candidate passed/failed filtering
  | 'experiment'     // Modification attempted
  | 'evaluate'       // Benchmark run
  | 'integrate'      // PR created/merged
  | 'cycle_start'    // Iteration began
  | 'cycle_end';     // Iteration completed
```

### R2: Event Structure
```typescript
interface ImprovementEvent {
  type: ImprovementEventType;
  timestamp: string;
  iteration: number;
  phase: string;
  cost: number;           // USD cost for this event
  success: boolean;
  metadata: {
    source?: string;      // arxiv, github, issue
    candidate_id?: string;
    benchmark_score?: number;
    modification_type?: string;
    [key: string]: unknown;
  };
}
```

### R3: Integration with Observatory
- Use existing `observatoryEmit()` pattern
- Events go to `improvement` channel
- Fire-and-forget (non-blocking)

### R4: Cost Tracking
- Track token usage per phase
- Convert to USD using model pricing
- Accumulate per iteration

## Technical Approach

### Implementation

```typescript
// src/observatory/improvement-tracker.ts

import { observatoryEmit } from './server';

interface ImprovementEvent {
  type: ImprovementEventType;
  timestamp: string;
  iteration: number;
  phase: string;
  cost: number;
  success: boolean;
  metadata: Record<string, unknown>;
}

class ImprovementTracker {
  private currentIteration: number = 0;
  private iterationCost: Record<string, number> = {};

  startIteration(): void {
    this.currentIteration++;
    this.iterationCost = {};
    this.emit({
      type: 'cycle_start',
      phase: 'init',
      cost: 0,
      success: true,
      metadata: { iteration: this.currentIteration }
    });
  }

  trackDiscovery(source: string, count: number, cost: number): void {
    this.addCost('discovery', cost);
    this.emit({
      type: 'discovery',
      phase: 'discovery',
      cost,
      success: true,
      metadata: { source, count }
    });
  }

  trackFilter(candidateId: string, passed: boolean, cost: number): void {
    this.addCost('filter', cost);
    this.emit({
      type: 'filter',
      phase: 'filter',
      cost,
      success: passed,
      metadata: { candidate_id: candidateId, passed }
    });
  }

  trackExperiment(modificationId: string, type: string, cost: number): void {
    this.addCost('experiment', cost);
    this.emit({
      type: 'experiment',
      phase: 'experiment',
      cost,
      success: true,
      metadata: { modification_id: modificationId, modification_type: type }
    });
  }

  trackEvaluation(tier: string, score: number, passed: boolean, cost: number): void {
    this.addCost('evaluate', cost);
    this.emit({
      type: 'evaluate',
      phase: 'evaluate',
      cost,
      success: passed,
      metadata: { tier, score, passed }
    });
  }

  trackIntegration(prNumber: number, merged: boolean): void {
    this.emit({
      type: 'integrate',
      phase: 'integrate',
      cost: 0,
      success: merged,
      metadata: { pr_number: prNumber, merged }
    });
  }

  endIteration(outcome: 'improvement' | 'no_improvement' | 'no_candidates'): void {
    const totalCost = Object.values(this.iterationCost).reduce((a, b) => a + b, 0);
    this.emit({
      type: 'cycle_end',
      phase: 'complete',
      cost: totalCost,
      success: outcome === 'improvement',
      metadata: {
        outcome,
        cost_breakdown: this.iterationCost,
        total_cost: totalCost
      }
    });
  }

  private addCost(phase: string, cost: number): void {
    this.iterationCost[phase] = (this.iterationCost[phase] || 0) + cost;
  }

  private emit(event: Omit<ImprovementEvent, 'timestamp' | 'iteration'>): void {
    observatoryEmit('improvement', {
      ...event,
      timestamp: new Date().toISOString(),
      iteration: this.currentIteration
    });
  }
}

export const improvementTracker = new ImprovementTracker();
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `src/observatory/improvement-tracker.ts` | Event tracking |
| `src/observatory/improvement-tracker.test.ts` | Unit tests |

### Modified Files
| File | Changes |
|------|---------|
| `src/observatory/index.ts` | Export tracker |

## Acceptance Criteria

- [ ] `ImprovementTracker` class implemented
- [ ] All event types emit to Observatory
- [ ] Cost tracking accumulates correctly
- [ ] Events include iteration number
- [ ] Unit tests pass
- [ ] Integration test with Observatory server

## Gates

### Entry Gate
- Observatory server infrastructure exists

### Exit Gate
- Events visible in Observatory logs
- Cost tracking verified accurate

## Dependencies

- Existing Observatory infrastructure (`src/observatory/server.ts`)

## Blocked By

- None (builds on existing infrastructure)

## Blocks

- SPEC-SIL-002 (Benchmark Suite Config)
- SPEC-SIL-005 (Main Loop)

---

**Created**: 2026-01-19
**Source**: PLAN Week 1, Section 1.1
