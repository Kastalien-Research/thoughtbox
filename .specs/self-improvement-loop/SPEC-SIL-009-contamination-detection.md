# SPEC-SIL-009: Contamination Detection

> **Status**: Draft
> **Priority**: HIGH
> **Week**: 4 (Autonomous Loop)
> **Phase**: Gaming Prevention
> **Estimated Effort**: 4-6 hours

## Summary

Implement contamination detection to identify when agent outputs are suspiciously similar to known solutions, solve times are too fast, or reasoning chains skip exploration.

## Problem Statement

Without contamination detection:
- Agent may have memorized solutions from training data
- Fast solve times indicate pre-computed answers
- Reasoning chains that jump to solutions indicate gaming
- Improvements might be data leakage, not genuine capability

Contamination detection provides:
- Solution similarity checking
- Timing anomaly detection
- Reasoning chain analysis
- Training set fingerprinting

## Scope

### In Scope
- Solution similarity computation
- Fast-solve threshold detection
- Reasoning chain jump detection
- Training set hash tracking
- Result flagging

### Out of Scope
- Model-level contamination detection
- Dataset deduplication
- Real-time monitoring dashboard

## Requirements

### R1: Similarity Checking
```typescript
interface SimilarityResult {
  similarity: number;
  threshold: number;
  contaminated: boolean;
  matchedRegions?: string[];
}
```

### R2: Timing Analysis
```typescript
interface TimingResult {
  actualTime: number;
  expectedTime: number;
  ratio: number;
  contaminated: boolean;
}
```

### R3: Reasoning Analysis
```typescript
interface ReasoningResult {
  thoughtCount: number;
  explorationDepth: number;
  jumpsToSolution: boolean;
  suspiciousPatterns: string[];
}
```

### R4: Contamination Result
```typescript
interface ContaminationResult {
  contaminated: boolean;
  reason?: string;
  confidence: number;
  checks: {
    similarity?: SimilarityResult;
    timing?: TimingResult;
    reasoning?: ReasoningResult;
  };
}
```

## Technical Approach

### Implementation

