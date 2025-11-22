/**
 * MCP Sampling Implementation Examples for Thoughtbox
 *
 * This file demonstrates practical patterns for implementing the MCP sampling
 * primitive in the Thoughtbox server.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  CreateMessageResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// ============================================================================
// EXAMPLE 1: Adding Sampling to NotebookServer
// ============================================================================

/**
 * Add a new "explain_code" operation to the notebook server that uses
 * sampling to explain code in a cell.
 */

// Step 1: Define the operation schema
const ExplainCodeOperationSchema = z.object({
  operation: z.literal("explain_code"),
  args: z.object({
    cellId: z.string().describe("The ID of the cell to explain"),
    detailLevel: z
      .enum(["brief", "detailed"])
      .optional()
      .default("detailed")
      .describe("How detailed the explanation should be"),
  }),
});

// Step 2: Implement the operation handler
async function handleExplainCode(
  args: z.infer<typeof ExplainCodeOperationSchema>["args"],
  cellContent: string,
  extra: any // RequestHandlerExtra from MCP SDK
) {
  // Check if client supports sampling
  const server = extra.server; // You'll need to pass this through
  const capabilities = server.getClientCapabilities();

  if (!capabilities?.sampling) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error:
                "This operation requires a client that supports MCP sampling",
              requiredCapability: "sampling",
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  // Craft the sampling request
  const systemPrompt =
    args.detailLevel === "brief"
      ? "You are a code explanation assistant. Provide concise, clear explanations focusing on what the code does and why."
      : "You are a code explanation assistant. Provide detailed explanations including what the code does, how it works, why specific approaches were used, and potential improvements.";

  const maxTokens = args.detailLevel === "brief" ? 300 : 800;

  try {
    // Make the sampling request
    const result = await extra.sendRequest(
      {
        method: "sampling/createMessage",
        params: {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Explain this TypeScript code:\n\n\`\`\`typescript\n${cellContent}\n\`\`\``,
              },
            },
          ],
          systemPrompt,
          maxTokens,
          modelPreferences: {
            // Prioritize intelligence and speed over cost for code explanation
            intelligencePriority: 0.8,
            speedPriority: 0.7,
            costPriority: 0.5,
            hints: [{ name: "claude" }], // Prefer Claude models
          },
        },
      },
      CreateMessageResultSchema
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              cellId: args.cellId,
              explanation: result.content.text,
              model: result.model,
              detailLevel: args.detailLevel,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: "Sampling request failed or was rejected by user",
              details: error instanceof Error ? error.message : String(error),
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

// ============================================================================
// EXAMPLE 2: Mental Model Application with Sampling
// ============================================================================

/**
 * Add an "apply_model" operation to the mental models server that uses
 * sampling to apply a mental model to a user's problem.
 */

const ApplyModelOperationSchema = z.object({
  operation: z.literal("apply_model"),
  args: z.object({
    modelName: z.string().describe("The name of the mental model to apply"),
    problem: z.string().describe("The problem to analyze"),
    additionalContext: z
      .string()
      .optional()
      .describe("Any additional context about the problem"),
  }),
});

async function handleApplyModel(
  args: z.infer<typeof ApplyModelOperationSchema>["args"],
  modelContent: string,
  extra: any
) {
  const server = extra.server;
  const capabilities = server.getClientCapabilities();

  if (!capabilities?.sampling) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error:
              "Mental model application requires a client that supports MCP sampling",
          }),
        },
      ],
      isError: true,
    };
  }

  // Build the prompt
  let userMessage = `Mental Model: ${args.modelName}\n\n${modelContent}\n\n---\n\nProblem to analyze:\n${args.problem}`;

  if (args.additionalContext) {
    userMessage += `\n\nAdditional context:\n${args.additionalContext}`;
  }

  userMessage += `\n\n---\n\nPlease apply this mental model to analyze the problem. Explain:
1. How the mental model applies to this specific problem
2. Key insights from this perspective
3. Recommended actions or considerations`;

  try {
    const result = await extra.sendRequest(
      {
        method: "sampling/createMessage",
        params: {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: userMessage,
              },
            },
          ],
          systemPrompt:
            "You are a reasoning assistant that applies mental models and frameworks to real-world problems. Provide clear, actionable insights.",
          maxTokens: 1500,
          modelPreferences: {
            // Prioritize intelligence for deep reasoning
            intelligencePriority: 0.95,
            speedPriority: 0.4,
            costPriority: 0.3,
          },
        },
      },
      CreateMessageResultSchema
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              modelName: args.modelName,
              problem: args.problem,
              analysis: result.content.text,
              llmModel: result.model,
              stopReason: result.stopReason,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to apply mental model",
            details: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
      isError: true,
    };
  }
}

