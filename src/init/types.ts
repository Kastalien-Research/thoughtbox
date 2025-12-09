/**
 * Init Flow Type Definitions
 *
 * Comprehensive types for the CLI-style initialization flow.
 * Designed for extensibility and future enhancement.
 */

import type { SessionExport } from '../persistence/types.js';

// =============================================================================
// Session Index Types
// =============================================================================

/**
 * In-memory index of all exported sessions
 * Built on server startup by scanning ~/.thoughtbox/exports/
 */
export interface SessionIndex {
  /** All sessions indexed by ID for O(1) lookup */
  byId: Map<string, SessionMetadata>;

  /** Sessions grouped by project tag (project -> Set<sessionId>) */
  byProject: Map<string, Set<string>>;

  /** Sessions grouped by project:task compound key (key -> Set<sessionId>) */
  byTask: Map<string, Set<string>>;

  /** Computed project summaries for display (sorted by lastWorked desc) */
  projects: ProjectSummary[];

  /** Timestamp of last index rebuild */
  builtAt: Date;
}

/**
 * Metadata extracted from a session export for indexing
 * Optimized for quick lookups during init flow navigation
 */
export interface SessionMetadata {
  /** Unique session identifier */
  id: string;

  /** Human-readable session title */
  title: string;

  /** Project name (extracted from project:{name} tag) */
  project: string | null;

  /** Task name (extracted from task:{name} tag) */
  task: string | null;

  /** Aspect type (extracted from aspect:{name} tag) */
  aspect: string | null;

  /** Number of thoughts in main chain */
  thoughtCount: number;

  /** When session was created */
  createdAt: Date;

  /** When session was last modified */
  updatedAt: Date;

  /** Full path to export file */
  exportPath: string;

  /** Last thought's content (for quick preview) */
  lastConclusion: string | null;
}

/**
 * Project-level summary computed from session index
 * Groups related sessions for hierarchical navigation
 */
export interface ProjectSummary {
  /** Project name (from project:{name} tag) */
  name: string;

  /** Total sessions in this project */
  sessionCount: number;

  /** Most recent session activity in project */
  lastWorked: Date;

  /** Task summaries within this project */
  tasks: TaskSummary[];
}

/**
 * Task-level summary within a project
 * Enables drilling down to specific work units
 */
export interface TaskSummary {
  /** Task name (from task:{name} tag) */
  name: string;

  /** Total sessions for this task */
  sessionCount: number;

  /** Most recent session activity for task */
  lastWorked: Date;

  /** Aspect types used in this task's sessions */
  aspects: string[];
}

/**
 * Structured tags extracted from session export
 * Enables hierarchical organization and filtering
 */
export interface StructuredTags {
  /** Project identifier (from project:{name} tag) */
  project: string | null;

  /** Task identifier (from task:{name} tag) */
  task: string | null;

  /** Aspect type (from aspect:{name} tag) */
  aspect: string | null;

  /** All other tags not matching structured patterns */
  other: string[];
}

// =============================================================================
// Init Flow State Machine Types
// =============================================================================

/**
 * States in the init flow navigation
 * Forms a directed graph with terminal states
 */
export type InitState =
  | 'entry'              // Initial welcome screen
  | 'project-selection'  // Choosing a project
  | 'task-selection'     // Choosing a task within project
  | 'aspect-selection'   // Choosing aspect type
  | 'context-loaded'     // Terminal: context ready, tools available
  | 'new-work';          // Creating new project/task

/**
 * Parameters parsed from init resource URI
 * Maps to query string: ?mode={mode}&project={project}...
 */
export interface InitParams {
  /** Operation mode: new work or continue existing */
  mode?: 'new' | 'continue';

  /** Selected project name */
  project?: string;

  /** Selected task name */
  task?: string;

  /** Selected aspect type */
  aspect?: string;
}

/**
 * Transition rules for state machine
 * Defines valid state transitions based on params
 */
export interface StateTransition {
  /** Current state */
  from: InitState;

  /** Next state */
  to: InitState;

  /** Required parameters for this transition */
  requires: (keyof InitParams)[];

  /** Optional parameters for this transition */
  optional?: (keyof InitParams)[];
}

// =============================================================================
// Resource Content Types
// =============================================================================

/**
 * MCP resource content returned by init handler
 * Matches MCP protocol ResourceContents structure
 */
export interface ResourceContent {
  /** Resource URI */
  uri: string;

  /** MIME type (typically text/markdown for init flow) */
  mimeType: string;

  /** Markdown-formatted content */
  text: string;
}

/**
 * Navigation option presented in init resources
 * Each option is a URI that advances the flow
 */
