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
import type { MentalModelsHandler } from '../mental-models/index.js';
import type { ThoughtboxStorage, ThoughtData } from '../persistence/index.js';
import { THOUGHTBOX_CIPHER } from '../resources/thoughtbox-cipher-content.js';
import { STAGE_2_OPERATIONS_SCHEMA } from '../resources/operation-schemas-content.js';
import type { KnowledgeHandler } from '../knowledge/index.js';

// =============================================================================
// Schema
// =============================================================================

/**
 * Gateway tool input schema with detailed operation-specific parameters
 */
export const gatewayToolInputSchema = z.discriminatedUnion('operation', [
  // =============================================================================
  // Init Operations (Stage 0) - Pattern 1: Direct Args
  // =============================================================================
  z.object({
    operation: z.literal('get_state'),
    args: z.object({}).optional(),
  }),
  z.object({
    operation: z.literal('list_sessions'),
    args: z.object({
      limit: z.number().optional().describe('Maximum number of sessions to return (default: 10)'),
      offset: z.number().optional().describe('Number of sessions to skip for pagination (default: 0)'),
      tags: z.array(z.string()).optional().describe('Filter by tags (returns sessions matching ANY tag)'),
    }).optional(),
  }),
  z.object({
    operation: z.literal('navigate'),
    args: z.object({
      sessionId: z.string().describe('Session ID to navigate to'),
    }),
  }),
  z.object({
    operation: z.literal('load_context'),
    args: z.object({
      sessionId: z.string().describe('Session ID to load'),
    }),
  }),
  z.object({
    operation: z.literal('start_new'),
    args: z.object({
      newWork: z.object({
        title: z.string().describe('Title describing the new reasoning session'),
        tags: z.array(z.string()).optional().describe('Tags for categorizing the session'),
        description: z.string().optional().describe('Optional description of the session purpose'),
      }),
    }),
  }),
  z.object({
    operation: z.literal('list_roots'),
    args: z.object({}).optional(),
  }),
  z.object({
    operation: z.literal('bind_root'),
    args: z.object({
      rootUri: z.string().describe('Root URI to bind'),
      pathPrefix: z.string().optional().describe('Optional path prefix within the root'),
    }),
  }),

  // =============================================================================
  // Cipher Operation (Stage 1 → Stage 2)
  // =============================================================================
  z.object({
    operation: z.literal('cipher'),
    args: z.object({}).optional(),
  }),

  // =============================================================================
  // Thought Operation (Stage 2) - Pattern 1: Direct Args
  // Note: branchId requires branchFromThought; revisesThought requires isRevision=true
  // These interdependencies are validated at runtime in the handler
  // =============================================================================
  z.object({
    operation: z.literal('thought'),
    args: z.object({
      thought: z.string().describe('The content of the thought'),
      nextThoughtNeeded: z.boolean().describe('Whether another thought is needed after this one'),
      thoughtNumber: z.number().optional().describe('Specific thought number (auto-assigned if omitted)'),
      totalThoughts: z.number().optional().describe('Expected total number of thoughts'),
      isRevision: z.boolean().optional().describe('Whether this thought revises a previous one'),
      revisesThought: z.number().optional().describe('Thought number being revised (requires isRevision=true)'),
      branchFromThought: z.number().optional().describe('Thought number to branch from'),
      branchId: z.string().optional().describe('Branch identifier (requires branchFromThought)'),
      needsMoreThoughts: z.boolean().optional().describe('Whether more thoughts are needed beyond current estimate'),
      includeGuide: z.boolean().optional().describe('Whether to include reasoning guide in response'),
      sessionTitle: z.string().optional().describe('Update session title'),
      sessionTags: z.array(z.string()).optional().describe('Update session tags'),
      critique: z.boolean().optional().describe('Request critique of the thought'),
      verbose: z.boolean().optional().describe('Return full response (default) vs minimal response'),
    }),
  }),

  // =============================================================================
  // Read Thoughts Operation (Stage 2)
  // =============================================================================
  z.object({
    operation: z.literal('read_thoughts'),
    args: z.object({
      sessionId: z.string().optional().describe('Session ID (defaults to active session)'),
      thoughtNumber: z.number().optional().describe('Get specific thought by number'),
      last: z.number().optional().describe('Get last N thoughts'),
      range: z.tuple([z.number(), z.number()]).optional().describe('Get thoughts in range [start, end] inclusive'),
      branchId: z.string().optional().describe('Get all thoughts from specific branch'),
    }).optional(),
  }),

  // =============================================================================
  // Get Structure Operation (Stage 2)
  // =============================================================================
  z.object({
    operation: z.literal('get_structure'),
    args: z.object({
      sessionId: z.string().optional().describe('Session ID (defaults to active session)'),
    }).optional(),
  }),

  // =============================================================================
  // Notebook Operation (Stage 2) - Pattern 2: Nested Operation
  // =============================================================================
  z.object({
    operation: z.literal('notebook'),
    args: z.object({
      operation: z.enum(['create', 'list', 'load', 'add_cell', 'update_cell', 'run_cell', 'install_deps', 'list_cells', 'get_cell', 'export']).describe('Notebook sub-operation'),
      // Common parameters
      notebookId: z.string().optional().describe('Notebook ID (required for most operations)'),
      // create parameters
      title: z.string().optional().describe('Notebook title (create)'),
      language: z.enum(['javascript', 'typescript']).optional().describe('Programming language (create)'),
      template: z.enum(['sequential-feynman']).optional().describe('Optional template (create)'),
      // load/export parameters
      path: z.string().optional().describe('Filesystem path (load/export)'),
      content: z.string().optional().describe('Raw content string (load)'),
      // cell parameters
      cellId: z.string().optional().describe('Cell ID (update_cell, run_cell, get_cell)'),
      cellType: z.enum(['title', 'markdown', 'code']).optional().describe('Cell type (add_cell)'),
      filename: z.string().optional().describe('Filename for code cells (add_cell)'),
      position: z.number().optional().describe('Cell position (add_cell)'),
    }),
  }),

  // =============================================================================
  // Session Operation (Stage 1) - Pattern 2: Nested Operation
  // =============================================================================
  z.object({
    operation: z.literal('session'),
    args: z.object({
      operation: z.enum(['list', 'get', 'search', 'resume', 'export', 'analyze', 'extract_learnings', 'discovery']).describe('Session sub-operation'),
      // Common parameters
      sessionId: z.string().optional().describe('Session ID (required for get, resume, export, analyze, extract_learnings)'),
      // list/search parameters
      limit: z.number().optional().describe('Maximum results (list/search)'),
      offset: z.number().optional().describe('Pagination offset (list)'),
      tags: z.array(z.string()).optional().describe('Filter by tags (list)'),
      query: z.string().optional().describe('Search query (search)'),
      // export parameters
      format: z.enum(['markdown', 'cipher', 'json']).optional().describe('Export format (export)'),
      includeMetadata: z.boolean().optional().describe('Include metadata (export)'),
      // extract_learnings parameters
      keyMoments: z.array(z.object({
        thoughtNumber: z.number(),
        type: z.enum(['decision', 'pivot', 'insight', 'revision', 'branch']),
        significance: z.number().optional(),
        summary: z.string().optional(),
      })).optional().describe('Key moments for pattern extraction (extract_learnings)'),
      targetTypes: z.array(z.enum(['pattern', 'anti-pattern', 'signal'])).optional().describe('Learning types to extract (extract_learnings)'),
      // discovery parameters
      action: z.enum(['list', 'hide', 'show']).optional().describe('Discovery action (discovery)'),
      toolName: z.string().optional().describe('Tool name for hide/show (discovery)'),
    }),
  }),

  // =============================================================================
  // Mental Models Operation (Stage 2) - Pattern 2: Nested Operation
  // =============================================================================
  z.object({
    operation: z.literal('mental_models'),
    args: z.object({
      operation: z.enum(['get_model', 'list_models', 'list_tags', 'get_capability_graph']).describe('Mental models sub-operation'),
      model: z.string().optional().describe('Model name (required for get_model)'),
      tag: z.string().optional().describe('Filter by tag (list_models)'),
    }),
  }),

  // =============================================================================
  // Deep Analysis Operation (Stage 1)
  // =============================================================================
  z.object({
    operation: z.literal('deep_analysis'),
    args: z.object({
      sessionId: z.string().describe('Session ID to analyze'),
      analysisType: z.enum(['patterns', 'cognitive_load', 'decision_points', 'full']).describe('Type of analysis'),
      options: z.object({
        includeTimeline: z.boolean().optional(),
        compareWith: z.array(z.string()).optional(),
      }).optional(),
    }),
  }),

  // =============================================================================
  // Knowledge Operation (Stage 2) - Pattern 3: Nested Action
  // =============================================================================
  z.object({
    operation: z.literal('knowledge'),
    args: z.object({
      action: z.enum(['create_entity', 'get_entity', 'list_entities', 'add_observation', 'create_relation', 'query_graph', 'stats']).describe('Knowledge graph action'),
      // create_entity parameters
      name: z.string().optional().describe('Entity name (create_entity)'),
      type: z.enum(['Insight', 'Concept', 'Workflow', 'Decision', 'Agent']).optional().describe('Entity type (create_entity)'),
      label: z.string().optional().describe('Entity label (create_entity)'),
      properties: z.record(z.unknown()).optional().describe('Entity properties (create_entity)'),
      // get_entity parameters
      entity_id: z.string().optional().describe('Entity ID (get_entity, add_observation, query_graph)'),
      // add_observation parameters
      content: z.string().optional().describe('Observation content (add_observation)'),
      source_session: z.string().optional().describe('Source session (add_observation)'),
      // create_relation parameters
      from_id: z.string().optional().describe('Source entity ID (create_relation)'),
      to_id: z.string().optional().describe('Target entity ID (create_relation)'),
      relation_type: z.enum(['RELATES_TO', 'BUILDS_ON', 'CONTRADICTS', 'EXTRACTED_FROM', 'APPLIED_IN', 'LEARNED_BY', 'DEPENDS_ON', 'SUPERSEDES', 'MERGED_FROM']).optional().describe('Relation type (create_relation)'),
      // query_graph parameters
      start_entity_id: z.string().optional().describe('Starting entity for traversal (query_graph)'),
      relation_types: z.array(z.string()).optional().describe('Filter by relation types (query_graph)'),
      max_depth: z.number().optional().describe('Maximum traversal depth (query_graph, default: 3)'),
    }),
  }),
]);

