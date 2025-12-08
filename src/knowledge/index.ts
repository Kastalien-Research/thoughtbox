/**
 * Knowledge Toolhost
 *
 * Provides tools for managing the Knowledge Zone ("The Garden"):
 * - Patterns: Extracted heuristics from successful reasoning sessions
 * - Scratchpad: Temporary collaborative working notes
 *
 * Follows the Toolhost Pattern with operation-based dispatch.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  KnowledgeStorage,
  type KnowledgePattern,
  type CreatePatternParams,
  type UpdatePatternParams,
  type PatternFilter,
  type ScratchpadNote,
} from "../persistence/index.js";

// =============================================================================
// Types
// =============================================================================

interface OperationDefinition {
  name: string;
  title: string;
  description: string;
  category: 'patterns' | 'scratchpad' | 'discovery';
  inputs: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  example: Record<string, any>;
}

// =============================================================================
// Operations Catalog
// =============================================================================

const KNOWLEDGE_OPERATIONS: OperationDefinition[] = [
  // Pattern operations
  {
    name: 'create_pattern',
    title: 'Create Knowledge Pattern',
    description: 'Extract and save a pattern from successful reasoning. Patterns are stored as Markdown with YAML frontmatter for human readability.',
    category: 'patterns',
    inputs: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Human-readable title for the pattern' },
        description: { type: 'string', description: 'Brief description of when/how to apply this pattern' },
        content: { type: 'string', description: 'The pattern content in Markdown format' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
        derivedFromSessions: { type: 'array', items: { type: 'string' }, description: 'Session IDs this pattern was extracted from' },
      },
      required: ['title', 'description', 'content'],
    },
    example: {
      title: 'Debugging Race Conditions',
      description: 'A systematic approach to identifying and fixing race conditions in concurrent code',
      content: '## Steps\n\n1. Identify shared state...',
      tags: ['debugging', 'concurrency'],
    },
  },
  {
    name: 'get_pattern',
    title: 'Get Knowledge Pattern',
    description: 'Retrieve a specific pattern by ID (slug)',
    category: 'patterns',
    inputs: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Pattern ID (slug, e.g., "debugging-race-conditions")' },
      },
      required: ['id'],
    },
    example: { id: 'debugging-race-conditions' },
  },
  {
    name: 'update_pattern',
    title: 'Update Knowledge Pattern',
    description: 'Update an existing pattern. Only provide fields you want to change.',
    category: 'patterns',
    inputs: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Pattern ID to update' },
        title: { type: 'string', description: 'New title (optional)' },
        description: { type: 'string', description: 'New description (optional)' },
        content: { type: 'string', description: 'New content (optional)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'New tags (optional)' },
      },
      required: ['id'],
    },
    example: { id: 'debugging-race-conditions', tags: ['debugging', 'concurrency', 'advanced'] },
  },
  {
    name: 'delete_pattern',
    title: 'Delete Knowledge Pattern',
    description: 'Delete a pattern by ID',
    category: 'patterns',
    inputs: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Pattern ID to delete' },
      },
      required: ['id'],
    },
    example: { id: 'outdated-pattern' },
  },
  {
    name: 'list_patterns',
    title: 'List Knowledge Patterns',
    description: 'List patterns with optional filtering by tags or search term',
    category: 'patterns',
    inputs: {
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags (OR matching)' },
        search: { type: 'string', description: 'Search in title, description, content' },
        limit: { type: 'number', description: 'Maximum results to return' },
        sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'title'], description: 'Sort field' },
        sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
      },
    },
    example: { tags: ['debugging'], limit: 10 },
  },
  {
    name: 'list_tags',
    title: 'List Pattern Tags',
    description: 'Get all unique tags across all patterns',
    category: 'discovery',
    inputs: {
      type: 'object',
      properties: {},
    },
    example: {},
  },
  // Scratchpad operations
  {
    name: 'write_scratchpad',
    title: 'Write Scratchpad Note',
    description: 'Create or update a temporary scratchpad note. Useful for collaborative working notes.',
    category: 'scratchpad',
    inputs: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic name (becomes the file name)' },
        content: { type: 'string', description: 'Note content in Markdown' },
      },
      required: ['topic', 'content'],
    },
    example: { topic: 'API Design Ideas', content: '## Current thinking\n\n...' },
  },
  {
    name: 'read_scratchpad',
    title: 'Read Scratchpad Note',
    description: 'Read a scratchpad note by topic ID',
    category: 'scratchpad',
    inputs: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Scratchpad topic ID (slug)' },
      },
      required: ['id'],
    },
    example: { id: 'api-design-ideas' },
  },
  {
    name: 'list_scratchpad',
    title: 'List Scratchpad Notes',
    description: 'List all scratchpad notes, sorted by last updated',
    category: 'scratchpad',
    inputs: {
      type: 'object',
      properties: {},
    },
    example: {},
  },
  {
    name: 'delete_scratchpad',
    title: 'Delete Scratchpad Note',
    description: 'Delete a scratchpad note',
    category: 'scratchpad',
    inputs: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Scratchpad topic ID to delete' },
      },
      required: ['id'],
    },
    example: { id: 'api-design-ideas' },
  },
];

// =============================================================================
// KnowledgeServer
// =============================================================================

export class KnowledgeServer {
  private storage: KnowledgeStorage;
  private initialized = false;

  constructor(dataDir?: string) {
    this.storage = new KnowledgeStorage(dataDir);
  }

  /**
   * Initialize the knowledge storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.storage.initialize();
    this.initialized = true;
  }

  /**
   * Process a knowledge tool call
   */
  async processTool(
    operation: string,
    args: Record<string, any>
  ): Promise<{
    content: Array<{ type: string; text?: string; resource?: any }>;
    isError?: boolean;
  }> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      switch (operation) {
        // Pattern operations
        case 'create_pattern':
          return this.handleCreatePattern(args);
        case 'get_pattern':
          return this.handleGetPattern(args.id);
        case 'update_pattern':
          return this.handleUpdatePattern(args.id, args);
        case 'delete_pattern':
          return this.handleDeletePattern(args.id);
        case 'list_patterns':
          return this.handleListPatterns(args);
        case 'list_tags':
          return this.handleListTags();

        // Scratchpad operations
        case 'write_scratchpad':
          return this.handleWriteScratchpad(args.topic, args.content);
        case 'read_scratchpad':
          return this.handleReadScratchpad(args.id);
        case 'list_scratchpad':
          return this.handleListScratchpad();
        case 'delete_scratchpad':
          return this.handleDeleteScratchpad(args.id);

        default:
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: `Unknown operation: ${operation}`,
                availableOperations: KNOWLEDGE_OPERATIONS.map(op => op.name),
              }, null, 2),
            }],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }, null, 2),
        }],
        isError: true,
      };
    }
  }

  /**
   * Get operations catalog as JSON
   */
  getOperationsCatalog(): string {
    return JSON.stringify({
      version: '1.0.0',
      description: 'Knowledge Zone operations for The Garden - mutable shared context',
      operations: KNOWLEDGE_OPERATIONS,
    }, null, 2);
  }

  // ===========================================================================
  // Pattern Handlers
  // ===========================================================================

  private async handleCreatePattern(args: Record<string, any>): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    if (!args.title || !args.description || !args.content) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Missing required fields: title, description, content',
          }, null, 2),
        }],
        isError: true,
      };
    }

    const pattern = await this.storage.createPattern({
      title: args.title,
      description: args.description,
      content: args.content,
      tags: args.tags,
      derivedFromSessions: args.derivedFromSessions,
      createdBy: args.createdBy,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          pattern: {
            id: pattern.id,
            title: pattern.title,
            description: pattern.description,
            tags: pattern.tags,
            uri: `thoughtbox://knowledge/patterns/${pattern.id}`,
          },
          message: `Pattern "${pattern.title}" created successfully`,
        }, null, 2),
      }],
    };
  }

  private async handleGetPattern(id: string): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    if (!id) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Pattern ID is required' }, null, 2),
        }],
        isError: true,
      };
    }

    const pattern = await this.storage.getPattern(id);
    if (!pattern) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: `Pattern "${id}" not found` }, null, 2),
        }],
        isError: true,
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          pattern: {
            ...pattern,
            uri: `thoughtbox://knowledge/patterns/${pattern.id}`,
            createdAt: pattern.createdAt.toISOString(),
            updatedAt: pattern.updatedAt.toISOString(),
          },
        }, null, 2),
      }],
    };
  }

  private async handleUpdatePattern(id: string, args: Record<string, any>): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    if (!id) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Pattern ID is required' }, null, 2),
        }],
        isError: true,
      };
    }

    const updateParams: UpdatePatternParams = {};
    if (args.title) updateParams.title = args.title;
    if (args.description) updateParams.description = args.description;
    if (args.content) updateParams.content = args.content;
    if (args.tags) updateParams.tags = args.tags;
    if (args.derivedFromSessions) updateParams.derivedFromSessions = args.derivedFromSessions;

    const pattern = await this.storage.updatePattern(id, updateParams);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          pattern: {
            id: pattern.id,
            title: pattern.title,
            description: pattern.description,
            tags: pattern.tags,
            uri: `thoughtbox://knowledge/patterns/${pattern.id}`,
            updatedAt: pattern.updatedAt.toISOString(),
          },
          message: `Pattern "${pattern.title}" updated successfully`,
        }, null, 2),
      }],
    };
  }

  private async handleDeletePattern(id: string): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    if (!id) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Pattern ID is required' }, null, 2),
        }],
        isError: true,
      };
    }

    await this.storage.deletePattern(id);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Pattern "${id}" deleted successfully`,
        }, null, 2),
      }],
    };
  }

  private async handleListPatterns(args: Record<string, any>): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    const filter: PatternFilter = {
      tags: args.tags,
      search: args.search,
      limit: args.limit,
      offset: args.offset,
      sortBy: args.sortBy,
      sortOrder: args.sortOrder,
    };

    const patterns = await this.storage.listPatterns(filter);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          patterns: patterns.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            tags: p.tags,
            uri: `thoughtbox://knowledge/patterns/${p.id}`,
            updatedAt: p.updatedAt.toISOString(),
          })),
          count: patterns.length,
          filter: {
            tags: args.tags,
            search: args.search,
          },
        }, null, 2),
      }],
    };
  }

  private async handleListTags(): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    const tags = await this.storage.getAllTags();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          tags,
          count: tags.length,
        }, null, 2),
      }],
    };
  }

  // ===========================================================================
  // Scratchpad Handlers
  // ===========================================================================

  private async handleWriteScratchpad(topic: string, content: string): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    if (!topic || !content) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Topic and content are required' }, null, 2),
        }],
        isError: true,
      };
    }

    const note = await this.storage.writeScratchpad(topic, content);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          note: {
            id: note.id,
            title: note.title,
            uri: `thoughtbox://knowledge/scratchpad/${note.id}`,
            updatedAt: note.updatedAt.toISOString(),
          },
          message: `Scratchpad "${note.title}" saved`,
        }, null, 2),
      }],
    };
  }

  private async handleReadScratchpad(id: string): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    if (!id) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Scratchpad ID is required' }, null, 2),
        }],
        isError: true,
      };
    }

    const note = await this.storage.readScratchpad(id);
    if (!note) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: `Scratchpad "${id}" not found` }, null, 2),
        }],
        isError: true,
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          note: {
            ...note,
            uri: `thoughtbox://knowledge/scratchpad/${note.id}`,
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
          },
        }, null, 2),
      }],
    };
  }

  private async handleListScratchpad(): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    const notes = await this.storage.listScratchpad();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          notes: notes.map(n => ({
            id: n.id,
            title: n.title,
            uri: `thoughtbox://knowledge/scratchpad/${n.id}`,
            updatedAt: n.updatedAt.toISOString(),
          })),
          count: notes.length,
        }, null, 2),
      }],
    };
  }

  private async handleDeleteScratchpad(id: string): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    if (!id) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Scratchpad ID is required' }, null, 2),
        }],
        isError: true,
      };
    }

    await this.storage.deleteScratchpad(id);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Scratchpad "${id}" deleted`,
        }, null, 2),
      }],
    };
  }
}

// =============================================================================
// Tool Definition
// =============================================================================

/**
 * Generate dynamic tool description
 */
function generateToolDescription(): string {
  const patternOps = KNOWLEDGE_OPERATIONS.filter(op => op.category === 'patterns');
  const scratchpadOps = KNOWLEDGE_OPERATIONS.filter(op => op.category === 'scratchpad');

  return `Manage the Knowledge Zone ("The Garden") - mutable shared context for patterns and notes.