export interface NavigationOption {
  /** URI to navigate to */
  uri: string;

  /** Human-readable description */
  description: string;

  /** Optional metadata for rendering hints */
  metadata?: Record<string, unknown>;
}

/**
 * Context information displayed in terminal state
 * Shows relevant prior sessions and suggestions
 */
export interface ContextSummary {
  /** Selected project name */
  project: string;

  /** Selected task name */
  task: string;

  /** Selected aspect type */
  aspect: string;

  /** Relevant prior sessions (sorted by relevance) */
  sessions: SessionPreview[];

  /** Suggested actions based on context */
  suggestions: string[];
}

/**
 * Preview of a session for context display
 * Condensed view without full thought chain
 */
export interface SessionPreview {
  /** Session ID */
  id: string;

  /** Session title */
  title: string;

  /** When session was created */
  createdAt: Date;

  /** When session was last updated */
  updatedAt: Date;

  /** Number of thoughts */
  thoughtCount: number;

  /** Last conclusion preview */
  lastConclusion: string | null;

  /** URI to full session resource */
  resourceUri: string;
}

// =============================================================================
// Index Building Types
// =============================================================================

/**
 * Configuration for index building
 * Enables customization of scanning behavior
 */
export interface IndexBuildOptions {
  /** Directory to scan for exports (default: ~/.thoughtbox/exports/) */
  exportsDir?: string;

  /** Maximum file size to parse (prevents OOM on huge files) */
  maxFileSizeBytes?: number;

  /** Include hidden files (dotfiles) */
  includeHidden?: boolean;

  /** Custom tag extractors for structured tags */
  tagExtractors?: TagExtractor[];

  /** Custom conclusion extractors */
  conclusionExtractors?: ConclusionExtractor[];
}

/**
 * Result of index building operation
 * Includes statistics for monitoring and debugging
 */
export interface IndexBuildResult {
  /** Built session index */
  index: SessionIndex;

  /** Build statistics */
  stats: IndexBuildStats;

  /** Errors encountered (non-fatal) */
  errors: IndexBuildError[];
}

/**
 * Statistics from index building
 * Useful for performance monitoring and diagnostics
 */
export interface IndexBuildStats {
  /** Total files scanned */
  filesScanned: number;

  /** Files successfully parsed */
  filesParsed: number;

  /** Sessions indexed */
  sessionsIndexed: number;

  /** Projects discovered */
  projectsFound: number;

  /** Tasks discovered */
  tasksFound: number;

  /** Time taken to build (milliseconds) */
  buildTimeMs: number;
}

/**
 * Error encountered during index building
 * Non-fatal errors logged but don't halt the build
 */
export interface IndexBuildError {
  /** File path where error occurred */
  filePath: string;

  /** Error message */
  message: string;

  /** Error type for categorization */
  type: 'parse-error' | 'invalid-format' | 'io-error' | 'unknown';
}

// =============================================================================
// Tag Extraction Types
// =============================================================================

/**
 * Function that extracts structured tags from session export
 * Extensibility point: custom tag patterns can be added
 */
export type TagExtractor = (tags: string[]) => Partial<StructuredTags>;

/**
 * Function that extracts conclusion from session nodes
 * Extensibility point: different conclusion heuristics
 */
export type ConclusionExtractor = (export_: SessionExport) => string | null;

// =============================================================================
// Rendering Types
// =============================================================================

/**
 * Template data for rendering init responses
 * Generic structure for different rendering strategies
 */
export interface RenderContext {
  /** Current state being rendered */
  state: InitState;

  /** URI parameters */
  params: InitParams;

  /** Session index for data access */
  index: SessionIndex;

  /** Additional context data */
  data?: unknown;
}

/**
 * Rendered output from a renderer
 * Decouples rendering logic from handler logic
 */
export interface RenderedOutput {
  /** Markdown content */
  markdown: string;

  /** Optional metadata about the rendering */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Standard Aspect Types
// =============================================================================

/**
 * Standard aspect types for work categorization
 * These are conventions, not enforced values
 */
export const STANDARD_ASPECTS = [
  'understanding',  // Exploring problem space, reading code
  'design',         // Architectural decisions, API design
  'implementing',   // Writing code, building features
  'debugging',      // Investigating issues, fixing bugs
  'reviewing',      // Validating work, code review, testing
  'documenting',    // Writing docs, explaining decisions
] as const;

/**
 * Standard aspect type (compile-time type safety for common aspects)
 */
export type StandardAspect = typeof STANDARD_ASPECTS[number];

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Helper to make specific keys required in a partial type
 */
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Helper to extract timestamp from session
 */
export type TimestampField = 'createdAt' | 'updatedAt' | 'lastWorked';
