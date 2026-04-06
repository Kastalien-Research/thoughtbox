import chalk from "chalk";
import { PATTERNS_COOKBOOK } from "./resources/patterns-cookbook-content.js";
import {
  InMemoryStorage,
  SessionExporter,
  type ThoughtboxStorage,
  type Session,
  type SessionFilter,
  type ThoughtData as PersistentThoughtData,
} from "./persistence/index.js";
import {
  thoughtEmitter,
  type Thought as ObservatoryThought,
} from "./observatory/index.js";
import { SamplingHandler } from "./sampling/index.js";
// SIL-104: Event stream for external consumers
import type { ThoughtboxEventEmitter } from "./events/index.js";

export interface ThoughtData {
  thought: string;
  // SIL-102: thoughtNumber is now optional - server auto-assigns if omitted
  thoughtNumber?: number;
  // SIL-102: totalThoughts is now optional - defaults to thoughtNumber if omitted
  totalThoughts?: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  includeGuide?: boolean;
  nextThoughtNeeded: boolean;
  // Session metadata (used at thoughtNumber=1 for auto-create)
  sessionTitle?: string;
  sessionTags?: string[];
  // Request autonomous critique of this thought (Phase 3: Sampling Loops)
  critique?: boolean;
  // SIL-101: Verbose response mode - when false (default), return minimal response
  verbose?: boolean;
  // Operations mode: structured thought type for auditability filtering
  thoughtType?: 'reasoning' | 'decision_frame' | 'action_report' | 'belief_snapshot' | 'assumption_update' | 'context_snapshot' | 'progress' | 'action_receipt';
  // AUDIT-001: Structured metadata fields (discriminated by thoughtType)
  confidence?: 'high' | 'medium' | 'low';
  options?: Array<{ label: string; selected: boolean; reason?: string }>;
  actionResult?: { success: boolean; reversible: 'yes' | 'no' | 'partial'; tool: string; target: string; sideEffects?: string[] };
  beliefs?: { entities: Array<{ name: string; state: string }>; constraints?: string[]; risks?: string[] };
  assumptionChange?: { text: string; oldStatus: string; newStatus: 'believed' | 'uncertain' | 'refuted'; trigger?: string; downstream?: number[] };
  contextData?: { toolsAvailable?: string[]; systemPromptHash?: string; modelId?: string; constraints?: string[]; dataSourcesAccessed?: string[] };
  progressData?: { task: string; status: 'pending' | 'in_progress' | 'done' | 'blocked'; note?: string };
  receiptData?: { toolName: string; expected: string; actual: string; match: boolean; residual?: string; durationMs?: number };
  // Multi-agent attribution (optional)
  agentId?: string;
  agentName?: string;
}

