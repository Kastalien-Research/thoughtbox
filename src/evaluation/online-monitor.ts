/**
 * OnlineMonitor — Real-time Session Scoring & Regression Detection
 * SPEC: SPEC-EVAL-001, Layer 5, Phase 4
 *
 * Subscribes to ThoughtEmitter session events and scores production
 * sessions using the same evaluator pipeline as offline experiments.
 *
 * Design constraints:
 * - All scoring is fire-and-forget (no await on hot path)
 * - Circuit breaker suppresses repeated LangSmith failures
 * - Alert deduplication prevents storm during sustained regression
 * - Baselines are cold-start safe (no alerts until 10+ scored sessions)
 */

import type { Client } from "langsmith";
import type { Run } from "langsmith/schemas";
import type { ThoughtEmitter, ThoughtEmitterEvents } from "../observatory/emitter.js";
import type { LangSmithConfig, MonitorConfig } from "./types.js";
import type { LangSmithTraceListener } from "./trace-listener.js";
import { getAllEvaluators } from "./evaluators/index.js";

const DEFAULTS: Required<MonitorConfig> = {
  minThoughts: 5,
  alwaysScoreTags: ["eval", "test", "experiment"],
  minSamplesForBaseline: 10,
  rollingWindowSize: 20,
  stddevThreshold: 2,
  alertCooldownMs: 30 * 60 * 1000, // 30 minutes
};

/**
 * OnlineMonitor subscribes to session events and scores production
 * sessions using the same evaluator pipeline as offline experiments.
 * Detects regressions against a rolling baseline and emits monitoring:alert events.
 */
export class OnlineMonitor {
  private client: Client;
  private projectName: string;
  private traceListener?: LangSmithTraceListener;
  private config: Required<MonitorConfig>;
  private sessionTags = new Map<string, string[]>();
  private handlers = new Map<string, (...args: any[]) => void>();
  private attached = false;
  private emitter?: ThoughtEmitter;

  // Circuit breaker (same pattern as trace-listener)
  private failureCount = 0;
  private circuitOpenUntil = 0;
  private static readonly CIRCUIT_THRESHOLD = 5;
  private static readonly CIRCUIT_COOLDOWN_MS = 60_000;

  // Baseline state — rolling window of scored sessions
  private scoreHistory: Array<Record<string, number>> = [];

  // Alert deduplication — metric → expiry timestamp
  private alertCooldowns = new Map<string, number>();

  // Timers for cleanup
  private pendingTimers = new Set<ReturnType<typeof setTimeout>>();

  constructor(
    config: LangSmithConfig,
    client: Client,
    options?: {
      traceListener?: LangSmithTraceListener;
      monitorConfig?: MonitorConfig;
    },
  ) {
    this.client = client;
    this.projectName = config.project || "default";
    this.traceListener = options?.traceListener;
    this.config = { ...DEFAULTS, ...options?.monitorConfig };
  }

  /**
   * Subscribe to ThoughtEmitter session events.
   * Idempotent — calling attach() multiple times is safe.
   */
  attach(emitter: ThoughtEmitter): void {
    if (this.attached) return;
    this.attached = true;
    this.emitter = emitter;

    const onSessionStarted = (data: any) => this.onSessionStarted(data);
    const onSessionEnded = (data: any) => this.onSessionEnded(data);

    this.handlers.set("session:started", onSessionStarted);
    this.handlers.set("session:ended", onSessionEnded);

    emitter.on("session:started", onSessionStarted);
    emitter.on("session:ended", onSessionEnded);
  }

  /**
   * Detach from the emitter and clean up all state.
   */
  detach(emitter: ThoughtEmitter): void {
    if (!this.attached) return;
    for (const [event, handler] of this.handlers) {
      emitter.off(event as any, handler);
    }
    this.handlers.clear();
    for (const timer of this.pendingTimers) {
      clearTimeout(timer);
    }
    this.pendingTimers.clear();
    this.sessionTags.clear();
    this.emitter = undefined;
    this.attached = false;
  }

