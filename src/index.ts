#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
// Fixed chalk import for ESM
import chalk from "chalk";
import { z } from "zod";
import { PATTERNS_COOKBOOK } from "./resources/patterns-cookbook-content.js";
import { SERVER_ARCHITECTURE_GUIDE } from "./resources/server-architecture-content.js";
import { NotebookServer, NOTEBOOK_TOOL } from "./notebook/index.js";
import {
  MentalModelsServer,
  MENTAL_MODELS_TOOL,
  getMentalModelsResources,
  getMentalModelsResourceTemplates,
  getMentalModelsResourceContent,
} from "./mental-models/index.js";
import {
  KnowledgeServer,
  KNOWLEDGE_TOOL,
  getKnowledgeResources,
  getKnowledgeResourceTemplates,
  getKnowledgeResourceContent,
} from "./knowledge/index.js";
import {
  LIST_MCP_ASSETS_PROMPT,
  getListMcpAssetsContent,
  INTERLEAVED_THINKING_PROMPT,
  getInterleavedThinkingContent,
  getInterleavedResourceTemplates,
  getInterleavedGuideForUri,
} from "./prompts/index.js";
import {
  FileSystemStorage,
  KnowledgeStorage,
  type ThoughtboxStorage,
  type Session,
  type SessionFilter,
  type ThoughtData as PersistentThoughtData,
} from "./persistence/index.js";

