/**
 * LangSmithTraceListener — ThoughtEmitter → LangSmith Bridge
 * SPEC: SPEC-EVAL-001, Layer 1, REQ-EVAL-001
 *
 * Subscribes to ThoughtEmitter events and creates corresponding
 * LangSmith runs for observability and evaluation.
 *
 * Design constraints (inherited from ThoughtEmitter):
 * - All API calls are fire-and-forget (no await on hot path)
 * - Errors are caught and logged, never propagated
 * - If LangSmith is unavailable, events are silently dropped
 * - Circuit breaker suppresses repeated failures (5 consecutive → 60s cooldown)
 *
 * Run hierarchy:
 * - Session → parent run (run_type: "chain")
 *   - Thought → child run (run_type: "tool")
 *   - Thought → child run (run_type: "tool")
 *   - ...
 */

import { Client } from "langsmith";
import type { ThoughtEmitter, ThoughtEmitterEvents } from "../observatory/emitter.js";
import type { LangSmithConfig, SessionRun } from "./types.js";

export interface TraceListenerOptions {
  /** When true, thought content is replaced with a length indicator in LangSmith outputs. */
  redactContent?: boolean;
}

/**
 * LangSmithTraceListener subscribes to ThoughtEmitter events
 * and creates LangSmith runs for each session and thought.
 */
export class LangSmithTraceListener {
  private client: Client;
  private projectName: string;
  private sessionRuns: Map<string, SessionRun>;
  private handlers = new Map<string, (...args: any[]) => void>();
  private pendingTimers = new Set<ReturnType<typeof setTimeout>>();
  private attached = false;
  private redactContent: boolean;

  // Circuit breaker state
  private failureCount = 0;
  private circuitOpenUntil = 0;
  private static readonly CIRCUIT_THRESHOLD = 5;
  private static readonly CIRCUIT_COOLDOWN_MS = 60_000;

  constructor(config: LangSmithConfig, client?: Client, options?: TraceListenerOptions) {
    this.client = client ?? new Client({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
    });
    this.projectName = config.project || "default";
    this.sessionRuns = new Map();
    this.redactContent = options?.redactContent ?? false;
  }

  /**
   * Subscribe to ThoughtEmitter events.
   *
   * This is idempotent — calling attach() multiple times
   * on the same emitter is safe (guards against double-subscribe).
   */
  attach(emitter: ThoughtEmitter): void {
    if (this.attached) return;
    this.attached = true;

    const onSessionStarted = (data: any) => this.onSessionStarted(data);
    const onThoughtAdded = (data: any) => this.onThoughtAdded(data);
    const onThoughtRevised = (data: any) => this.onThoughtRevised(data);
    const onThoughtBranched = (data: any) => this.onThoughtBranched(data);
    const onSessionEnded = (data: any) => this.onSessionEnded(data);

    this.handlers.set("session:started", onSessionStarted);
    this.handlers.set("thought:added", onThoughtAdded);
    this.handlers.set("thought:revised", onThoughtRevised);
    this.handlers.set("thought:branched", onThoughtBranched);
    this.handlers.set("session:ended", onSessionEnded);

    emitter.on("session:started", onSessionStarted);
    emitter.on("thought:added", onThoughtAdded);
    emitter.on("thought:revised", onThoughtRevised);
    emitter.on("thought:branched", onThoughtBranched);
    emitter.on("session:ended", onSessionEnded);

    console.error("[Evaluation] LangSmith trace listener attached");
  }

  /**
   * Detach from the emitter and clean up.
   * Only removes this listener's handlers — does not affect other listeners.
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
    this.sessionRuns.clear();
    this.attached = false;
  }

  /**
   * Get active session run count (for diagnostics).
   */
  get activeSessionCount(): number {
    return this.sessionRuns.size;
  }

  // ===========================================================================
  // Event Handlers (all fire-and-forget)
  // ===========================================================================

  private onSessionStarted(data: ThoughtEmitterEvents["session:started"]): void {
    const runId = crypto.randomUUID();
    const startTime = new Date().toISOString();

    const sessionRun: SessionRun = {
      runId,
      sessionId: data.session.id,
      startTime,
      thoughtCount: 0,
    };

    this.sessionRuns.set(data.session.id, sessionRun);

    // Fire-and-forget: create parent run in LangSmith
    this.safeAsync(() =>
      this.client.createRun({
        id: runId,
        name: `session:${data.session.id}`,
        run_type: "chain",
        project_name: this.projectName,
        start_time: new Date(startTime).getTime(),
        inputs: {
          sessionId: data.session.id,
          title: data.session.title,
          sessionTags: data.session.tags,
        },
        extra: {
          metadata: {
            tags: ["thoughtbox", "session", ...(data.session.tags || [])],
            source: "thoughtbox-emitter",
          },
        },
      })
    );
  }

