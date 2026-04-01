/**
 * Benchmark Anchor Point Sampler
 * SPEC: SIL-003
 *
 * Implements anchor point sampling that selects a representative subset
 * of benchmark issues, enabling cost reduction while maintaining correlation
 * with full benchmark performance.
 */

import { createHash } from "crypto";

// =============================================================================
// Types
// =============================================================================

/**
 * A benchmark issue to be evaluated
 */
export interface Issue {
  id: string;
  repo: string;
  number: number;
  title: string;
  body: string;
  difficulty: "easy" | "medium" | "hard";
  solution?: string;
}

/**
 * Configuration for anchor point sampling
 */
export interface AnchorPointConfig {
  /** Sample rate (0.01 = 1%) */
  sampleRate: number;
  /** Selection strategy */
  selection: "stratified" | "random";
  /** Key to stratify by */
  stratificationKey: "difficulty";
  /** How often to rotate held-out set */
  rotationPeriod: "weekly" | "monthly";
  /** Correlation validation settings */
  validation: {
    enabled: boolean;
    correlationThreshold: number;
    validationRuns: number;
  };
}

/**
 * Fingerprint for tracking issue history (for contamination detection)
 */
export interface IssueFingerprint {
  issue_id: string;
  content_hash: string;
  solution_hash: string;
  created_at: string;
  added_to_training: string | null;
}

/**
 * Result of correlation validation
 */
export interface CorrelationResult {
  correlation: number;
  valid: boolean;
}

/**
 * Serializable state for persistence
 */
export interface SamplerState {
  trainingSet: Issue[];
  heldOutSet: Issue[];
  currentRotation: string;
  fingerprints: Record<string, IssueFingerprint>;
}

// =============================================================================
// Default Configuration
// =============================================================================

export const DEFAULT_ANCHOR_CONFIG: AnchorPointConfig = {
  sampleRate: 0.01, // 1%
  selection: "stratified",
  stratificationKey: "difficulty",
  rotationPeriod: "monthly",
  validation: {
    enabled: true,
    correlationThreshold: 0.9,
    validationRuns: 3,
  },
};

// =============================================================================
// BenchmarkSampler
// =============================================================================

/**
 * Anchor point sampling for benchmark cost reduction.
 *
 * Selects a representative subset of benchmark issues that correlates
 * strongly with full benchmark performance, enabling 99% cost reduction
 * while maintaining >0.9 correlation.
 */
export class BenchmarkSampler {
  private trainingSet: Issue[] = [];
  private heldOutSet: Issue[] = [];
  private currentRotation: Date;
  private fingerprints: Map<string, IssueFingerprint> = new Map();

  constructor(private config: AnchorPointConfig = DEFAULT_ANCHOR_CONFIG) {
    this.currentRotation = this.getRotationDate();
  }

  // ---------------------------------------------------------------------------
  // R1: Stratified Sampling
  // ---------------------------------------------------------------------------

  /**
   * Select representative anchor points from full benchmark.
   * Uses stratified sampling to ensure coverage across difficulty levels.
   *
   * @param fullBenchmark - Complete set of benchmark issues
   * @returns Selected anchor point issues
   */
  selectAnchorPoints(fullBenchmark: Issue[]): Issue[] {
    if (fullBenchmark.length === 0) {
      return [];
    }

    if (this.config.selection === "random") {
      return this.randomSample(fullBenchmark, this.config.sampleRate);
    }

    // Stratified sampling
    const strata = this.stratifyByDifficulty(fullBenchmark);
    const anchors: Issue[] = [];

    for (const [_difficulty, issues] of Object.entries(strata)) {
      // Ensure at least 1 from each stratum
      const count = Math.max(
        1,
        Math.ceil(issues.length * this.config.sampleRate)
      );
      anchors.push(...this.randomSample(issues, count / issues.length));
    }

    return anchors;
  }

  // ---------------------------------------------------------------------------
  // R2: Correlation Validation
  // ---------------------------------------------------------------------------

  /**
   * Validate that anchor points correlate with full benchmark.
   * Run periodically to ensure sampling remains valid.
   *
   * @param anchorResults - Results from anchor point evaluation
   * @param fullResults - Results from full benchmark evaluation
   * @returns Correlation coefficient and validity flag
   */
  validateCorrelation(
    anchorResults: number[],
    fullResults: number[]
  ): CorrelationResult {
    const correlation = this.pearsonCorrelation(anchorResults, fullResults);
    return {
      correlation,
      valid: correlation >= this.config.validation.correlationThreshold,
    };
  }

  // ---------------------------------------------------------------------------
  // R3: Rotation Management
  // ---------------------------------------------------------------------------