export type GatewayToolInput = z.infer<typeof gatewayToolInputSchema>;

// =============================================================================
// Stage Mapping
// =============================================================================

/**
 * Type for operation names
 */
type OperationName = GatewayToolInput['operation'];

/**
 * Required stage for each operation
 */
const OPERATION_REQUIRED_STAGE: Record<OperationName, DisclosureStage> = {
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
  deep_analysis: DisclosureStage.STAGE_1_INIT_COMPLETE,
  // Stage 2 operations
  thought: DisclosureStage.STAGE_2_CIPHER_LOADED,
  read_thoughts: DisclosureStage.STAGE_2_CIPHER_LOADED,
  get_structure: DisclosureStage.STAGE_2_CIPHER_LOADED,
  notebook: DisclosureStage.STAGE_2_CIPHER_LOADED,
  mental_models: DisclosureStage.STAGE_2_CIPHER_LOADED,
  knowledge: DisclosureStage.STAGE_2_CIPHER_LOADED,
};

/**
 * Stage advancement per operation (null = no advancement)
 */
const OPERATION_ADVANCES_TO: Record<OperationName, DisclosureStage | null> = {
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
  read_thoughts: null,
  get_structure: null,
  notebook: null,
  mental_models: null,
  deep_analysis: null,
  knowledge: null,
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
  mentalModelsHandler: MentalModelsHandler;
  knowledgeHandler?: KnowledgeHandler;
  /** Storage for deep analysis operations */
  storage: ThoughtboxStorage;
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
  private mentalModelsHandler: MentalModelsHandler;
  private knowledgeHandler?: KnowledgeHandler;
  private storage: ThoughtboxStorage;
  private sendToolListChanged?: () => void;

  constructor(config: GatewayHandlerConfig) {
    this.toolRegistry = config.toolRegistry;
    this.initToolHandler = config.initToolHandler;
    this.thoughtHandler = config.thoughtHandler;
    this.notebookHandler = config.notebookHandler;
    this.sessionHandler = config.sessionHandler;
    this.mentalModelsHandler = config.mentalModelsHandler;
    this.knowledgeHandler = config.knowledgeHandler;
    this.storage = config.storage;
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

      // Read thoughts operation - retrieve previous thoughts mid-session
      case 'read_thoughts':
        result = await this.handleReadThoughts(args);
        break;

      // Get structure operation - reasoning graph topology
      case 'get_structure':
        result = await this.handleGetStructure(args);
        break;

      // Notebook operation
      case 'notebook':
        result = await this.handleNotebook(args);
        break;

      // Session operation
      case 'session':
        result = await this.handleSession(args);
        break;

      // Mental models operation
      case 'mental_models':
        result = await this.handleMentalModels(args);
        break;

      // Deep analysis operation
      case 'deep_analysis':
        result = await this.handleDeepAnalysis(args);
        break;

      // Knowledge operation
      case 'knowledge':
        result = await this.handleKnowledge(args);
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

      // SIL-103: Session Continuity - restore ThoughtHandler state on load_context
      if (operation === 'load_context' && args?.sessionId) {
        try {
          const restoration = await this.thoughtHandler.restoreFromSession(args.sessionId as string);
          // Append restoration info to the result
          const restorationInfo = `\n\n**Session State Restored (SIL-103)**:\n- Thoughts: ${restoration.thoughtCount}\n- Current #: ${restoration.currentThoughtNumber}\n- Branches: ${restoration.branchCount}\n- Next thought will be #${restoration.currentThoughtNumber + 1}`;

          // Find the text content block and append restoration info
          for (const block of result.content) {
            if (block.type === 'text') {
              block.text += restorationInfo;
              break;
            }
          }
        } catch (err) {
          console.warn(`[SIL-103] Session restoration failed: ${(err as Error).message}`);
          // Don't fail the operation - load_context still worked, just without full state restoration
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
    const nextStepsGuidance = `

---

## Next Steps

Notation loaded. Available operations: \`thought\`, \`read_thoughts\`, \`get_structure\`, \`notebook\`, \`mental_models\`, \`knowledge\`

**Next action:** Call \`thoughtbox_gateway\` with operation \`thought\` to begin structured reasoning:

\`\`\`typescript
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "Initial observation about the problem...",
    nextThoughtNeeded: true
  }
})
\`\`\`

---

${STAGE_2_OPERATIONS_SCHEMA}`;

    return {
      content: [{ type: 'text', text: THOUGHTBOX_CIPHER + nextStepsGuidance }],
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
    // SIL-102: thoughtNumber and totalThoughts are now optional - server auto-assigns
    const thought = args.thought as string | undefined;
    const nextThoughtNeeded = args.nextThoughtNeeded as boolean | undefined;

    if (!thought || nextThoughtNeeded === undefined) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Missing required parameters',
            required: ['thought', 'nextThoughtNeeded'],
            optional: ['thoughtNumber', 'totalThoughts', 'verbose', 'branchId', 'branchFromThought', 'isRevision', 'revisesThought'],
            received: Object.keys(args),
          }, null, 2),
        }],
        isError: true,
      };
    }

    const result = await this.thoughtHandler.processThought({
      thought,
      nextThoughtNeeded,
      // SIL-102: Pass thoughtNumber and totalThoughts as optional
      thoughtNumber: args.thoughtNumber as number | undefined,
      totalThoughts: args.totalThoughts as number | undefined,
      isRevision: args.isRevision as boolean | undefined,
      revisesThought: args.revisesThought as number | undefined,
      branchFromThought: args.branchFromThought as number | undefined,
      branchId: args.branchId as string | undefined,
      needsMoreThoughts: args.needsMoreThoughts as boolean | undefined,
      includeGuide: args.includeGuide as boolean | undefined,
      sessionTitle: args.sessionTitle as string | undefined,
      sessionTags: args.sessionTags as string[] | undefined,
      critique: args.critique as boolean | undefined,
      // SIL-101: Pass verbose flag for minimal/full response mode
      verbose: args.verbose as boolean | undefined,
    });

    return result;
  }

  /**
   * Handle read_thoughts operation - retrieve previous thoughts mid-session
   *
   * Supports multiple query modes:
   * - { thoughtNumber: N } - get a single thought by number
   * - { last: N } - get the last N thoughts
   * - { range: [start, end] } - get thoughts in a range (inclusive)
   * - { branchId: 'name' } - get all thoughts from a specific branch
   * - { branchId: 'name', thoughtNumber: N } - get specific thought from branch
   */
  private async handleReadThoughts(args?: Record<string, unknown>): Promise<ToolResponse> {
    // Get session ID - prefer explicit arg, fall back to thoughtHandler's current session
    const explicitSessionId = args?.sessionId as string | undefined;
    const sessionId = explicitSessionId || this.thoughtHandler.getCurrentSessionId();
    if (!sessionId) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'No active reasoning session',
            suggestion: 'Provide sessionId in args, or start a reasoning session first by calling thought operation',
          }, null, 2),
        }],
        isError: true,
      };
    }

    try {
      // Parse query parameters
      const thoughtNumber = args?.thoughtNumber as number | undefined;
      const last = args?.last as number | undefined;
      const range = args?.range as [number, number] | undefined;
      const branchId = args?.branchId as string | undefined;

      let thoughts: ThoughtData[] = [];
      let queryDescription = '';

      // Query mode: specific thought (with optional branch)
      if (thoughtNumber !== undefined) {
        const thought = await this.storage.getThought(sessionId, thoughtNumber);
        if (thought) {
          thoughts = [thought];
          queryDescription = branchId
            ? `thought ${thoughtNumber} from branch '${branchId}'`
            : `thought ${thoughtNumber}`;
        } else {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: `Thought ${thoughtNumber} not found in session`,
                sessionId,
                branchId: branchId || null,
              }, null, 2),
            }],
            isError: true,
          };
        }
      }
      // Query mode: branch thoughts
      else if (branchId !== undefined) {
        thoughts = await this.storage.getBranch(sessionId, branchId);
        queryDescription = `all thoughts from branch '${branchId}'`;
      }
      // Query mode: last N thoughts
      else if (last !== undefined) {
        const allThoughts = await this.storage.getThoughts(sessionId);
        thoughts = allThoughts.slice(-last);
        queryDescription = `last ${last} thoughts`;
      }
      // Query mode: range of thoughts
      else if (range !== undefined && Array.isArray(range) && range.length === 2) {
        const [start, end] = range;
        const allThoughts = await this.storage.getThoughts(sessionId);
        thoughts = allThoughts.filter(t => t.thoughtNumber >= start && t.thoughtNumber <= end);
        queryDescription = `thoughts ${start} to ${end}`;
      }
      // No query parameters - return recent context
      else {
        const allThoughts = await this.storage.getThoughts(sessionId);
        thoughts = allThoughts.slice(-5);  // Default: last 5
        queryDescription = 'last 5 thoughts (default)';
      }

      // Format response
      const formattedThoughts = thoughts.map(t => ({
        thoughtNumber: t.thoughtNumber,
        thought: t.thought,
        totalThoughts: t.totalThoughts,
        isRevision: t.isRevision || false,
        revisesThought: t.revisesThought,
        branchId: t.branchId,
        branchFromThought: t.branchFromThought,
        timestamp: t.timestamp,
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            sessionId,
            query: queryDescription,
            count: formattedThoughts.length,
            thoughts: formattedThoughts,
          }, null, 2),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: (err as Error).message }, null, 2),
        }],
        isError: true,
      };
    }
  }

  /**
   * Handle get_structure operation - return reasoning graph topology without content
   *
   * Returns a compact representation of the reasoning structure:
   * - Main chain: head, tail, length
   * - Branches: id, fork point, length
   * - Revisions: pairs of [thought, revises]
   */
  private async handleGetStructure(args?: Record<string, unknown>): Promise<ToolResponse> {
    // Get session ID - prefer explicit arg, fall back to thoughtHandler's current session
    const explicitSessionId = args?.sessionId as string | undefined;
    const sessionId = explicitSessionId || this.thoughtHandler.getCurrentSessionId();
    if (!sessionId) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'No active reasoning session',
            suggestion: 'Provide sessionId in args, or start a reasoning session first by calling thought operation',
          }, null, 2),
        }],
        isError: true,
      };
    }

    try {
      // Fetch all thoughts
      const allThoughts = await this.storage.getThoughts(sessionId);

      // Separate main chain from branches
      const mainChainThoughts = allThoughts.filter(t => !t.branchId);
      const branchThoughts = allThoughts.filter(t => t.branchId);

      // Build main chain info
      const mainChain = {
        length: mainChainThoughts.length,
        head: mainChainThoughts.length > 0 ? mainChainThoughts[0].thoughtNumber : null,
        tail: mainChainThoughts.length > 0 ? mainChainThoughts[mainChainThoughts.length - 1].thoughtNumber : null,
      };

      // Build branch info - group by branchId
      const branchMap = new Map<string, { forks: number; thoughts: number[]; length: number }>();
      for (const thought of branchThoughts) {
        if (!thought.branchId) continue;

        let branch = branchMap.get(thought.branchId);
        if (!branch) {
          branch = {
            forks: thought.branchFromThought || 0,
            thoughts: [],
            length: 0,
          };
          branchMap.set(thought.branchId, branch);
        }
        branch.thoughts.push(thought.thoughtNumber);
        branch.length++;
        // Update forks if this thought has branchFromThought
        if (thought.branchFromThought && branch.forks === 0) {
          branch.forks = thought.branchFromThought;
        }
      }

      // Convert branch map to object
      const branches: Record<string, { forks: number; range: [number, number]; length: number }> = {};
      for (const [branchId, data] of branchMap) {
        const sorted = data.thoughts.sort((a, b) => a - b);
        branches[branchId] = {
          forks: data.forks,
          range: [sorted[0], sorted[sorted.length - 1]],
          length: data.length,
        };
      }

      // Build revisions list
      const revisions: [number, number][] = allThoughts
        .filter(t => t.isRevision && t.revisesThought)
        .map(t => [t.thoughtNumber, t.revisesThought!]);

      // Build response
      const structure = {
        sessionId,
        totalThoughts: allThoughts.length,
        mainChain,
        branches,
        branchCount: branchMap.size,
        revisions,
        revisionCount: revisions.length,
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(structure, null, 2),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: (err as Error).message }, null, 2),
        }],
        isError: true,
      };
    }
  }

  private async handleNotebook(args?: Record<string, unknown>): Promise<ToolResponse> {
    if (!args || !args.operation) {
      return {
        content: [{ type: 'text', text: 'Notebook operation requires args with operation field' }],
        isError: true,
      };
    }

    const operation = args.operation as string;
    const { operation: _, ...operationArgs } = args;

    return this.notebookHandler.processTool(operation, operationArgs);
  }

  private async handleSession(args?: Record<string, unknown>): Promise<ToolResponse> {
    if (!args || !args.operation) {
      return {
        content: [{ type: 'text', text: 'Session operation requires args with operation field' }],
        isError: true,
      };
    }

    const operation = args.operation as string;
    const { operation: _, ...operationArgs } = args;

    return this.sessionHandler.processTool(operation, operationArgs || {});
  }

  private async handleMentalModels(args?: Record<string, unknown>): Promise<ToolResponse> {
    if (!args || !args.operation) {
      return {
        content: [{ type: 'text', text: 'Mental models operation requires args with operation field' }],
        isError: true,
      };
    }

    const operation = args.operation as string;
    const { operation: _, ...operationArgs } = args;

    const result = await this.mentalModelsHandler.processTool(operation, operationArgs);
    // Transform content to have proper literal types
    const content: Array<{ type: 'text'; text: string }> = result.content
      .filter((c): c is { type: string; text: string } => c.type === 'text' && typeof c.text === 'string')
      .map((c) => ({ type: 'text' as const, text: c.text }));
    return { content, isError: result.isError };
  }

  private async handleDeepAnalysis(args?: Record<string, unknown>): Promise<ToolResponse> {
    if (!args || !args.sessionId || !args.analysisType) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Deep analysis requires sessionId and analysisType',
            required: ['sessionId', 'analysisType'],
            analysisTypes: ['patterns', 'cognitive_load', 'decision_points', 'full'],
          }, null, 2),
        }],
        isError: true,
      };
    }

    const sessionId = args.sessionId as string;
    const analysisType = args.analysisType as 'patterns' | 'cognitive_load' | 'decision_points' | 'full';
    const options = args.options as { includeTimeline?: boolean; compareWith?: string[] } | undefined;

    try {
      const session = await this.storage.getSession(sessionId);
      if (!session) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: `Session not found: ${sessionId}` }, null, 2),
          }],
          isError: true,
        };
      }

      // Fetch thoughts separately (not stored on Session object)
      const thoughts: ThoughtData[] = await this.storage.getThoughts(sessionId);

      const result: Record<string, unknown> = {
        sessionId,
        analysisType,
        timestamp: new Date().toISOString(),
      };

      if (analysisType === 'patterns' || analysisType === 'full') {
        result.patterns = {
          totalThoughts: thoughts.length,
          revisionCount: thoughts.filter((t: ThoughtData) => t.isRevision).length,
          branchCount: new Set(
            thoughts
              .filter((t: ThoughtData) => t.branchId)
              .map((t: ThoughtData) => t.branchId)
          ).size,
          averageThoughtLength:
            thoughts.length > 0
              ? Math.round(
                  thoughts.reduce((sum: number, t: ThoughtData) => sum + t.thought.length, 0) / thoughts.length
                )
              : 0,
        };
      }

      if (analysisType === 'cognitive_load' || analysisType === 'full') {
        result.cognitiveLoad = {
          complexityScore: Math.min(100, thoughts.length * 5 + ((session.tags?.length || 0) as number) * 10),
          depthIndicator: thoughts.reduce((max: number, t: ThoughtData) => Math.max(max, t.thoughtNumber), 0),
          breadthIndicator: new Set(thoughts.map((t: ThoughtData) => t.branchId || 'main')).size,
        };
      }

      if (analysisType === 'decision_points' || analysisType === 'full') {
        result.decisionPoints = thoughts
          .filter((t: ThoughtData) => t.isRevision || t.branchFromThought)
          .map((t: ThoughtData) => ({
            thoughtNumber: t.thoughtNumber,
            type: t.isRevision ? 'revision' : 'branch',
            reference: t.revisesThought || t.branchFromThought,
          }));
      }

      if (options?.includeTimeline) {
        result.timeline = {
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          durationEstimate: thoughts.length ? `~${thoughts.length * 2} minutes` : 'unknown',
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: (err as Error).message }, null, 2),
        }],
        isError: true,
      };
    }
  }

  /**
   * Handle knowledge operation
   */
  private async handleKnowledge(args?: Record<string, unknown>): Promise<ToolResponse> {
    if (!this.knowledgeHandler) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Knowledge operations not enabled. Initialize knowledge storage in server configuration.',
          }, null, 2),
        }],
        isError: true,
      };
    }

    if (!args || !args.action) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Knowledge operation requires args with action field',
            available_actions: [
              'create_entity',
              'get_entity',
              'list_entities',
              'add_observation',
              'create_relation',
              'query_graph',
              'stats',
            ],
          }, null, 2),
        }],
        isError: true,
      };
    }

    return this.knowledgeHandler.processOperation(args as any);
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
Routes to: init, cipher, thoughtbox, notebook, session, mental_models, knowledge handlers.

