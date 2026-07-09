/**
 * ThoughtEmitter - Fire-and-Forget Event Emission
 *
 * Core principle: Observability WITHOUT Intrusion
 *
 * The act of observation does NOT affect the thing observed.
 *
 * Design constraints:
 * - Emit calls are synchronous and return immediately
 * - Failures in listeners never propagate back to the caller
 * - No async/await on the emission path
 * - Singleton pattern ensures consistent state
 */

import { EventEmitter } from "events";
import type { ClaimStatus } from "../claims/types.js";

/**
 * A single reasoning step as carried on emitted events.
 * Plain TS shape (formerly a zod schema in thought-schemas.ts).
 */
export interface Thought {
  id: string;
  thoughtNumber: number;
  totalThoughts: number;
  thought: string;
  nextThoughtNeeded: boolean;
  timestamp: string;
  isRevision?: boolean;
  revisesThought?: number;
  branchId?: string;
  branchFromThought?: number;
  thoughtType?: 'reasoning' | 'decision_frame' | 'action_report' | 'belief_snapshot' | 'assumption_update' | 'context_snapshot' | 'progress' | 'action_receipt' | 'finding' | 'synthesis' | 'question' | 'conclusion';
  confidence?: 'high' | 'medium' | 'low';
  options?: Array<{ label: string; selected: boolean; reason?: string }>;
  actionResult?: { success: boolean; reversible: 'yes' | 'no' | 'partial'; tool: string; target: string; sideEffects?: string[] };
  beliefs?: { entities: Array<{ name: string; state: string }>; constraints?: string[]; risks?: string[] };
  assumptionChange?: { text: string; oldStatus: string; newStatus: 'believed' | 'uncertain' | 'refuted'; trigger?: string; downstream?: number[] };
  contextData?: { toolsAvailable?: string[]; systemPromptHash?: string; modelId?: string; constraints?: string[]; dataSourcesAccessed?: string[] };
  progressData?: { task: string; status: 'pending' | 'in_progress' | 'done' | 'blocked'; note?: string };
  receiptData?: { toolName: string; expected: string; actual: string; match: boolean; residual?: string; durationMs?: number };
}

/** Session status for emitted session events */
export type SessionStatus = 'active' | 'completed' | 'abandoned';

/** A reasoning session as carried on emitted events */
export interface Session {
  id: string;
  title?: string;
  tags: string[];
  createdAt: string;
  completedAt?: string;
  status: SessionStatus;
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
    /** AUDIT-003: Optional audit manifest generated at session close */
    auditManifest?: import('../persistence/types.js').AuditManifest;
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
   * Hub events bridged from hub-handler for visualization
   */
  "hub:event": {
    type: string;
    workspaceId: string;
    data: Record<string, unknown>;
  };
  /**
   * Claim graph propagation (SPEC-AGX-SUBSTRATE B3): a claim's status
   * transitioned. In local/in-memory mode this emitter IS the delivery
   * channel (B6 binds awaiting runbook cells to it); in Supabase mode the
   * same signal also rides the supabase_realtime publication.
   */
  "claim:status": {
    claimId: string;
    oldStatus: ClaimStatus;
    newStatus: ClaimStatus;
    /** Hub agentId that caused the transition. */
    actor: string;
    /** Hub workspace the claim belongs to. */
    workspaceId: string;
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
 * ThoughtEmitter - Singleton EventEmitter for reasoning events
 *
 * This class provides a fire-and-forget mechanism for emitting
 * thought events to observers without affecting the reasoning process.
 */
export class ThoughtEmitter extends EventEmitter {
  private static instance: ThoughtEmitter | null = null;

  private constructor() {
    super();
    // Increase max listeners for multiple subscribers
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
   * Emit a hub:event for workspace visualization
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
   * Emit a claim:status event for a claim status transition
   * SPEC: SPEC-AGX-SUBSTRATE, B3
   *
   * Fire-and-forget: This method returns immediately.
   * Listener errors are logged but never propagate.
   */
  emitClaimStatus(data: ThoughtEmitterEvents["claim:status"]): void {
    this.safeEmit("claim:status", data);
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
        `[ThoughtEmitter] Error in ${event} listener:`,
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
 * import { thoughtEmitter } from '../events/index.js';
 * thoughtEmitter.emitThoughtAdded({ ... });
 * ```
 */
export const thoughtEmitter = ThoughtEmitter.getInstance();
