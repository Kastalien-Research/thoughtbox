/**
 * ThoughtEmitter - Fire-and-Forget Event Emission
 *
 * Core principle: Observability WITHOUT Intrusion
 *
 * The act of observation does NOT affect the thing observed.
 *
 * ```
 *                  ┌──────────────┐
 *                  │   Reasoning  │
 *                  │    Process   │
 *                  └──────┬───────┘
 *                         │
 *            ┌────────────┼────────────┐
 *            │            │            │
 *            ▼            ▼            ▼
 *       [Thought 1]  [Thought 2]  [Thought 3]
 *            │            │            │
 *            └────────────┼────────────┘
 *                         │
 *                         │ emit (fire-and-forget)
 *                         ▼
 *                  ┌──────────────┐
 *                  │   Emitter    │──────┐
 *                  └──────────────┘      │
 *                                        │ NO backpressure
 *                                        │ NO blocking
 *                                        │ NO feedback loop
 *                                        ▼
 *                                  ┌──────────────┐
 *                                  │  Observatory │
 *                                  └──────────────┘
 * ```
 *
 * Design constraints:
 * - Emit calls are synchronous and return immediately
 * - Failures in listeners never propagate back to the caller
 * - No async/await on the emission path
 * - Singleton pattern ensures consistent state
 */

import { EventEmitter } from "events";
import type { Thought, Session } from "./schemas/thought.js";

// =============================================================================
// Improvement Event Types (Self-Improvement Loop)
// =============================================================================

/**
 * Types of improvement events emitted during SIL cycles
 */
export type ImprovementEventType =
  | "cycle_start"
  | "discovery"
  | "filter"
  | "experiment"
  | "evaluate"
  | "integrate"
  | "cycle_end";

/**
 * Improvement event emitted by ImprovementTracker
 *
 * These events track the progress and outcomes of self-improvement loop iterations.
 */
export interface ImprovementEvent {
  /** Event type */
  type: ImprovementEventType;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Iteration number (monotonically increasing within a run) */
  iteration: number;
  /** Current phase when event was emitted */
  phase: string;
  /** Cost incurred for this event (tokens/API cost) */
  cost: number;
  /** Whether this phase/iteration was successful */
  success: boolean;
  /** Additional metadata specific to the event type */
  metadata: Record<string, unknown>;
}

/**
 * Agent role type for multi-agent collaboration
 */
export type AgentRole =
  | "orchestrator"
  | "researcher"
  | "architect"
  | "implementer"
  | "reviewer"
  | "tester"
  | "integrator"
  | "critic"
  | "unknown";

/**
 * Event types emitted by the ThoughtEmitter
 */
export type ThoughtEmitterEvents = {
  "thought:added": {
    sessionId: string;
    thought: Thought;
    parentId: string | null;
    agentId?: string;
    agentRole?: AgentRole;
    taskId?: string;
  };
  "thought:revised": {
    sessionId: string;
    thought: Thought;
    parentId: string | null;
    originalThoughtNumber: number;
    agentId?: string;
    agentRole?: AgentRole;
  };
  "thought:branched": {
    sessionId: string;
    thought: Thought;
    parentId: string | null;
    branchId: string;
    fromThoughtNumber: number;
    agentId?: string;
    agentRole?: AgentRole;
  };
  "session:started": {
    session: Session;
  };
  "session:ended": {
    sessionId: string;
    finalThoughtCount: number;
  };
  /**
   * Agent lifecycle events for multi-agent collaboration visualization
   */
  "agent:spawned": {
    agentId: string;
    agentRole: AgentRole;
    taskId?: string;
    timestamp: string;
  };
  "agent:active": {
    agentId: string;
    agentRole: AgentRole;
    timestamp: string;
  };
  "agent:idle": {
    agentId: string;
    timestamp: string;
  };
  "agent:completed": {
    agentId: string;
    taskId?: string;
    timestamp: string;
  };
  /**
   * Task lifecycle events for collaborative work tracking
   */
  "task:created": {
    taskId: string;
    title: string;
    subtasks: Array<{
      id: string;
      title: string;
      status: "pending" | "in_progress" | "completed";
      assignedTo?: string;
    }>;
    progress: number;
    timestamp: string;
  };
  "task:updated": {
    taskId: string;
    title: string;
    subtasks: Array<{
      id: string;
      title: string;
      status: "pending" | "in_progress" | "completed";
      assignedTo?: string;
    }>;
    progress: number;
    timestamp: string;
  };
  "task:completed": {
    taskId: string;
    timestamp: string;
  };
  /**
   * Improvement events from the Self-Improvement Loop (SIL)
   * SPEC: SIL-001
   */
  "improvement:event": ImprovementEvent;
  /**
   * Hub events bridged from hub-handler for Observatory visualization
   */
  "hub:event": {
    type: string;
    workspaceId: string;
    data: Record<string, unknown>;
  };
  /**
   * Monitoring alerts from the evaluation system (SPEC-EVAL-001, Layer 5)
   * Surfaces regressions, anomalies, and budget violations.
   */
  "monitoring:alert": {
    type: "regression" | "anomaly" | "budget_exceeded";
    severity: "info" | "warning" | "critical";
    metric: string;
    currentValue: number;
    threshold: number;
    message: string;
    timestamp: string;
  };
};