// Configuration schema for Smithery
export const configSchema = z.object({
  disableThoughtLogging: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Disable thought output to stderr (useful for production deployments)"
    ),
});

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

  // Persistence layer
  private storage: ThoughtboxStorage;
  private currentSessionId: string | null = null;
  private initialized: boolean = false;

  constructor(
    disableThoughtLogging: boolean = false,
    storage?: ThoughtboxStorage
  ) {
    this.disableThoughtLogging = disableThoughtLogging;
    // Use imported cookbook content (works for both STDIO and HTTP builds)
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

const CLEAR_THOUGHT_TOOL: Tool = {
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

// Exported server creation function for Smithery HTTP transport
export default async function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new Server(
    {
      name: "thoughtbox-server",
      version: "1.1.0",
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
        resourceTemplates: {},
      },
    }
  );

  const thinkingServer = new ThoughtboxServer(config.disableThoughtLogging);
  const notebookServer = new NotebookServer();
  const mentalModelsServer = new MentalModelsServer();
  const knowledgeServer = new KnowledgeServer();
  
  // Shared knowledge storage instance for resource handlers
  const knowledgeStorage = new KnowledgeStorage();

  // Initialize persistence layer
  try {
    await thinkingServer.initialize();
    console.error("Persistence layer initialized");
  } catch (err) {
    console.error("Failed to initialize persistence layer:", err);
    // Continue without persistence - in-memory mode
  }

  // Initialize knowledge server
  try {
    await knowledgeServer.initialize();
    await knowledgeStorage.initialize();
    console.error("Knowledge Zone initialized");
  } catch (err) {
    console.error("Failed to initialize Knowledge Zone:", err);
  }

  // Sync mental models to filesystem for inspection
  // URI: thoughtbox://mental-models/{tag}/{model} → ~/.thoughtbox/mental-models/{tag}/{model}.md
  mentalModelsServer.syncToFilesystem().catch((err) => {
    console.error("Failed to sync mental models to filesystem:", err);
  });

  // Note: NotebookServer uses lazy initialization - temp directories created on first use

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [CLEAR_THOUGHT_TOOL, NOTEBOOK_TOOL, MENTAL_MODELS_TOOL, KNOWLEDGE_TOOL],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "thoughtbox") {
      return await thinkingServer.processThought(request.params.arguments);
    }

    // Handle notebook toolhost dispatcher
    if (request.params.name === "notebook") {
      const { operation, args } = request.params.arguments as any;

      if (!operation || typeof operation !== "string") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: "operation parameter is required and must be a string",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      return notebookServer.processTool(operation, args || {});
    }

    // Handle mental_models toolhost dispatcher
    if (request.params.name === "mental_models") {
      const { operation, args } = request.params.arguments as any;

      if (!operation || typeof operation !== "string") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: "operation parameter is required and must be a string",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      return mentalModelsServer.processTool(operation, args || {});
    }

    // Handle knowledge toolhost dispatcher
    if (request.params.name === "knowledge") {
      const { operation, args } = request.params.arguments as any;

      if (!operation || typeof operation !== "string") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: "operation parameter is required and must be a string",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      return knowledgeServer.processTool(operation, args || {});
    }

    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${request.params.name}`,
        },
      ],
      isError: true,
    };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [LIST_MCP_ASSETS_PROMPT, INTERLEAVED_THINKING_PROMPT],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name === "list_mcp_assets") {
      return {
        description: LIST_MCP_ASSETS_PROMPT.description,
        messages: [
          {
            role: "assistant",
            content: {
              type: "text",
              text: getListMcpAssetsContent(),
            },
          },
        ],
      };
    }

    if (request.params.name === "interleaved-thinking") {
      // Extract arguments - MCP spec says arguments values are always strings
      const args = request.params.arguments ?? {};
      const task = args.task;
      
      if (!task) {
        throw new Error("Missing required argument 'task'");
      }

      // Convert string arguments to proper types
      const thoughts_limit = args.thoughts_limit 
        ? parseInt(args.thoughts_limit, 10) 
        : undefined;
      const clear_folder = args.clear_folder === "true";

      // Get the prompt content with variable substitution
      const content = getInterleavedThinkingContent({
        task: String(task),
        thoughts_limit,
        clear_folder,
      });

      return {
        description: INTERLEAVED_THINKING_PROMPT.description,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: content,
            },
          },
        ],
      };
    }

    throw new Error(`Unknown prompt: ${request.params.name}`);
  });

  // Resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "system://status",
        name: "Notebook Server Status",
        description: "Health snapshot of the notebook server",
        mimeType: "application/json",
      },
      {
        uri: "thoughtbox://notebook/operations",
        name: "Notebook Operations Catalog",
        description: "Complete catalog of notebook operations with schemas and examples",
        mimeType: "application/json",
      },
      {
        uri: "thoughtbox://patterns-cookbook",
        name: "Thoughtbox Patterns Cookbook",
        description: "Guide to core reasoning patterns for thoughtbox tool",
        mimeType: "text/markdown",
      },
      {
        uri: "thoughtbox://architecture",
        name: "Server Architecture Guide",
        description: "Interactive notebook explaining Thoughtbox MCP server architecture and implementation patterns",
        mimeType: "text/markdown",
      },
      {
        uri: "thoughtbox://mental-models/operations",
        name: "Mental Models Operations Catalog",
        description: "Complete catalog of mental models, tags, and operations",
        mimeType: "application/json",
      },
      // Mental models browsable hierarchy
      ...getMentalModelsResources(),
      // Knowledge Zone resources
      ...getKnowledgeResources(),
    ],
  }));

  // Resource template handlers
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    const interleavedTemplates = getInterleavedResourceTemplates();
    const mentalModelsTemplates = getMentalModelsResourceTemplates();
    const knowledgeTemplates = getKnowledgeResourceTemplates();
    return {
      resourceTemplates: [
        ...interleavedTemplates.resourceTemplates,
        ...mentalModelsTemplates.resourceTemplates,
        ...knowledgeTemplates.resourceTemplates,
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    if (uri === "system://status") {
      const status = notebookServer.getStatus();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }

    if (uri === "thoughtbox://notebook/operations") {
      const catalog = notebookServer.getOperationsCatalog();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: catalog,
          },
        ],
      };
    }

    if (uri === "thoughtbox://patterns-cookbook") {
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: PATTERNS_COOKBOOK,
          },
        ],
      };
    }

    if (uri === "thoughtbox://architecture") {
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: SERVER_ARCHITECTURE_GUIDE,
          },
        ],
      };
    }

    if (uri === "thoughtbox://mental-models/operations") {
      const catalog = mentalModelsServer.getOperationsCatalog();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: catalog,
          },
        ],
      };
    }

    // Handle mental models browsable hierarchy
    if (uri.startsWith("thoughtbox://mental-models")) {
      const content = getMentalModelsResourceContent(uri);
      if (content) {
        return {
          contents: [content],
        };
      }
    }

    // Handle interleaved thinking resource templates
    if (uri.startsWith("thoughtbox://interleaved/")) {
      try {
        const resource = getInterleavedGuideForUri(uri);
        return {
          contents: [resource],
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Handle knowledge zone resources
    if (uri === "thoughtbox://knowledge/operations") {
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: knowledgeServer.getOperationsCatalog(),
          },
        ],
      };
    }

    if (uri.startsWith("thoughtbox://knowledge")) {
      const content = await getKnowledgeResourceContent(uri, knowledgeStorage);
      if (content) {
        return {
          contents: [content],
        };
      }
    }

    throw new Error(`Unknown resource: ${uri}`);
  });

  return server;
}

// STDIO transport for backward compatibility
async function runServer() {
  // Get configuration from environment variable (backward compatible)
  const disableThoughtLogging =
    (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";

  // Create server using the exported function (now async)
  const server = await createServer({
    config: {
      disableThoughtLogging,
    },
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Thoughtbox MCP Server running on stdio");
}

// Auto-run for STDIO usage (dist/index.js is never imported, only executed)
runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
