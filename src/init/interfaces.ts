/**
 * Init Flow Extensibility Interfaces
 *
 * Abstract interfaces for pluggable components.
 * Enables custom implementations without modifying core logic.
 */

import type { SessionExport } from '../persistence/types.js';
import type {
  SessionIndex,
  SessionMetadata,
  InitState,
  InitParams,
  ResourceContent,
  StructuredTags,
  IndexBuildOptions,
  IndexBuildResult,
  RenderContext,
  RenderedOutput,
} from './types.js';

// =============================================================================
// Index Source Interface
// =============================================================================

/**
 * Abstract interface for session data sources
 *
 * Extensibility point: Enables different backends (filesystem, cloud, database)
 * while maintaining consistent index building behavior.
 *
 * Example implementations:
 * - FileSystemIndexSource: Scans ~/.thoughtbox/exports/
 * - S3IndexSource: Fetches from S3 bucket
 * - DatabaseIndexSource: Queries PostgreSQL/SQLite
 */
export interface IndexSource {
  /**
   * Initialize the source (setup connections, validate paths, etc.)
   */
  initialize(): Promise<void>;

  /**
   * List all available session exports
   * @returns Array of export identifiers (e.g., file paths, S3 keys)
   */
  listExports(): Promise<string[]>;

  /**
   * Load a specific session export
   * @param identifier Export identifier from listExports()
   * @returns Parsed session export
   */
  loadExport(identifier: string): Promise<SessionExport>;

  /**
   * Get the last modified timestamp for an export (for incremental updates)
   * @param identifier Export identifier
   * @returns ISO 8601 timestamp or null if not available
   */
  getExportTimestamp(identifier: string): Promise<string | null>;

  /**
   * Close connections and cleanup resources
   */
  close(): Promise<void>;
}

// =============================================================================
// Tag Extractor Interface
// =============================================================================

/**
 * Interface for custom tag extraction strategies
 *
 * Extensibility point: Enables different tagging conventions beyond
 * the standard project:, task:, aspect: patterns.
 *
 * Example implementations:
 * - StandardTagExtractor: project:, task:, aspect:
 * - JiraTagExtractor: jira:PROJECT-123
 * - GitHubTagExtractor: gh:owner/repo#123
 * - CustomTagExtractor: domain-specific patterns
 */
export interface ITagExtractor {
  /**
   * Name of this extractor (for logging/debugging)
   */
  readonly name: string;

  /**
   * Priority (higher runs first, allows override)
   */
  readonly priority: number;

  /**
   * Extract structured tags from tag array
   * @param tags Raw tags from session export
   * @returns Partial structured tags (merged with other extractors)
   */
  extract(tags: string[]): Partial<StructuredTags>;

  /**
   * Validate that extracted tags are well-formed
   * @param tags Structured tags to validate
   * @returns True if valid, false otherwise
   */
  validate?(tags: StructuredTags): boolean;
}

// =============================================================================
// Conclusion Extractor Interface
// =============================================================================

/**
 * Interface for custom conclusion extraction strategies
 *
 * Extensibility point: Different heuristics for identifying the "conclusion"
 * of a reasoning session.
 *
 * Example implementations:
 * - LastThoughtExtractor: Use final thought content
 * - SummaryNodeExtractor: Look for thoughts tagged as "summary"
 * - LLMExtractor: Use LLM to generate conclusion from chain
 */
export interface IConclusionExtractor {
  /**
   * Name of this extractor (for logging/debugging)
   */
  readonly name: string;

  /**
   * Priority (higher runs first, first non-null result is used)
   */
  readonly priority: number;

  /**
   * Extract conclusion from session export
   * @param export_ Session export data
   * @returns Conclusion text or null if cannot extract
   */
  extract(export_: SessionExport): string | null;

  /**
   * Maximum length of conclusion (for truncation)
   * Return null for no limit
   */
  getMaxLength?(): number | null;
}

// =============================================================================
// Index Builder Interface
// =============================================================================

/**
 * Interface for session index builders
 *
 * Extensibility point: Different indexing strategies or backends.
 * The standard implementation scans exports directory, but alternatives
 * could use cached indexes, database queries, etc.
 */
export interface IIndexBuilder {
  /**
   * Build session index from configured source
   * @param options Build configuration
   * @returns Index build result with statistics
   */
  build(options?: IndexBuildOptions): Promise<IndexBuildResult>;

