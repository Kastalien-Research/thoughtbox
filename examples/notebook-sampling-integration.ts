/**
 * Production-Ready Example: Adding Code Explanation to NotebookServer
 *
 * This file shows exactly how to add a sampling-powered "explain_code"
 * operation to the existing NotebookServer implementation.
 *
 * To integrate this into the main codebase:
 * 1. Add the operation definition to src/notebook/operations.ts
 * 2. Add the handler to src/notebook/index.ts processTool() method
 * 3. Update the server to pass RequestHandlerExtra to processTool()
 */

import { z } from "zod";
import { CreateMessageResultSchema } from "@modelcontextprotocol/sdk/types.js";

// ============================================================================
// STEP 1: Add to src/notebook/operations.ts
// ============================================================================

/**
 * Add this to the OPERATIONS object in operations.ts
 */
export const EXPLAIN_CODE_OPERATION = {
  name: "explain_code",
  description:
    "Explain code in a notebook cell using AI (requires client with sampling support)",
  requiresSampling: true, // Document this requirement
  schema: z.object({
    cellId: z
      .string()
      .describe("The ID of the cell to explain (e.g., 'cell_0')"),
    detailLevel: z
      .enum(["brief", "detailed"])
      .optional()
      .default("detailed")
      .describe(
        "Level of detail: 'brief' for quick summary, 'detailed' for in-depth explanation"
      ),
    focusAreas: z
      .array(
        z.enum([
          "purpose",
          "implementation",
          "performance",
          "edge_cases",
          "improvements",
        ])
      )
      .optional()
      .describe("Specific aspects to focus on in the explanation"),
  }),
  examples: [
    {
      description: "Get a brief explanation of a cell",
      args: {
        cellId: "cell_0",
        detailLevel: "brief",
      },
    },
    {
      description: "Get detailed explanation focusing on performance",
      args: {
        cellId: "cell_1",
        detailLevel: "detailed",
        focusAreas: ["performance", "improvements"],
      },
    },
  ],
};

// ============================================================================
// STEP 2: Handler Implementation for NotebookServer
// ============================================================================

/**
 * Handler for the explain_code operation
 * Add this as a method to the NotebookServer class
 */