// ============================================================================
// EXAMPLE 3: Thought Validation with Sampling
// ============================================================================

/**
 * Enhance the ClearThoughtServer to validate thoughts using sampling.
 * This could be an optional feature controlled by a parameter.
 */

const ValidateThoughtSchema = z.object({
  thought: z.string(),
  thoughtNumber: z.number(),
  validationType: z
    .enum(["logical", "comprehensive", "creative"])
    .optional()
    .default("logical"),
});

async function validateThought(
  args: z.infer<typeof ValidateThoughtSchema>,
  thoughtHistory: string[],
  extra: any
) {
  const validationPrompts = {
    logical:
      "Analyze this reasoning step for logical consistency. Identify any fallacies, gaps in reasoning, or unfounded assumptions.",
    comprehensive:
      "Evaluate if this reasoning step adequately addresses the problem. Suggest what might be missing or what should be explored further.",
    creative:
      "Consider alternative perspectives or approaches that weren't explored in this reasoning step. Suggest creative alternatives.",
  };

  const systemPrompt = `You are a critical thinking assistant. ${validationPrompts[args.validationType]}`;

  const contextStr =
    thoughtHistory.length > 0
      ? `\n\nPrevious thoughts:\n${thoughtHistory.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
      : "";

  try {
    const result = await extra.sendRequest(
      {
        method: "sampling/createMessage",
        params: {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Current thought (step ${args.thoughtNumber}):\n${args.thought}${contextStr}\n\nProvide validation and suggestions:`,
              },
            },
          ],
          systemPrompt,
          maxTokens: 500,
          modelPreferences: {
            intelligencePriority: 0.9,
            speedPriority: 0.6,
            costPriority: 0.5,
          },
        },
      },
      CreateMessageResultSchema
    );

    return {
      validationType: args.validationType,
      feedback: result.content.text,
      model: result.model,
    };
  } catch (error) {
    return {
      validationType: args.validationType,
      feedback: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// EXAMPLE 4: Multi-turn Conversation Pattern
// ============================================================================

/**
 * Demonstrate a multi-turn conversation pattern where the server maintains
 * conversation history and builds context across multiple sampling requests.
 */

class ConversationalMentalModelAssistant {
  private conversationHistory: Map<
    string,
    Array<{ role: "user" | "assistant"; content: string }>
  > = new Map();

  async chat(
    sessionId: string,
    userMessage: string,
    mentalModelContext: string | null,
    extra: any
  ) {
    // Get or initialize conversation history
    if (!this.conversationHistory.has(sessionId)) {
      this.conversationHistory.set(sessionId, []);
    }

    const history = this.conversationHistory.get(sessionId)!;

    // Add user message to history
    history.push({
      role: "user",
      content: userMessage,
    });

    // Build messages array for sampling
    const messages = history.map((msg) => ({
      role: msg.role,
      content: {
        type: "text" as const,
        text: msg.content,
      },
    }));

    // Build system prompt with mental model context if provided
    let systemPrompt =
      "You are a reasoning assistant that helps users think through problems using mental models and structured thinking.";

    if (mentalModelContext) {
      systemPrompt += `\n\nRelevant mental model context:\n${mentalModelContext}`;
    }

    try {
      const result = await extra.sendRequest(
        {
          method: "sampling/createMessage",
          params: {
            messages,
            systemPrompt,
            maxTokens: 1000,
            modelPreferences: {
              intelligencePriority: 0.85,
              speedPriority: 0.7,
              costPriority: 0.5,
            },
          },
        },
        CreateMessageResultSchema
      );

      // Add assistant response to history
      history.push({
        role: "assistant",
        content: result.content.text,
      });

      // Limit history length to prevent token overflow
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      return {
        success: true,
        response: result.content.text,
        model: result.model,
        conversationLength: history.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  clearConversation(sessionId: string) {
    this.conversationHistory.delete(sessionId);
  }
}

// ============================================================================
// EXAMPLE 5: Code Generation with Iterative Refinement
// ============================================================================

/**
 * Generate code using sampling, then optionally refine it based on feedback.
 */

async function generateCode(
  description: string,
  language: string,
  context: string | null,
  extra: any
) {
  const server = extra.server;
  const capabilities = server.getClientCapabilities();

  if (!capabilities?.sampling) {
    throw new Error("Code generation requires sampling support");
  }

  let prompt = `Generate ${language} code for the following:\n\n${description}`;

  if (context) {
    prompt += `\n\nContext:\n${context}`;
  }

  prompt += `\n\nRequirements:
- Write clean, readable code
- Include type annotations where applicable
- Add brief comments for complex logic
- Follow best practices for ${language}`;

  const result = await extra.sendRequest(
    {
      method: "sampling/createMessage",
      params: {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: prompt,
            },
          },
        ],
        systemPrompt: `You are a code generation assistant. Generate clean, well-structured ${language} code.`,
        maxTokens: 1500,
        modelPreferences: {
          intelligencePriority: 0.85,
          speedPriority: 0.6,
          costPriority: 0.5,
          hints: [{ name: "claude" }],
        },
      },
    },
    CreateMessageResultSchema
  );

  return {
    code: result.content.text,
    model: result.model,
  };
}

async function refineCode(
  originalCode: string,
  refinementInstructions: string,
  extra: any
) {
  const result = await extra.sendRequest(
    {
      method: "sampling/createMessage",
      params: {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Original code:\n\`\`\`\n${originalCode}\n\`\`\`\n\nRefinement request:\n${refinementInstructions}\n\nProvide the refined code:`,
            },
          },
        ],
        systemPrompt:
          "You are a code refinement assistant. Improve code based on specific feedback while maintaining its core functionality.",
        maxTokens: 1500,
        modelPreferences: {
          intelligencePriority: 0.8,
          speedPriority: 0.7,
          costPriority: 0.6,
        },
      },
    },
    CreateMessageResultSchema
  );

  return {
    refinedCode: result.content.text,
    model: result.model,
  };
}

