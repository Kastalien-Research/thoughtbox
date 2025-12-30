#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListResourcesRequestSchema, ListResourceTemplatesRequestSchema } from "@modelcontextprotocol/sdk/types.js";
// Fixed chalk import for ESM
import chalk from "chalk";
import { z } from "zod";
import { PATTERNS_COOKBOOK } from "./resources/patterns-cookbook-content.js";
import { SERVER_ARCHITECTURE_GUIDE } from "./resources/server-architecture-content.js";
import { NotebookServer, NOTEBOOK_TOOL } from "./notebook/index.js";
import { getOperationNames } from "./notebook/operations.js";
import {
  MentalModelsServer,
  MENTAL_MODELS_TOOL,
  getMentalModelsResources,
  getMentalModelsResourceContent,
  getMentalModelsResourceTemplates,
} from "./mental-models/index.js";
import {
  LIST_MCP_ASSETS_PROMPT,
  getListMcpAssetsContent,
  INTERLEAVED_THINKING_PROMPT,
  getInterleavedThinkingContent,
  getInterleavedGuideForUri,
  getInterleavedResourceTemplates,
} from "./prompts/index.js";
import {
  InMemoryStorage,
  SessionExporter,
  type ThoughtboxStorage,
  type Session,
  type SessionFilter,
  type ThoughtData as PersistentThoughtData,
  type SessionExport,
} from "./persistence/index.js";
import {
  createInitFlow,
  type IInitHandler,
  type SessionIndex,
} from "./init/index.js";
import {
  thoughtEmitter,
  loadObservatoryConfig,
  createObservatoryServer,
  type Thought as ObservatoryThought,
  type Session as ObservatorySession,
  type ObservatoryServer,
} from "./observatory/index.js";

// Configuration schema for Smithery
// Note: Using .default() means the field is always present after parsing,
// but callers providing raw objects need to include the field or use configSchema.parse()
export const configSchema = z.object({
  disableThoughtLogging: z
    .boolean()
    .default(false)
    .describe(
      "Disable thought output to stderr (useful for production deployments)"
    ),
  // Session management options (for stateful mode)
  autoCreateSession: z
    .boolean()
    .default(true)
    .describe("Auto-create reasoning session on first thought"),
  reasoningSessionId: z
    .string()
    .optional()
    .describe("Pre-load a specific reasoning session on server start"),
});

// Parsed config type (with defaults applied)
export type ServerConfig = z.infer<typeof configSchema>;

// Input config type (before parsing, allows omitting fields with defaults)
export type ServerConfigInput = z.input<typeof configSchema>;

// Logger interface for Smithery SDK compatibility
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

// Server factory arguments (Smithery SDK stateful pattern)
export interface CreateServerArgs {
  sessionId: string;  // MCP connection session ID (ephemeral)
  config: ServerConfigInput;
  logger: Logger;
}

// Legacy args for stateless mode (backward compatibility)
export interface LegacyServerArgs {
  config: ServerConfigInput;
}

interface ThoughtData {
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

class ThoughtboxServer {
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

