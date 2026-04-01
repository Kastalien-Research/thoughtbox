# SPEC-SIL-006: Improvement Reasoner

> **Status**: Draft
> **Priority**: HIGH
> **Week**: 3 (Thoughtbox Integration)
> **Phase**: Reasoning
> **Estimated Effort**: 6-8 hours

## Summary

Implement the ImprovementReasoner that uses Thoughtbox branching to explore multiple improvement approaches, synthesize findings, and produce actionable improvement plans.

## Problem Statement

Improvement decisions need structured reasoning:
- Multiple approaches should be explored before committing
- Branching allows parallel exploration without losing context
- Synthesis step ensures best approach is selected
- Reasoning chain provides audit trail for why improvements were chosen

## Scope

### In Scope
- Thoughtbox session creation for improvement reasoning
- Branching to explore alternative approaches
- Synthesis across branches
- Improvement plan extraction
- Integration with existing ThoughtHandler

### Out of Scope
- The improvement execution itself (SPEC-SIL-010)
- Benchmark evaluation (SPEC-SIL-004)
- Critique prompts (SPEC-SIL-007)

## Requirements

### R1: Session Management
```typescript
interface ImprovementSession {
  sessionId: string;
  discoveryId: string;
  title: string;
  tags: string[];
  branches: string[];
  synthesisThoughtNumber: number;
}
```

### R2: Branching-Based Exploration
```typescript
interface ApproachBranch {
  branchId: string;
  approach: string;
  thoughts: number[];
  assessment: {
    feasibility: number;
    risk: number;
    estimatedCost: number;
  };
}
```

### R3: Synthesis Output
```typescript
interface ImprovementPlan {
  selectedApproach: string;
  reasoning: string;
  steps: ImprovementStep[];
  estimatedCost: number;
  rollbackPlan: string;
}
```

## Technical Approach

### Implementation