// ============================================================================
// EXAMPLE 6: Integrating with Existing Server
// ============================================================================

/**
 * Example of how to modify the main server setup to support sampling.
 */

function setupServerWithSampling() {
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
        // Note: Server doesn't need to declare sampling capability
        // Only clients declare this
      },
    }
  );

  // Set up tool handler with access to sendRequest
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    // extra.sendRequest is available here for sampling

    if (request.params.name === "notebook") {
      const { operation, args } = request.params.arguments as any;

      // Check if this is a sampling-powered operation
      if (operation === "explain_code") {
        // Get cell content (pseudo-code)
        const cellContent = "/* ... */";

        return await handleExplainCode(
          args,
          cellContent,
          { ...extra, server } // Pass server reference
        );
      }
    }

    if (request.params.name === "mental_models") {
      const { operation, args } = request.params.arguments as any;

      if (operation === "apply_model") {
        // Get model content (pseudo-code)
        const modelContent = "/* ... */";

        return await handleApplyModel(
          args,
          modelContent,
          { ...extra, server }
        );
      }
    }

    // ... other tool handlers ...
  });

  return server;
}

// ============================================================================
// EXAMPLE 7: Helper Functions
// ============================================================================

/**
 * Utility function to check if client supports sampling
 */
function clientSupportsSampling(server: Server): boolean {
  const capabilities = server.getClientCapabilities();
  return !!capabilities?.sampling;
}

/**
 * Model preference presets for common use cases
 */
const MODEL_PREFERENCES = {
  quickValidation: {
    intelligencePriority: 0.5,
    speedPriority: 0.9,
    costPriority: 0.8,
  },
  deepReasoning: {
    intelligencePriority: 0.95,
    speedPriority: 0.3,
    costPriority: 0.2,
  },
  codeGeneration: {
    intelligencePriority: 0.85,
    speedPriority: 0.6,
    costPriority: 0.5,
    hints: [{ name: "claude" }],
  },
  documentation: {
    intelligencePriority: 0.6,
    speedPriority: 0.7,
    costPriority: 0.7,
  },
  brainstorming: {
    intelligencePriority: 0.8,
    speedPriority: 0.5,
    costPriority: 0.4,
  },
} as const;

/**
 * System prompt templates for common use cases
 */
const SYSTEM_PROMPTS = {
  codeExplanation:
    "You are a code explanation assistant. Provide clear, accurate explanations of how code works.",
  codeGeneration:
    "You are a code generation assistant. Generate clean, well-typed, production-ready code.",
  mentalModelApplication:
    "You are a reasoning assistant that applies mental models to real-world problems. Provide actionable insights.",
  criticalThinking:
    "You are a critical thinking assistant. Identify logical flaws, gaps in reasoning, and suggest improvements.",
  brainstorming:
    "You are a creative thinking assistant. Generate diverse, innovative ideas and approaches.",
} as const;

// Export for use in other modules
export {
  handleExplainCode,
  handleApplyModel,
  validateThought,
  ConversationalMentalModelAssistant,
  generateCode,
  refineCode,
  clientSupportsSampling,
  MODEL_PREFERENCES,
  SYSTEM_PROMPTS,
};
