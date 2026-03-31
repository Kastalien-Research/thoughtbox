/**
 * Contamination Detection
 * SPEC: SIL-009
 *
 * Detects when agent outputs are suspiciously similar to known solutions,
 * solve times are too fast, or reasoning chains skip exploration.
 *
 * Detection methods:
 * 1. Solution similarity checking (n-gram Jaccard similarity)
 * 2. Timing anomaly detection (too-fast solves)
 * 3. Reasoning chain analysis (jumps to solution, minimal exploration)
 * 4. Training set fingerprinting (hash-based tracking)
 */

import { createHash } from "crypto";

// =============================================================================
// Types
// =============================================================================

/**
 * A test case being evaluated
 */
export interface TestCase {
  id: string;
  name: string;
  difficulty: "easy" | "medium" | "hard";
  solveTime?: number;
  thoughtChain?: string[];
}

/**
 * A known solution in the training set
 */
export interface KnownSolution {
  testCaseId: string;
  solution: string;
  hash: string;
  addedToTraining: string; // ISO date
}

/**
 * Result of similarity checking
 */
export interface SimilarityResult {
  similarity: number;
  threshold: number;
  contaminated: boolean;
  matchedRegions: string[];
}

/**
 * Result of timing analysis
 */
export interface TimingResult {
  actualTime: number;
  expectedTime: number;
  ratio: number;
  contaminated: boolean;
}

/**
 * Result of reasoning chain analysis
 */
export interface ReasoningResult {
  thoughtCount: number;
  explorationDepth: number;
  jumpsToSolution: boolean;
  suspiciousPatterns: string[];
}

/**
 * Overall contamination check result
 */
export interface ContaminationResult {
  contaminated: boolean;
  reason?: string;
  confidence: number;
  checks: {
    similarity?: SimilarityResult;
    timing?: TimingResult;
    reasoning?: ReasoningResult;
  };
}

/**
 * Configuration for contamination detection
 */
export interface ContaminationConfig {
  /** Similarity threshold above which output is considered contaminated */
  similarityThreshold: number;
  /** Ratio of actual/expected time below which is suspicious */
  fastSolveThreshold: number;
  /** Minimum exploration depth expected in reasoning */
  minExplorationDepth: number;
}

// =============================================================================
// Default Configuration
// =============================================================================

export const DEFAULT_CONTAMINATION_CONFIG: ContaminationConfig = {
  similarityThreshold: 0.95,
  fastSolveThreshold: 0.1, // 10% of expected time
  minExplorationDepth: 3,
};

/**
 * Expected solve times by difficulty (milliseconds)
 */
export const EXPECTED_SOLVE_TIMES: Record<string, number> = {
  easy: 60000, // 1 minute
  medium: 300000, // 5 minutes
  hard: 900000, // 15 minutes
};

// =============================================================================
// ContaminationDetector
// =============================================================================

/**
 * Detects contamination in agent outputs.
 *
 * Contamination indicates that the agent may have memorized solutions
 * from training data rather than genuinely solving problems.
 */
export class ContaminationDetector {
  private config: ContaminationConfig;
  private trainingSetHashes: Map<string, KnownSolution> = new Map();
  private solutionIndex: Map<string, string> = new Map(); // testCaseId -> solution

  constructor(config: Partial<ContaminationConfig> = {}) {
    this.config = { ...DEFAULT_CONTAMINATION_CONFIG, ...config };
  }

  /**
   * Load known solutions for comparison.
   *
   * @param solutions - Array of known solutions to track
   */
  loadTrainingSet(solutions: KnownSolution[]): void {
    for (const solution of solutions) {
      const hash = this.hashContent(solution.solution);
      this.trainingSetHashes.set(hash, solution);
      this.solutionIndex.set(solution.testCaseId, solution.solution);
    }
  }

  /**
   * Check agent output for contamination.
   *
   * Runs all applicable checks and returns a combined result.
   *
   * @param agentOutput - The agent's solution output
   * @param testCase - The test case being solved
   * @returns Contamination detection result
   */
  checkContamination(
    agentOutput: string,
    testCase: TestCase
  ): ContaminationResult {
    const checks: ContaminationResult["checks"] = {};
    const reasons: string[] = [];
    let contaminated = false;

    // Check 1: Output similarity to known solutions
    const knownSolution = this.solutionIndex.get(testCase.id);
    if (knownSolution) {
      const similarityResult = this.checkSimilarity(agentOutput, knownSolution);
      checks.similarity = similarityResult;

      if (similarityResult.contaminated) {
        contaminated = true;
        reasons.push(
          `Output ${(similarityResult.similarity * 100).toFixed(1)}% similar to known solution`
        );
      }
    }

    // Check 2: Suspiciously fast solve time
    if (testCase.solveTime !== undefined) {
      const timingResult = this.checkTiming(testCase);
      checks.timing = timingResult;

      if (timingResult.contaminated) {
        contaminated = true;
        reasons.push(
          `Solve time (${timingResult.actualTime}ms) is ${(timingResult.ratio * 100).toFixed(1)}% of expected`
        );
      }
    }

    // Check 3: Reasoning chain analysis
    if (testCase.thoughtChain && testCase.thoughtChain.length > 0) {
      const reasoningResult = this.analyzeReasoning(
        testCase.thoughtChain,
        knownSolution
      );
      checks.reasoning = reasoningResult;

      if (reasoningResult.jumpsToSolution) {
        contaminated = true;
        reasons.push(
          "Reasoning chain jumps directly to solution without exploration"
        );
      }
    }

    // Calculate confidence
    const confidence = this.calculateConfidence(checks);

    return {
      contaminated,
      reason: reasons.length > 0 ? reasons.join("; ") : undefined,
      confidence,
      checks,
    };
  }