  private onThoughtAdded(data: ThoughtEmitterEvents["thought:added"]): void {
    const sessionRun = this.sessionRuns.get(data.sessionId);
    if (!sessionRun) return;

    sessionRun.thoughtCount++;
    const childRunId = crypto.randomUUID();

    this.safeAsync(() =>
      this.client.createRun({
        id: childRunId,
        name: `thought:${data.thought.thoughtNumber}`,
        run_type: "tool",
        project_name: this.projectName,
        parent_run_id: sessionRun.runId,
        start_time: new Date(data.thought.timestamp).getTime(),
        end_time: Date.now(),
        inputs: {
          thoughtNumber: data.thought.thoughtNumber,
          totalThoughts: data.thought.totalThoughts,
          nextThoughtNeeded: data.thought.nextThoughtNeeded,
        },
        outputs: {
          thought: this.sanitizeThought(data.thought.thought),
        },
        extra: {
          metadata: {
            tags: ["thoughtbox", "thought"],
            parentId: data.parentId,
            agentId: data.agentId,
            agentRole: data.agentRole,
            taskId: data.taskId,
          },
        },
      })
    );
  }

  private onThoughtRevised(data: ThoughtEmitterEvents["thought:revised"]): void {
    const sessionRun = this.sessionRuns.get(data.sessionId);
    if (!sessionRun) return;

    sessionRun.thoughtCount++;
    const childRunId = crypto.randomUUID();

    this.safeAsync(() =>
      this.client.createRun({
        id: childRunId,
        name: `revision:${data.thought.thoughtNumber}→${data.originalThoughtNumber}`,
        run_type: "tool",
        project_name: this.projectName,
        parent_run_id: sessionRun.runId,
        start_time: new Date(data.thought.timestamp).getTime(),
        end_time: Date.now(),
        inputs: {
          thoughtNumber: data.thought.thoughtNumber,
          originalThoughtNumber: data.originalThoughtNumber,
          isRevision: true,
        },
        outputs: {
          thought: this.sanitizeThought(data.thought.thought),
        },
        extra: {
          metadata: {
            tags: ["thoughtbox", "revision"],
          },
        },
      })
    );
  }

  private onThoughtBranched(data: ThoughtEmitterEvents["thought:branched"]): void {
    const sessionRun = this.sessionRuns.get(data.sessionId);
    if (!sessionRun) return;

    sessionRun.thoughtCount++;
    const childRunId = crypto.randomUUID();

    this.safeAsync(() =>
      this.client.createRun({
        id: childRunId,
        name: `branch:${data.branchId}:${data.thought.thoughtNumber}`,
        run_type: "tool",
        project_name: this.projectName,
        parent_run_id: sessionRun.runId,
        start_time: new Date(data.thought.timestamp).getTime(),
        end_time: Date.now(),
        inputs: {
          thoughtNumber: data.thought.thoughtNumber,
          branchId: data.branchId,
          fromThoughtNumber: data.fromThoughtNumber,
        },
        outputs: {
          thought: this.sanitizeThought(data.thought.thought),
        },
        extra: {
          metadata: {
            tags: ["thoughtbox", "branch", `branch:${data.branchId}`],
          },
        },
      })
    );
  }

  private onSessionEnded(data: ThoughtEmitterEvents["session:ended"]): void {
    const sessionRun = this.sessionRuns.get(data.sessionId);
    if (!sessionRun) return;

    sessionRun.endTime = new Date().toISOString();

    // Update the parent run with end time and final outputs
    this.safeAsync(() =>
      this.client.updateRun(sessionRun.runId, {
        end_time: Date.now(),
        outputs: {
          finalThoughtCount: data.finalThoughtCount,
          trackedThoughtCount: sessionRun.thoughtCount,
        },
        tags: ["thoughtbox", "session", "completed"],
      })
    );

    // Clean up after a delay to allow any in-flight child runs to complete
    const timer = setTimeout(() => {
      this.sessionRuns.delete(data.sessionId);
      this.pendingTimers.delete(timer);
    }, 5000);
    this.pendingTimers.add(timer);
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Sanitize thought content for LangSmith output.
   * When redactContent is enabled, replaces content with a length indicator.
   */
  private sanitizeThought(thought: string): string {
    if (!this.redactContent) return thought;
    return `[redacted: ${thought.length} chars]`;
  }

  // ===========================================================================
  // Safety wrapper with circuit breaker
  // ===========================================================================

  /**
   * Execute an async operation without awaiting or propagating errors.
   * Includes a circuit breaker that suppresses calls after repeated failures.
   */
  private safeAsync(fn: () => Promise<unknown>): void {
    // Circuit breaker: skip if too many recent failures
    if (this.failureCount >= LangSmithTraceListener.CIRCUIT_THRESHOLD) {
      if (Date.now() < this.circuitOpenUntil) return;
      // Half-open: cooldown expired, try again
      this.failureCount = 0;
    }

    fn().then(() => {
      this.failureCount = 0;
    }).catch((err) => {
      this.failureCount++;
      if (this.failureCount >= LangSmithTraceListener.CIRCUIT_THRESHOLD) {
        this.circuitOpenUntil = Date.now() + LangSmithTraceListener.CIRCUIT_COOLDOWN_MS;
        console.warn(
          `[Evaluation] LangSmith circuit breaker open after ${this.failureCount} failures. ` +
          `Suppressing traces for ${LangSmithTraceListener.CIRCUIT_COOLDOWN_MS / 1000}s.`
        );
      } else {
        console.warn(
          "[Evaluation] LangSmith trace error:",
          err instanceof Error ? err.message : err,
        );
      }
    });
  }
}
