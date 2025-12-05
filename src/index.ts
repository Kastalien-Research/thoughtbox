#!/usr/bin/env node

import { writeFileSync } from "fs";
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
  LIST_MCP_ASSETS_PROMPT,
  getListMcpAssetsContent,
  INTERLEAVED_THINKING_PROMPT,
  getInterleavedThinkingContent,
  getInterleavedResourceTemplates,
  getInterleavedGuideForUri,
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
  includeChart?: boolean;
  nextThoughtNeeded: boolean;
}

class ClearThoughtServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};
  private disableThoughtLogging: boolean;
  private patternsCookbook: string;
  private sessionTimestamp: string;

  constructor(disableThoughtLogging: boolean = false) {
    this.sessionTimestamp = Date.now().toString();
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
      includeChart: data.includeChart as boolean | undefined,
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

  /**
   * Format a compact inline summary of the reasoning chain.
   * Shows thought number, type indicator, and truncated first line.
   */
  private formatCompactChain(thoughts: ThoughtData[]): string {
    return thoughts
      .map((t) => {
        const typeIndicator = t.isRevision
          ? "↩"
          : t.branchFromThought
            ? "⑂"
            : "→";
        const firstLine = t.thought.split("\n")[0].slice(0, 50);
        const ellipsis = t.thought.split("\n")[0].length > 50 ? "..." : "";
        return `T${t.thoughtNumber}${typeIndicator}: ${firstLine}${ellipsis}`;
      })
      .join("\n");
  }

  /**
   * Format the full reasoning chain as markdown for file export.
   */
  private formatFullChain(thoughts: ThoughtData[]): string {
    const lines = ["# Thoughtbox Reasoning Chain", ""];

    for (const t of thoughts) {
      let header = `## Thought ${t.thoughtNumber}/${t.totalThoughts}`;
      if (t.isRevision && t.revisesThought) {
        header += ` (Revision of T${t.revisesThought})`;
      } else if (t.branchFromThought && t.branchId) {
        header += ` (Branch "${t.branchId}" from T${t.branchFromThought})`;
      }

      lines.push(header);
      lines.push("");
      lines.push(t.thought);
      lines.push("");
      lines.push(
        `*Status: ${t.nextThoughtNeeded ? "More thoughts needed" : "Complete"}*`
      );
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Generate Mermaid flowchart from reasoning chain.
   */
  private generateReasoningChart(thoughts: ThoughtData[]): string {
    const mermaid = ["flowchart TD"];

    // Add nodes
    for (const t of thoughts) {
      const label = t.thought
        .split("\n")[0]
        .slice(0, 40)
        .replace(/"/g, "'")
        .replace(/[[\]{}()<>]/g, "");
      const shape = t.isRevision ? "((" : t.branchFromThought ? "{{" : "[";
      const end = t.isRevision ? "))" : t.branchFromThought ? "}}" : "]";
      mermaid.push(`  T${t.thoughtNumber}${shape}"${label}"${end}`);
    }

    // Add edges
    for (let i = 1; i < thoughts.length; i++) {
      const t = thoughts[i];
      const prev = thoughts[i - 1];
      if (t.isRevision && t.revisesThought) {
        mermaid.push(`  T${t.thoughtNumber} -.->|revises| T${t.revisesThought}`);
      } else if (t.branchFromThought) {
        mermaid.push(
          `  T${t.branchFromThought} ==>|branch| T${t.thoughtNumber}`
        );
      } else {
        mermaid.push(`  T${prev.thoughtNumber} --> T${t.thoughtNumber}`);
      }
    }

    // Wrap in HTML with Mermaid CDN
    const mermaidCode = mermaid.join("\n");
    return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Reasoning Flow</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
  body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
  h1 { color: #2c3e50; }
  .mermaid { background: #f8f9fa; padding: 20px; border-radius: 8px; }
</style>
</head><body>
<h1>Reasoning Flow</h1>
<p>Generated from ${thoughts.length} thoughts</p>
<div class="mermaid">
${mermaidCode}
</div>
<script>mermaid.initialize({startOnLoad:true,theme:'default'})</script>
</body></html>`;
  }

  private generateThoughtDashboardHtml(): string {
    const thoughts = this.thoughtHistory.map((t) => {
      let typeClass = "thought";
      let typeLabel = "Thought";
      if (t.isRevision) {
        typeClass = "revision";
        typeLabel = "Revision";
      } else if (t.branchFromThought) {
        typeClass = "branch";
        typeLabel = "Branch";
      }

      return `
        <div class="card ${typeClass}">
          <div class="header">
            <span class="badge ${typeClass}">${typeLabel}</span>
            <span class="number">#${t.thoughtNumber}</span>
            ${t.revisesThought ? `<span class="ref">Revises #${t.revisesThought}</span>` : ""}
            ${t.branchFromThought ? `<span class="ref">From #${t.branchFromThought}</span>` : ""}
          </div>
          <div class="content">${t.thought}</div>
          <div class="footer">
            <span class="status">${t.nextThoughtNeeded ? "More needed" : "Complete"}</span>
          </div>
        </div>
      `;
    }).join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: system-ui, sans-serif; padding: 20px; background: #f0f0f0; }
          .card { background: white; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 0.9em; color: #666; }
          .badge { padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8em; text-transform: uppercase; }
          .thought .badge { background: #e3f2fd; color: #1565c0; }
          .revision .badge { background: #fff3e0; color: #ef6c00; }
          .branch .badge { background: #e8f5e9; color: #2e7d32; }
          .content { white-space: pre-wrap; line-height: 1.5; }
          .footer { margin-top: 12px; font-size: 0.8em; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
        </style>
      </head>
      <body>
        <h1>Thinking Process</h1>
        ${thoughts}
      </body>
      </html>
    `;
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

      // Include reasoning chain summary at thought 2 and N-1
      // Gives agents using forward (thought 2) or backward (N-1) reasoning a chance to review their chain
      const isSecondThought = validatedInput.thoughtNumber === 2;
      const isPenultimate =
        validatedInput.thoughtNumber === validatedInput.totalThoughts - 1;
      const shouldIncludeChain = isSecondThought || isPenultimate;

      if (shouldIncludeChain) {
        // Write full chain to file for detailed inspection
        const fullChain = this.formatFullChain(this.thoughtHistory);
        const chainFilePath = `/tmp/thoughtbox-reasoning-${this.sessionTimestamp}.md`;
        writeFileSync(chainFilePath, fullChain);

        // Build compact summary for inline display
        const compactChain = this.formatCompactChain(this.thoughtHistory);

        if (isSecondThought) {
          content.push({
            type: "text",
            text: `## Reasoning Chain\n\n${compactChain}\n\nFull history: ${chainFilePath}\n\n*You can branch from any thought or revise previous thoughts as you progress.*`,
          });
        } else if (isPenultimate) {
          content.push({
            type: "text",
            text: `## Reasoning Chain (Review Before Finalizing)\n\n${compactChain}\n\nFull history: ${chainFilePath}\n\n*Consider: Are there gaps? Should you revise any earlier thoughts? Branch to explore alternatives?*`,
          });
        }
      }

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

      // Generate Mermaid chart when requested on final thought
      if (
        validatedInput.includeChart &&
        !validatedInput.nextThoughtNeeded &&
        this.thoughtHistory.length > 0
      ) {
        const chartHtml = this.generateReasoningChart(this.thoughtHistory);
        const chartPath = `/tmp/thoughtbox-chart-${this.sessionTimestamp}.html`;
        writeFileSync(chartPath, chartHtml);

        content.push({
          type: "text",
          text: `\n📊 Reasoning chart: ${chartPath}\nView with: open ${chartPath}`,
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
      includeChart: {
        type: "boolean",
        description:
          "Generate visual Mermaid flowchart of reasoning process (returns file path to HTML)",
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
        resourceTemplates: {},
      },
    }
  );

  const thinkingServer = new ClearThoughtServer(config.disableThoughtLogging);
  const notebookServer = new NotebookServer();
  const mentalModelsServer = new MentalModelsServer();

  // Sync mental models to filesystem for inspection
  // URI: thoughtbox://mental-models/{tag}/{model} → ~/.thoughtbox/mental-models/{tag}/{model}.md
  mentalModelsServer.syncToFilesystem().catch((err) => {
    console.error("Failed to sync mental models to filesystem:", err);
  });

  // Note: NotebookServer uses lazy initialization - temp directories created on first use

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [CLEAR_THOUGHT_TOOL, NOTEBOOK_TOOL, MENTAL_MODELS_TOOL],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "thoughtbox") {
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
    ],
  }));

  // Resource template handlers
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    const interleavedTemplates = getInterleavedResourceTemplates();
    const mentalModelsTemplates = getMentalModelsResourceTemplates();
    return {
      resourceTemplates: [
        ...interleavedTemplates.resourceTemplates,
        ...mentalModelsTemplates.resourceTemplates,
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
  console.error("Thoughtbox MCP Server running on stdio");
}

// Auto-run for STDIO usage (dist/index.js is never imported, only executed)
runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