Operations:
- get_state, list_sessions, navigate, load_context, start_new, list_roots, bind_root (init)
- cipher (loads notation system)
- thought (structured reasoning)
- read_thoughts (retrieve previous thoughts mid-session for re-reading)
- get_structure (get reasoning graph topology without content)
- notebook (literate programming)
- session (session management)
- mental_models (reasoning frameworks)
- deep_analysis (session pattern analysis)
- knowledge (knowledge graph memory - Phase 1)

read_thoughts usage (Stage 2 required):
- { args: { thoughtNumber: N } } - get a single thought by number
- { args: { last: N } } - get the last N thoughts
- { args: { range: [start, end] } } - get thoughts in a range (inclusive)
- { args: { branchId: 'name' } } - get all thoughts from a specific branch
- { args: { sessionId: 'id' } } - optional, defaults to active session
- No args returns last 5 thoughts as default context

get_structure usage (Stage 2 required):
- { args: { sessionId: 'id' } } - optional, defaults to active session
- Response includes: mainChain (head/tail/length), branches (id/forks/range), revisions
- Use to understand "shape" of reasoning before drilling into specific thoughts

knowledge usage (Stage 2 required):
- { args: { action: 'create_entity', name, type, label, properties } } - create entity
- { args: { action: 'add_observation', entity_id, content } } - add fact to entity
- { args: { action: 'create_relation', from_id, to_id, relation_type } } - link entities
- { args: { action: 'query_graph', start_entity_id, relation_types, max_depth } } - traverse graph
- { args: { action: 'stats' } } - get entity/relation counts

Stage enforcement is handled internally - you'll get clear errors if calling operations too early.`,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};
