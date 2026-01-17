/**
 * Init Tool Handler
 *
 * Converts init workflow from resource-based navigation to tool-based operations.
 * Aligns with MCP 2025-11-25 spec for embedded resources in tool responses.
 *
 * @see https://modelcontextprotocol.io/specification/2025-11-25/server/tools#embedded-resources
 */

import { z } from 'zod';
import type {
  SessionIndex,
  SessionMetadata,
  McpServerWithRoots,
} from './types.js';
import { StateManager, ConnectionStage, type BoundRoot, type SessionState } from './state-manager.js';
import { ToolRegistry } from '../tool-registry.js';
import type { ThoughtboxStorage, Session } from '../persistence/types.js';

// =============================================================================
// Tool Schema
// =============================================================================

/**
 * Input schema for init tool operations
 */
export const initToolInputSchema = z.object({
  operation: z.enum([
    'get_state',      // Get current navigation state
    'list_sessions',  // List available sessions (with filters)
    'navigate',       // Navigate to project/task/aspect
    'load_context',   // Load full context for a session
    'start_new',      // Start new work (project/task/aspect)
    'list_roots',     // Query available MCP roots from client (SPEC-011)
    'bind_root',      // Bind a root as project scope (SPEC-011)
  ]),

  // For list_sessions
  filters: z.object({
    project: z.string().optional(),
    task: z.string().optional(),
    aspect: z.string().optional(),
    search: z.string().optional(),
    limit: z.number().default(20),
  }).optional(),

  // For navigate
  target: z.object({
    project: z.string().optional(),
    task: z.string().optional(),
    aspect: z.string().optional(),
  }).optional(),

  // For load_context
  sessionId: z.string().optional(),

  // For start_new
  newWork: z.object({
    // Project can be omitted when a bound root provides the project name.
    project: z.string().optional(),
    task: z.string().optional(),
    aspect: z.string().optional(),
    domain: z.string().optional().describe("Reasoning domain (e.g., 'debugging', 'planning', 'architecture') - unlocks domain-specific mental models"),
  }).optional(),

  // For bind_root (SPEC-011)
  rootUri: z.string().optional().describe('URI of the MCP root to bind as project scope'),
});

export type InitToolInput = z.infer<typeof initToolInputSchema>;

// =============================================================================
// MCP Response Types
// =============================================================================

/**
 * Embedded resource with MCP 2025-11-25 annotations
 */
interface EmbeddedResource {
  type: 'resource';
  resource: {
    uri: string;
    mimeType: string;
    text: string;
    annotations?: {
      audience?: ('assistant' | 'user')[];
      priority?: number;
      lastModified?: string;
    };
  };
}

/**
 * Text content block
 */
interface TextContent {
  type: 'text';
  text: string;
}

/**
 * Tool response content
 */
type ContentBlock = TextContent | EmbeddedResource;

/**
 * Tool response
 */
interface ToolResponse {
  content: ContentBlock[];
  isError?: boolean;
}

// =============================================================================
// Init Tool Handler
// =============================================================================

/**
 * Tool definition for registration
 */
