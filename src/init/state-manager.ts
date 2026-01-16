/**
 * Init Tool State Manager
 *
 * Tracks connection stage for each MCP session using Map-based storage.
 * Enables proper state machine semantics for the init tool workflow.
 */

/**
 * Connection stages for init workflow
 *
 * STAGE_1_UNINITIALIZED: No init tool call made yet
 * STAGE_2_INIT_STARTED: Agent has called init tool at least once
 * STAGE_3_FULLY_LOADED: Context fully loaded, ready for work
 */
export enum ConnectionStage {
  STAGE_1_UNINITIALIZED = 'stage_1',
  STAGE_2_INIT_STARTED = 'stage_2',
  STAGE_3_FULLY_LOADED = 'stage_3',
}

/**
 * Bound MCP root for scoping session context
 */
export interface BoundRoot {
  /** Root URI (e.g., file:///path/to/project) */
  uri: string;
  /** Human-readable name (derived from URI if not provided) */
  name?: string;
}

/**
 * Session state tracked by the state manager
 */
export interface SessionState {
  /** Current connection stage */
  stage: ConnectionStage;

  /** Currently selected project (if any) */
  project?: string;

  /** Currently selected task (if any) */
  task?: string;

  /** Currently selected aspect (if any) */
  aspect?: string;

  /** Session ID being worked on (if context loaded) */
  activeSessionId?: string;

  /** Bound MCP root for project scope (SPEC-011) */
  boundRoot?: BoundRoot;

  /** Timestamp of last state update */
  lastUpdated: Date;
}

/**
 * State manager for init tool sessions
 *
 * Uses Map-based storage (in-memory) for tracking session states.
 * Each MCP connection session ID maps to its own state.
 *
 * @example
 * ```typescript
 * const stateManager = new StateManager();
 *
 * // Get current stage
 * const stage = stateManager.getSessionStage('session-123');
 * // => ConnectionStage.STAGE_1_UNINITIALIZED
 *
 * // Update stage
 * stateManager.updateSessionStage('session-123', ConnectionStage.STAGE_2_INIT_STARTED);
 *
 * // Get full state
 * const state = stateManager.getSessionState('session-123');
 * // => { stage: 'stage_2', lastUpdated: Date, ... }
 * ```
 */
export class StateManager {
  private state = new Map<string, SessionState>();

  /**
   * Get connection stage for a session
   *
   * @param sessionId MCP connection session ID
   * @returns Current connection stage (defaults to STAGE_1_UNINITIALIZED)
   */
  getSessionStage(sessionId: string): ConnectionStage {
    const state = this.state.get(sessionId);
    return state?.stage ?? ConnectionStage.STAGE_1_UNINITIALIZED;
  }

  /**
   * Update connection stage for a session
   *
   * @param sessionId MCP connection session ID
   * @param stage New connection stage
   */
  updateSessionStage(sessionId: string, stage: ConnectionStage): void {
    const existingState = this.state.get(sessionId);
    this.state.set(sessionId, {
      ...existingState,
      stage,
      lastUpdated: new Date(),
    });
  }

  /**
   * Get full state for a session
   *
   * @param sessionId MCP connection session ID
   * @returns Session state object (creates default if not exists)
   */
  getSessionState(sessionId: string): SessionState {
    let state = this.state.get(sessionId);
    if (!state) {
      state = {
        stage: ConnectionStage.STAGE_1_UNINITIALIZED,
        lastUpdated: new Date(),
      };
      this.state.set(sessionId, state);
    }
    return state;
  }

  /**
   * Update session state with partial values
   *
   * @param sessionId MCP connection session ID
   * @param updates Partial state updates to apply
   */
  updateSessionState(
    sessionId: string,
    updates: Partial<Omit<SessionState, 'lastUpdated'>>
  ): void {
    const existingState = this.getSessionState(sessionId);
    this.state.set(sessionId, {
      ...existingState,
      ...updates,
      lastUpdated: new Date(),
    });
  }

  /**
   * Clear session state (for cleanup on disconnect)
   *
   * @param sessionId MCP connection session ID
   */
  clearSession(sessionId: string): void {
    this.state.delete(sessionId);
  }

  /**
   * Get all active session IDs (for debugging/monitoring)
   *
   * @returns Array of session IDs with tracked state
   */
  getActiveSessions(): string[] {
    return Array.from(this.state.keys());
  }

  /**
   * Check if session has reached fully loaded state
   *
   * @param sessionId MCP connection session ID
   * @returns True if session is fully loaded
   */
  isFullyLoaded(sessionId: string): boolean {
    return this.getSessionStage(sessionId) === ConnectionStage.STAGE_3_FULLY_LOADED;
  }

  /**
   * Set the bound root for a session (SPEC-011)
   *
   * @param sessionId MCP connection session ID
   * @param root The root to bind
   */
  setBoundRoot(sessionId: string, root: BoundRoot): void {
    const existingState = this.getSessionState(sessionId);
    this.state.set(sessionId, {
      ...existingState,
      boundRoot: root,
      lastUpdated: new Date(),
    });
  }

  /**
   * Get the bound root for a session
   *
   * @param sessionId MCP connection session ID
   * @returns The bound root, or undefined if not set
   */
  getBoundRoot(sessionId: string): BoundRoot | undefined {
    return this.state.get(sessionId)?.boundRoot;
  }

  /**
   * Check if session has a bound root
   *
   * @param sessionId MCP connection session ID
   * @returns True if a root is bound
   */
  hasBoundRoot(sessionId: string): boolean {
    return this.getBoundRoot(sessionId) !== undefined;
  }
}