  /**
   * Incrementally update index with new/changed export
   * @param index Existing index to update
   * @param exportIdentifier Identifier of changed export
   * @returns Updated index
   */
  updateIndex?(
    index: SessionIndex,
    exportIdentifier: string
  ): Promise<SessionIndex>;

  /**
   * Remove session from index (for deletions)
   * @param index Existing index
   * @param sessionId Session to remove
   * @returns Updated index
   */
  removeFromIndex?(index: SessionIndex, sessionId: string): SessionIndex;
}

// =============================================================================
// Response Renderer Interface
// =============================================================================

/**
 * Interface for rendering init flow responses
 *
 * Extensibility point: Different output formats or rendering strategies.
 *
 * Example implementations:
 * - MarkdownRenderer: Standard markdown output
 * - JSONRenderer: Structured JSON for programmatic clients
 * - HTMLRenderer: Rich HTML for web interfaces
 * - PlainTextRenderer: Simple text for minimal clients
 */
export interface IResponseRenderer {
  /**
   * Name of this renderer (for selection/logging)
   */
  readonly name: string;

  /**
   * MIME type produced by this renderer
   */
  readonly mimeType: string;

  /**
   * Render entry point state
   */
  renderEntry(context: RenderContext): RenderedOutput;

  /**
   * Render project selection state
   */
  renderProjectSelection(context: RenderContext): RenderedOutput;

  /**
   * Render task selection state
   */
  renderTaskSelection(context: RenderContext): RenderedOutput;

  /**
   * Render aspect selection state
   */
  renderAspectSelection(context: RenderContext): RenderedOutput;

  /**
   * Render context loaded (terminal) state
   */
  renderContextLoaded(context: RenderContext): RenderedOutput;

  /**
   * Render new work mode state
   */
  renderNewWork(context: RenderContext): RenderedOutput;

  /**
   * Render error state (fallback)
   */
  renderError?(message: string): RenderedOutput;
}

// =============================================================================
// Init Handler Interface
// =============================================================================

/**
 * Interface for init flow request handlers
 *
 * Extensibility point: Different navigation strategies or state machines.
 */
export interface IInitHandler {
  /**
   * Handle init resource request
   * @param params URI parameters
   * @returns Resource content
   */
  handle(params: InitParams): ResourceContent;

  /**
   * Determine current state from parameters
   * @param params URI parameters
   * @returns Resolved state
   */
  getState(params: InitParams): InitState;

  /**
   * Validate that parameters are valid for current state
   * @param params URI parameters
   * @returns True if valid, error message otherwise
   */
  validate(params: InitParams): true | string;

  /**
   * Get session index being used by this handler
   */
  getIndex(): SessionIndex;

  /**
   * Refresh index (useful after session exports)
   * @returns Updated handler with fresh index
   */
  refresh?(): Promise<IInitHandler>;
}

// =============================================================================
// Session Preview Provider Interface
// =============================================================================

/**
 * Interface for providing session previews
 *
 * Extensibility point: Different preview generation strategies.
 * Could include ML-based summarization, metadata extraction, etc.
 */
export interface ISessionPreviewProvider {
  /**
   * Generate preview from session metadata
   * @param metadata Session metadata
   * @returns Preview object for display
   */
  createPreview(metadata: SessionMetadata): {
    id: string;
    title: string;
    summary: string;
    relativeTime: string;
    resourceUri: string;
  };

  /**
   * Format relative time for display
   * @param date Timestamp to format
   * @returns Human-readable relative time (e.g., "2 days ago")
   */
  formatRelativeTime(date: Date): string;
}

// =============================================================================
// Factory Interfaces
// =============================================================================

/**
 * Factory for creating index sources
 * Enables dependency injection and testing
 */
export interface IndexSourceFactory {
  /**
   * Create index source from configuration
   * @param config Source-specific configuration
   */
  create(config?: Record<string, unknown>): IndexSource;
}

/**
 * Factory for creating tag extractors
 * Enables registration of custom extractors
 */
export interface TagExtractorFactory {
  /**
   * Register a new tag extractor
   * @param extractor Extractor to register
   */
  register(extractor: ITagExtractor): void;

  /**
   * Get all registered extractors (sorted by priority)
   */
  getExtractors(): ITagExtractor[];
}

/**
 * Factory for creating conclusion extractors
 * Enables registration of custom extractors
 */
export interface ConclusionExtractorFactory {
  /**
   * Register a new conclusion extractor
   * @param extractor Extractor to register
   */
  register(extractor: IConclusionExtractor): void;

  /**
   * Get all registered extractors (sorted by priority)
   */
  getExtractors(): IConclusionExtractor[];
}