```typescript
// src/improvement/reasoner.ts

import { ThoughtHandler } from '../thought-handler';
import { improvementTracker } from '../observatory/improvement-tracker';

interface Discovery {
  id: string;
  title: string;
  summary: string;
  source: string;
  relevanceScore: number;
}

interface Capabilities {
  currentBenchmarkScore: number;
  knownGaps: string[];
  recentChanges: string[];
}

interface ImprovementStep {
  order: number;
  action: string;
  files: string[];
  validation: string;
}

interface ImprovementPlan {
  discoveryId: string;
  selectedApproach: string;
  reasoning: string;
  steps: ImprovementStep[];
  estimatedCost: number;
  estimatedRisk: 'low' | 'medium' | 'high';
  rollbackPlan: string;
  thoughtboxSessionId: string;
}

export class ImprovementReasoner {
  private thoughtHandler: ThoughtHandler;
  private defaultApproaches = ['direct-integration', 'wrapper-pattern', 'hybrid'];

  constructor(thoughtHandler: ThoughtHandler) {
    this.thoughtHandler = thoughtHandler;
  }

  /**
   * Reason about a discovered improvement opportunity.
   * Uses Thoughtbox branching to explore multiple approaches.
   */
  async reasonAboutImprovement(
    discovery: Discovery,
    currentCapabilities: Capabilities
  ): Promise<ImprovementPlan> {
    const startTime = Date.now();

    // Start new reasoning session for this improvement
    const session = await this.thoughtHandler.startSession({
      title: `Improvement: ${discovery.title}`,
      tags: ['improvement-loop', discovery.source, `discovery:${discovery.id}`]
    });

    // Track reasoning start
    improvementTracker.trackEvent({
      type: 'reasoning_started',
      iteration: 0,  // Filled by caller
      phase: 'reasoning',
      cost: 0,
      success: true,
      metadata: { discoveryId: discovery.id, sessionId: session.id }
    });

    // Main reasoning chain - analyze the discovery
    await this.thoughtHandler.addThought({
      thought: this.formatAnalysisPrompt(discovery, currentCapabilities),
      thoughtNumber: 1
    });

    // Branch to explore each approach
    const branchResults: Map<string, number> = new Map();

    for (const approach of this.defaultApproaches) {
      const branchThought = await this.thoughtHandler.addThought({
        thought: this.formatApproachPrompt(approach, discovery),
        branchFromThought: 1,
        branchId: approach
      });

      // Continue exploration on this branch
      const assessmentThought = await this.thoughtHandler.addThought({
        thought: this.formatAssessmentPrompt(approach, discovery, currentCapabilities),
        branchFromThought: branchThought.thoughtNumber,
        branchId: approach
      });

      branchResults.set(approach, assessmentThought.thoughtNumber);
    }

    // Synthesis - back on main chain, compare all approaches
    const synthesis = await this.thoughtHandler.addThought({
      thought: this.formatSynthesisPrompt(discovery, this.defaultApproaches),
      thoughtNumber: 4  // After the branching
    });

    // Extract plan from synthesis
    const plan = await this.extractPlan(synthesis, discovery, session.id);

    // Track reasoning completion
    improvementTracker.trackEvent({
      type: 'reasoning_completed',
      iteration: 0,
      phase: 'reasoning',
      cost: Date.now() - startTime,  // Track time as proxy for cost
      success: true,
      metadata: {
        discoveryId: discovery.id,
        selectedApproach: plan.selectedApproach,
        branchesExplored: this.defaultApproaches.length
      }
    });

    return plan;
  }

  /**
   * Quick reasoning for simple improvements (no branching).
   */
  async reasonQuick(
    discovery: Discovery,
    approach: string
  ): Promise<ImprovementPlan> {
    const session = await this.thoughtHandler.startSession({
      title: `Quick: ${discovery.title}`,
      tags: ['improvement-loop', 'quick', discovery.source]
    });

    const analysis = await this.thoughtHandler.addThought({
      thought: `Quick analysis for ${approach}: ${discovery.summary}`,
      thoughtNumber: 1
    });

    const steps = await this.thoughtHandler.addThought({
      thought: `Implementation steps for ${approach}...`,
      thoughtNumber: 2
    });

    return this.extractPlan(steps, discovery, session.id);
  }

  // Prompt formatting

  private formatAnalysisPrompt(discovery: Discovery, capabilities: Capabilities): string {
    return `
Analyzing improvement opportunity: ${discovery.title}

Discovery Summary:
${discovery.summary}

Current Capabilities:
- Benchmark Score: ${capabilities.currentBenchmarkScore}
- Known Gaps: ${capabilities.knownGaps.join(', ')}
- Recent Changes: ${capabilities.recentChanges.join(', ')}

I need to:
1. Understand what this improvement would address
2. Assess if it targets a known gap
3. Identify potential implementation approaches
4. Consider risks and dependencies
    `.trim();
  }

  private formatApproachPrompt(approach: string, discovery: Discovery): string {
    const approachDescriptions: Record<string, string> = {
      'direct-integration': `
Approach: Direct Integration
- Modify existing code directly
- Minimal abstraction layer
- Fastest implementation
- Higher risk of breaking changes`,
      'wrapper-pattern': `
Approach: Wrapper Pattern
- Create wrapper around existing functionality
- Add improvement as layer on top
- Lower risk, easier rollback
- May add complexity`,
      'hybrid': `
Approach: Hybrid
- Combine direct changes with strategic wrappers
- Balance speed and safety
- Moderate complexity`
    };

    return `
Exploring ${approach} for: ${discovery.title}

${approachDescriptions[approach] || `Approach: ${approach}`}

Considering:
1. What changes would be needed?
2. Which files would be affected?
3. What's the estimated effort?
4. What could go wrong?
    `.trim();
  }

  private formatAssessmentPrompt(
    approach: string,
    discovery: Discovery,
    capabilities: Capabilities
  ): string {
    return `
Assessing ${approach} approach:

Feasibility (1-10): Consider our current codebase state
Risk (1-10): Consider regression potential
Cost (tokens): Estimate implementation + testing cost