  /**
   * Monthly rotation: move held-out to training, select new held-out.
   *
   * @param freshIssues - New issues to select held-out from
   */
  rotateHeldOutSet(freshIssues: Issue[]): void {
    const newRotation = this.getRotationDate();

    if (newRotation > this.currentRotation) {
      // Move current held-out to training
      for (const issue of this.heldOutSet) {
        const fp = this.fingerprints.get(issue.id);
        if (fp) {
          fp.added_to_training = new Date().toISOString();
        }
        this.trainingSet.push(issue);
      }

      // Select new held-out from fresh issues
      this.heldOutSet = this.selectForHeldOut(freshIssues);

      // Fingerprint new held-out issues
      for (const issue of this.heldOutSet) {
        this.fingerprints.set(issue.id, {
          issue_id: issue.id,
          content_hash: this.hashContent(issue),
          solution_hash: issue.solution
            ? this.hashContent({ body: issue.solution })
            : "",
          created_at: new Date().toISOString(),
          added_to_training: null,
        });
      }

      this.currentRotation = newRotation;
    }
  }

  /**
   * Get the current rotation date.
   */
  getCurrentRotation(): Date {
    return this.currentRotation;
  }

  /**
   * Get the current held-out set.
   */
  getHeldOutSet(): Issue[] {
    return [...this.heldOutSet];
  }

  /**
   * Get the current training set.
   */
  getTrainingSet(): Issue[] {
    return [...this.trainingSet];
  }

  // ---------------------------------------------------------------------------
  // R4: Issue Fingerprinting
  // ---------------------------------------------------------------------------

  /**
   * Get fingerprint for contamination detection.
   *
   * @param issueId - The issue ID to look up
   * @returns The fingerprint or undefined if not found
   */
  getFingerprint(issueId: string): IssueFingerprint | undefined {
    return this.fingerprints.get(issueId);
  }

  /**
   * Get all fingerprints.
   */
  getAllFingerprints(): Map<string, IssueFingerprint> {
    return new Map(this.fingerprints);
  }

  /**
   * Create a fingerprint for an issue.
   *
   * @param issue - The issue to fingerprint
   * @returns The created fingerprint
   */
  createFingerprint(issue: Issue): IssueFingerprint {
    const fingerprint: IssueFingerprint = {
      issue_id: issue.id,
      content_hash: this.hashContent(issue),
      solution_hash: issue.solution
        ? this.hashContent({ body: issue.solution })
        : "",
      created_at: new Date().toISOString(),
      added_to_training: null,
    };
    this.fingerprints.set(issue.id, fingerprint);
    return fingerprint;
  }

  // ---------------------------------------------------------------------------
  // State Persistence
  // ---------------------------------------------------------------------------

  /**
   * Export current state for persistence.
   */
  exportState(): SamplerState {
    return {
      trainingSet: this.trainingSet,
      heldOutSet: this.heldOutSet,
      currentRotation: this.currentRotation.toISOString(),
      fingerprints: Object.fromEntries(this.fingerprints),
    };
  }

  /**
   * Import state from persistence.
   *
   * @param state - Previously exported state
   */
  importState(state: SamplerState): void {
    this.trainingSet = state.trainingSet;
    this.heldOutSet = state.heldOutSet;
    this.currentRotation = new Date(state.currentRotation);
    this.fingerprints = new Map(Object.entries(state.fingerprints));
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Group issues by difficulty level.
   */
  private stratifyByDifficulty(issues: Issue[]): Record<string, Issue[]> {
    return issues.reduce(
      (acc, issue) => {
        const key = issue.difficulty || "unknown";
        (acc[key] = acc[key] || []).push(issue);
        return acc;
      },
      {} as Record<string, Issue[]>
    );
  }

  /**
   * Random sample from issues at given rate.
   */
  private randomSample(issues: Issue[], rate: number): Issue[] {
    const count = Math.ceil(issues.length * rate);
    const shuffled = [...issues].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Select issues for held-out set using stratified sampling.
   */
  private selectForHeldOut(issues: Issue[]): Issue[] {
    const strata = this.stratifyByDifficulty(issues);
    const selected: Issue[] = [];

    for (const stratum of Object.values(strata)) {
      // Select ~10% of each stratum for held-out
      const count = Math.max(5, Math.ceil(stratum.length * 0.1));
      selected.push(...this.randomSample(stratum, count / stratum.length));
    }

    return selected;
  }

  /**
   * Compute Pearson correlation coefficient.
   */
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Hash content for fingerprinting.
   */
  private hashContent(obj: { body?: string; title?: string }): string {
    const content = `${obj.title || ""}::${obj.body || ""}`;
    return createHash("sha256").update(content).digest("hex").substring(0, 16);
  }

  /**
   * Get the start of the current rotation period.
   */
  private getRotationDate(): Date {
    const now = new Date();
    if (this.config.rotationPeriod === "monthly") {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    // Weekly: start of week (Sunday)
    const day = now.getDay();
    const diff = now.getDate() - day;
    return new Date(now.getFullYear(), now.getMonth(), diff);
  }
}