```typescript
// benchmarks/contamination.ts

import { createHash } from 'crypto';

interface TestCase {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solveTime?: number;
  thoughtChain?: string[];
}

interface KnownSolution {
  testCaseId: string;
  solution: string;
  hash: string;
  addedToTraining: string;  // ISO date
}

interface SimilarityResult {
  similarity: number;
  threshold: number;
  contaminated: boolean;
  matchedRegions: string[];
}

interface TimingResult {
  actualTime: number;
  expectedTime: number;
  ratio: number;
  contaminated: boolean;
}

interface ReasoningResult {
  thoughtCount: number;
  explorationDepth: number;
  jumpsToSolution: boolean;
  suspiciousPatterns: string[];
}

interface ContaminationResult {
  contaminated: boolean;
  reason?: string;
  confidence: number;
  checks: {
    similarity?: SimilarityResult;
    timing?: TimingResult;
    reasoning?: ReasoningResult;
  };
}

interface ContaminationConfig {
  similarityThreshold: number;
  fastSolveThreshold: number;
  minExplorationDepth: number;
}

const DEFAULT_CONFIG: ContaminationConfig = {
  similarityThreshold: 0.95,
  fastSolveThreshold: 0.1,  // 10% of expected time
  minExplorationDepth: 3
};

// Expected solve times by difficulty (milliseconds)
const EXPECTED_SOLVE_TIMES: Record<string, number> = {
  easy: 60000,    // 1 minute
  medium: 300000, // 5 minutes
  hard: 900000    // 15 minutes
};

export class ContaminationDetector {
  private config: ContaminationConfig;
  private trainingSetHashes: Map<string, KnownSolution> = new Map();
  private solutionIndex: Map<string, string> = new Map();  // testCaseId -> solution

  constructor(config: Partial<ContaminationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Load known solutions for comparison.
   */
  async loadTrainingSet(solutions: KnownSolution[]): Promise<void> {
    for (const solution of solutions) {
      const hash = this.hashContent(solution.solution);
      this.trainingSetHashes.set(hash, solution);
      this.solutionIndex.set(solution.testCaseId, solution.solution);
    }
  }

  /**
   * Check agent output for contamination.
   */
  async checkContamination(
    agentOutput: string,
    testCase: TestCase
  ): Promise<ContaminationResult> {
    const checks: ContaminationResult['checks'] = {};
    const reasons: string[] = [];
    let contaminated = false;

    // Check 1: Output similarity to known solutions
    const knownSolution = this.solutionIndex.get(testCase.id);
    if (knownSolution) {
      const similarityResult = this.checkSimilarity(agentOutput, knownSolution);
      checks.similarity = similarityResult;

      if (similarityResult.contaminated) {
        contaminated = true;
        reasons.push(`Output ${(similarityResult.similarity * 100).toFixed(1)}% similar to known solution`);
      }
    }

    // Check 2: Suspiciously fast solve time
    if (testCase.solveTime !== undefined) {
      const timingResult = this.checkTiming(testCase);
      checks.timing = timingResult;

      if (timingResult.contaminated) {
        contaminated = true;
        reasons.push(`Solve time (${timingResult.actualTime}ms) is ${(timingResult.ratio * 100).toFixed(1)}% of expected`);
      }
    }

    // Check 3: Reasoning chain analysis
    if (testCase.thoughtChain && testCase.thoughtChain.length > 0) {
      const reasoningResult = this.analyzeReasoning(testCase.thoughtChain, knownSolution);
      checks.reasoning = reasoningResult;

      if (reasoningResult.jumpsToSolution) {
        contaminated = true;
        reasons.push('Reasoning chain jumps directly to solution without exploration');
      }
    }

    // Calculate confidence
    const confidence = this.calculateConfidence(checks);

    return {
      contaminated,
      reason: reasons.length > 0 ? reasons.join('; ') : undefined,
      confidence,
      checks
    };
  }

  /**
   * Check similarity between agent output and known solution.
   */
  private checkSimilarity(output: string, known: string): SimilarityResult {
    const similarity = this.computeSimilarity(output, known);
    const matchedRegions = this.findMatchedRegions(output, known);

    return {
      similarity,
      threshold: this.config.similarityThreshold,
      contaminated: similarity > this.config.similarityThreshold,
      matchedRegions
    };
  }

  /**
   * Compute similarity using Jaccard similarity on n-grams.
   */
  private computeSimilarity(a: string, b: string): number {
    const ngramSize = 3;
    const getNgrams = (text: string): Set<string> => {
      const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
      const ngrams = new Set<string>();

      for (let i = 0; i <= normalized.length - ngramSize; i++) {
        ngrams.add(normalized.substring(i, i + ngramSize));
      }

      return ngrams;
    };

    const ngramsA = getNgrams(a);
    const ngramsB = getNgrams(b);

    if (ngramsA.size === 0 || ngramsB.size === 0) {
      return 0;
    }

    // Jaccard similarity
    const intersection = new Set([...ngramsA].filter(x => ngramsB.has(x)));
    const union = new Set([...ngramsA, ...ngramsB]);

    return intersection.size / union.size;
  }

  /**
   * Find matching regions between output and known solution.
   */
  private findMatchedRegions(output: string, known: string): string[] {
    const matches: string[] = [];
    const minMatchLength = 50;  // Characters

    // Simple longest common substring approach
    const words = known.split(/\s+/);
    let currentMatch = '';

    for (let i = 0; i < words.length; i++) {
      const phrase = words.slice(i, i + 10).join(' ');

      if (output.includes(phrase) && phrase.length > minMatchLength) {
        matches.push(phrase.substring(0, 100) + '...');
      }
    }

    return matches.slice(0, 5);  // Return top 5 matches
  }

  /**
   * Check if solve time is suspiciously fast.
   */
  private checkTiming(testCase: TestCase): TimingResult {
    const actualTime = testCase.solveTime || 0;
    const expectedTime = EXPECTED_SOLVE_TIMES[testCase.difficulty] || EXPECTED_SOLVE_TIMES.medium;
    const ratio = actualTime / expectedTime;

    return {
      actualTime,
      expectedTime,
      ratio,
      contaminated: ratio < this.config.fastSolveThreshold
    };
  }

  /**
   * Analyze reasoning chain for signs of gaming.
   */
  private analyzeReasoning(
    thoughtChain: string[],
    knownSolution?: string
  ): ReasoningResult {
    const thoughtCount = thoughtChain.length;
    const suspiciousPatterns: string[] = [];

    // Calculate exploration depth (branching, backtracking)
    const explorationDepth = this.measureExplorationDepth(thoughtChain);

    // Check if reasoning jumps to solution
    const jumpsToSolution = this.detectSolutionJump(thoughtChain, knownSolution);

    // Look for suspicious patterns
    if (thoughtCount < 3) {
      suspiciousPatterns.push('Very short reasoning chain');
    }

    if (explorationDepth < this.config.minExplorationDepth) {
      suspiciousPatterns.push('Minimal exploration before answer');
    }

    // Check for "instant knowing" patterns
    if (thoughtChain.some(t =>
      /I (already )?know|The answer is|Obviously|Simply/i.test(t) &&
      thoughtChain.indexOf(t) < 2
    )) {
      suspiciousPatterns.push('Claims immediate knowledge early in chain');
    }

    return {
      thoughtCount,
      explorationDepth,
      jumpsToSolution,
      suspiciousPatterns
    };
  }

  /**
   * Measure how much exploration occurred in the reasoning chain.
   */
  private measureExplorationDepth(thoughts: string[]): number {
    let depth = 0;

    // Count exploration indicators
    const explorationPatterns = [
      /let me (think|consider|explore)/i,
      /another approach/i,
      /alternatively/i,
      /what if/i,
      /on the other hand/i,
      /but wait/i,
      /actually/i,
      /hmm/i,
      /considering/i
    ];

    for (const thought of thoughts) {
      for (const pattern of explorationPatterns) {
        if (pattern.test(thought)) {
          depth++;
          break;  // Count once per thought
        }
      }
    }

    return depth;
  }

  /**
   * Detect if reasoning chain jumps directly to the solution.
   */
  private detectSolutionJump(
    thoughts: string[],
    knownSolution?: string
  ): boolean {
    if (!knownSolution || thoughts.length === 0) {
      return false;
    }

    // Check if solution appears very early with high similarity
    const firstThird = thoughts.slice(0, Math.ceil(thoughts.length / 3));

    for (const thought of firstThird) {
      const similarity = this.computeSimilarity(thought, knownSolution);
      if (similarity > 0.7) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate confidence in contamination detection.
   */
  private calculateConfidence(checks: ContaminationResult['checks']): number {
    let confidenceSum = 0;
    let checkCount = 0;

    if (checks.similarity) {
      // Higher similarity = higher confidence in contamination
      if (checks.similarity.contaminated) {
        confidenceSum += checks.similarity.similarity;
      } else {
        confidenceSum += 1 - checks.similarity.similarity;
      }
      checkCount++;
    }

    if (checks.timing) {
      // Lower ratio (faster) = higher confidence in contamination
      if (checks.timing.contaminated) {
        confidenceSum += 1 - checks.timing.ratio;
      } else {
        confidenceSum += checks.timing.ratio;
      }
      checkCount++;
    }

    if (checks.reasoning) {
      // Jumps to solution = high confidence
      if (checks.reasoning.jumpsToSolution) {
        confidenceSum += 0.9;
      } else if (checks.reasoning.suspiciousPatterns.length > 0) {
        confidenceSum += 0.3 * checks.reasoning.suspiciousPatterns.length;
      } else {
        confidenceSum += 0.8;  // Clean reasoning chain
      }
      checkCount++;
    }

    return checkCount > 0 ? confidenceSum / checkCount : 0;
  }

  /**
   * Hash content for fingerprinting.
   */
  private hashContent(content: string): string {
    const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim();
    return createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Add a solution to the training set (for tracking).
   */
  addToTrainingSet(testCaseId: string, solution: string): void {
    const hash = this.hashContent(solution);
    this.trainingSetHashes.set(hash, {
      testCaseId,
      solution,
      hash,
      addedToTraining: new Date().toISOString()
    });
    this.solutionIndex.set(testCaseId, solution);
  }

  /**
   * Check if content matches any training set item.
   */
  isInTrainingSet(content: string): boolean {
    const hash = this.hashContent(content);
    return this.trainingSetHashes.has(hash);
  }
}

// Singleton
let detectorInstance: ContaminationDetector | null = null;

export function getContaminationDetector(
  config?: Partial<ContaminationConfig>
): ContaminationDetector {
  if (!detectorInstance) {
    detectorInstance = new ContaminationDetector(config);
  }
  return detectorInstance;
}
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `benchmarks/contamination.ts` | Contamination detection |
| `benchmarks/contamination.test.ts` | Unit tests |

## Acceptance Criteria

- [ ] Solution similarity detection working
- [ ] Fast-solve threshold detection working
- [ ] Reasoning chain analysis detecting jumps
- [ ] Training set fingerprinting working
- [ ] Confidence scores calculated correctly
- [ ] All checks combinable for final verdict

## Test Cases

```typescript
describe('ContaminationDetector', () => {
  const detector = new ContaminationDetector();

  it('detects high similarity to known solution', async () => {
    const knownSolution = 'function add(a, b) { return a + b; }';
    detector.addToTrainingSet('test-1', knownSolution);

    const result = await detector.checkContamination(
      'function add(a, b) { return a + b; }',
      { id: 'test-1', name: 'Add', difficulty: 'easy' }
    );

    expect(result.contaminated).toBe(true);
    expect(result.checks.similarity?.contaminated).toBe(true);
  });

  it('detects suspiciously fast solve time', async () => {
    const result = await detector.checkContamination(
      'solution here',
      {
        id: 'test-2',
        name: 'Test',
        difficulty: 'hard',
        solveTime: 5000  // 5 seconds for a "hard" problem
      }
    );

    expect(result.checks.timing?.contaminated).toBe(true);
  });

  it('detects reasoning chain that jumps to solution', async () => {
    const knownSolution = 'The answer is to use map and filter';
    detector.addToTrainingSet('test-3', knownSolution);

    const result = await detector.checkContamination(
      knownSolution,
      {
        id: 'test-3',
        name: 'Test',
        difficulty: 'medium',
        thoughtChain: [
          'Let me look at this problem',
          'The answer is to use map and filter',  // Jumps immediately
          'Done'
        ]
      }
    );

    expect(result.checks.reasoning?.jumpsToSolution).toBe(true);
  });

  it('passes clean outputs', async () => {
    const result = await detector.checkContamination(
      'A completely novel solution approach',
      {
        id: 'novel-test',
        name: 'Novel',
        difficulty: 'medium',
        solveTime: 200000,
        thoughtChain: [
          'Let me understand the problem',
          'One approach could be...',
          'But alternatively...',
          'Actually, what if...',
          'After considering options, I think...',
          'Here is my solution'
        ]
      }
    );

    expect(result.contaminated).toBe(false);
  });
});
```

## Gates

### Entry Gate
- SPEC-SIL-003 (Sampler for fingerprinting integration)
- SPEC-SIL-008 (Held-Out Manager provides training set)

### Exit Gate
- All detection methods working
- False positive rate < 5% on clean samples

## Dependencies

- SPEC-SIL-003 (Sampler)
- SPEC-SIL-008 (Held-Out Manager)

## Blocked By

- SPEC-SIL-003

## Blocks

- SPEC-SIL-010 (Main Loop)

---

**Created**: 2026-01-19
**Source**: PLAN Week 4, Section 4.3