export class ThoughtHandler {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};
  private disableThoughtLogging: boolean;
  private patternsCookbook: string;

  // MCP session ID (ephemeral, per-connection isolation)
  private mcpSessionId: string | null = null;

  // Persistence layer
  private storage: ThoughtboxStorage;
  private currentSessionId: string | null = null;  // Reasoning session ID (persistent)
  private initialized: boolean = false;

  // Sampling handler for autonomous critique (Phase 3)
  private samplingHandler: SamplingHandler | null = null;

  // SIL-104: Event emitter for external consumers (JSONL stream)
  private eventEmitter: ThoughtboxEventEmitter | null = null;

  // Processing queue to serialize concurrent thought operations
  // Prevents race conditions when multiple thoughts arrive simultaneously
  private processingQueue: Promise<void> = Promise.resolve();

  constructor(
    disableThoughtLogging: boolean = false,
    storage?: ThoughtboxStorage,
    mcpSessionId?: string
  ) {
    this.disableThoughtLogging = disableThoughtLogging;
    this.mcpSessionId = mcpSessionId || null;
    // Use imported cookbook content (works for both STDIO and HTTP builds)
    this.patternsCookbook = PATTERNS_COOKBOOK;
    // Use provided storage or create default InMemoryStorage
    this.storage = storage || new InMemoryStorage();
  }

  /**
   * Get the MCP session ID (for client isolation in stateful mode)
   */
  getMcpSessionId(): string | null {
    return this.mcpSessionId;
  }

  /**
   * Initialize the persistence layer
   * Must be called before processing thoughts
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.storage.initialize();
    this.initialized = true;
  }

  /**
   * Set the sampling handler for autonomous critique
   * Uses deferred initialization pattern - handler is set after transport connects
   */
  setSamplingHandler(handler: SamplingHandler): void {
    this.samplingHandler = handler;
  }

  /**
   * SIL-104: Set the event emitter for external JSONL event stream
   * Uses deferred initialization pattern - emitter is set after server setup
   */
  setEventEmitter(emitter: ThoughtboxEventEmitter): void {
    this.eventEmitter = emitter;
  }

  /**
   * Get the current session ID (if any)
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * List sessions with optional filtering
   */
  async listSessions(filter?: SessionFilter): Promise<Session[]> {
    return this.storage.listSessions(filter);
  }

  /**
   * Load an existing session (restores thought history)
   */
  async loadSession(sessionId: string): Promise<void> {
    const session = await this.storage.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found in database`);

    // Validate filesystem integrity before loading
    const integrity = await this.storage.validateSessionIntegrity(sessionId);
    if (!integrity.valid) {
      const errorDetails = integrity.errors.join('; ');
      throw new Error(
        `Cannot load session ${sessionId}: Filesystem corruption detected. ${errorDetails}\n\n` +
        `Recovery options:\n` +
        `1. Delete the corrupted session using the storage API\n` +
        `2. Manually inspect/repair files in the session directory\n` +
        `3. Start a new reasoning session`
      );
    }

    this.currentSessionId = sessionId;

    // Load thoughts into memory
    try {
      const thoughts = await this.storage.getThoughts(sessionId);
      this.thoughtHistory = thoughts.map((t) => ({
        thought: t.thought,
        thoughtNumber: t.thoughtNumber,
        totalThoughts: t.totalThoughts,
        nextThoughtNeeded: t.nextThoughtNeeded,
        isRevision: t.isRevision,
        revisesThought: t.revisesThought,
        branchFromThought: t.branchFromThought,
        branchId: t.branchId,
        needsMoreThoughts: t.needsMoreThoughts,
        includeGuide: t.includeGuide,
        thoughtType: t.thoughtType,
        confidence: t.confidence,
        options: t.options,
        actionResult: t.actionResult,
        beliefs: t.beliefs,
        assumptionChange: t.assumptionChange,
        contextData: t.contextData,
        progressData: t.progressData,
        receiptData: t.receiptData,
      }));

      // Update lastAccessedAt
      await this.storage.updateSession(sessionId, {
        lastAccessedAt: new Date(),
      });
    } catch (err) {
      // Clear the session ID if loading failed
      this.currentSessionId = null;
      throw new Error(
        `Failed to load session ${sessionId}: ${(err as Error).message}`
      );
    }
  }

  /**
   * Auto-export session to filesystem when it closes
   * @returns Path to exported file
   */
  private async autoExportSession(sessionId: string): Promise<string> {
    // Get linked export data from storage
    const exportData = await (this.storage as any).toLinkedExport(sessionId);

    // Export to filesystem
    const exporter = new SessionExporter();
    return exporter.export(exportData, sessionId);
  }

  /**
   * Export a reasoning session to filesystem as linked JSON
   * Public method for manual export via tool
   */
  async exportReasoningChain(
    sessionId: string,
    destination?: string
  ): Promise<{ path: string; session: Session; nodeCount: number }> {
    // Get session to verify it exists
    const session = await this.storage.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Get linked export data
    const exportData = await (this.storage as any).toLinkedExport(sessionId);

    // Export to filesystem
    const exporter = new SessionExporter();
    const exportPath = await exporter.export(exportData, sessionId, destination);

    // SIL-104: Emit export_requested event to external event stream
    if (this.eventEmitter?.isEnabled()) {
      this.eventEmitter.emitExportRequested({
        sessionId,
        exportPath,
        nodeCount: exportData.nodes.length,
      });
    }

    return {
      path: exportPath,
      session,
      nodeCount: exportData.nodes.length,
    };
  }

  /**
   * SIL-103: Restore handler state from an existing session
   *
   * When MCP connection resets, this method fully restores:
   * - thoughtHistory (all thoughts)
   * - branches (all branching data)
   * - currentSessionId
   *
   * Note: currentThoughtNumber is calculated from thoughtHistory on each thought,
   * so we just need to restore the history and the auto-assignment (SIL-102) handles the rest.
   *
   * Called by gateway when load_context specifies an existing session.
   *
   * @param sessionId - Session to restore from
   * @returns Restoration summary for confirmation
   */
  async restoreFromSession(sessionId: string): Promise<{
    thoughtCount: number;
    currentThoughtNumber: number;
    branchCount: number;
    restored: boolean;
  }> {
    // 1. Verify session exists
    const session = await this.storage.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // 2. Load all thoughts from storage (main chain)
    const thoughts = await this.storage.getThoughts(sessionId);

    // 3. Restore thought history
    // Note: storage returns PersistentThoughtData, we map to local ThoughtData
    this.thoughtHistory = thoughts.map((t) => ({
      thought: t.thought,
      thoughtNumber: t.thoughtNumber,
      totalThoughts: t.totalThoughts ?? t.thoughtNumber,
      nextThoughtNeeded: t.nextThoughtNeeded,
      branchId: t.branchId,
      branchFromThought: t.branchFromThought,
      isRevision: t.isRevision,
      revisesThought: t.revisesThought,
      thoughtType: t.thoughtType,
      confidence: t.confidence,
      options: t.options,
      actionResult: t.actionResult,
      beliefs: t.beliefs,
      assumptionChange: t.assumptionChange,
      contextData: t.contextData,
      progressData: t.progressData,
      receiptData: t.receiptData,
    }));

    // 4. Calculate current thought number (max in main chain)
    // This is computed, not stored - SIL-102 auto-assignment will use this
    const mainChainThoughts = this.thoughtHistory.filter(t => !t.branchId);
    const currentThoughtNumber = mainChainThoughts.length > 0
      ? Math.max(...mainChainThoughts.map(t => t.thoughtNumber ?? 0))
      : 0;

    // 5. Restore branches
    this.branches = {};
    for (const thought of this.thoughtHistory) {
      if (thought.branchId) {
        if (!this.branches[thought.branchId]) {
          this.branches[thought.branchId] = [];
        }
        this.branches[thought.branchId].push(thought);
      }
    }

    // 6. Set session ID
    this.currentSessionId = sessionId;

    // 7. Log restoration
    const branchCount = Object.keys(this.branches).length;
    console.log(`[SIL-103] Restored session ${sessionId}: ${thoughts.length} thoughts, current #${currentThoughtNumber}, ${branchCount} branches`);

    return {
      thoughtCount: thoughts.length,
      currentThoughtNumber,
      branchCount,
      restored: true,
    };
  }

  private validateThoughtData(input: unknown): ThoughtData & { thoughtNumber: number; totalThoughts: number } {
    const data = input as Record<string, unknown>;

    if (!data.thought || typeof data.thought !== "string") {
      throw new Error("Invalid thought: must be a string");
    }
    // SIL-102: thoughtNumber is now optional - if provided, must be a number
    if (data.thoughtNumber !== undefined && typeof data.thoughtNumber !== "number") {
      throw new Error("Invalid thoughtNumber: when provided, must be a number");
    }
    // SIL-102: totalThoughts is now optional - if provided, must be a number
    if (data.totalThoughts !== undefined && typeof data.totalThoughts !== "number") {
      throw new Error("Invalid totalThoughts: when provided, must be a number");
    }
    if (typeof data.nextThoughtNeeded !== "boolean") {
      throw new Error("Invalid nextThoughtNeeded: must be a boolean");
    }

    // Validate branching: branchId requires branchFromThought
    // branchId is a structural fork identifier, not a category/tag
    if (data.branchId && !data.branchFromThought) {
      throw new Error(
        "branchId requires branchFromThought. " +
        "Branching creates an alternative reasoning path from a specific thought. " +
        "Use branchFromThought to specify which thought number you're forking from. " +
        "Example: { branchFromThought: 5, branchId: 'approach-a' }"
      );
    }

    // SIL-102: Auto-assign thoughtNumber if not provided
    // Calculate next thought number from history (main chain thoughts only)
    // If no active session, history is stale from a previous session — start at 1
    let thoughtNumber = data.thoughtNumber as number | undefined;
    if (thoughtNumber === undefined) {
      if (!this.currentSessionId) {
        thoughtNumber = 1;
      } else {
        const mainChainThoughts = this.thoughtHistory.filter(t => !t.branchId);
        if (mainChainThoughts.length === 0) {
          thoughtNumber = 1;
        } else {
          const maxNumber = Math.max(...mainChainThoughts.map(t => t.thoughtNumber ?? 0));
          thoughtNumber = maxNumber + 1;
        }
      }
    }

    // SIL-102: Auto-assign totalThoughts if not provided (set to current thoughtNumber)
    let totalThoughts = data.totalThoughts as number | undefined;
    if (totalThoughts === undefined) {
      totalThoughts = thoughtNumber;
    }

    // AUDIT-001: thoughtType defaults to 'reasoning' if not provided
    const thoughtType = (data.thoughtType as ThoughtData['thoughtType']) ?? 'reasoning';

    // AUDIT-001: Discriminated union validation
    this.validateStructuredFields(thoughtType, data);

    return {
      thought: data.thought,
      thoughtNumber,
      totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded,
      isRevision: data.isRevision as boolean | undefined,
      revisesThought: data.revisesThought as number | undefined,
      branchFromThought: data.branchFromThought as number | undefined,
      branchId: data.branchId as string | undefined,
      needsMoreThoughts: data.needsMoreThoughts as boolean | undefined,
      includeGuide: data.includeGuide as boolean | undefined,
      // Session metadata
      sessionTitle: data.sessionTitle as string | undefined,
      sessionTags: data.sessionTags as string[] | undefined,
      // Sampling critique
      critique: data.critique as boolean | undefined,
      // SIL-101: Verbose mode (default false)
      verbose: data.verbose as boolean | undefined,
      // Operations mode: structured thought type
      thoughtType,
      // AUDIT-001: Structured metadata fields
      confidence: data.confidence as ThoughtData['confidence'],
      options: data.options as ThoughtData['options'],
      actionResult: data.actionResult as ThoughtData['actionResult'],
      beliefs: data.beliefs as ThoughtData['beliefs'],
      assumptionChange: data.assumptionChange as ThoughtData['assumptionChange'],
      contextData: data.contextData as ThoughtData['contextData'],
      progressData: data.progressData as ThoughtData['progressData'],
      receiptData: data.receiptData as ThoughtData['receiptData'],
      // Multi-agent attribution
      agentId: data.agentId as string | undefined,
      agentName: data.agentName as string | undefined,
    };
  }

  /**
   * AUDIT-001: Validate structured fields based on thoughtType.
   * Each thoughtType requires specific metadata fields.
   */
  private validateStructuredFields(
    thoughtType: NonNullable<ThoughtData['thoughtType']>,
    data: Record<string, unknown>
  ): void {
    switch (thoughtType) {
      case 'reasoning':
        break;
      case 'decision_frame':
        this.validateDecisionFrame(data);
        break;
      case 'action_report':
        this.validateActionReport(data);
        break;
      case 'belief_snapshot':
        this.validateBeliefSnapshot(data);
        break;
      case 'assumption_update':
        this.validateAssumptionUpdate(data);
        break;
      case 'context_snapshot':
        this.validateContextSnapshot(data);
        break;
      case 'progress':
        this.validateProgress(data);
        break;
      case 'action_receipt':
        this.validateActionReceipt(data);
        break;
      default:
        throw new Error(
          `Unknown thoughtType: '${thoughtType as string}'. ` +
          "Valid types: reasoning, decision_frame, action_report, " +
          "belief_snapshot, assumption_update, context_snapshot, progress."
        );
    }
  }

  private validateDecisionFrame(data: Record<string, unknown>): void {
    const confidence = data.confidence as string | undefined;
    const validConfidence = ['high', 'medium', 'low'];
    if (!confidence || !validConfidence.includes(confidence)) {
      throw new Error(
        "decision_frame requires confidence ('high' | 'medium' | 'low')."
      );
    }
    const options = data.options as Array<Record<string, unknown>> | undefined;
    if (!options || !Array.isArray(options) || options.length === 0) {
      throw new Error(
        "decision_frame requires options (non-empty array)."
      );
    }
    const selectedCount = options.filter(o => o.selected === true).length;
    if (selectedCount !== 1) {
      throw new Error(
        "decision_frame options must have exactly one with selected: true."
      );
    }
  }

  private validateActionReport(data: Record<string, unknown>): void {
    const ar = data.actionResult as Record<string, unknown> | undefined;
    if (!ar || typeof ar !== 'object') {
      throw new Error("action_report requires actionResult object.");
    }
    if (typeof ar.success !== 'boolean') {
      throw new Error("action_report actionResult requires success (boolean).");
    }
    const validReversible = ['yes', 'no', 'partial'];
    if (!validReversible.includes(ar.reversible as string)) {
      throw new Error(
        "action_report actionResult requires reversible ('yes' | 'no' | 'partial')."
      );
    }
    if (!ar.tool || typeof ar.tool !== 'string') {
      throw new Error("action_report actionResult requires tool (non-empty string).");
    }
    if (!ar.target || typeof ar.target !== 'string') {
      throw new Error("action_report actionResult requires target (non-empty string).");
    }
  }

  private validateBeliefSnapshot(data: Record<string, unknown>): void {
    const beliefs = data.beliefs as Record<string, unknown> | undefined;
    if (!beliefs || typeof beliefs !== 'object') {
      throw new Error("belief_snapshot requires beliefs object.");
    }
    const entities = (beliefs as any).entities as unknown[] | undefined;
    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      throw new Error(
        "belief_snapshot requires beliefs.entities (non-empty array)."
      );
    }
  }

  private validateAssumptionUpdate(data: Record<string, unknown>): void {
    const ac = data.assumptionChange as Record<string, unknown> | undefined;
    if (!ac || typeof ac !== 'object') {
      throw new Error("assumption_update requires assumptionChange object.");
    }
    const validStatuses = ['believed', 'uncertain', 'refuted'];
    if (!validStatuses.includes(ac.newStatus as string)) {
      throw new Error(
        "assumption_update requires assumptionChange.newStatus " +
        "('believed' | 'uncertain' | 'refuted')."
      );
    }
  }

  private validateContextSnapshot(data: Record<string, unknown>): void {
    const cd = data.contextData as unknown;
    if (cd === undefined || cd === null || typeof cd !== 'object') {
      throw new Error("context_snapshot requires contextData object.");
    }
  }

  private validateProgress(data: Record<string, unknown>): void {
    const pd = data.progressData as Record<string, unknown> | undefined;
    if (!pd || typeof pd !== 'object') {
      throw new Error("progress requires progressData object.");
    }
    if (!pd.task || typeof pd.task !== 'string') {
      throw new Error(
        "progress progressData requires task (non-empty string)."
      );
    }
    const validStatuses = ['pending', 'in_progress', 'done', 'blocked'];
    if (!validStatuses.includes(pd.status as string)) {
      throw new Error(
        "progress progressData requires status " +
        "('pending' | 'in_progress' | 'done' | 'blocked')."
      );
    }
  }

  private validateActionReceipt(data: Record<string, unknown>): void {
    const rd = data.receiptData as Record<string, unknown> | undefined;
    if (!rd || typeof rd !== 'object') {
      throw new Error("action_receipt requires receiptData object.");
    }
    if (!rd.toolName || typeof rd.toolName !== 'string') {
      throw new Error(
        "action_receipt receiptData requires toolName (non-empty string)."
      );
    }
    if (typeof rd.match !== 'boolean') {
      throw new Error(
        "action_receipt receiptData requires match (boolean)."
      );
    }
  }

  /**
   * Generate a readable session title from the first thought's content.
   * Extracts the first meaningful sentence/phrase, truncates to 80 chars.
   */
  private generateSessionTitle(thought: string): string {
    // Strip markdown formatting
    const cleaned = thought
      .replace(/[#*_`~\[\]()>]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleaned) {
      return `Session ${new Date().toISOString().slice(0, 10)}`;
    }

    // Take first sentence (up to period, question mark, or newline)
    const firstSentence = cleaned.match(/^[^.!?\n]+[.!?]?/)?.[0] ?? cleaned;

    // Truncate to 80 chars at a word boundary
    if (firstSentence.length <= 80) {
      return firstSentence.trim();
    }

    const truncated = firstSentence.slice(0, 80);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated).trim() + '...';
  }

  private formatThought(thoughtData: ThoughtData): string {
    const {
      thoughtNumber,
      totalThoughts,
      thought,
      isRevision,
      revisesThought,
      branchFromThought,
      branchId,
    } = thoughtData;

    let prefix = "";
    let context = "";

    if (isRevision) {
      prefix = chalk.yellow("🔄 Revision");
      context = ` (revising thought ${revisesThought})`;
    } else if (branchFromThought) {
      prefix = chalk.green("🌿 Branch");
      context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
    } else {
      prefix = chalk.blue("💭 Thought");
      context = "";
    }

    const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
    const border = "─".repeat(Math.max(header.length, thought.length) + 4);

    return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${thought.padEnd(border.length - 2)} │
└${border}┘`;
  }

  public async processThought(input: unknown): Promise<{
    content: Array<any>;
    isError?: boolean;
  }> {
    // Serialize all thought processing through a promise queue
    // This prevents race conditions when concurrent requests arrive
    const currentQueue = this.processingQueue;

    // Create promise for THIS operation (doesn't retry on failure)
    const operation = currentQueue
      .catch(() => undefined) // Recover from previous failure
      .then(() => this._processThoughtImpl(input)); // Process THIS input

    // Update queue for next operation (ensure queue continues even if this fails)
    this.processingQueue = operation.then(() => undefined).catch(() => undefined);

    // Return result of THIS operation
    return operation;
  }

  private async _processThoughtImpl(input: unknown): Promise<{
    content: Array<any>;
    isError?: boolean;
  }> {
    try {
      const validatedInput = this.validateThoughtData(input);

      if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
        validatedInput.totalThoughts = validatedInput.thoughtNumber;
      }

      // If caller provides a sessionTitle while a session is active,
      // they intend to start a new session. Close the current one first.
      if (this.currentSessionId && validatedInput.sessionTitle) {
        try {
          await this.autoExportSession(this.currentSessionId);
        } catch {
          // Export failure is non-fatal
        }
        this.currentSessionId = null;
        this.thoughtHistory = [];
        this.branches = {};
      }

      // Auto-create session on first thought (if no session active)
      if (!this.currentSessionId) {
        const sessionId = this.mcpSessionId ?? undefined;
        let session = sessionId
          ? await this.storage.getSession(sessionId)
          : null;

        if (!session) {
          session = await this.storage.createSession({
            id: sessionId,
            title:
              validatedInput.sessionTitle ||
              this.generateSessionTitle(validatedInput.thought),
            tags: validatedInput.sessionTags || [],
          });
        }

        await this.storage.createRun({
          sessionId: session.id,
        });
        this.currentSessionId = session.id;
        // Clear in-memory state for new session
        this.thoughtHistory = [];
        this.branches = {};

        // Observatory: Emit session started event
        if (thoughtEmitter.hasListeners()) {
          try {
            thoughtEmitter.emitSessionStarted({
              session: {
                id: session.id,
                title: session.title,
                tags: session.tags || [],
                createdAt: session.createdAt.toISOString(),
                status: 'active',
              },
            });
          } catch (e) {
            console.warn('[Observatory] Session start emit failed:', e instanceof Error ? e.message : e);
          }
        }

        // SIL-104: Emit session_created event
        if (this.eventEmitter?.isEnabled()) {
          this.eventEmitter.emitSessionCreated({
            sessionId: session.id,
            title: session.title,
            tags: session.tags,
          });
        }
      }

      // Track if this thought creates a new branch (used for resource_link in response)
      const isNewBranch = validatedInput.branchFromThought &&
                          validatedInput.branchId &&
                          !this.branches[validatedInput.branchId];

      // Critique result (populated if critique requested and sampling succeeds)
      let critiqueResult: { text: string; model: string; timestamp: string } | null = null;

      // Persist to storage if session is active
      if (this.currentSessionId) {
        // Validate session exists before persisting
        const sessionExists = await this.storage.getSession(this.currentSessionId);
        if (!sessionExists) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: `Session ${this.currentSessionId} no longer exists. It may have been deleted or the session ID is corrupted. Please start a new reasoning session by using thoughtNumber: 1.`,
                    status: "failed",
                    sessionId: this.currentSessionId,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        // Calculate updated counts for session metadata BEFORE any persistence
        // This ensures we know what the final state will be
        const isBranchThought = !!validatedInput.branchId;
        const newThoughtCount = isBranchThought
          ? this.thoughtHistory.filter(t => !t.branchId).length
          : this.thoughtHistory.filter(t => !t.branchId).length + 1;

        const willCreateNewBranch = validatedInput.branchFromThought &&
                                    validatedInput.branchId &&
                                    !this.branches[validatedInput.branchId];
        const newBranchCount = willCreateNewBranch
          ? Object.keys(this.branches).length + 1
          : Object.keys(this.branches).length;

        const thoughtData: PersistentThoughtData = {
          thought: validatedInput.thought,
          thoughtNumber: validatedInput.thoughtNumber,
          totalThoughts: validatedInput.totalThoughts,
          nextThoughtNeeded: validatedInput.nextThoughtNeeded,
          isRevision: validatedInput.isRevision,
          revisesThought: validatedInput.revisesThought,
          branchFromThought: validatedInput.branchFromThought,
          branchId: validatedInput.branchId,
          needsMoreThoughts: validatedInput.needsMoreThoughts,
          includeGuide: validatedInput.includeGuide,
          timestamp: new Date().toISOString(),
          // Operations mode: structured thought type (validated as required in validateThoughtData)
          thoughtType: validatedInput.thoughtType!,
          // AUDIT-001: Structured metadata fields
          confidence: validatedInput.confidence,
          options: validatedInput.options,
          actionResult: validatedInput.actionResult,
          beliefs: validatedInput.beliefs,
          assumptionChange: validatedInput.assumptionChange,
          contextData: validatedInput.contextData,
          progressData: validatedInput.progressData,
          receiptData: validatedInput.receiptData,
          // Multi-agent attribution (optional)
          agentId: validatedInput.agentId,
          agentName: validatedInput.agentName,
        };

        // Perform ALL persistence operations BEFORE updating in-memory state
        // This ensures consistency: if any persistence fails, in-memory state remains unchanged
        if (validatedInput.branchId) {
          await this.storage.saveBranchThought(
            this.currentSessionId,
            validatedInput.branchId,
            thoughtData
          );
        } else {
          await this.storage.saveThought(this.currentSessionId, thoughtData);
        }

        // Update session metadata
        await this.storage.updateSession(this.currentSessionId, {
          thoughtCount: newThoughtCount,
          branchCount: newBranchCount,
        });

        // Update in-memory state AFTER all persistence operations succeed
        this.thoughtHistory.push(validatedInput);

        if (validatedInput.branchFromThought && validatedInput.branchId) {
          if (!this.branches[validatedInput.branchId]) {
            this.branches[validatedInput.branchId] = [];
          }
          this.branches[validatedInput.branchId].push(validatedInput);
        }

        // Observatory: Fire-and-forget event emission
        // This block NEVER throws - failures are logged and swallowed
        if (thoughtEmitter.hasListeners()) {
          // Generate unique ID - include branchId for branch thoughts to prevent collisions
          const thoughtId = validatedInput.branchId
            ? `${this.currentSessionId}-${validatedInput.branchId}-${validatedInput.thoughtNumber}`
            : `${this.currentSessionId}-${validatedInput.thoughtNumber}`;

          const observatoryThought: ObservatoryThought = {
            id: thoughtId,
            thoughtNumber: validatedInput.thoughtNumber,
            totalThoughts: validatedInput.totalThoughts,
            thought: validatedInput.thought,
            nextThoughtNeeded: validatedInput.nextThoughtNeeded,
            timestamp: thoughtData.timestamp,
            isRevision: validatedInput.isRevision,
            revisesThought: validatedInput.revisesThought,
            branchId: validatedInput.branchId,
            branchFromThought: validatedInput.branchFromThought,
            thoughtType: validatedInput.thoughtType,
            confidence: validatedInput.confidence,
            options: validatedInput.options,
            actionResult: validatedInput.actionResult,
            beliefs: validatedInput.beliefs,
            assumptionChange: validatedInput.assumptionChange,
            contextData: validatedInput.contextData,
          };

          const parentId = validatedInput.thoughtNumber > 1
            ? `${this.currentSessionId}-${validatedInput.thoughtNumber - 1}`
            : null;

          try {
            if (validatedInput.isRevision && validatedInput.revisesThought) {
              thoughtEmitter.emitThoughtRevised({
                sessionId: this.currentSessionId,
                thought: observatoryThought,
                parentId,
                originalThoughtNumber: validatedInput.revisesThought,
              });
            } else if (validatedInput.branchFromThought && validatedInput.branchId) {
              thoughtEmitter.emitThoughtBranched({
                sessionId: this.currentSessionId,
                thought: observatoryThought,
                parentId,
                branchId: validatedInput.branchId,
                fromThoughtNumber: validatedInput.branchFromThought,
              });
            } else {
              thoughtEmitter.emitThoughtAdded({
                sessionId: this.currentSessionId,
                thought: observatoryThought,
                parentId,
              });
            }
          } catch (e) {
            // Swallow any errors - observatory must never affect reasoning
            console.warn('[Observatory] Emit failed:', e instanceof Error ? e.message : e);
          }
        }

        // SIL-104: Emit thought_added and branch_created events
        if (this.eventEmitter?.isEnabled()) {
          // Track if thoughtNumber was auto-assigned (SIL-102)
          const wasAutoAssigned = (input as Record<string, unknown>).thoughtNumber === undefined;

          // Emit thought_added for all thoughts
          this.eventEmitter.emitThoughtAdded({
            sessionId: this.currentSessionId!,
            thoughtNumber: validatedInput.thoughtNumber,
            wasAutoAssigned,
            thoughtPreview: validatedInput.thought.slice(0, 100) + (validatedInput.thought.length > 100 ? '...' : ''),
          });

          // Emit branch_created for new branches
          if (willCreateNewBranch) {
            this.eventEmitter.emitBranchCreated({
              sessionId: this.currentSessionId!,
              branchId: validatedInput.branchId!,
              fromThoughtNumber: validatedInput.branchFromThought!,
            });
          }
        }

        // Request critique if enabled and sampling handler available
        if (validatedInput.critique && this.samplingHandler) {
          try {
            // Build context from in-memory history (last 5 thoughts, excluding current)
            const context = this.thoughtHistory
              .filter(t => (t.thoughtNumber ?? 0) < validatedInput.thoughtNumber && !t.branchId)
              .slice(-5)
              .map(({ critique: _, ...rest }) => ({
                ...rest,
                timestamp: new Date().toISOString(),
              })) as PersistentThoughtData[];

            const critiqueText = await this.samplingHandler.requestCritique(
              validatedInput.thought,
              context
            );

            critiqueResult = {
              text: critiqueText,
              model: 'claude-sonnet-4-5-20250929',
              timestamp: new Date().toISOString(),
            };

            // Persist critique in background (fire-and-forget)
            this.storage.updateThoughtCritique(
              this.currentSessionId,
              validatedInput.thoughtNumber,
              { ...critiqueResult }
            ).catch(err => console.error('[Thoughtbox] Critique persistence failed:', err));
          } catch (error: unknown) {
            // Graceful degradation - don't fail thought if critique fails
            // error.code === -32601 means sampling not supported by client
            const err = error as { code?: number; message?: string };
            if (err.code !== -32601) {
              console.error('[Thoughtbox] Critique request failed:', err.message || error);
            }
          }
        }
      } else {
        // No active session - update in-memory state only
        this.thoughtHistory.push(validatedInput);

        if (validatedInput.branchFromThought && validatedInput.branchId) {
          if (!this.branches[validatedInput.branchId]) {
            this.branches[validatedInput.branchId] = [];
          }
          this.branches[validatedInput.branchId].push(validatedInput);
        }
      }

      // End session when reasoning is complete
      if (!validatedInput.nextThoughtNeeded && this.currentSessionId) {
        // Transition session status to completed
        await this.storage.updateSession(this.currentSessionId, {
          status: 'completed',
        });
        await this.storage.endRunsForSession(this.currentSessionId);

        // AUDIT-003: Generate audit manifest at session close
        let auditManifest: import('./persistence/types.js').AuditManifest | undefined;
        try {
          const { generateAuditData, toAuditManifest } = await import('./audit/index.js');
          const allThoughts = await this.storage.getThoughts(this.currentSessionId);
          const auditData = generateAuditData(this.currentSessionId, allThoughts);
          auditManifest = toAuditManifest(auditData);
        } catch (err) {
          console.warn('[AUDIT-003] Manifest generation failed:', (err as Error).message);
        }

        // Observatory: Emit session ended event
        if (thoughtEmitter.hasListeners()) {
          try {
            thoughtEmitter.emitSessionEnded({
              sessionId: this.currentSessionId,
              finalThoughtCount: this.thoughtHistory.length,
              auditManifest,
            });
          } catch (e) {
            console.warn('[Observatory] Session end emit failed:', e instanceof Error ? e.message : e);
          }
        }

        // SIL-104: Emit session_completed event to external event stream
        if (this.eventEmitter?.isEnabled()) {
          this.eventEmitter.emitSessionCompleted({
            sessionId: this.currentSessionId,
            finalThoughtCount: this.thoughtHistory.length,
            branchCount: Object.keys(this.branches).length,
            auditManifest,
          });
        }

        // Auto-export before session ends
        try {
          const exportPath = await this.autoExportSession(this.currentSessionId);
          const closingSessionId = this.currentSessionId;
          this.currentSessionId = null;

          // Include export info in response
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    thoughtNumber: validatedInput.thoughtNumber,
                    totalThoughts: validatedInput.totalThoughts,
                    nextThoughtNeeded: validatedInput.nextThoughtNeeded,
                    branches: Object.keys(this.branches),
                    thoughtHistoryLength: this.thoughtHistory.length,
                    sessionId: null,
                    sessionClosed: true,
                    closedSessionId: closingSessionId,
                    exportPath,
                    ...(critiqueResult && { critique: critiqueResult }),
                    ...(auditManifest && { auditManifest }),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (err) {
          // Export failed - session remains open to prevent data loss
          const exportError = (err as Error).message;
          console.error(`Auto-export failed: ${exportError}`);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    thoughtNumber: validatedInput.thoughtNumber,
                    totalThoughts: validatedInput.totalThoughts,
                    nextThoughtNeeded: validatedInput.nextThoughtNeeded,
                    branches: Object.keys(this.branches),
                    thoughtHistoryLength: this.thoughtHistory.length,
                    sessionId: this.currentSessionId,
                    warning: `Auto-export failed: ${exportError}. Session remains open to prevent data loss. You can manually export using the export_reasoning_chain tool.`,
                    ...(critiqueResult && { critique: critiqueResult }),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }

      if (!this.disableThoughtLogging) {
        const formattedThought = this.formatThought(validatedInput);
        console.error(formattedThought);
      }

      // SIL-101: Check verbose flag - default is false (minimal response)
      const isVerbose = validatedInput.verbose === true;

      // SIL-101: Minimal response mode (default)
      // When verbose is false, return only essential fields for token efficiency
      if (!isVerbose) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  thoughtNumber: validatedInput.thoughtNumber,
                  sessionId: this.currentSessionId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // SIL-101: Verbose response mode - full response with all fields
      // Build response content array
      const verbosePayload: Record<string, unknown> = {
        thoughtNumber: validatedInput.thoughtNumber,
        totalThoughts: validatedInput.totalThoughts,
        nextThoughtNeeded: validatedInput.nextThoughtNeeded,
        thoughtType: validatedInput.thoughtType,
        branches: Object.keys(this.branches),
        thoughtHistoryLength: this.thoughtHistory.length,
        sessionId: this.currentSessionId,
      };
      if (validatedInput.confidence) verbosePayload.confidence = validatedInput.confidence;
      if (validatedInput.options) verbosePayload.options = validatedInput.options;
      if (validatedInput.actionResult) verbosePayload.actionResult = validatedInput.actionResult;
      if (validatedInput.beliefs) verbosePayload.beliefs = validatedInput.beliefs;
      if (validatedInput.assumptionChange) verbosePayload.assumptionChange = validatedInput.assumptionChange;
      if (validatedInput.progressData) verbosePayload.progressData = validatedInput.progressData;
      if (validatedInput.receiptData) verbosePayload.receiptData = validatedInput.receiptData;
      if (validatedInput.agentId) verbosePayload.agentId = validatedInput.agentId;
      if (validatedInput.agentName) verbosePayload.agentName = validatedInput.agentName;
      if (validatedInput.branchId) verbosePayload.branchId = validatedInput.branchId;
      if (validatedInput.branchFromThought) verbosePayload.branchFromThought = validatedInput.branchFromThought;
      if (validatedInput.isRevision) verbosePayload.isRevision = validatedInput.isRevision;
      if (validatedInput.revisesThought) verbosePayload.revisesThought = validatedInput.revisesThought;
      if (critiqueResult) verbosePayload.critique = critiqueResult;

      const content: Array<any> = [
        {
          type: "text",
          text: JSON.stringify(verbosePayload, null, 2),
        },
      ];

      // Include patterns cookbook as embedded resource when:
      // 1. At the start (thoughtNumber === 1)
      // 2. At the end (thoughtNumber === totalThoughts)
      // 3. On-demand (includeGuide === true)
      const shouldIncludeGuide =
        validatedInput.thoughtNumber === 1 ||
        validatedInput.thoughtNumber === validatedInput.totalThoughts ||
        validatedInput.includeGuide === true;

      if (shouldIncludeGuide) {
        content.push({
          type: "resource",
          resource: {
            uri: "thoughtbox://patterns-cookbook",
            title: "Thoughtbox Patterns Cookbook",
            mimeType: "text/markdown",
            text: this.patternsCookbook,
            annotations: {
              audience: ["assistant"],
              priority: 0.9,
            },
          },
        });
      }

      // Include parallel verification guide as resource_link when creating a new branch
      // Agent can fetch if they want guidance on hypothesis exploration workflow
      if (isNewBranch) {
        content.push({
          type: "resource_link",
          uri: "thoughtbox://guidance/parallel-verification",
          name: "Parallel Verification Guide",
          description: "Workflow for exploring multiple hypotheses through branching",
          mimeType: "text/markdown",
        });
      }

      return { content };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: "failed",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
}
