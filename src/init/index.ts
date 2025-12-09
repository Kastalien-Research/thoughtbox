/**
 * Init Flow Module Exports
 *
 * Public API for the Thoughtbox initialization flow.
 * Provides types, interfaces, and implementations for session indexing
 * and CLI-style context navigation.
 */

// ============================================================================
// Core Types
// ============================================================================

export type {
  // Index types
  SessionIndex,
  SessionMetadata,
  ProjectSummary,
  TaskSummary,
  StructuredTags,
  
  // State machine types
  InitState,
  InitParams,
  StateTransition,
  
  // Resource types
  ResourceContent,
  NavigationOption,
  ContextSummary,
  SessionPreview,
  
  // Build types
  IndexBuildOptions,
  IndexBuildResult,
  IndexBuildStats,
  IndexBuildError,
  
  // Extractor types
  TagExtractor,
  ConclusionExtractor,
  
  // Render types
  RenderContext,
  RenderedOutput,
  
  // Standard types
  StandardAspect,
  TimestampField,
} from './types.js';

export { STANDARD_ASPECTS } from './types.js';

// ============================================================================
// Extensibility Interfaces
// ============================================================================

export type {
  // Source interfaces
  IndexSource,
  
  // Extractor interfaces
  ITagExtractor,
  IConclusionExtractor,
  
  // Builder interfaces
  IIndexBuilder,
  
  // Renderer interfaces
  IResponseRenderer,
  
  // Handler interfaces
  IInitHandler,
  ISessionPreviewProvider,
  
  // Factory interfaces
  IndexSourceFactory,
  TagExtractorFactory,
  ConclusionExtractorFactory,
} from './interfaces.js';

// ============================================================================
// Index Builder
// ============================================================================

export {
  // Core builder
  IndexBuilder,
  
  // Default implementations
  FileSystemIndexSource,
  StandardTagExtractor,
  LastThoughtExtractor,
} from './index-builder.js';

// ============================================================================
// Init Handler
// ============================================================================

export {
  // Core handler
  InitHandler,
  
  // Helper functions
  parseInitUri,
  isTerminalState,
  getNextStates,
} from './init-handler.js';

// ============================================================================
// Renderers
// ============================================================================

export {
  MarkdownRenderer,
} from './renderers/markdown.js';

// ============================================================================
// Convenience Factory
// ============================================================================

/**
 * Create a complete init flow setup with default configuration
 * 
 * @example
 * ```typescript
 * import { createInitFlow } from './init';
 * 
 * const { index, handler } = await createInitFlow({
 *   exportsDir: '~/.thoughtbox/exports',
 * });
 * 
 * // Use in MCP resource handler
 * const content = handler.handle({ mode: 'continue' });
 * ```
 */
export async function createInitFlow(options: {
  exportsDir?: string;
  tagExtractors?: ITagExtractor[];
  conclusionExtractors?: IConclusionExtractor[];
  renderer?: IResponseRenderer;
} = {}): Promise<{
  index: SessionIndex;
  handler: IInitHandler;
  stats: IndexBuildStats;
  errors: IndexBuildError[];
}> {
  const { IndexBuilder } = await import('./index-builder.js');
  const { FileSystemIndexSource } = await import('./index-builder.js');
  const { InitHandler } = await import('./init-handler.js');
  
  // Create source
  const source = new FileSystemIndexSource({
    exportsDir: options.exportsDir,
  });
  
  // Create builder
  const builder = new IndexBuilder({
    source,
    tagExtractors: options.tagExtractors,
    conclusionExtractors: options.conclusionExtractors,
  });
  
  // Build index
  const { index, stats, errors } = await builder.build();
  
  // Create handler
  const handler = new InitHandler(index, options.renderer);
  
  return { index, handler, stats, errors };
}

// Import types for convenience factory
import type { SessionIndex, IndexBuildStats, IndexBuildError } from './types.js';
import type { ITagExtractor, IConclusionExtractor, IResponseRenderer, IInitHandler } from './interfaces.js';