  /**
   * Number of sessions scored so far (for diagnostics).
   */
  get scoredSessionCount(): number {
    return this.scoreHistory.length;
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  private onSessionStarted(data: ThoughtEmitterEvents["session:started"]): void {
    // Store tags for lookup when session ends
    this.sessionTags.set(data.session.id, data.session.tags || []);
  }

  private onSessionEnded(data: ThoughtEmitterEvents["session:ended"]): void {
    const tags = this.sessionTags.get(data.sessionId) || [];

    // Check filter: enough thoughts or tagged for scoring
    if (!this.shouldScore(data.finalThoughtCount, tags)) {
      this.sessionTags.delete(data.sessionId);
      return;
    }

    // Look up LangSmith run ID from trace-listener
    const runId = this.traceListener?.getSessionRunId(data.sessionId);
    if (!runId) {
      // Trace-listener not active or session not tracked — skip
      this.sessionTags.delete(data.sessionId);
      return;
    }

    // Schedule scoring after 3s delay to let trace-listener finalize the run
    const timer = setTimeout(() => {
      this.pendingTimers.delete(timer);
      this.safeAsync(() => this.scoreSession(data.sessionId, runId));
    }, 3000);
    this.pendingTimers.add(timer);

    // Clean up tags
    this.sessionTags.delete(data.sessionId);
  }

  // ===========================================================================
  // Scoring Pipeline
  // ===========================================================================

  private async scoreSession(sessionId: string, runId: string): Promise<void> {
    // Fetch the completed run from LangSmith
    const run = await this.client.readRun(runId) as Run;

    // Run all 4 evaluators
    const evaluators = getAllEvaluators();
    const scores: Record<string, number> = {};

    for (const evaluator of evaluators) {
      const result = evaluator({
        run,
        example: {} as any, // not needed for online scoring
        inputs: run.inputs ?? {},
        outputs: (run.outputs as Record<string, any>) ?? {},
      });

      const key = result.key as string;
      const score = (result.score as number) ?? 0;
      scores[key] = score;

      // Write feedback to LangSmith for this run
      await this.client.createFeedback(runId, key, {
        score,
        comment: result.comment as string | undefined,
      });
    }

    // Append scores to rolling history (trim to window size)
    this.scoreHistory.push(scores);
    if (this.scoreHistory.length > this.config.rollingWindowSize) {
      this.scoreHistory = this.scoreHistory.slice(-this.config.rollingWindowSize);
    }

    // Check for regressions
    if (this.emitter) {
      this.checkForRegressions(scores, this.emitter);
    }
  }

  // ===========================================================================
  // Regression Detection
  // ===========================================================================

  private checkForRegressions(
    currentScores: Record<string, number>,
    emitter: ThoughtEmitter,
  ): void {
    // Not enough data for baselines yet
    if (this.scoreHistory.length < this.config.minSamplesForBaseline) return;

    // Compute baselines from history (excluding the current entry)
    const history = this.scoreHistory.slice(0, -1);

    for (const [metric, currentValue] of Object.entries(currentScores)) {
      const values = history
        .map((h) => h[metric])
        .filter((v): v is number => v !== undefined);

      if (values.length === 0) continue;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
      const stddev = Math.sqrt(variance);

      const lowerBound = mean - this.config.stddevThreshold * stddev;
      const upperBound = mean + this.config.stddevThreshold * stddev;

      if (currentValue < lowerBound) {
        // Regression detected
        if (!this.isAlertCoolingDown(metric)) {
          this.setAlertCooldown(metric);
          emitter.emitMonitoringAlert({
            type: "regression",
            severity: "warning",
            metric,
            currentValue,
            threshold: lowerBound,
            message: `${metric} dropped to ${currentValue.toFixed(3)} (baseline: ${mean.toFixed(3)} +/- ${stddev.toFixed(3)})`,
            timestamp: new Date().toISOString(),
          });
        }
      } else if (currentValue > upperBound) {
        // Anomaly (positive spike) — informational
        if (!this.isAlertCoolingDown(metric)) {
          this.setAlertCooldown(metric);
          emitter.emitMonitoringAlert({
            type: "anomaly",
            severity: "info",
            metric,
            currentValue,
            threshold: upperBound,
            message: `${metric} spiked to ${currentValue.toFixed(3)} (baseline: ${mean.toFixed(3)} +/- ${stddev.toFixed(3)})`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Check whether a session should be scored.
   */
  private shouldScore(finalThoughtCount: number, tags: string[]): boolean {
    return (
      finalThoughtCount >= this.config.minThoughts ||
      tags.some((t) => this.config.alwaysScoreTags.includes(t))
    );
  }

  /**
   * Check if a metric's alert is in cooldown.
   */
  private isAlertCoolingDown(metric: string): boolean {
    const expiry = this.alertCooldowns.get(metric);
    if (!expiry) return false;
    if (Date.now() >= expiry) {
      this.alertCooldowns.delete(metric);
      return false;
    }
    return true;
  }

  /**
   * Set alert cooldown for a metric.
   */
  private setAlertCooldown(metric: string): void {
    this.alertCooldowns.set(metric, Date.now() + this.config.alertCooldownMs);
  }

  /**
   * Execute an async operation without awaiting or propagating errors.
   * Includes a circuit breaker that suppresses calls after repeated failures.
   */
  private safeAsync(fn: () => Promise<unknown>): void {
    // Circuit breaker: skip if too many recent failures
    if (this.failureCount >= OnlineMonitor.CIRCUIT_THRESHOLD) {
      if (Date.now() < this.circuitOpenUntil) return;
      // Half-open: cooldown expired, try again
      this.failureCount = 0;
    }

    fn()
      .then(() => {
        this.failureCount = 0;
      })
      .catch((err) => {
        this.failureCount++;
        if (this.failureCount >= OnlineMonitor.CIRCUIT_THRESHOLD) {
          this.circuitOpenUntil =
            Date.now() + OnlineMonitor.CIRCUIT_COOLDOWN_MS;
          console.warn(
            `[Evaluation] OnlineMonitor circuit breaker open after ${this.failureCount} failures. ` +
              `Suppressing scoring for ${OnlineMonitor.CIRCUIT_COOLDOWN_MS / 1000}s.`,
          );
        } else {
          console.warn(
            "[Evaluation] OnlineMonitor scoring error:",
            err instanceof Error ? err.message : err,
          );
        }
      });
  }
}
