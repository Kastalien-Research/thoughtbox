/**
 * Branch Toolhost
 *
 * MCP toolhost for managing reasoning branches within sessions.
 * Follows the same pattern as the sessions toolhost.
 */

import { BranchHandlers, type BranchHandlerDeps } from "./handlers.js";
import { getOperation } from "./operations.js";

export { BRANCH_TOOL } from "./operations.js";
export { getOperationNames, getOperationsCatalog } from "./operations.js";
export type { BranchHandlerDeps } from "./handlers.js";

export class BranchHandler {
  private handlers: BranchHandlers;
  private initialized = false;

  constructor(deps: BranchHandlerDeps) {
    this.handlers = new BranchHandlers(deps);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  async processTool(
    operation: string,
    args: Record<string, unknown>
  ): Promise<{
    content: Array<
      | { type: "text"; text: string }
      | {
          type: "resource";
          resource: {
            uri: string;
            text: string;
            mimeType: string;
            title?: string;
            annotations?: Record<string, unknown>;
          };
        }
    >;
    isError: boolean;
  }> {
    try {
      let result: unknown;
      const opDef = getOperation(`branch_${operation}`);

      switch (operation) {
        case "spawn":
          result = await this.handlers.handleSpawn(
            args as Parameters<BranchHandlers["handleSpawn"]>[0]
          );
          break;
        case "merge":
          result = await this.handlers.handleMerge(
            args as Parameters<BranchHandlers["handleMerge"]>[0]
          );
          break;
        case "list":
          result = await this.handlers.handleList(
            args as Parameters<BranchHandlers["handleList"]>[0]
          );
          break;
        case "get":
          result = await this.handlers.handleGet(
            args as Parameters<BranchHandlers["handleGet"]>[0]
          );
          break;
        default:
          throw new Error(`Unknown branch operation: ${operation}`);
      }

      const content: Array<
        | { type: "text"; text: string }
        | {
            type: "resource";
            resource: {
              uri: string;
              text: string;
              mimeType: string;
              title?: string;
              annotations?: Record<string, unknown>;
            };
          }
      > = [{ type: "text", text: JSON.stringify(result, null, 2) }];

      if (opDef) {
        content.push({
          type: "resource",
          resource: {
            uri: `thoughtbox://branch/operations/${operation}`,
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
                error:
                  error instanceof Error ? error.message : String(error),
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
