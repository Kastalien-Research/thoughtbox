/**
 * @fileoverview Gateway Tool Handler
 *
 * Single always-enabled routing tool that bypasses client tool list refresh issues.
 * Routes to existing handlers (init, cipher, thoughtbox, notebook, session) and
 * enforces progressive disclosure stages internally.
 *
 * @see specs/gateway-tool.md
 * @module src/gateway/gateway-handler
 */

import { z } from 'zod';
import { ToolRegistry, DisclosureStage } from '../tool-registry.js';
import type { InitToolHandler, InitToolInput } from '../init/tool-handler.js';
import type { ThoughtHandler } from '../thought-handler.js';
import type { NotebookHandler } from '../notebook/index.js';
import type { SessionHandler } from '../sessions/index.js';
import { THOUGHTBOX_CIPHER } from '../resources/thoughtbox-cipher-content.js';

// =============================================================================
// Schema
// =============================================================================

/**
 * Gateway tool input schema
 */
export const gatewayToolInputSchema = z.object({
  operation: z.enum([
    // Init operations (Stage 0)
    'get_state',
    'list_sessions',
    'navigate',
    'load_context',
    'start_new',
    'list_roots',
    'bind_root',
    // Cipher operation (Stage 1 → Stage 2)
    'cipher',
    // Thought operation (Stage 2)
    'thought',
    // Notebook operation (Stage 2)
    'notebook',
    // Session operation (Stage 1)
    'session',
  ]),
  args: z.record(z.string(), z.unknown()).optional().describe('Arguments passed to the underlying handler'),
});

export type GatewayToolInput = z.infer<typeof gatewayToolInputSchema>;

// =============================================================================
// Stage Mapping
// =============================================================================

/**
 * Required stage for each operation
 */
const OPERATION_REQUIRED_STAGE: Record<GatewayToolInput['operation'], DisclosureStage> = {
  // Stage 0 operations - always available
  get_state: DisclosureStage.STAGE_0_ENTRY,
  list_sessions: DisclosureStage.STAGE_0_ENTRY,
  navigate: DisclosureStage.STAGE_0_ENTRY,
  load_context: DisclosureStage.STAGE_0_ENTRY,
  start_new: DisclosureStage.STAGE_0_ENTRY,
  list_roots: DisclosureStage.STAGE_0_ENTRY,
  bind_root: DisclosureStage.STAGE_0_ENTRY,
  // Stage 1 operations
  cipher: DisclosureStage.STAGE_1_INIT_COMPLETE,
  session: DisclosureStage.STAGE_1_INIT_COMPLETE,
  // Stage 2 operations
  thought: DisclosureStage.STAGE_2_CIPHER_LOADED,
  notebook: DisclosureStage.STAGE_2_CIPHER_LOADED,
};

/**
 * Stage advancement per operation (null = no advancement)
 */
const OPERATION_ADVANCES_TO: Record<GatewayToolInput['operation'], DisclosureStage | null> = {
  get_state: null,
  list_sessions: null,
  navigate: null,
  load_context: DisclosureStage.STAGE_1_INIT_COMPLETE,
  start_new: DisclosureStage.STAGE_1_INIT_COMPLETE,
  list_roots: null,
  bind_root: null,
  cipher: DisclosureStage.STAGE_2_CIPHER_LOADED,
  session: null,
  thought: null,
  notebook: null,
};

/**
 * Stage order for comparison
 */
const STAGE_ORDER: DisclosureStage[] = [
  DisclosureStage.STAGE_0_ENTRY,
  DisclosureStage.STAGE_1_INIT_COMPLETE,
  DisclosureStage.STAGE_2_CIPHER_LOADED,
  DisclosureStage.STAGE_3_DOMAIN_ACTIVE,
];

// =============================================================================
// Response Types
// =============================================================================

interface TextContent {
  type: 'text';
  text: string;
}

interface ResourceContent {
  type: 'resource';
  resource: {
    uri: string;
    mimeType: string;
    text: string;
  };
}

type ContentBlock = TextContent | ResourceContent;

interface ToolResponse {
  content: ContentBlock[];
  isError?: boolean;
}