  /**
   * Check similarity between agent output and known solution.
   */
  checkSimilarity(output: string, known: string): SimilarityResult {
    const similarity = this.computeSimilarity(output, known);
    const matchedRegions = this.findMatchedRegions(output, known);

    return {
      similarity,
      threshold: this.config.similarityThreshold,
      contaminated: similarity > this.config.similarityThreshold,
      matchedRegions,
    };
  }

  /**
   * Check if solve time is suspiciously fast.
   */
  checkTiming(testCase: TestCase): TimingResult {
    const actualTime = testCase.solveTime || 0;
    const expectedTime =
      EXPECTED_SOLVE_TIMES[testCase.difficulty] ||
      EXPECTED_SOLVE_TIMES.medium;
    const ratio = expectedTime > 0 ? actualTime / expectedTime : 1;

    return {
      actualTime,
      expectedTime,
      ratio,
      contaminated: ratio < this.config.fastSolveThreshold,
    };
  }

  /**
   * Analyze reasoning chain for signs of gaming.
   */
  analyzeReasoning(
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
      suspiciousPatterns.push("Very short reasoning chain");
    }

    if (explorationDepth < this.config.minExplorationDepth) {
      suspiciousPatterns.push("Minimal exploration before answer");
    }

    // Check for "instant knowing" patterns
    if (
      thoughtChain.some(
        (t, i) =>
          /I (already )?know|The answer is|Obviously|Simply/i.test(t) && i < 2
      )
    ) {
      suspiciousPatterns.push("Claims immediate knowledge early in chain");
    }

    return {
      thoughtCount,
      explorationDepth,
      jumpsToSolution,
      suspiciousPatterns,
    };
  }

  /**
   * Add a solution to the training set (for tracking).
   *
   * @param testCaseId - The test case ID
   * @param solution - The solution text
   */
  addToTrainingSet(testCaseId: string, solution: string): void {
    const hash = this.hashContent(solution);
    this.trainingSetHashes.set(hash, {
      testCaseId,
      solution,
      hash,
      addedToTraining: new Date().toISOString(),
    });
    this.solutionIndex.set(testCaseId, solution);
  }

  /**
   * Check if content matches any training set item (by hash).
   *
   * @param content - Content to check
   * @returns True if exact match found in training set
   */
  isInTrainingSet(content: string): boolean {
    const hash = this.hashContent(content);
    return this.trainingSetHashes.has(hash);
  }

  /**
   * Get the number of solutions in the training set.
   */
  getTrainingSetSize(): number {
    return this.solutionIndex.size;
  }

  /**
   * Clear the training set.
   */
  clearTrainingSet(): void {
    this.trainingSetHashes.clear();
    this.solutionIndex.clear();
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Compute similarity using Jaccard similarity on n-grams.
   */
  private computeSimilarity(a: string, b: string): number {
    const ngramSize = 3;
    const getNgrams = (text: string): Set<string> => {
      const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
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
    const intersection = new Set([...ngramsA].filter((x) => ngramsB.has(x)));
    const union = new Set([...ngramsA, ...ngramsB]);

    return intersection.size / union.size;
  }

  /**
   * Find matching regions between output and known solution.
   */
  private findMatchedRegions(output: string, known: string): string[] {
    const matches: string[] = [];
    const minMatchLength = 50; // Characters

    // Simple phrase matching approach
    const words = known.split(/\s+/);

    for (let i = 0; i < words.length - 9; i++) {
      const phrase = words.slice(i, i + 10).join(" ");

      if (output.includes(phrase) && phrase.length >= minMatchLength) {
        matches.push(
          phrase.length > 100 ? phrase.substring(0, 100) + "..." : phrase
        );
      }
    }

    return matches.slice(0, 5); // Return top 5 matches
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
      /considering/i,
      /let's try/i,
      /perhaps/i,
      /maybe/i,
    ];

    for (const thought of thoughts) {
      for (const pattern of explorationPatterns) {
        if (pattern.test(thought)) {
          depth++;
          break; // Count once per thought
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
  private calculateConfidence(checks: ContaminationResult["checks"]): number {
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
        confidenceSum += Math.min(1, checks.timing.ratio);
      }
      checkCount++;
    }

    if (checks.reasoning) {
      // Jumps to solution = high confidence
      if (checks.reasoning.jumpsToSolution) {
        confidenceSum += 0.9;
      } else if (checks.reasoning.suspiciousPatterns.length > 0) {
        confidenceSum += Math.min(
          0.9,
          0.3 * checks.reasoning.suspiciousPatterns.length
        );
      } else {
        confidenceSum += 0.8; // Clean reasoning chain
      }
      checkCount++;
    }

    return checkCount > 0 ? confidenceSum / checkCount : 0;
  }

  /**
   * Hash content for fingerprinting.
   */
  private hashContent(content: string): string {
    const normalized = content.toLowerCase().replace(/\s+/g, " ").trim();
    return createHash("sha256").update(normalized).digest("hex");
  }
}

// =============================================================================
// Singleton
// =============================================================================

let detectorInstance: ContaminationDetector | null = null;

/**
 * Get the singleton ContaminationDetector instance.
 *
 * @param config - Configuration (only used on first call)
 */
export function getContaminationDetector(
  config?: Partial<ContaminationConfig>
): ContaminationDetector {
  if (!detectorInstance) {
    detectorInstance = new ContaminationDetector(config);
  }
  return detectorInstance;
}

/**
 * Reset the singleton instance (for testing).
 */
export function resetContaminationDetector(): void {
  detectorInstance = null;
}
