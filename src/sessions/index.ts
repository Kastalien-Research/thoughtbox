/**
 * Sessions Toolhost
 *
 * MCP toolhost for managing Thoughtbox reasoning sessions.
 * Follows the same pattern as the notebook toolhost.
 *
 * Supports SPEC-009 operation-based tool discovery: calling certain operations
 * (like "analyze") can unlock specialized tools.
 */

import { SessionHandlers, type SessionHandlerDeps } from "./handlers.js";
import { getOperation, SESSION_TOOL } from "./operations.js";

export { SESSION_TOOL } from "./operations.js";
export { getOperationNames, getOperationsCatalog } from "./operations.js";
export type { SessionHandlerDeps } from "./handlers.js";

/**
 * Session Handler - MCP tool handlers for reasoning sessions
 */
export class SessionHandler {
  private handlers: SessionHandlers;
  private initialized = false;

  constructor(deps: SessionHandlerDeps) {
    this.handlers = new SessionHandlers(deps);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  async processTool(
    operation: string,
    args: any
  ): Promise<{
    content: Array<
      | { type: "text"; text: string }
      | { type: "resource"; resource: { uri: string; text: string; mimeType: string; title?: string; annotations?: any } }
    >;
    isError: boolean;
  }> {
    try {
      let result: any;
      const opDef = getOperation(operation);

      switch (operation) {
        case "list":
          result = await this.handlers.handleList(args);
          break;
        case "get":
          result = await this.handlers.handleGet(args);
          break;
        case "search":
          result = await this.handlers.handleSearch(args);
          break;
        case "resume":
          result = await this.handlers.handleResume(args);
          break;
        case "export":
          result = await this.handlers.handleExport(args);
          break;
        case "analyze":
          result = await this.handlers.handleAnalyze(args);
          break;
        case "extract_learnings":
          result = await this.handlers.handleExtractLearnings(args);
          break;
        default:
          throw new Error(`Unknown session operation: ${operation}`);
      }

      const content: Array<
        | { type: "text"; text: string }
        | { type: "resource"; resource: { uri: string; text: string; mimeType: string; title?: string; annotations?: any } }
      > = [{ type: "text", text: JSON.stringify(result, null, 2) }];

      // Include operation metadata as resource for LLM context
      if (opDef) {
        content.push({
          type: "resource",
          resource: {
            uri: `thoughtbox://session/operations/${operation}`,
            title: opDef.title,
            mimeType: "application/json",
            text: JSON.stringify(opDef, null, 2),
            annotations: { audience: ["assistant"], priority: 0.5 },
          },
        });
      }

      return { content, isError: false };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : String(error),
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
