
import chalk from "chalk";
import { PATTERNS_COOKBOOK } from "../resources/patterns-cookbook-content.js";
import {
  FileSystemStorage,
  type ThoughtboxStorage,
  type Session,
  type SessionFilter,
  type ThoughtData as PersistentThoughtData,
} from "../persistence/index.js";

export interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
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
}

export class ThoughtboxServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};
  private disableThoughtLogging: boolean;
  private patternsCookbook: string;

  // Persistence layer
  private storage: ThoughtboxStorage;
  private currentSessionId: string | null = null;
  private initialized: boolean = false;

  constructor(
    disableThoughtLogging: boolean = false,
    storage?: ThoughtboxStorage
  ) {
    this.disableThoughtLogging = disableThoughtLogging;
    // Use imported cookbook content
    this.patternsCookbook = PATTERNS_COOKBOOK;
    // Use provided storage or create default FileSystemStorage
    this.storage = storage || new FileSystemStorage();
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

  private validateThoughtData(input: unknown): ThoughtData {
    const data = input as Record<string, unknown>;

    if (!data.thought || typeof data.thought !== "string") {
      throw new Error("Invalid thought: must be a string");
    }
    if (!data.thoughtNumber || typeof data.thoughtNumber !== "number") {
      throw new Error("Invalid thoughtNumber: must be a number");
    }
    if (!data.totalThoughts || typeof data.totalThoughts !== "number") {
      throw new Error("Invalid totalThoughts: must be a number");
    }
    if (typeof data.nextThoughtNeeded !== "boolean") {
      throw new Error("Invalid nextThoughtNeeded: must be a boolean");
    }

    return {
      thought: data.thought,
      thoughtNumber: data.thoughtNumber,
      totalThoughts: data.totalThoughts,
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

      // Auto-create session on thought 1 (if no session active)
      if (validatedInput.thoughtNumber === 1 && !this.currentSessionId) {
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
      }

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
        this.currentSessionId = null;
      }

      if (!this.disableThoughtLogging) {
        const formattedThought = this.formatThought(validatedInput);
        console.error(formattedThought);
      }

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