    return {
      path: exportPath,
      session,
      nodeCount: exportData.nodes.length,
    };
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

const CLEAR_THOUGHT_TOOL = {
  name: "thoughtbox",
  description: `Step-by-step thinking tool for complex problem-solving.

Supports flexible reasoning: forward thinking (1→N), backward thinking (N→1), branching, and revision.
Adjust your approach dynamically as understanding deepens.

Use for:
- Multi-step analysis and planning
- Problems requiring course correction
- Hypothesis generation and testing
- System design and architecture decisions

Patterns Cookbook:
Automatically provided at thought 1 with 6 core reasoning patterns, examples, and best practices.
Request anytime with includeGuide parameter.`,
  inputSchema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "Your current thinking step",
      },
      nextThoughtNeeded: {
        type: "boolean",
        description: "Whether another thought step is needed",
      },
      thoughtNumber: {
        type: "integer",
        description:
          "Current thought number (can be 1→N for forward thinking, or N→1 for backward/goal-driven thinking)",
        minimum: 1,
      },
      totalThoughts: {
        type: "integer",
        description:
          "Estimated total thoughts needed (for backward thinking, start with thoughtNumber = totalThoughts)",
        minimum: 1,
      },
      isRevision: {
        type: "boolean",
        description: "Whether this revises previous thinking",
      },
      revisesThought: {
        type: "integer",
        description: "Which thought is being reconsidered",
        minimum: 1,
      },
      branchFromThought: {
        type: "integer",
        description: "Branching point thought number",
        minimum: 1,
      },
      branchId: {
        type: "string",
        description: "Branch identifier",
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed",
      },
      includeGuide: {
        type: "boolean",
        description:
          "Request the patterns cookbook guide as embedded resource (also provided automatically at thought 1 and final thought)",
      },
      sessionTitle: {
        type: "string",
        description:
          "Title for the reasoning session (used at thought 1 for auto-create). Defaults to timestamp-based title.",
      },
      sessionTags: {
        type: "array",
        items: { type: "string" },
        description:
          "Tags for the reasoning session (used at thought 1 for auto-create). Enables cross-chat discovery.",
      },
    },
    required: [
      "thought",
      "nextThoughtNeeded",
      "thoughtNumber",
      "totalThoughts",
    ],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// Default logger for non-stateful mode
const defaultLogger: Logger = {
  debug: (msg, ...args) => console.error(`[DEBUG] ${msg}`, ...args),
  info: (msg, ...args) => console.error(`[INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.error(`[WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
};

// Server factory - must be synchronous for Smithery SDK compatibility
export default function createServer(
  args: CreateServerArgs | LegacyServerArgs
): Server {
  // Normalize arguments for both stateful and stateless modes
  const sessionId = 'sessionId' in args ? args.sessionId : undefined;
  // Parse config to apply defaults
  const config = configSchema.parse(args.config);
  const logger = 'logger' in args ? args.logger : defaultLogger;

  const server = new McpServer({
    name: "thoughtbox-server",
    version: "1.0.0",
  });

  // Create server instances with MCP session ID for client isolation
  const thinkingServer = new ThoughtboxServer(
    config.disableThoughtLogging,
    undefined,  // Use default storage
    sessionId   // MCP session ID for isolation
  );
  const notebookServer = new NotebookServer();
  const mentalModelsServer = new MentalModelsServer();

  // Log server creation in stateful mode
  if (sessionId) {
    logger.info(`Creating server for MCP session: ${sessionId}`);
  }

  // Initialize persistence layer (fire-and-forget for sync factory)
  // Handlers are resilient to uninitialized state
  thinkingServer.initialize().then(() => {
    logger.info("Persistence layer initialized");
    
    // Pre-load a specific reasoning session if configured
    if (config.reasoningSessionId) {
      thinkingServer.loadSession(config.reasoningSessionId)
        .then(() => logger.info(`Pre-loaded reasoning session: ${config.reasoningSessionId}`))
        .catch((loadErr) => logger.warn(`Failed to pre-load reasoning session ${config.reasoningSessionId}:`, loadErr));
    }
  }).catch((err) => {
    logger.error("Failed to initialize persistence layer:", err);
    // Continue without persistence - in-memory mode
  });

  // Initialize init flow (fire-and-forget for sync factory)
  // handleInit() has fallback for when initHandler is null
  let initHandler: IInitHandler | null = null;
  createInitFlow().then(({ handler, stats, errors }) => {
    initHandler = handler;
    logger.info(`Init flow index built: ${stats.sessionsIndexed} sessions, ${stats.projectsFound} projects, ${stats.tasksFound} tasks (${stats.buildTimeMs}ms)`);
    if (errors.length > 0) {
      logger.warn(`Init flow index encountered ${errors.length} errors during build`);
    }
  }).catch((err) => {
    logger.error("Failed to initialize init flow:", err);
    // Continue without init flow
  });

  // Sync mental models to filesystem for inspection (fire-and-forget)
  // URI: thoughtbox://mental-models/{tag}/{model} → ~/.thoughtbox/mental-models/{tag}/{model}.md
  mentalModelsServer.syncToFilesystem().catch((err) => {
    logger.error("Failed to sync mental models to filesystem:", err);
  });

  // Note: NotebookServer uses lazy initialization - temp directories created on first use

  // Register tools using McpServer's registerTool API
  server.registerTool("thoughtbox", {
    description: CLEAR_THOUGHT_TOOL.description,
    inputSchema: z.object({
      thought: z.string().describe("Your current thinking step"),
      nextThoughtNeeded: z.boolean().describe("Whether another thought step is needed"),
      thoughtNumber: z.number().int().min(1).describe("Current thought number (can be 1→N for forward thinking, or N→1 for backward/goal-driven thinking)"),
      totalThoughts: z.number().int().min(1).describe("Estimated total thoughts needed (for backward thinking, start with thoughtNumber = totalThoughts)"),
      isRevision: z.boolean().optional().describe("Whether this revises previous thinking"),
      revisesThought: z.number().int().min(1).optional().describe("Which thought is being reconsidered"),
      branchFromThought: z.number().int().min(1).optional().describe("Branching point thought number"),
      branchId: z.string().optional().describe("Branch identifier"),
      needsMoreThoughts: z.boolean().optional().describe("If more thoughts are needed"),
      includeGuide: z.boolean().optional().describe("Request the patterns cookbook guide as embedded resource (also provided automatically at thought 1 and final thought)"),
      sessionTitle: z.string().optional().describe("Title for the reasoning session (used at thought 1 for auto-create). Defaults to timestamp-based title."),
      sessionTags: z.array(z.string()).optional().describe("Tags for the reasoning session (used at thought 1 for auto-create). Enables cross-chat discovery."),
    }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  }, async (args) => {
    return await thinkingServer.processThought(args);
  });

  server.registerTool("notebook", {
    description: NOTEBOOK_TOOL.description,
    inputSchema: z.object({
      operation: z.enum(getOperationNames() as [string, ...string[]]).describe("The notebook operation to execute"),
      args: z.record(z.string(), z.unknown()).optional().describe("Arguments for the operation (varies by operation)"),
    }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    _meta: NOTEBOOK_TOOL._meta,
  }, async ({ operation, args }) => {
    return notebookServer.processTool(operation, args || {});
  });

  server.registerTool("mental_models", {
    description: MENTAL_MODELS_TOOL.description,
    inputSchema: z.object({
      operation: z.enum(["get_model", "list_models", "list_tags", "get_capability_graph"]).describe("The operation to execute"),
      args: z.object({
        model: z.string().optional().describe("Name of the mental model to retrieve (for get_model)"),
        tag: z.string().optional().describe("Tag to filter models by (for list_models)"),
      }).optional().describe("Arguments for the operation"),
    }),
    annotations: MENTAL_MODELS_TOOL.annotations,
  }, async ({ operation, args }) => {
    const result = await mentalModelsServer.processTool(operation, args || {});
    // Transform content to have proper literal types for McpServer
    const content: Array<{ type: "text"; text: string }> = result.content
      .filter((c): c is { type: string; text: string } => c.type === "text" && typeof c.text === "string")
      .map(c => ({ type: "text" as const, text: c.text }));
    return { content, isError: result.isError };
  });

  // Export reasoning chain tool
  server.registerTool("export_reasoning_chain", {
    description: "Export a reasoning session to filesystem as linked JSON structure. Useful for persisting reasoning chains, sharing sessions, or archiving completed work.",
    inputSchema: z.object({
      sessionId: z.string().optional().describe("Session ID to export (uses current session if omitted)"),
      destination: z.string().optional().describe("Custom export directory path (default: ~/.thoughtbox/exports/)"),
    }),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
  }, async ({ sessionId, destination }) => {
    const targetSession = sessionId || thinkingServer.getCurrentSessionId();
    if (!targetSession) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: "No active session to export. Provide a sessionId or start a reasoning session first." }, null, 2),
        }],
        isError: true,
      };
    }

    try {
      const result = await thinkingServer.exportReasoningChain(targetSession, destination);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            exportPath: result.path,
            sessionId: result.session.id,
            sessionTitle: result.session.title,
            nodeCount: result.nodeCount,
            exportedAt: new Date().toISOString(),
          }, null, 2),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: (err as Error).message }, null, 2),
        }],
        isError: true,
      };
    }
  });

  // Register prompts using McpServer's registerPrompt API
  server.registerPrompt("list_mcp_assets", {
    description: LIST_MCP_ASSETS_PROMPT.description,
  }, async () => ({
    messages: [{
      role: "assistant" as const,
      content: { type: "text" as const, text: getListMcpAssetsContent() },
    }],
  }));

  server.registerPrompt("interleaved-thinking", {
    description: INTERLEAVED_THINKING_PROMPT.description,
    argsSchema: {
      task: z.string().describe("The task to reason about"),
      thoughts_limit: z.string().optional().describe("Maximum number of thoughts"),
      clear_folder: z.string().optional().describe("Whether to clear folder (true/false)"),
    },
  }, async (args) => {
    // Validate required argument (defensive check - Zod schema should enforce this)
    if (!args.task) {
      throw new Error("Missing required argument: task");
    }
    const content = getInterleavedThinkingContent({
      task: args.task,
      thoughts_limit: args.thoughts_limit ? parseInt(args.thoughts_limit, 10) : undefined,
      clear_folder: args.clear_folder === "true",
    });
    return {
      messages: [{
        role: "user" as const,
        content: { type: "text" as const, text: content },
      }],
    };
  });

  // Register static resources using McpServer's registerResource API
  server.registerResource("status", "system://status", {
    description: "Health snapshot of the notebook server",
    mimeType: "application/json",
  }, async (uri) => ({
    contents: [{ uri: uri.toString(), mimeType: "application/json", text: JSON.stringify(notebookServer.getStatus(), null, 2) }],
  }));

  server.registerResource("notebook-operations", "thoughtbox://notebook/operations", {
    description: "Complete catalog of notebook operations with schemas and examples",
    mimeType: "application/json",
  }, async (uri) => ({
    contents: [{ uri: uri.toString(), mimeType: "application/json", text: notebookServer.getOperationsCatalog() }],
  }));

  server.registerResource("patterns-cookbook", "thoughtbox://patterns-cookbook", {
    description: "Guide to core reasoning patterns for thoughtbox tool",
    mimeType: "text/markdown",
  }, async (uri) => ({
    contents: [{ uri: uri.toString(), mimeType: "text/markdown", text: PATTERNS_COOKBOOK }],
  }));

  server.registerResource("architecture", "thoughtbox://architecture", {
    description: "Interactive notebook explaining Thoughtbox MCP server architecture and implementation patterns",
    mimeType: "text/markdown",
  }, async (uri) => ({
    contents: [{ uri: uri.toString(), mimeType: "text/markdown", text: SERVER_ARCHITECTURE_GUIDE }],
  }));

  server.registerResource("mental-models-operations", "thoughtbox://mental-models/operations", {
    description: "Complete catalog of mental models, tags, and operations",
    mimeType: "application/json",
  }, async (uri) => ({
    contents: [{ uri: uri.toString(), mimeType: "application/json", text: mentalModelsServer.getOperationsCatalog() }],
  }));

  // Register resource templates
  server.registerResource(
    "interleaved-guide",
    new ResourceTemplate("thoughtbox://interleaved/{guide}", { list: undefined }),
    { description: "Interleaved thinking guides", mimeType: "text/markdown" },
    async (uri, { guide }) => ({
      contents: [getInterleavedGuideForUri(`thoughtbox://interleaved/${guide}`)],
    })
  );

  // Mental models root directory (static resource)
  server.registerResource("mental-models-root", "thoughtbox://mental-models", {
    description: "Mental models root directory",
    mimeType: "application/json",
  }, async (uri) => {
    const content = getMentalModelsResourceContent(uri.toString());
    if (!content) throw new Error(`Unknown resource: ${uri}`);
    return { contents: [content] };
  });

  // Mental models tag directory (template with single path segment)
  server.registerResource(
    "mental-models-tag",
    new ResourceTemplate("thoughtbox://mental-models/{tag}", { list: undefined }),
    { description: "Mental models by tag", mimeType: "application/json" },
    async (uri, { tag }) => {
      const content = getMentalModelsResourceContent(uri.toString());
      if (!content) throw new Error(`Unknown resource: ${uri}`);
      return { contents: [content] };
    }
  );

  // Mental model content (template with tag/model path)
  server.registerResource(
    "mental-model-by-tag",
    new ResourceTemplate("thoughtbox://mental-models/{tag}/{model}", { list: undefined }),
    { description: "Mental model content by tag path", mimeType: "text/markdown" },
    async (uri, { tag, model }) => {
      const content = getMentalModelsResourceContent(uri.toString());
      if (!content) throw new Error(`Unknown resource: ${uri}`);
      return { contents: [content] };
    }
  );

  // Init flow resources using path segments
  // Helper to extract string from template param (can be string | string[])
  const str = (val: string | string[] | undefined): string | undefined =>
    Array.isArray(val) ? val[0] : val;

  // Helper to validate mode param
  const asMode = (val: string | undefined): 'new' | 'continue' | undefined =>
    val === 'new' || val === 'continue' ? val : undefined;

  // Helper for init handler fallback
  const handleInit = (params: { mode?: 'new' | 'continue'; project?: string; task?: string; aspect?: string }) => {
    if (!initHandler) {
      return {
        uri: "thoughtbox://init",
        mimeType: "text/markdown",
        text: `# Thoughtbox Init\n\nSession index not available. You can start using tools directly.\n\n## Available Tools\n\n- \`thoughtbox\` — Step-by-step reasoning\n- \`notebook\` — Literate programming notebooks\n- \`mental_models\` — Structured reasoning frameworks`
      };
    }
    return initHandler.handle(params);
  };

  // Entry point (static resource)
  server.registerResource("init", "thoughtbox://init", {
    description: "START HERE: Initialize Thoughtbox session before using other tools. Loads context from previous sessions and guides you through project/task selection.",
    mimeType: "text/markdown"
  }, async (uri) => ({
    contents: [handleInit({})]
  }));

  // Mode selection: thoughtbox://init/{mode}
  server.registerResource(
    "init-mode",
    new ResourceTemplate("thoughtbox://init/{mode}", { list: undefined }),
    { description: "Init flow mode selection", mimeType: "text/markdown" },
    async (uri, params) => ({
      contents: [handleInit({ mode: asMode(str(params.mode)) })]
    })
  );

  // Project selection: thoughtbox://init/{mode}/{project}
  server.registerResource(
    "init-project",
    new ResourceTemplate("thoughtbox://init/{mode}/{project}", { list: undefined }),
    { description: "Init flow project selection", mimeType: "text/markdown" },
    async (uri, params) => ({
      contents: [handleInit({ mode: asMode(str(params.mode)), project: str(params.project) })]
    })
  );

  // Task selection: thoughtbox://init/{mode}/{project}/{task}
  server.registerResource(
    "init-task",
    new ResourceTemplate("thoughtbox://init/{mode}/{project}/{task}", { list: undefined }),
    { description: "Init flow task selection", mimeType: "text/markdown" },
    async (uri, params) => ({
      contents: [handleInit({ mode: asMode(str(params.mode)), project: str(params.project), task: str(params.task) })]
    })
  );

  // Aspect selection (terminal state): thoughtbox://init/{mode}/{project}/{task}/{aspect}
  server.registerResource(
    "init-aspect",
    new ResourceTemplate("thoughtbox://init/{mode}/{project}/{task}/{aspect}", { list: undefined }),
    { description: "Init flow context loaded", mimeType: "text/markdown" },
    async (uri, params) => ({
      contents: [handleInit({ mode: asMode(str(params.mode)), project: str(params.project), task: str(params.task), aspect: str(params.aspect) })]
    })
  );

  // Escape hatch: Use server.server for ListResourcesRequestSchema to include dynamic resources
  // McpServer's registerResource doesn't support dynamic resource lists from getMentalModelsResources()
  server.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      { uri: "thoughtbox://init", name: "Thoughtbox Init Flow", description: "START HERE FIRST: Read this resource before using any Thoughtbox tools. Initializes session context and loads previous work for continuity.", mimeType: "text/markdown" },
      { uri: "system://status", name: "Notebook Server Status", description: "Health snapshot of the notebook server", mimeType: "application/json" },
      { uri: "thoughtbox://notebook/operations", name: "Notebook Operations Catalog", description: "Complete catalog of notebook operations with schemas and examples", mimeType: "application/json" },
      { uri: "thoughtbox://patterns-cookbook", name: "Thoughtbox Patterns Cookbook", description: "Guide to core reasoning patterns for thoughtbox tool", mimeType: "text/markdown" },
      { uri: "thoughtbox://architecture", name: "Server Architecture Guide", description: "Interactive notebook explaining Thoughtbox MCP server architecture and implementation patterns", mimeType: "text/markdown" },
      { uri: "thoughtbox://mental-models/operations", name: "Mental Models Operations Catalog", description: "Complete catalog of mental models, tags, and operations", mimeType: "application/json" },
      // Dynamic mental models browsable hierarchy
      ...getMentalModelsResources(),
    ],
  }));

  // Escape hatch: Use server.server for ListResourceTemplatesRequestSchema to preserve template metadata
  // McpServer's registerResource doesn't preserve annotations and custom metadata from original templates
  server.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
    resourceTemplates: [
      // Init flow resource templates (path-based hierarchy)
      {
        uriTemplate: "thoughtbox://init/{mode}",
        name: "Init Mode Selection",
        description: "Select new or continue mode",
        mimeType: "text/markdown",
      },
      {
        uriTemplate: "thoughtbox://init/{mode}/{project}",
        name: "Init Project Selection",
        description: "Select project for context",
        mimeType: "text/markdown",
      },
      {
        uriTemplate: "thoughtbox://init/{mode}/{project}/{task}",
        name: "Init Task Selection",
        description: "Select task within project",
        mimeType: "text/markdown",
      },
      {
        uriTemplate: "thoughtbox://init/{mode}/{project}/{task}/{aspect}",
        name: "Init Context Loaded",
        description: "Context loaded - ready to work",
        mimeType: "text/markdown",
      },
      ...getInterleavedResourceTemplates().resourceTemplates,
      ...getMentalModelsResourceTemplates().resourceTemplates,
    ],
  }));

  return server.server;
}

// STDIO transport runner (exported for stdio.ts entry point)
export async function runStdioServer() {
  // Get configuration from environment variable (backward compatible)
  const disableThoughtLogging =
    (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";

  // Create server using the exported function (now synchronous)
  const server = createServer({
    config: {
      disableThoughtLogging,
    },
  });

  // Start Observatory server if enabled
  let observatoryServer: ObservatoryServer | null = null;
  const observatoryConfig = loadObservatoryConfig();
  if (observatoryConfig.enabled) {
    observatoryServer = createObservatoryServer(observatoryConfig);
    await observatoryServer.start();
    console.error(`[Observatory] Server started on port ${observatoryConfig.port}`);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Thoughtbox MCP Server running on stdio");

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    if (observatoryServer?.isRunning()) {
      await observatoryServer.stop();
    }
    process.exit(0);
  });
}

// Auto-run when executed directly
runStdioServer();