export type ThoughtEmitterEventName = keyof ThoughtEmitterEvents;

/**
 * ThoughtEmitter - Singleton EventEmitter for observatory events
 *
 * This class provides a fire-and-forget mechanism for emitting
 * thought events to observers without affecting the reasoning process.
 */
export class ThoughtEmitter extends EventEmitter {
  private static instance: ThoughtEmitter | null = null;

  private constructor() {
    super();
    // Increase max listeners for multiple observatory subscribers
    this.setMaxListeners(100);
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): ThoughtEmitter {
    if (!ThoughtEmitter.instance) {
      ThoughtEmitter.instance = new ThoughtEmitter();
    }
    return ThoughtEmitter.instance;
  }

  /**
   * Reset the singleton instance (primarily for testing)
   */
  static resetInstance(): void {
    if (ThoughtEmitter.instance) {
      ThoughtEmitter.instance.removeAllListeners();
      ThoughtEmitter.instance = null;
    }
  }

  /**
   * Check if there are any listeners for any event
   * Use this to skip emission work when no observers are connected
   */
  hasListeners(): boolean {
    return this.eventNames().length > 0;
  }

  /**
   * Check if there are listeners for a specific event
   */
  hasListenersFor(event: ThoughtEmitterEventName): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Emit a thought:added event
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitThoughtAdded(data: ThoughtEmitterEvents["thought:added"]): void {
    this.safeEmit("thought:added", data);
  }

  /**
   * Emit a thought:revised event
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitThoughtRevised(data: ThoughtEmitterEvents["thought:revised"]): void {
    this.safeEmit("thought:revised", data);
  }

  /**
   * Emit a thought:branched event
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitThoughtBranched(data: ThoughtEmitterEvents["thought:branched"]): void {
    this.safeEmit("thought:branched", data);
  }

  /**
   * Emit a session:started event
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitSessionStarted(data: ThoughtEmitterEvents["session:started"]): void {
    this.safeEmit("session:started", data);
  }

  /**
   * Emit a session:ended event
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitSessionEnded(data: ThoughtEmitterEvents["session:ended"]): void {
    this.safeEmit("session:ended", data);
  }

  /**
   * Emit an improvement:event for SIL tracking
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitImprovementEvent(data: ThoughtEmitterEvents["improvement:event"]): void {
    this.safeEmit("improvement:event", data);
  }

  /**
   * Emit an agent:spawned event
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitAgentSpawned(data: ThoughtEmitterEvents["agent:spawned"]): void {
    this.safeEmit("agent:spawned", data);
  }

  /**
   * Emit an agent:active event
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitAgentActive(data: ThoughtEmitterEvents["agent:active"]): void {
    this.safeEmit("agent:active", data);
  }

  /**
   * Emit an agent:idle event
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitAgentIdle(data: ThoughtEmitterEvents["agent:idle"]): void {
    this.safeEmit("agent:idle", data);
  }

  /**
   * Emit an agent:completed event
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitAgentCompleted(data: ThoughtEmitterEvents["agent:completed"]): void {
    this.safeEmit("agent:completed", data);
  }

  /**
   * Emit a task:created event
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitTaskCreated(data: ThoughtEmitterEvents["task:created"]): void {
    this.safeEmit("task:created", data);
  }

  /**
   * Emit a task:updated event
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitTaskUpdated(data: ThoughtEmitterEvents["task:updated"]): void {
    this.safeEmit("task:updated", data);
  }

  /**
   * Emit a task:completed event
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitTaskCompleted(data: ThoughtEmitterEvents["task:completed"]): void {
    this.safeEmit("task:completed", data);
  }

  /**
   * Emit a hub:event for Observatory workspace visualization
   */
  emitHubEvent(data: ThoughtEmitterEvents["hub:event"]): void {
    this.safeEmit("hub:event", data);
  }

  /**
   * Emit a monitoring:alert event from the evaluation system
   * SPEC: SPEC-EVAL-001, Layer 5
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitMonitoringAlert(data: ThoughtEmitterEvents["monitoring:alert"]): void {
    this.safeEmit("monitoring:alert", data);
  }

  /**
   * Safe emit wrapper - catches and logs errors from listeners
   * Ensures observer failures never affect the observed process
   */
  private safeEmit<E extends ThoughtEmitterEventName>(
    event: E,
    data: ThoughtEmitterEvents[E]
  ): void {
    try {
      this.emit(event, data);
    } catch (err) {
      // Log but never rethrow - observability must not affect reasoning
      console.warn(
        `[Observatory] Error in ${event} listener:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}

/**
 * Singleton instance of ThoughtEmitter
 *
 * Import this directly for convenience:
 * ```ts
 * import { thoughtEmitter } from '../observatory';
 * thoughtEmitter.emitThoughtAdded({ ... });
 * ```
 */
export const thoughtEmitter = ThoughtEmitter.getInstance();
