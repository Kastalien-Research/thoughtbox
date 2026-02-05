/**
 * ImprovementTracker - Self-Improvement Loop Event Tracker
 * SPEC: SIL-001
 *
 * Tracks improvement events during SIL cycles and emits them to the Observatory.
 * This provides observability into the self-improvement process without affecting
 * the improvement logic itself (fire-and-forget pattern).
 *
 * Usage:
 * ```ts
 * import { improvementTracker } from './observatory';
 *
 * // Start a new improvement iteration
 * improvementTracker.startIteration();
 *
 * // Track events during the cycle
 * improvementTracker.trackDiscovery({ candidateCount: 5, source: 'github' });
 * improvementTracker.trackFilter({ filteredCount: 3, reason: 'priority' });
 * improvementTracker.trackExperiment({ experimentId: 'exp-1', config: {...} });
 * improvementTracker.trackEvaluation({ passed: true, metrics: {...} });
 * improvementTracker.trackIntegration({ changeId: 'chg-1', filesModified: 3 });
 *
 * // End the iteration
 * improvementTracker.endIteration(true); // success
 * ```
 */

import { ThoughtEmitter, type ImprovementEvent, type ImprovementEventType } from "./emitter.js";

/**
 * Phase cost accumulator
 */
interface PhaseCosts {
  discovery: number;
  filter: number;
  experiment: number;
  evaluate: number;
  integrate: number;
}

/**
 * Iteration state tracking
 */
interface IterationState {
  iteration: number;
  startTime: string;
  phaseCosts: PhaseCosts;
  eventCount: number;
}

/**
 * ImprovementTracker - Singleton tracker for SIL improvement events
 *
 * Follows the same fire-and-forget pattern as ThoughtEmitter:
 * - Emit calls are synchronous and return immediately
 * - Failures in emission never affect the improvement process
 * - No backpressure or blocking
 */