Given:
- Current score: ${capabilities.currentBenchmarkScore}
- Target improvement: ${discovery.title}

My assessment:
    `.trim();
  }

  private formatSynthesisPrompt(discovery: Discovery, approaches: string[]): string {
    return `
Synthesis: Selecting best approach for ${discovery.title}

Approaches explored: ${approaches.join(', ')}

Comparing across:
- Feasibility
- Risk
- Cost
- Time to implement
- Reversibility

Selected approach and reasoning:
    `.trim();
  }

  private async extractPlan(
    synthesisThought: any,
    discovery: Discovery,
    sessionId: string
  ): Promise<ImprovementPlan> {
    // In practice, this would parse the synthesis thought content
    // For now, provide structured output
    return {
      discoveryId: discovery.id,
      selectedApproach: 'direct-integration',  // Would be extracted from synthesis
      reasoning: synthesisThought.thought,
      steps: [
        {
          order: 1,
          action: 'Implement core change',
          files: ['src/target.ts'],
          validation: 'npm run test:unit'
        },
        {
          order: 2,
          action: 'Update tests',
          files: ['tests/target.test.ts'],
          validation: 'npm test'
        },
        {
          order: 3,
          action: 'Run benchmarks',
          files: [],
          validation: 'npm run benchmark'
        }
      ],
      estimatedCost: 50000,  // tokens
      estimatedRisk: 'medium',
      rollbackPlan: 'git revert HEAD',
      thoughtboxSessionId: sessionId
    };
  }
}

// Export factory function
export function createImprovementReasoner(thoughtHandler: ThoughtHandler): ImprovementReasoner {
  return new ImprovementReasoner(thoughtHandler);
}
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `src/improvement/reasoner.ts` | Improvement reasoning with branching |
| `src/improvement/reasoner.test.ts` | Unit tests |

### Modified Files
| File | Changes |
|------|---------|
| `src/thought-handler.ts` | Ensure branching works for improvement sessions |

## Acceptance Criteria

- [ ] Creates Thoughtbox session for each improvement
- [ ] Explores multiple approaches via branching
- [ ] Synthesizes across branches to select best approach
- [ ] Produces structured ImprovementPlan
- [ ] Tracks reasoning in Observatory
- [ ] Quick reasoning path for simple cases

## Test Cases

```typescript
describe('ImprovementReasoner', () => {
  it('creates session with correct tags', async () => {
    const reasoner = new ImprovementReasoner(mockThoughtHandler);
    await reasoner.reasonAboutImprovement(mockDiscovery, mockCapabilities);
    expect(mockThoughtHandler.startSession).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: expect.arrayContaining(['improvement-loop'])
      })
    );
  });

  it('explores default approaches via branching', async () => {
    const reasoner = new ImprovementReasoner(mockThoughtHandler);
    await reasoner.reasonAboutImprovement(mockDiscovery, mockCapabilities);

    // Should have 3 branches
    expect(mockThoughtHandler.addThought).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'direct-integration' })
    );
    expect(mockThoughtHandler.addThought).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'wrapper-pattern' })
    );
  });

  it('produces structured improvement plan', async () => {
    const reasoner = new ImprovementReasoner(mockThoughtHandler);
    const plan = await reasoner.reasonAboutImprovement(mockDiscovery, mockCapabilities);

    expect(plan).toHaveProperty('selectedApproach');
    expect(plan).toHaveProperty('steps');
    expect(plan).toHaveProperty('rollbackPlan');
  });
});
```

## Gates

### Entry Gate
- SPEC-SIL-001 (Observatory) complete
- ThoughtHandler branching working correctly

### Exit Gate
- All acceptance criteria met
- Integration with ThoughtHandler verified

## Dependencies

- ThoughtHandler (existing)
- SPEC-SIL-001 (Observatory Improvement Tracker)

## Blocked By

- SPEC-SIL-001

## Blocks

- SPEC-SIL-010 (Main Loop)

---

**Created**: 2026-01-19
**Source**: PLAN Week 3, Section 3.1
