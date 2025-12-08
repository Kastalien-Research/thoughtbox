
import { Tool, CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { NotebookServer, NOTEBOOK_TOOL } from "../notebook/index.js";
import { MentalModelsServer, MENTAL_MODELS_TOOL } from "../mental-models/index.js";
import { KnowledgeServer, KNOWLEDGE_TOOL } from "../knowledge/index.js";

// Re-export the clear thought tool definition from the main file or move it here.
// For now, I'll copy the structure or import it if I can extract it.
// Since it was defined inside index.ts, I'll redefine it here as a constant.

export const CLEAR_THOUGHT_TOOL: Tool = {
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

export const ALL_TOOLS = [
    CLEAR_THOUGHT_TOOL, 
    NOTEBOOK_TOOL, 
    MENTAL_MODELS_TOOL, 
    KNOWLEDGE_TOOL
];

export async function handleListTools() {
    return {
        tools: ALL_TOOLS
    };
}

export async function handleCallTool(
    request: CallToolRequest,
    servers: {
        thinking: any; // Using any for now to avoid circular dependency issues, will fix types later
        notebook: NotebookServer;
        mentalModels: MentalModelsServer;
        knowledge: KnowledgeServer;
    }
) {
    if (request.params.name === "thoughtbox") {
      return await servers.thinking.processThought(request.params.arguments);
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

      return servers.notebook.processTool(operation, args || {});
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

      return servers.mentalModels.processTool(operation, args || {});
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

      return servers.knowledge.processTool(operation, args || {});
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
}