export class ImprovementTracker {
  private static instance: ImprovementTracker | null = null;
  private currentIteration: number = 0;
  private iterationState: IterationState | null = null;
  private totalCost: number = 0;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): ImprovementTracker {
    if (!ImprovementTracker.instance) {
      ImprovementTracker.instance = new ImprovementTracker();
    }
    return ImprovementTracker.instance;
  }

  /**
   * Reset the singleton instance (primarily for testing)
   */
  static resetInstance(): void {
    ImprovementTracker.instance = null;
  }

  /**
   * Get current iteration number
   */
  getCurrentIteration(): number {
    return this.currentIteration;
  }

  /**
   * Get total accumulated cost across all iterations
   */
  getTotalCost(): number {
    return this.totalCost;
  }

  /**
   * Get costs for current iteration by phase
   */
  getCurrentPhaseCosts(): PhaseCosts | null {
    return this.iterationState?.phaseCosts ?? null;
  }

  /**
   * Check if an iteration is currently in progress
   */
  isIterationInProgress(): boolean {
    return this.iterationState !== null;
  }

  /**
   * Start a new improvement iteration
   *
   * This emits a cycle_start event and initializes cost tracking for the iteration.
   *
   * @param metadata Optional metadata to include with the event
   */
  startIteration(metadata: Record<string, unknown> = {}): void {
    this.currentIteration++;
    this.iterationState = {
      iteration: this.currentIteration,
      startTime: new Date().toISOString(),
      phaseCosts: {
        discovery: 0,
        filter: 0,
        experiment: 0,
        evaluate: 0,
        integrate: 0,
      },
      eventCount: 0,
    };

    this.emit({
      type: "cycle_start",
      phase: "initialization",
      cost: 0,
      success: true,
      metadata: {
        ...metadata,
        iterationNumber: this.currentIteration,
      },
    });
  }

  /**
   * Track a discovery phase event
   *
   * The discovery phase searches for potential improvements (e.g., from GitHub issues,
   * code analysis, user feedback).
   *
   * @param metadata Event metadata (e.g., candidateCount, source)
   * @param cost Token/API cost for this operation (default: 0)
   * @param success Whether the discovery was successful
   */
  trackDiscovery(
    metadata: Record<string, unknown> = {},
    cost: number = 0,
    success: boolean = true
  ): void {
    this.trackPhaseEvent("discovery", metadata, cost, success);
  }

  /**
   * Track a filter phase event
   *
   * The filter phase prioritizes and filters discovered candidates.
   *
   * @param metadata Event metadata (e.g., filteredCount, reason)
   * @param cost Token/API cost for this operation (default: 0)
   * @param success Whether the filtering was successful
   */
  trackFilter(
    metadata: Record<string, unknown> = {},
    cost: number = 0,
    success: boolean = true
  ): void {
    this.trackPhaseEvent("filter", metadata, cost, success);
  }

  /**
   * Track an experiment phase event
   *
   * The experiment phase applies candidate improvements in a sandboxed environment.
   *
   * @param metadata Event metadata (e.g., experimentId, config)
   * @param cost Token/API cost for this operation (default: 0)
   * @param success Whether the experiment was successful
   */
  trackExperiment(
    metadata: Record<string, unknown> = {},
    cost: number = 0,
    success: boolean = true
  ): void {
    this.trackPhaseEvent("experiment", metadata, cost, success);
  }

  /**
   * Track an evaluation phase event
   *
   * The evaluation phase runs benchmarks to measure the improvement's impact.
   *
   * @param metadata Event metadata (e.g., metrics, benchmarkResults)
   * @param cost Token/API cost for this operation (default: 0)
   * @param success Whether the evaluation passed thresholds
   */
  trackEvaluation(
    metadata: Record<string, unknown> = {},
    cost: number = 0,
    success: boolean = true
  ): void {
    this.trackPhaseEvent("evaluate", metadata, cost, success);
  }

  /**
   * Track an integration phase event
   *
   * The integration phase commits successful improvements to the codebase.
   *
   * @param metadata Event metadata (e.g., changeId, filesModified)
   * @param cost Token/API cost for this operation (default: 0)
   * @param success Whether the integration was successful
   */
  trackIntegration(
    metadata: Record<string, unknown> = {},
    cost: number = 0,
    success: boolean = true
  ): void {
    this.trackPhaseEvent("integrate", metadata, cost, success);
  }

  /**
   * End the current improvement iteration
   *
   * This emits a cycle_end event with accumulated costs and metrics.
   *
   * @param success Whether the overall iteration was successful
   * @param metadata Optional metadata to include with the event
   */
  endIteration(success: boolean, metadata: Record<string, unknown> = {}): void {
    if (!this.iterationState) {
      // No iteration in progress - emit warning event but don't crash
      this.emit({
        type: "cycle_end",
        phase: "error",
        cost: 0,
        success: false,
        metadata: {
          error: "No iteration in progress",
          ...metadata,
        },
      });
      return;
    }

    const iterationCost = Object.values(this.iterationState.phaseCosts).reduce(
      (sum, cost) => sum + cost,
      0
    );
    this.totalCost += iterationCost;

    this.emit({
      type: "cycle_end",
      phase: "completion",
      cost: iterationCost,
      success,
      metadata: {
        ...metadata,
        iterationNumber: this.iterationState.iteration,
        duration_ms: Date.now() - new Date(this.iterationState.startTime).getTime(),
        eventCount: this.iterationState.eventCount,
        phaseCosts: { ...this.iterationState.phaseCosts },
        totalCostSoFar: this.totalCost,
      },
    });

    this.iterationState = null;
  }

  /**
   * Track a generic phase event
   *
   * Internal method used by phase-specific tracking methods.
   */
  private trackPhaseEvent(
    phase: "discovery" | "filter" | "experiment" | "evaluate" | "integrate",
    metadata: Record<string, unknown>,
    cost: number,
    success: boolean
  ): void {
    if (this.iterationState) {
      this.iterationState.phaseCosts[phase] += cost;
      this.iterationState.eventCount++;
    }

    this.emit({
      type: phase,
      phase,
      cost,
      success,
      metadata,
    });
  }

  /**
   * Emit an improvement event via the ThoughtEmitter
   *
   * Fire-and-forget: This method returns immediately.
   * Errors are caught and logged, never propagated.
   */
  private emit(eventData: Omit<ImprovementEvent, "timestamp" | "iteration">): void {
    const event: ImprovementEvent = {
      ...eventData,
      timestamp: new Date().toISOString(),
      iteration: this.currentIteration,
    };

    try {
      ThoughtEmitter.getInstance().emitImprovementEvent(event);
    } catch (err) {
      // Log but never throw - observability must not affect improvement process
      console.warn(
        `[ImprovementTracker] Error emitting ${event.type} event:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}

/**
 * Singleton instance of ImprovementTracker
 *
 * Import this directly for convenience:
 * ```ts
 * import { improvementTracker } from '../observatory';
 * improvementTracker.startIteration();
 * ```
 */
export const improvementTracker = ImprovementTracker.getInstance();