// =============================================================================
// Handler
// =============================================================================

/**
 * Configuration for GatewayHandler
 */
export interface GatewayHandlerConfig {
  toolRegistry: ToolRegistry;
  initToolHandler: InitToolHandler;
  thoughtHandler: ThoughtHandler;
  notebookHandler: NotebookHandler;
  sessionHandler: SessionHandler;
  /** Callback to notify clients of tool list changes */
  sendToolListChanged?: () => void;
}

/**
 * Gateway tool handler - routes to existing handlers with stage enforcement
 */
export class GatewayHandler {
  private toolRegistry: ToolRegistry;
  private initToolHandler: InitToolHandler;
  private thoughtHandler: ThoughtHandler;
  private notebookHandler: NotebookHandler;
  private sessionHandler: SessionHandler;
  private sendToolListChanged?: () => void;

  constructor(config: GatewayHandlerConfig) {
    this.toolRegistry = config.toolRegistry;
    this.initToolHandler = config.initToolHandler;
    this.thoughtHandler = config.thoughtHandler;
    this.notebookHandler = config.notebookHandler;
    this.sessionHandler = config.sessionHandler;
    this.sendToolListChanged = config.sendToolListChanged;
  }

  /**
   * Process a gateway tool call
   */
  async handle(input: GatewayToolInput): Promise<ToolResponse> {
    const { operation, args } = input;

    // Check stage requirement
    const requiredStage = OPERATION_REQUIRED_STAGE[operation];
    const currentStage = this.toolRegistry.getCurrentStage();

    if (!this.isStageAtLeast(currentStage, requiredStage)) {
      return this.createStageError(operation, currentStage, requiredStage);
    }

    // Route to appropriate handler
    let result: ToolResponse;

    switch (operation) {
      // Init operations
      case 'get_state':
      case 'list_sessions':
      case 'navigate':
      case 'load_context':
      case 'start_new':
      case 'list_roots':
      case 'bind_root':
        result = await this.handleInitOperation(operation, args);
        break;

      // Cipher operation
      case 'cipher':
        result = await this.handleCipher();
        break;

      // Thought operation
      case 'thought':
        result = await this.handleThought(args);
        break;

      // Notebook operation
      case 'notebook':
        result = await this.handleNotebook(args);
        break;

      // Session operation
      case 'session':
        result = await this.handleSession(args);
        break;

      default:
        return {
          content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
          isError: true,
        };
    }

    // Handle stage advancement if operation succeeded
    if (!result.isError) {
      const advancesTo = OPERATION_ADVANCES_TO[operation];
      if (advancesTo) {
        this.toolRegistry.advanceToStage(advancesTo);
        // Notify clients (harmless if ignored by streaming HTTP)
        if (this.sendToolListChanged) {
          this.sendToolListChanged();
        }
      }
    }

    return result;
  }

  // ===========================================================================
  // Stage Helpers
  // ===========================================================================

  private isStageAtLeast(current: DisclosureStage, required: DisclosureStage): boolean {
    const currentIdx = STAGE_ORDER.indexOf(current);
    const requiredIdx = STAGE_ORDER.indexOf(required);
    return currentIdx >= requiredIdx;
  }

