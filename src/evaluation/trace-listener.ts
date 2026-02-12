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

/**
 * LangSmithTraceListener subscribes to ThoughtEmitter events
 * and creates LangSmith runs for each session and thought.
 */
export class LangSmithTraceListener {
  private client: Client;
  private projectName: string;
  private sessionRuns: Map<string, SessionRun>;
  private attached = false;

  constructor(config: LangSmithConfig) {
    this.client = new Client({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
    });
    this.projectName = config.project || "default";
    this.sessionRuns = new Map();
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

    emitter.on("session:started", (data) => {
      this.onSessionStarted(data);
    });

    emitter.on("thought:added", (data) => {
      this.onThoughtAdded(data);
    });

    emitter.on("thought:revised", (data) => {
      this.onThoughtRevised(data);
    });

    emitter.on("thought:branched", (data) => {
      this.onThoughtBranched(data);
    });

    emitter.on("session:ended", (data) => {
      this.onSessionEnded(data);
    });

    console.error("[Evaluation] LangSmith trace listener attached");
  }

  /**
   * Detach from the emitter and clean up.
   */
  detach(emitter: ThoughtEmitter): void {
    if (!this.attached) return;
    emitter.removeAllListeners("session:started");
    emitter.removeAllListeners("thought:added");
    emitter.removeAllListeners("thought:revised");
    emitter.removeAllListeners("thought:branched");
    emitter.removeAllListeners("session:ended");
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
          thought: data.thought.thought,
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
          thought: data.thought.thought,
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
          thought: data.thought.thought,
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
    setTimeout(() => {
      this.sessionRuns.delete(data.sessionId);
    }, 5000);
  }

  // ===========================================================================
  // Safety wrapper
  // ===========================================================================

  /**
   * Execute an async operation without awaiting or propagating errors.
   * This is the core fire-and-forget mechanism.
   */
  private safeAsync(fn: () => Promise<unknown>): void {
    fn().catch((err) => {
      console.warn(
        "[Evaluation] LangSmith trace error:",
        err instanceof Error ? err.message : err
      );
    });
  }
}