export async function handleExplainCode(
  this: any, // NotebookServer instance
  args: z.infer<typeof EXPLAIN_CODE_OPERATION.schema>,
  extra: any // RequestHandlerExtra
) {
  // Validate that the cell exists
  const notebooks = Array.from(this.stateManager.getAllNotebooks().values());
  let targetCell: any = null;
  let notebookId: string | null = null;

  for (const [id, notebook] of this.stateManager.getAllNotebooks()) {
    const cell = notebook.cells.find((c: any) => c.id === args.cellId);
    if (cell) {
      targetCell = cell;
      notebookId = id;
      break;
    }
  }

  if (!targetCell) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: `Cell with id '${args.cellId}' not found in any notebook`,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  // Check if client supports sampling
  // Note: We need access to the Server instance to check capabilities
  // This would be passed through via extra or stored on the class
  const server = this.server; // Assumes server reference is stored

  if (!server) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Server reference not available for capability check",
          }),
        },
      ],
      isError: true,
    };
  }

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
                "The explain_code operation requires a client that supports MCP sampling",
              requiredCapability: "sampling",
              suggestion:
                "Use a client like Claude Desktop or another MCP client with sampling support",
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  // Build the explanation prompt
  const cellSource = targetCell.source;
  const cellType = targetCell.cell_type;

  if (cellType !== "code") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Only code cells can be explained",
            cellType,
          }),
        },
      ],
      isError: true,
    };
  }

  // Construct the prompt based on detail level and focus areas
  let userPrompt = `Explain this TypeScript code:\n\n\`\`\`typescript\n${cellSource}\n\`\`\``;

  if (args.focusAreas && args.focusAreas.length > 0) {
    const focusMap = {
      purpose: "What is the purpose and main functionality?",
      implementation: "How is it implemented?",
      performance: "What are the performance characteristics?",
      edge_cases: "What edge cases are handled (or not handled)?",
      improvements: "What improvements could be made?",
    };

    userPrompt += "\n\nPlease focus on:\n";
    args.focusAreas.forEach((area) => {
      userPrompt += `- ${focusMap[area]}\n`;
    });
  }

  // Set system prompt based on detail level
  const systemPrompts = {
    brief:
      "You are a code explanation assistant. Provide concise, clear explanations focusing on what the code does and why. Use 2-3 sentences maximum.",
    detailed:
      "You are a code explanation assistant. Provide thorough explanations including: (1) what the code does, (2) how it works, (3) why specific approaches were used, and (4) potential improvements or considerations.",
  };

  const maxTokens = args.detailLevel === "brief" ? 300 : 800;

  try {
    // Make the sampling request using extra.sendRequest
    const result = await extra.sendRequest(
      {
        method: "sampling/createMessage",
        params: {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: userPrompt,
              },
            },
          ],
          systemPrompt: systemPrompts[args.detailLevel],
          maxTokens,
          modelPreferences: {
            // Code explanation benefits from intelligence and speed
            intelligencePriority: 0.8,
            speedPriority: 0.7,
            costPriority: 0.5,
            hints: [{ name: "claude" }], // Prefer Claude models for code tasks
          },
        },
      },
      CreateMessageResultSchema
    );

    // Extract the explanation text
    const explanation =
      result.content.type === "text" ? result.content.text : "";

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              operation: "explain_code",
              cellId: args.cellId,
              notebookId,
              detailLevel: args.detailLevel,
              focusAreas: args.focusAreas,
              explanation,
              metadata: {
                model: result.model,
                stopReason: result.stopReason,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    // Handle various error cases
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              operation: "explain_code",
              cellId: args.cellId,
              error: "Sampling request failed or was rejected",
              details: errorMessage,
              possibleReasons: [
                "User rejected the sampling request in the client UI",
                "Network timeout or connection issue",
                "Client-side rate limiting",
                "Model provider error",
              ],
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
// STEP 3: Modify src/notebook/index.ts
// ============================================================================

/**
 * Changes needed in NotebookServer class:
 *
 * 1. Store server reference in constructor:
 */
/*
export class NotebookServer {
  private stateManager: NotebookStateManager;
  private server: Server | null = null;  // ADD THIS

  constructor() {
    this.stateManager = new NotebookStateManager();
  }

  // ADD THIS METHOD
  setServer(server: Server) {
    this.server = server;
  }

  // ... rest of class
}
*/

/**
 * 2. Update processTool signature to accept extra parameter:
 */
/*
public async processTool(
  operation: string,
  args: Record<string, unknown>,
  extra?: any  // ADD THIS OPTIONAL PARAMETER
): Promise<{ content: Array<any>; isError?: boolean }> {

  // Add handler for explain_code
  if (operation === "explain_code") {
    if (!extra) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "explain_code requires extra parameter for sampling"
          })
        }],
        isError: true
      };
    }

    return await this.handleExplainCode(args, extra);
  }

  // ... existing operation handlers ...
}
*/

/**
 * 3. In the main request handler (src/index.ts), pass extra to processTool:
 */
/*
server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
  if (request.params.name === "notebook") {
    const { operation, args } = request.params.arguments as any;

    // Pass extra parameter for sampling-enabled operations
    return notebookServer.processTool(operation, args || {}, extra);
  }

  // ... other handlers ...
});
*/

/**
 * 4. Set server reference after creating the server:
 */
/*
const server = createServer({ config });
const notebookServer = new NotebookServer();
notebookServer.setServer(server);  // ADD THIS
*/

// ============================================================================
// STEP 4: Update Operations Catalog
// ============================================================================

/**
 * The getOperationsCatalog() method should include the new operation.
 * This happens automatically if you add EXPLAIN_CODE_OPERATION to the
 * OPERATIONS object in operations.ts.
 */

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Brief explanation
 *
 * Tool call:
 * {
 *   "name": "notebook",
 *   "arguments": {
 *     "operation": "explain_code",
 *     "args": {
 *       "cellId": "cell_0",
 *       "detailLevel": "brief"
 *     }
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "operation": "explain_code",
 *   "cellId": "cell_0",
 *   "notebookId": "notebook_123",
 *   "detailLevel": "brief",
 *   "explanation": "This code defines a function that calculates the Fibonacci sequence...",
 *   "metadata": {
 *     "model": "claude-3-5-sonnet-20241022",
 *     "stopReason": "endTurn"
 *   }
 * }
 */

/**
 * Example 2: Detailed explanation with focus areas
 *
 * Tool call:
 * {
 *   "name": "notebook",
 *   "arguments": {
 *     "operation": "explain_code",
 *     "args": {
 *       "cellId": "cell_1",
 *       "detailLevel": "detailed",
 *       "focusAreas": ["performance", "improvements"]
 *     }
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "operation": "explain_code",
 *   "cellId": "cell_1",
 *   "notebookId": "notebook_123",
 *   "detailLevel": "detailed",
 *   "focusAreas": ["performance", "improvements"],
 *   "explanation": "This code implements a memoized Fibonacci calculator...\n\nPerformance: The memoization provides O(n) time complexity...\n\nImprovements: Consider using an iterative approach...",
 *   "metadata": {
 *     "model": "claude-3-5-sonnet-20241022",
 *     "stopReason": "endTurn"
 *   }
 * }
 */

/**
 * Example 3: Error - client doesn't support sampling
 *
 * Response:
 * {
 *   "success": false,
 *   "error": "The explain_code operation requires a client that supports MCP sampling",
 *   "requiredCapability": "sampling",
 *   "suggestion": "Use a client like Claude Desktop or another MCP client with sampling support"
 * }
 */

// ============================================================================
// TESTING CHECKLIST
// ============================================================================

/**
 * Before deploying:
 *
 * ✓ Test with sampling-capable client (Claude Desktop, etc.)
 * ✓ Test with non-sampling client (should return helpful error)
 * ✓ Test with invalid cellId (should return error)
 * ✓ Test with markdown cell instead of code cell (should return error)
 * ✓ Test user rejection of sampling request in client UI
 * ✓ Test both brief and detailed explanation levels
 * ✓ Test with various focus areas
 * ✓ Verify getOperationsCatalog() includes the new operation
 * ✓ Check that operations documentation is generated correctly
 */

// ============================================================================
// NOTES
// ============================================================================

/**
 * Design decisions:
 *
 * 1. **Error handling**: Comprehensive error cases with helpful messages
 * 2. **Graceful degradation**: Clear error when sampling not supported
 * 3. **Model preferences**: Balanced for code explanation use case
 * 4. **Token limits**: Conservative (300 brief, 800 detailed) to avoid timeouts
 * 5. **System prompts**: Specific to each detail level
 * 6. **Focus areas**: Optional feature for targeted explanations
 * 7. **Response format**: Consistent with other notebook operations
 *
 * Future enhancements:
 *
 * - Cache explanations to avoid redundant sampling
 * - Support for explaining multiple cells in one request
 * - Interactive refinement (follow-up questions)
 * - Language-specific explanation styles
 * - Integration with cell execution results
 */

export { EXPLAIN_CODE_OPERATION, handleExplainCode };