The Knowledge Zone has two areas:
1. **Patterns** - Extracted heuristics from successful reasoning sessions (persistent)
2. **Scratchpad** - Temporary collaborative working notes (ephemeral)

Pattern operations: ${patternOps.map(op => op.name).join(', ')}
Scratchpad operations: ${scratchpadOps.map(op => op.name).join(', ')}

Patterns are stored as Markdown files with YAML frontmatter in ~/.thoughtbox/knowledge/patterns/
Use patterns to capture and share learnings across sessions.`;
}

export const KNOWLEDGE_TOOL: Tool = {
  name: 'knowledge',
  description: generateToolDescription(),
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: KNOWLEDGE_OPERATIONS.map(op => op.name),
        description: 'The operation to execute',
      },
      args: {
        type: 'object',
        description: 'Arguments for the operation (varies by operation)',
      },
    },
    required: ['operation'],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// =============================================================================
// Resource Handlers
// =============================================================================

/**
 * Get static resources for knowledge zone
 */
export function getKnowledgeResources(): Array<{
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}> {
  return [
    {
      uri: 'thoughtbox://knowledge',
      name: 'Knowledge Zone Root',
      description: 'Root directory for The Garden - patterns and scratchpad',
      mimeType: 'application/json',
    },
    {
      uri: 'thoughtbox://knowledge/patterns',
      name: 'Knowledge Patterns',
      description: 'Extracted heuristics from successful reasoning sessions',
      mimeType: 'application/json',
    },
    {
      uri: 'thoughtbox://knowledge/scratchpad',
      name: 'Scratchpad Notes',
      description: 'Temporary collaborative working notes',
      mimeType: 'application/json',
    },
    {
      uri: 'thoughtbox://knowledge/operations',
      name: 'Knowledge Operations Catalog',
      description: 'Complete catalog of knowledge operations with schemas and examples',
      mimeType: 'application/json',
    },
  ];
}

/**
 * Get resource templates for knowledge zone
 */
export function getKnowledgeResourceTemplates(): {
  resourceTemplates: Array<{
    uriTemplate: string;
    name: string;
    description: string;
    mimeType: string;
  }>;
} {
  return {
    resourceTemplates: [
      {
        uriTemplate: 'thoughtbox://knowledge/patterns/{pattern}',
        name: 'Knowledge Pattern',
        description: 'Get a specific pattern by ID. Returns Markdown with YAML frontmatter.',
        mimeType: 'text/markdown',
      },
      {
        uriTemplate: 'thoughtbox://knowledge/scratchpad/{topic}',
        name: 'Scratchpad Note',
        description: 'Get a specific scratchpad note by topic ID',
        mimeType: 'text/markdown',
      },
    ],
  };
}

/**
 * Read a knowledge resource by URI
 */
export async function getKnowledgeResourceContent(
  uri: string,
  storage: KnowledgeStorage
): Promise<{
  uri: string;
  mimeType: string;
  text: string;
} | null> {
  // Root directory
  if (uri === 'thoughtbox://knowledge') {
    const patterns = await storage.listPatterns({ limit: 100 });
    const notes = await storage.listScratchpad();

    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({
        description: 'Knowledge Zone - The Garden',
        areas: {
          patterns: {
            description: 'Extracted heuristics from successful reasoning',
            count: patterns.length,
            uri: 'thoughtbox://knowledge/patterns',
          },
          scratchpad: {
            description: 'Temporary collaborative notes',
            count: notes.length,
            uri: 'thoughtbox://knowledge/scratchpad',
          },
        },
      }, null, 2),
    };
  }

  // Patterns listing
  if (uri === 'thoughtbox://knowledge/patterns') {
    const patterns = await storage.listPatterns({ limit: 100 });

    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({
        patterns: patterns.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          tags: p.tags,
          uri: `thoughtbox://knowledge/patterns/${p.id}`,
        })),
        count: patterns.length,
      }, null, 2),
    };
  }

  // Scratchpad listing
  if (uri === 'thoughtbox://knowledge/scratchpad') {
    const notes = await storage.listScratchpad();

    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({
        notes: notes.map(n => ({
          id: n.id,
          title: n.title,
          uri: `thoughtbox://knowledge/scratchpad/${n.id}`,
          updatedAt: n.updatedAt.toISOString(),
        })),
        count: notes.length,
      }, null, 2),
    };
  }

  // Specific pattern
  const patternMatch = uri.match(/^thoughtbox:\/\/knowledge\/patterns\/(.+)$/);
  if (patternMatch) {
    const pattern = await storage.getPattern(patternMatch[1]);
    if (!pattern) return null;

    // Return as Markdown with frontmatter
    const frontmatter = [
      '---',
      `id: ${pattern.id}`,
      `title: "${pattern.title}"`,
      `description: "${pattern.description}"`,
      `tags: [${pattern.tags.map(t => `"${t}"`).join(', ')}]`,
      `created_at: "${pattern.createdAt.toISOString()}"`,
      `updated_at: "${pattern.updatedAt.toISOString()}"`,
      '---',
      '',
    ].join('\n');

    return {
      uri,
      mimeType: 'text/markdown',
      text: frontmatter + pattern.content,
    };
  }

  // Specific scratchpad note
  const scratchpadMatch = uri.match(/^thoughtbox:\/\/knowledge\/scratchpad\/(.+)$/);
  if (scratchpadMatch) {
    const note = await storage.readScratchpad(scratchpadMatch[1]);
    if (!note) return null;

    return {
      uri,
      mimeType: 'text/markdown',
      text: `# ${note.title}\n\n_Updated: ${note.updatedAt.toISOString()}_\n\n${note.content}`,
    };
  }

  return null;
}

// Export operations for external use
export { KNOWLEDGE_OPERATIONS };