export const INIT_TOOL = {
  name: 'init',
  description: `Navigate and manage Thoughtbox sessions.

Operations:
- get_state: Get current navigation state and available actions
- list_sessions: List sessions with optional filtering
- navigate: Move to a project/task/aspect in the hierarchy
- load_context: Load full context for continuing a session
- start_new: Initialize new work with project/task/aspect

Each response includes an embedded resource with navigation state.`,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

/**
 * Configuration for InitToolHandler
 */
export interface InitToolHandlerConfig {
  /** Storage for direct session access (required - source of truth) */
  storage: ThoughtboxStorage;
  /** Session index for navigation (optional - used for cached lookups) */
  index?: SessionIndex;
  /** State manager for session state */
  stateManager?: StateManager;
  /** Tool registry for progressive disclosure */
  toolRegistry?: ToolRegistry;
  /** MCP connection session ID */
  mcpSessionId?: string;
  /** MCP server for querying roots (SPEC-011) */
  mcpServer?: McpServerWithRoots;
}

/**
 * Handler for init tool operations
 *
 * Implements all operations with embedded resources per MCP spec.
 * Supports MCP roots for project scoping (SPEC-011).
 */
export class InitToolHandler {
  private storage: ThoughtboxStorage;
  private index: SessionIndex | null;
  private stateManager: StateManager;
  private toolRegistry: ToolRegistry | null;
  private mcpSessionId?: string;
  private mcpServer?: McpServerWithRoots;

  constructor(config: InitToolHandlerConfig) {
    this.storage = config.storage;
    this.index = config.index || null;
    this.stateManager = config.stateManager || new StateManager();
    this.toolRegistry = config.toolRegistry || null;
    this.mcpSessionId = config.mcpSessionId;
    this.mcpServer = config.mcpServer;
  }

  /**
   * Process an init tool call
   */
  async handle(input: InitToolInput): Promise<ToolResponse> {
    const sessionId = this.mcpSessionId || 'default';

    switch (input.operation) {
      case 'get_state':
        return this.handleGetState(sessionId);

      case 'list_sessions':
        return await this.handleListSessions(sessionId, input.filters);

      case 'navigate':
        return await this.handleNavigate(sessionId, input.target);

      case 'load_context':
        return await this.handleLoadContext(sessionId, input.sessionId);

      case 'start_new':
        return await this.handleStartNew(sessionId, input.newWork);

      case 'list_roots':
        return await this.handleListRoots(sessionId);

      case 'bind_root':
        return await this.handleBindRoot(sessionId, input.rootUri);

      default:
        return {
          content: [{
            type: 'text',
            text: `Unknown operation: ${input.operation}`,
          }],
          isError: true,
        };
    }
  }

  // ===========================================================================
  // Operation Handlers
  // ===========================================================================

  /**
   * get_state: Get current navigation state and available actions
   */
  private handleGetState(sessionId: string): ToolResponse {
    const state = this.stateManager.getSessionState(sessionId);
    const stage = state.stage;

    // Build state summary
    const stateText = this.buildStateText(state);

    // Build navigation options based on current state
    const navigationMarkdown = this.buildNavigationMarkdown(state);

    return {
      content: [
        { type: 'text', text: stateText },
        this.createEmbeddedResource(
          'thoughtbox://init/state',
          navigationMarkdown,
          ['assistant'],
          0.9
        ),
      ],
    };
  }

  /**
   * list_sessions: List sessions with optional filtering
   * Now reads from storage directly instead of exports-based index.
   */
  private async handleListSessions(
    sessionId: string,
    filters?: InitToolInput['filters']
  ): Promise<ToolResponse> {
    // Update state to indicate init has started
    if (this.stateManager.getSessionStage(sessionId) === ConnectionStage.STAGE_1_UNINITIALIZED) {
      this.stateManager.updateSessionStage(sessionId, ConnectionStage.STAGE_2_INIT_STARTED);
    }

    const limit = filters?.limit ?? 20;

    // Build storage filter from init filters
    const storageFilter: { tags?: string[] } = {};
    const tagFilters: string[] = [];
    if (filters?.project) {
      tagFilters.push(`project:${filters.project}`);
    }
    if (filters?.task) {
      tagFilters.push(`task:${filters.task}`);
    }
    if (filters?.aspect) {
      tagFilters.push(`aspect:${filters.aspect}`);
    }
    if (tagFilters.length > 0) {
      storageFilter.tags = tagFilters;
    }

    // Get sessions from storage
    const storageSessions = await this.storage.listSessions(storageFilter);

    // Convert to SessionMetadata format
    let sessions = storageSessions.map(s => this.sessionToMetadata(s));

    // Apply search filter (storage doesn't support text search)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      sessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchLower) ||
        s.lastConclusion?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by updatedAt desc and limit
    sessions = sessions
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);

    // Build response
    const summaryText = this.buildSessionListSummary(sessions, filters);
    const detailMarkdown = this.buildSessionListMarkdown(sessions);

    return {
      content: [
        { type: 'text', text: summaryText },
        this.createEmbeddedResource(
          'thoughtbox://init/sessions',
          detailMarkdown,
          ['assistant'],
          0.8
        ),
      ],
    };
  }

  /**
   * Convert a storage Session to SessionMetadata format.
   * Parses project:, task:, aspect: tags into separate fields.
   */
  private sessionToMetadata(session: Session): SessionMetadata {
    let project: string | null = null;
    let task: string | null = null;
    let aspect: string | null = null;

    for (const tag of session.tags) {
      if (tag.startsWith('project:')) {
        project = tag.slice(8);
      } else if (tag.startsWith('task:')) {
        task = tag.slice(5);
      } else if (tag.startsWith('aspect:')) {
        aspect = tag.slice(7);
      }
    }

    return {
      id: session.id,
      title: session.title,
      project,
      task,
      aspect,
      thoughtCount: session.thoughtCount,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      exportPath: '', // Not relevant when reading from storage
      lastConclusion: null, // Would need to load thoughts to get this
    };
  }

  /**
   * navigate: Move to a project/task/aspect in the hierarchy
   */
  private async handleNavigate(
    sessionId: string,
    target?: InitToolInput['target']
  ): Promise<ToolResponse> {
    if (!target) {
      return {
        content: [{
          type: 'text',
          text: 'Navigate operation requires target parameter',
        }],
        isError: true,
      };
    }

    // Update state to indicate init has started
    if (this.stateManager.getSessionStage(sessionId) === ConnectionStage.STAGE_1_UNINITIALIZED) {
      this.stateManager.updateSessionStage(sessionId, ConnectionStage.STAGE_2_INIT_STARTED);
    }

    // Update state with navigation target
    this.stateManager.updateSessionState(sessionId, {
      project: target.project,
      task: target.task,
      aspect: target.aspect,
    });

    // Validate navigation target exists by querying storage
    if (target.project) {
      const projectSessions = await this.storage.listSessions({
        tags: [`project:${target.project}`]
      });
      if (projectSessions.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `Project not found: ${target.project}`,
          }],
          isError: true,
        };
      }
    }

    if (target.project && target.task) {
      const taskSessions = await this.storage.listSessions({
        tags: [`project:${target.project}`, `task:${target.task}`]
      });
      if (taskSessions.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `Task not found: ${target.project}/${target.task}`,
          }],
          isError: true,
        };
      }
    }

    // Get sessions matching navigation target
    const sessions = await this.getSessionsForTarget(target);

    // Build navigation context
    const contextText = this.buildNavigationContextText(target, sessions);
    const contextMarkdown = this.buildNavigationContextMarkdown(target, sessions);

    return {
      content: [
        { type: 'text', text: contextText },
        this.createEmbeddedResource(
          `thoughtbox://init/context/${target.project || 'root'}`,
          contextMarkdown,
          ['assistant'],
          0.85
        ),
      ],
    };
  }

  /**
   * load_context: Load full context for continuing a session
   */
  private async handleLoadContext(
    sessionId: string,
    targetSessionId?: string
  ): Promise<ToolResponse> {
    if (!targetSessionId) {
      return {
        content: [{
          type: 'text',
          text: 'load_context operation requires sessionId parameter',
        }],
        isError: true,
      };
    }

    // Get session from storage
    const storageSession = await this.storage.getSession(targetSessionId);
    if (!storageSession) {
      return {
        content: [{
          type: 'text',
          text: `Session not found: ${targetSessionId}`,
        }],
        isError: true,
      };
    }

    // Convert to SessionMetadata format
    const session = this.sessionToMetadata(storageSession);

    // Update state to fully loaded
    this.stateManager.updateSessionState(sessionId, {
      stage: ConnectionStage.STAGE_3_FULLY_LOADED,
      project: session.project || undefined,
      task: session.task || undefined,
      aspect: session.aspect || undefined,
      activeSessionId: targetSessionId,
    });

    // NOTE: Stage advancement moved to server-factory.ts for error-safe pattern
    // The factory checks isError before advancing stages

    // Build context response
    const contextText = this.buildLoadedContextText(session);
    const contextMarkdown = this.buildLoadedContextMarkdown(session);

    return {
      content: [
        { type: 'text', text: contextText },
        this.createEmbeddedResource(
          `thoughtbox://session/${targetSessionId}/context`,
          contextMarkdown,
          ['assistant'],
          1.0  // Highest priority - this is the loaded context
        ),
      ],
    };
  }

  /**
   * start_new: Initialize new work with project/task/aspect
   *
   * If no project is provided but a root is bound, uses the bound root name as project.
   * This ensures consistent project naming when using MCP roots for scoping.
   */
  private async handleStartNew(
    sessionId: string,
    newWork?: InitToolInput['newWork']
  ): Promise<ToolResponse> {
    // Get bound root for fallback project name
    const boundRoot = this.stateManager.getBoundRoot(sessionId);

    // If a root is bound, it takes precedence; a provided project is ignored
    // but noted back to the caller so the behavior is transparent.
    const projectOverrideIgnored =
      Boolean(boundRoot?.name) &&
      Boolean(newWork?.project) &&
      newWork!.project !== boundRoot!.name;

    // Determine effective project: explicit > bound root > error
    let effectiveProject: string;
    if (boundRoot?.name) {
      effectiveProject = boundRoot.name;
    } else if (newWork?.project) {
      effectiveProject = newWork.project;
    } else if (boundRoot?.name) {
      effectiveProject = boundRoot.name;
    } else if (!newWork) {
      return {
        content: [{
          type: 'text',
          text: 'start_new operation requires newWork parameter with at least project, or bind a root first using bind_root',
        }],
        isError: true,
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: 'start_new requires a project name. Either provide newWork.project or bind a root first using bind_root.',
        }],
        isError: true,
      };
    }

    // Build effective newWork with resolved project
    const effectiveNewWork = {
      ...newWork,
      project: effectiveProject,
    };

    // Update state to fully loaded with new work context
    this.stateManager.updateSessionState(sessionId, {
      stage: ConnectionStage.STAGE_3_FULLY_LOADED,
      project: effectiveNewWork.project,
      task: effectiveNewWork.task,
      aspect: effectiveNewWork.aspect,
    });

    // NOTE: Stage advancement moved to server-factory.ts for error-safe pattern
    // The factory checks isError before advancing stages
    // Domain-based Stage 3 advancement is also handled there

    // Find related sessions for context
    const relatedSessions = await this.getSessionsForTarget({
      project: effectiveNewWork.project,
      task: effectiveNewWork.task,
      aspect: effectiveNewWork.aspect,
    });

    // Compute counts at project/task/aspect granularity using storage queries
    const projectSessions = await this.storage.listSessions({
      tags: [`project:${effectiveNewWork.project}`],
    });
    const projectSessionCount = projectSessions.length;

    let taskSessionCount = 0;
    if (effectiveNewWork.task) {
      const taskSessions = await this.storage.listSessions({
        tags: [
          `project:${effectiveNewWork.project}`,
          `task:${effectiveNewWork.task}`,
        ],
      });
      taskSessionCount = taskSessions.length;
    }

    const relatedCounts = {
      projectCount: projectSessionCount,
      taskCount: taskSessionCount,
      aspectCount: relatedSessions.length,
    };

    // Build response with indication if project came from bound root
    const projectSource = boundRoot ? 'bound-root' : newWork?.project ? 'explicit' : 'bound-root';
    const confirmText = this.buildNewWorkConfirmText(
      effectiveNewWork,
      relatedSessions,
      projectSource,
      boundRoot,
      relatedCounts,
      projectOverrideIgnored ? `Project input "${newWork!.project}" was ignored because bound root "${boundRoot!.name}" is active.` : undefined
    );
    const suggestionsMarkdown = this.buildNewWorkSuggestionsMarkdown(effectiveNewWork, relatedSessions);

    return {
      content: [
        { type: 'text', text: confirmText },
        this.createEmbeddedResource(
          `thoughtbox://init/new/${effectiveNewWork.project}`,
          suggestionsMarkdown,
          ['assistant'],
          0.9
        ),
      ],
    };
  }

  /**
   * list_roots: Query available MCP roots from connected client (SPEC-011)
   */
  private async handleListRoots(sessionId: string): Promise<ToolResponse> {
    // Check if MCP server supports roots
    if (!this.mcpServer?.listRoots) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            operation: 'list_roots',
            available: false,
            message: 'MCP roots not available - client may not support roots capability',
            suggestion: 'You can still use start_new or load_context to initialize',
          }, null, 2),
        }],
        // Not an error - just not supported
      };
    }

    try {
      const { roots } = await this.mcpServer.listRoots();

      // Get current bound root for this session
      const boundRoot = this.stateManager.getBoundRoot(sessionId);

      const rootsInfo = roots.map(r => ({
        uri: r.uri,
        name: r.name || this.extractNameFromUri(r.uri),
        isBound: boundRoot?.uri === r.uri,
      }));

      const summaryText = `Found ${roots.length} available root(s)${boundRoot ? `, currently bound to: ${boundRoot.name || boundRoot.uri}` : ''}`;

      const detailMarkdown = this.buildRootsListMarkdown(rootsInfo, boundRoot);

      return {
        content: [
          { type: 'text', text: summaryText },
          this.createEmbeddedResource(
            'thoughtbox://init/roots',
            detailMarkdown,
            ['assistant'],
            0.85
          ),
        ],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Failed to list roots: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }

  /**
   * bind_root: Bind an MCP root as project scope (SPEC-011)
   */
  private async handleBindRoot(
    sessionId: string,
    rootUri?: string
  ): Promise<ToolResponse> {
    if (!rootUri) {
      return {
        content: [{
          type: 'text',
          text: 'bind_root operation requires rootUri parameter',
        }],
        isError: true,
      };
    }

    // Check if MCP server supports roots
    if (!this.mcpServer?.listRoots) {
      return {
        content: [{
          type: 'text',
          text: 'MCP roots not available - cannot validate root URI',
        }],
        isError: true,
      };
    }

    try {
      // Fetch available roots to validate the requested URI
      const { roots } = await this.mcpServer.listRoots();
      const targetRoot = roots.find(r => r.uri === rootUri);

      if (!targetRoot) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'Root not found',
              requestedUri: rootUri,
              availableRoots: roots.map(r => r.uri),
              suggestion: 'Use list_roots to see available roots',
            }, null, 2),
          }],
          isError: true,
        };
      }

      // Bind the root
      const boundRoot: BoundRoot = {
        uri: targetRoot.uri,
        name: targetRoot.name || this.extractNameFromUri(targetRoot.uri),
      };
      this.stateManager.setBoundRoot(sessionId, boundRoot);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            operation: 'bind_root',
            success: true,
            boundRoot,
            message: `Bound to root: ${boundRoot.name || boundRoot.uri}`,
            nextSteps: [
              'Use start_new to begin work in this project scope',
              'Use list_sessions with filters to find related sessions',
            ],
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Failed to bind root: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }

  /**
   * Extract a human-readable name from a file URI
   */
  private extractNameFromUri(uri: string): string {
    try {
      // Handle file:// URIs
      if (uri.startsWith('file://')) {
        const path = uri.slice(7); // Remove 'file://'
        return path.split('/').filter(Boolean).pop() || uri;
      }
      // Fallback: last segment of path
      return uri.split('/').filter(Boolean).pop() || uri;
    } catch {
      return uri;
    }
  }

  /**
   * Build markdown for roots list
   */
  private buildRootsListMarkdown(
    roots: Array<{ uri: string; name: string; isBound: boolean }>,
    boundRoot?: BoundRoot
  ): string {
    const lines: string[] = ['# Available MCP Roots', ''];

    if (boundRoot) {
      lines.push(`**Currently bound**: ${boundRoot.name || boundRoot.uri}`);
      lines.push('');
    }

    if (roots.length === 0) {
      lines.push('No roots available from the connected client.');
      lines.push('');
      lines.push('Use `start_new` to initialize work without binding to a specific root.');
    } else {
      lines.push('## Roots');
      lines.push('');
      for (const root of roots) {
        const marker = root.isBound ? '✓ ' : '';
        lines.push(`- ${marker}**${root.name}**`);
        lines.push(`  URI: ${root.uri}`);
      }
      lines.push('');
      lines.push('## Actions');
      lines.push('');
      lines.push('- Use `bind_root` with `rootUri` to bind to a specific root');
      lines.push('- Use `start_new` to begin work (optionally with bound root as project scope)');
    }

    return lines.join('\n');
  }

  // ===========================================================================
  // Helper Methods - Embedded Resources
  // ===========================================================================

  /**
   * Create an embedded resource with proper MCP annotations
   */
  private createEmbeddedResource(
    uri: string,
    markdown: string,
    audience: ('assistant' | 'user')[],
    priority: number
  ): EmbeddedResource {
    return {
      type: 'resource',
      resource: {
        uri,
        mimeType: 'text/markdown',
        text: markdown,
        annotations: {
          audience,
          priority,
          lastModified: new Date().toISOString(),
        },
      },
    };
  }

  // ===========================================================================
  // Helper Methods - Text Building
  // ===========================================================================

  private buildStateText(state: SessionState): string {
    const parts = [`Connection stage: ${state.stage}`];

    if (state.project) parts.push(`Project: ${state.project}`);
    if (state.task) parts.push(`Task: ${state.task}`);
    if (state.aspect) parts.push(`Aspect: ${state.aspect}`);
    if (state.activeSessionId) parts.push(`Active session: ${state.activeSessionId}`);

    return parts.join('\n');
  }

  private buildNavigationMarkdown(state: SessionState): string {
    const lines: string[] = ['# Navigation State', ''];

    if (state.stage === ConnectionStage.STAGE_1_UNINITIALIZED) {
      lines.push('## Getting Started');
      lines.push('');
      lines.push('Use one of these operations to begin:');
      lines.push('');
      lines.push('- `list_sessions` - Browse existing sessions');
      lines.push('- `navigate` - Go to a specific project/task');
      lines.push('- `start_new` - Begin new work');
    } else if (state.stage === ConnectionStage.STAGE_2_INIT_STARTED) {
      lines.push('## Navigation In Progress');
      lines.push('');
      if (state.project) {
        lines.push(`**Project**: ${state.project}`);
        if (state.task) lines.push(`**Task**: ${state.task}`);
        if (state.aspect) lines.push(`**Aspect**: ${state.aspect}`);
      }
      lines.push('');
      lines.push('Continue with:');
      lines.push('- `navigate` - Refine selection');
      lines.push('- `load_context` - Load a specific session');
      lines.push('- `start_new` - Begin new work');
    } else {
      lines.push('## Context Loaded');
      lines.push('');
      lines.push('Ready to work. Use `thoughtbox` tool to begin reasoning.');
      if (state.activeSessionId) {
        lines.push('');
        lines.push(`Continuing session: ${state.activeSessionId}`);
      }
    }

    // Add available projects summary (if index is available)
    if (this.index && this.index.projects.length > 0) {
      lines.push('');
      lines.push('## Available Projects');
      lines.push('');
      for (const project of this.index.projects.slice(0, 10)) {
        const relTime = this.formatRelativeTime(project.lastWorked);
        lines.push(`- **${project.name}** (${project.sessionCount} sessions, last: ${relTime})`);
      }
    }

    return lines.join('\n');
  }

  private buildSessionListSummary(
    sessions: SessionMetadata[],
    filters?: InitToolInput['filters']
  ): string {
    const filterDesc = filters
      ? Object.entries(filters)
          .filter(([k, v]) => v !== undefined && k !== 'limit')
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')
      : 'none';

    return `Found ${sessions.length} sessions (filters: ${filterDesc || 'none'})`;
  }

  private buildSessionListMarkdown(sessions: SessionMetadata[]): string {
    const lines: string[] = ['# Session List', ''];

    if (sessions.length === 0) {
      lines.push('No sessions found matching criteria.');
      return lines.join('\n');
    }

    for (const session of sessions) {
      const relTime = this.formatRelativeTime(session.updatedAt);
      lines.push(`## ${session.title}`);
      lines.push('');
      lines.push(`- **ID**: ${session.id}`);
      if (session.project) lines.push(`- **Project**: ${session.project}`);
      if (session.task) lines.push(`- **Task**: ${session.task}`);
      if (session.aspect) lines.push(`- **Aspect**: ${session.aspect}`);
      lines.push(`- **Thoughts**: ${session.thoughtCount}`);
      lines.push(`- **Last updated**: ${relTime}`);
      if (session.lastConclusion) {
        lines.push(`- **Last conclusion**: ${session.lastConclusion.slice(0, 200)}${session.lastConclusion.length > 200 ? '...' : ''}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private buildNavigationContextText(
    target: NonNullable<InitToolInput['target']>,
    sessions: SessionMetadata[]
  ): string {
    const path = [target.project, target.task, target.aspect]
      .filter(Boolean)
      .join('/');
    return `Navigated to: ${path || 'root'}\nFound ${sessions.length} related sessions`;
  }

  private buildNavigationContextMarkdown(
    target: NonNullable<InitToolInput['target']>,
    sessions: SessionMetadata[]
  ): string {
    const lines: string[] = ['# Navigation Context', ''];

    const path = [target.project, target.task, target.aspect]
      .filter(Boolean)
      .join(' → ');
    lines.push(`**Current path**: ${path || 'root'}`);
    lines.push('');

    // Show hierarchy options if not fully drilled down (requires index)
    if (target.project && !target.task && this.index) {
      const project = this.index.projects.find(p => p.name === target.project);
      if (project && project.tasks.length > 0) {
        lines.push('## Available Tasks');
        lines.push('');
        for (const task of project.tasks) {
          lines.push(`- **${task.name}** (${task.sessionCount} sessions)`);
        }
        lines.push('');
      }
    }

    // Show recent sessions
    if (sessions.length > 0) {
      lines.push('## Related Sessions');
      lines.push('');
      for (const session of sessions.slice(0, 5)) {
        const relTime = this.formatRelativeTime(session.updatedAt);
        lines.push(`- **${session.title}** (${relTime})`);
        lines.push(`  ID: ${session.id}`);
      }
    }

    return lines.join('\n');
  }

  private buildLoadedContextText(session: SessionMetadata): string {
    const parts = [
      `Loaded session: ${session.title}`,
      `ID: ${session.id}`,
      `Thoughts: ${session.thoughtCount}`,
    ];
    if (session.project) parts.push(`Project: ${session.project}`);
    if (session.task) parts.push(`Task: ${session.task}`);
    if (session.aspect) parts.push(`Aspect: ${session.aspect}`);
    return parts.join('\n');
  }

  private buildLoadedContextMarkdown(session: SessionMetadata): string {
    const lines: string[] = ['# Session Context', ''];

    lines.push(`## ${session.title}`);
    lines.push('');
    lines.push(`- **Session ID**: ${session.id}`);
    lines.push(`- **Thought count**: ${session.thoughtCount}`);
    lines.push(`- **Created**: ${this.formatRelativeTime(session.createdAt)}`);
    lines.push(`- **Last updated**: ${this.formatRelativeTime(session.updatedAt)}`);
    lines.push('');

    if (session.project || session.task || session.aspect) {
      lines.push('## Classification');
      lines.push('');
      if (session.project) lines.push(`- **Project**: ${session.project}`);
      if (session.task) lines.push(`- **Task**: ${session.task}`);
      if (session.aspect) lines.push(`- **Aspect**: ${session.aspect}`);
      lines.push('');
    }

    if (session.lastConclusion) {
      lines.push('## Last Conclusion');
      lines.push('');
      lines.push(session.lastConclusion);
      lines.push('');
    }

    lines.push('## Next Steps');
    lines.push('');
    lines.push('**⚠️ STOP HERE - DO NOT CALL ANY MORE TOOLS IN THIS TURN**');
    lines.push('');
    lines.push('New tools (`thoughtbox_cipher`, `session`) are now available, but you must');
    lines.push('**end this turn and wait for the user to send another message** before calling them.');
    lines.push('If a tool seems missing, wait a few seconds and retry.');
    lines.push('');
    lines.push('Immediate next actions for Claude:');
    lines.push('0) Ask the user to send any short message to start the next turn.');
    lines.push('1) Call `thoughtbox_cipher`.');
    lines.push('If the call fails with "not found" or "No such tool available: mcp__thoughtbox__thoughtbox_cipher", wait 5s and retry.');
    lines.push('');
    lines.push('Tell the user: "Session loaded. Ready to continue - please send any message to proceed."');
    lines.push('');
    lines.push('In your NEXT turn (after user responds), call `thoughtbox_cipher` to load the notation system.');

    return lines.join('\n');
  }

  private buildNewWorkConfirmText(
    newWork: NonNullable<InitToolInput['newWork']>,
    relatedSessions: SessionMetadata[],
    projectSource?: 'explicit' | 'bound-root',
    boundRoot?: BoundRoot,
    relatedCounts?: { projectCount: number; taskCount: number; aspectCount: number },
    overrideNotice?: string
  ): string {
    const path = [newWork.project, newWork.task, newWork.aspect]
      .filter(Boolean)
      .join('/');

    let message = `Initialized new work context: ${path}`;

    // Indicate if project was auto-derived from bound root
    if (projectSource === 'bound-root' && boundRoot) {
      message += `\nProject "${newWork.project}" derived from bound root: ${boundRoot.uri}`;
    }
    if (overrideNotice) {
      message += `\n${overrideNotice}`;
    }

    if (relatedCounts) {
      message += '\nRelated prior sessions:';
      message += `\n- Project matches: ${relatedCounts.projectCount}`;
      message += `\n- Task matches: ${relatedCounts.taskCount}${newWork.task ? '' : ' (task not specified)'}`;
      message += `\n- Aspect matches: ${relatedCounts.aspectCount}${newWork.aspect ? '' : ' (aspect not specified)'}`;
    } else {
      message += `\nFound ${relatedSessions.length} related prior sessions`;
    }
    return message;
  }

  private buildNewWorkSuggestionsMarkdown(
    newWork: NonNullable<InitToolInput['newWork']>,
    relatedSessions: SessionMetadata[]
  ): string {
    const lines: string[] = ['# New Work Context', ''];

    lines.push(`## Work Area`);
    lines.push('');
    lines.push(`- **Project**: ${newWork.project}`);
    if (newWork.task) lines.push(`- **Task**: ${newWork.task}`);
    if (newWork.aspect) lines.push(`- **Aspect**: ${newWork.aspect}`);
    lines.push('');

    lines.push('## Getting Started');
    lines.push('');
    lines.push('**⚠️ STOP HERE - DO NOT CALL ANY MORE TOOLS IN THIS TURN**');
    lines.push('');
    lines.push('New tools (`thoughtbox_cipher`, `session`) are now available, but you must');
    lines.push('**end this turn and wait for the user to send another message** before calling them.');
    lines.push('If a tool seems missing, wait a few seconds and retry.');
    lines.push('');
    lines.push('Immediate next actions for Claude:');
    lines.push('0) Ask the user to send any short message to start the next turn.');
    lines.push('1) Call `thoughtbox_cipher`.');
    lines.push('If the call fails with "not found" or "No such tool available: mcp__thoughtbox__thoughtbox_cipher", wait 5s and retry.');
    lines.push('');
    lines.push('Tell the user: "Work context initialized. Ready to begin - please send any message to proceed."');
    lines.push('');
    lines.push('In your NEXT turn (after user responds), call `thoughtbox_cipher` to load the notation system.');
    lines.push('');
    lines.push('Suggested session setup:');
    lines.push('```json');
    lines.push('{');
    lines.push(`  "sessionTitle": "Work on ${newWork.project}${newWork.task ? '/' + newWork.task : ''}",`);
    lines.push(`  "sessionTags": [`);
    lines.push(`    "project:${newWork.project}"${newWork.task ? ',' : ''}`);
    if (newWork.task) lines.push(`    "task:${newWork.task}"${newWork.aspect ? ',' : ''}`);
    if (newWork.aspect) lines.push(`    "aspect:${newWork.aspect}"`);
    lines.push(`  ]`);
    lines.push('}');
    lines.push('```');
    lines.push('');

    if (relatedSessions.length > 0) {
      lines.push('## Related Prior Work');
      lines.push('');
      lines.push('Consider reviewing these sessions for context:');
      lines.push('');
      for (const session of relatedSessions.slice(0, 5)) {
        const relTime = this.formatRelativeTime(session.updatedAt);
        lines.push(`- **${session.title}** (${relTime})`);
        lines.push(`  Use \`load_context\` with sessionId: ${session.id}`);
      }
    }

    return lines.join('\n');
  }

  // ===========================================================================
  // Helper Methods - Data Access
  // ===========================================================================

  private async getSessionsForTarget(target: {
    project?: string;
    task?: string;
    aspect?: string;
  }): Promise<SessionMetadata[]> {
    // Build tag filters
    const tagFilters: string[] = [];
    if (target.project) {
      tagFilters.push(`project:${target.project}`);
    }
    if (target.task) {
      tagFilters.push(`task:${target.task}`);
    }
    if (target.aspect) {
      tagFilters.push(`aspect:${target.aspect}`);
    }

    // Query storage
    const storageSessions = await this.storage.listSessions(
      tagFilters.length > 0 ? { tags: tagFilters } : undefined
    );

    // Convert to SessionMetadata and sort
    return storageSessions
      .map(s => this.sessionToMetadata(s))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 30) {
      return date.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else {
      return 'just now';
    }
  }

  /**
   * Update the session index (for refresh scenarios)
   */
  setIndex(index: SessionIndex): void {
    this.index = index;
  }
}

/**
 * Get operation names for tool registration
 */
export function getInitOperationNames(): string[] {
  return ['get_state', 'list_sessions', 'navigate', 'load_context', 'start_new', 'list_roots', 'bind_root'];
}
