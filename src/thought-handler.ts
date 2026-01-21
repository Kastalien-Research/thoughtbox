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
    let thoughtNumber = data.thoughtNumber as number | undefined;
    if (thoughtNumber === undefined) {
      const mainChainThoughts = this.thoughtHistory.filter(t => !t.branchId);
      if (mainChainThoughts.length === 0) {
        thoughtNumber = 1; // First thought
      } else {
        const maxNumber = Math.max(...mainChainThoughts.map(t => t.thoughtNumber ?? 0));
        thoughtNumber = maxNumber + 1;
      }
    }

    // SIL-102: Auto-assign totalThoughts if not provided (set to current thoughtNumber)
    let totalThoughts = data.totalThoughts as number | undefined;
    if (totalThoughts === undefined) {
      totalThoughts = thoughtNumber;
    }

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
    };
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
    try {
      const validatedInput = this.validateThoughtData(input);

      if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
        validatedInput.totalThoughts = validatedInput.thoughtNumber;
      }

      // Auto-create session on first thought (if no session active)
      if (!this.currentSessionId) {
        const session = await this.storage.createSession({
          title:
            validatedInput.sessionTitle ||
            `Reasoning session ${new Date().toISOString()}`,
          tags: validatedInput.sessionTags || [],
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
        // Observatory: Emit session ended event
        if (thoughtEmitter.hasListeners()) {
          try {
            thoughtEmitter.emitSessionEnded({
              sessionId: this.currentSessionId,
              finalThoughtCount: this.thoughtHistory.length,
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
      const content: Array<any> = [
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
              ...(critiqueResult && { critique: critiqueResult }),
            },
            null,
            2
          ),
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
