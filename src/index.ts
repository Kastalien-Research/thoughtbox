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
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
// Fixed chalk import for ESM
import chalk from "chalk";
import { z } from "zod";
import { PATTERNS_COOKBOOK } from "./resources/patterns-cookbook-content.js";
import { SERVER_ARCHITECTURE_GUIDE } from "./resources/server-architecture-content.js";
import { NotebookServer, NOTEBOOK_TOOL } from "./notebook/index.js";
import {
  INTERLEAVED_THINKING_PROMPT,
  getInterleavedThinkingContent,
} from "./prompts/index.js";

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
}

class ClearThoughtServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};
  private disableThoughtLogging: boolean;
  private patternsCookbook: string;

  constructor(disableThoughtLogging: boolean = false) {
    this.disableThoughtLogging = disableThoughtLogging;
    // Use imported cookbook content (works for both STDIO and HTTP builds)
    this.patternsCookbook = PATTERNS_COOKBOOK;
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

  public processThought(input: unknown): {
    content: Array<any>;
    isError?: boolean;
  } {
    try {
      const validatedInput = this.validateThoughtData(input);

      if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
        validatedInput.totalThoughts = validatedInput.thoughtNumber;
      }

      this.thoughtHistory.push(validatedInput);

      if (validatedInput.branchFromThought && validatedInput.branchId) {
        if (!this.branches[validatedInput.branchId]) {
          this.branches[validatedInput.branchId] = [];
        }
        this.branches[validatedInput.branchId].push(validatedInput);
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

const LIST_MCP_ASSETS_PROMPT = {
  name: "list_mcp_assets",
  title: "list_mcp_assets",
  description:
    "Overview of all MCP capabilities, tools, resources, and quickstart guide",
  arguments: [],
};

const CLEAR_THOUGHT_TOOL: Tool = {
  name: "clear_thought",
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
    },
    required: [
      "thought",
      "nextThoughtNeeded",
      "thoughtNumber",
      "totalThoughts",
    ],
  },
  annotations: {
    audience: ["assistant"],
    priority: 0.85,
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// Exported server creation function for Smithery HTTP transport
export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new Server(
    {
      name: "thoughtbox-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    }
  );

  const thinkingServer = new ClearThoughtServer(config.disableThoughtLogging);
  const notebookServer = new NotebookServer();

  // Note: NotebookServer uses lazy initialization - temp directories created on first use

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [CLEAR_THOUGHT_TOOL, NOTEBOOK_TOOL],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "clear_thought") {
      return thinkingServer.processThought(request.params.arguments);
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
      const markdown = `# Thoughtbox MCP Server Capabilities

## Prompts
- \`list_mcp_assets()\` — Overview of tools/resources and quickstart steps (this prompt)

## Tools
- \`clear_thought(thought, thoughtNumber, totalThoughts, ...)\` — Sequential thinking for complex problem-solving
  - Supports forward thinking (1→N), backward thinking (N→1), and branching
  - Automatic Thoughtbox patterns cookbook at thought 1 and final thought

- \`notebook(operation, args)\` — Toolhost for literate programming notebooks
  - Operations: \`create\`, \`list\`, \`load\`, \`add_cell\`, \`update_cell\`, \`run_cell\`, \`install_deps\`, \`list_cells\`, \`get_cell\`, \`export\`
  - Full operation reference: \`thoughtbox://notebook/operations\`

## Resources
- \`system://status\` — Notebook server health snapshot
- \`thoughtbox://notebook/operations\` — Notebook operations catalog with schemas and examples
- \`thoughtbox://patterns-cookbook\` — Clear Thought patterns guide
- \`thoughtbox://architecture\` — Interactive guide to Thoughtbox architecture and implementation

## Quick Start

### Thoughtbox Reasoning
\`\`\`
clear_thought({
  thought: "Breaking down the problem...",
  thoughtNumber: 1,
  totalThoughts: 10,
  nextThoughtNeeded: true
})
\`\`\`

### Notebooks
\`\`\`
notebook({
  operation: "create",
  args: { title: "My Notebook", language: "typescript" }
})

notebook({
  operation: "add_cell",
  args: {
    notebookId: "abc123",
    cellType: "code",
    content: "console.log('Hello!');",
    filename: "hello.ts"
  }
})

notebook({
  operation: "run_cell",
  args: { notebookId: "abc123", cellId: "cell456" }
})
\`\`\`
`;

      return {
        description: "MCP server capabilities overview",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: markdown,
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
        description: "Guide to core reasoning patterns for clear_thought tool",
        mimeType: "text/markdown",
      },
      {
        uri: "thoughtbox://architecture",
        name: "Server Architecture Guide",
        description: "Interactive notebook explaining Thoughtbox MCP server architecture and implementation patterns",
        mimeType: "text/markdown",
      },
    ],
  }));

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

    throw new Error(`Unknown resource: ${uri}`);
  });

  return server;
}

// STDIO transport for backward compatibility
async function runServer() {
  // Get configuration from environment variable (backward compatible)
  const disableThoughtLogging =
    (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";

  // Create server using the exported function
  const server = createServer({
    config: {
      disableThoughtLogging,
    },
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Clear Thought MCP Server running on stdio");
}

// Auto-run for STDIO usage (dist/index.js is never imported, only executed)
runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
