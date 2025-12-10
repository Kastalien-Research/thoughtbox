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

/**
 * Event types emitted by the ThoughtEmitter
 */
export type ThoughtEmitterEvents = {
  "thought:added": {
    sessionId: string;
    thought: Thought;
    parentId: string | null;
  };
  "thought:revised": {
    sessionId: string;
    thought: Thought;
    parentId: string | null;
    originalThoughtNumber: number;
  };
  "thought:branched": {
    sessionId: string;
    thought: Thought;
    parentId: string | null;
    branchId: string;
    fromThoughtNumber: number;
  };
  "session:started": {
    session: Session;
  };
  "session:ended": {
    sessionId: string;
    finalThoughtCount: number;
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