  private createStageError(
    operation: string,
    current: DisclosureStage,
    required: DisclosureStage
  ): ToolResponse {
    let suggestion: string;

    switch (required) {
      case DisclosureStage.STAGE_1_INIT_COMPLETE:
        suggestion = "Call gateway with operation 'start_new' or 'load_context' first.";
        break;
      case DisclosureStage.STAGE_2_CIPHER_LOADED:
        suggestion = "Call gateway with operation 'cipher' first.";
        break;
      default:
        suggestion = "Complete the initialization workflow first.";
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: `Operation '${operation}' requires stage ${required}, but current stage is ${current}`,
          currentStage: current,
          requiredStage: required,
          suggestion,
        }, null, 2),
      }],
      isError: true,
    };
  }

  // ===========================================================================
  // Handler Routing
  // ===========================================================================

  private async handleInitOperation(
    operation: GatewayToolInput['operation'],
    args?: Record<string, unknown>
  ): Promise<ToolResponse> {
    // Map gateway operation to init tool input
    const initInput: InitToolInput = {
      operation: operation as InitToolInput['operation'],
      ...(args || {}),
    };

    const result = await this.initToolHandler.handle(initInput);

    // Transform content to match gateway response type
    return {
      content: result.content.map((block) => {
        if (block.type === 'text') {
          return { type: 'text' as const, text: block.text };
        } else if (block.type === 'resource') {
          return {
            type: 'resource' as const,
            resource: {
              uri: block.resource.uri,
              mimeType: block.resource.mimeType,
              text: block.resource.text,
            },
          };
        }
        return block as ContentBlock;
      }),
      isError: result.isError,
    };
  }

  private async handleCipher(): Promise<ToolResponse> {
    const turnBoundaryInstruction = `

---

## Next Steps

The gateway tool now supports thought and notebook operations.
Call \`thoughtbox_gateway\` with operation 'thought' to begin structured reasoning.`;

    return {
      content: [{ type: 'text', text: THOUGHTBOX_CIPHER + turnBoundaryInstruction }],
    };
  }

  private async handleThought(args?: Record<string, unknown>): Promise<ToolResponse> {
    if (!args) {
      return {
        content: [{ type: 'text', text: 'Thought operation requires args with thought parameters' }],
        isError: true,
      };
    }

    // Validate required thought parameters
    const thought = args.thought as string | undefined;
    const nextThoughtNeeded = args.nextThoughtNeeded as boolean | undefined;
    const thoughtNumber = args.thoughtNumber as number | undefined;
    const totalThoughts = args.totalThoughts as number | undefined;

    if (!thought || nextThoughtNeeded === undefined || !thoughtNumber || !totalThoughts) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Missing required parameters',
            required: ['thought', 'nextThoughtNeeded', 'thoughtNumber', 'totalThoughts'],
            received: Object.keys(args),
          }, null, 2),
        }],
        isError: true,
      };
    }

    const result = await this.thoughtHandler.processThought({
      thought,
      nextThoughtNeeded,
      thoughtNumber,
      totalThoughts,
      isRevision: args.isRevision as boolean | undefined,
      revisesThought: args.revisesThought as number | undefined,
      branchFromThought: args.branchFromThought as number | undefined,
      branchId: args.branchId as string | undefined,
      needsMoreThoughts: args.needsMoreThoughts as boolean | undefined,
      includeGuide: args.includeGuide as boolean | undefined,
      sessionTitle: args.sessionTitle as string | undefined,
      sessionTags: args.sessionTags as string[] | undefined,
      critique: args.critique as boolean | undefined,
    });

    return result;
  }

  private async handleNotebook(args?: Record<string, unknown>): Promise<ToolResponse> {
    if (!args || !args.operation) {
      return {
        content: [{ type: 'text', text: 'Notebook operation requires args with operation field' }],
        isError: true,
      };
    }

    const operation = args.operation as string;
    const operationArgs = args.args as Record<string, unknown> | undefined;

    return this.notebookHandler.processTool(operation, operationArgs || {});
  }

  private async handleSession(args?: Record<string, unknown>): Promise<ToolResponse> {
    if (!args || !args.operation) {
      return {
        content: [{ type: 'text', text: 'Session operation requires args with operation field' }],
        isError: true,
      };
    }

    const operation = args.operation as string;
    const operationArgs = args.args as Record<string, unknown> | undefined;

    return this.sessionHandler.processTool(operation, operationArgs || {});
  }
}

// =============================================================================
// Tool Definition
// =============================================================================

/**
 * Gateway tool definition for registration
 */
export const GATEWAY_TOOL = {
  name: 'thoughtbox_gateway',
  description: `Always-available routing tool for Thoughtbox operations.

Use this tool when other tools appear unavailable due to tool list not refreshing.
Routes to: init, cipher, thoughtbox, notebook, session handlers.

Operations:
- get_state, list_sessions, navigate, load_context, start_new, list_roots, bind_root (init)
- cipher (loads notation system)
- thought (structured reasoning)
- notebook (literate programming)
- session (session management)

Stage enforcement is handled internally - you'll get clear errors if calling operations too early.`,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};
