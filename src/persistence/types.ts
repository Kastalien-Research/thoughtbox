/**
 * Persistence Layer Type Definitions
 *
 * Defines interfaces for the in-memory storage pattern.
 * Data persists for the lifetime of the server process.
 */

// =============================================================================
// Configuration
// =============================================================================

/**
 * Time partitioning granularity for session storage
 */
export type TimePartitionGranularity = 'monthly' | 'weekly' | 'daily' | 'none';

/**
 * Server configuration (in-memory)
 */
export interface Config {
  installId: string;
  dataDir: string;
  disableThoughtLogging: boolean;
  /**
   * Time partitioning granularity for session directories.
   * - 'monthly': sessions/2025-12/{uuid}/ (recommended)
   * - 'weekly': sessions/2025-W50/{uuid}/
   * - 'daily': sessions/2025-12-07/{uuid}/
   * - 'none': sessions/{uuid}/ (legacy, no partitioning)
   * 
   * @default 'monthly'
   */
  sessionPartitionGranularity: TimePartitionGranularity;
  createdAt: Date;
}

// =============================================================================
// Session Types
// =============================================================================

/**
 * Session metadata stored in SQLite for quick listing/search
 */
export interface Session {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  thoughtCount: number;
  branchCount: number;
  /**
   * Time partition path for this session (e.g., '2025-12' for monthly).
   * Used to locate the session directory on filesystem.
   * Null for legacy sessions created before time-partitioning.
   */
  partitionPath?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

/**
 * Parameters for creating a new session
 */
export interface CreateSessionParams {
  title: string;
  description?: string;
  tags?: string[];
}

/**
 * Filter options for listing sessions
 */
export interface SessionFilter {
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// Thought Types
// =============================================================================

/**
 * Individual thought data stored as JSON file
 *
 * Note: The timestamp field is always present after persistence.
 * The storage layer automatically adds it if not provided when saving.
 */
export interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  includeGuide?: boolean;
  timestamp: string; // ISO 8601 - always present after persistence

  /**
   * Autonomous critique metadata (Phase 3: Sampling Loops)
   * Generated when critique parameter is enabled in thoughtbox tool
   */
  critique?: {
    /** The critique text from the sampled model */
    text: string;
    /** Model that generated the critique */
    model: string;
    /** ISO 8601 timestamp when critique was generated */
    timestamp: string;
  };

  /**
   * Recursive Language Model (RLM) result metadata
   */
  rlmResult?: {
    /** Final answer produced by the RLM loop */
    text: string;
    /** Model that generated the final answer */
    model?: string;
    /** Logs from REPL/sub-LLM calls */
    logs?: string[];
    /** ISO 8601 timestamp when result was generated */
    timestamp: string;
  };
}

/**
 * Extended thought input with session metadata (for auto-create)
 */
export interface ThoughtInput extends ThoughtData {
  sessionTitle?: string;
  sessionTags?: string[];
}

// =============================================================================
// Linked Node Types (for doubly-linked list storage)
// =============================================================================

/**
 * Unique identifier for a thought node
 * Format: "{sessionId}:{thoughtNumber}"
 */
export type ThoughtNodeId = string;

/**
 * Doubly-linked thought node with tree structure support
 *
 * Each thought becomes a node in a linked list. The `next` field is an array
 * to support tree structures where a single thought can branch into multiple
 * alternative paths.
 */
export interface ThoughtNode {
  /** Unique identifier (format: "{sessionId}:{thoughtNumber}") */
  id: ThoughtNodeId;

  /** Original thought data (unchanged from ThoughtData) */
  data: ThoughtData;

  /** ID of previous thought in sequence (null for first thought) */
  prev: ThoughtNodeId | null;

  /** IDs of next thoughts (array enables tree structure for branches) */
  next: ThoughtNodeId[];

  /** ID of node this thought revises (null if not a revision) */
  revisesNode: ThoughtNodeId | null;

  /** ID of node this branches from (null if on main chain) */
  branchOrigin: ThoughtNodeId | null;

  /** Branch identifier (null if on main chain) */
  branchId: string | null;

  /** SPEC-002: Revision metadata for tracking conceptual evolution */
  revisionMetadata?: RevisionMetadata;
}

/**
 * SPEC-002: Metadata tracking revision chains and semantic versioning
 */
export interface RevisionMetadata {
  /** True if this thought has never revised another thought */
  isOriginal: boolean;

  /** True if this thought revises another thought */
  isRevision: boolean;

  /** Thought number this revises (null if isRevision=false) */
  revisesThought: number | null;

  /** Thought numbers that revised THIS thought (reverse pointers) */
  revisedBy: number[];

  /** Revision depth (0 = original, 1 = first revision, 2 = revision of revision, etc.) */
  revisionDepth: number;

  /** Unique ID grouping related revisions (all revisions of S1 share same chainId) */
  revisionChainId: string;
}

/**
 * Computed indexes for reverse lookups (not persisted, rebuilt on load)
 */
export interface ThoughtIndexes {
  /** Maps node ID to list of nodes that revise it */
  revisedBy: Map<ThoughtNodeId, ThoughtNodeId[]>;

  /** Maps node ID to list of branch nodes that fork from it */
  branchChildren: Map<ThoughtNodeId, ThoughtNodeId[]>;
}

/**
 * Revision metadata for a thought (SPEC-002)
 */
export interface RevisionMetadata {
  isOriginal: boolean;
  isRevision: boolean;
  revisesThought: number | null;
  revisedBy: number[];
  revisionDepth: number;
  revisionChainId: string;
}

/**
 * Export format for linked reasoning sessions (v1.0)
 */
export interface SessionExport {
  /** Schema version */
  version: '1.0';

  /** Session metadata */
  session: Session;

  /** All thought nodes with linked structure */
  nodes: ThoughtNode[];

  /** Revision analysis (SPEC-002) */
  revisionAnalysis?: any;

  /** ISO 8601 timestamp of export */
  exportedAt: string;
}

/**
 * Options for exporting a session
 */
export interface ExportOptions {
  /** Session ID to export */
  sessionId: string;

  /** Custom export directory (default: ~/.thoughtbox/exports/) */
  destination?: string;
}

// =============================================================================
// Filesystem Integrity Types
// =============================================================================

/**
 * Result of filesystem integrity validation
 */
export interface IntegrityValidationResult {
  valid: boolean;
  sessionExists: boolean;
  manifestExists: boolean;
  manifestValid: boolean;
  missingThoughtFiles: string[];
  missingBranchFiles: Record<string, string[]>;
  errors: string[];
}

// =============================================================================
// Manifest Types
// =============================================================================

/**
 * Session manifest stored as JSON file in session directory
 * Tracks all thought files and branches for a session
 */
export interface SessionManifest {
  id: string;
  version: string; // Schema version, e.g., "1.0.0"
  thoughtFiles: string[]; // ["001.json", "002.json", ...]
  branchFiles: Record<string, string[]>; // { "alt-1": ["001.json", ...] }
  metadata: {
    title: string;
    description?: string;
    tags: string[];
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
  };
}

// =============================================================================
// Knowledge Zone Types (The Garden)
// =============================================================================

/**
 * A knowledge pattern extracted from successful reasoning sessions.
 * Stored as Markdown files with YAML frontmatter in /knowledge/patterns/
 */
export interface KnowledgePattern {
  /** Unique slug identifier (e.g., 'debugging-race-conditions') */
  id: string;
  /** Human-readable title */
  title: string;
  /** Brief description of the pattern */
  description: string;
  /** Tags for categorization and search */
  tags: string[];
  /** The main content in Markdown format */
  content: string;
  /** Session IDs this pattern was derived from (if any) */
  derivedFromSessions?: string[];
  /** Agent ID that created this pattern (for multi-agent scenarios) */
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Parameters for creating a new knowledge pattern
 */
export interface CreatePatternParams {
  title: string;
  description: string;
  tags?: string[];
  content: string;
  derivedFromSessions?: string[];
  createdBy?: string;
}

/**
 * Parameters for updating an existing pattern
 */
export interface UpdatePatternParams {
  title?: string;
  description?: string;
  tags?: string[];
  content?: string;
  derivedFromSessions?: string[];
}

/**
 * Filter options for listing patterns
 */
export interface PatternFilter {
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * A scratchpad note for temporary collaborative work.
 * Stored in /knowledge/scratchpad/
 */
export interface ScratchpadNote {
  /** Topic slug identifier */
  id: string;
  /** Human-readable title */
  title: string;
  /** The note content in Markdown format */
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Session Analysis Types (for session toolhost)
// =============================================================================

/**
 * Session analysis result with objective metrics
 * Used by the session toolhost `analyze` operation
 */
export interface SessionAnalysis {
  sessionId: string;
  metadata: {
    title: string;
    tags: string[] | undefined;
    thoughtCount: number;
    branchCount: number;
    revisionCount: number;
    duration: number;           // Milliseconds from first to last thought
    createdAt: string;          // ISO 8601
    lastUpdatedAt: string;      // ISO 8601
  };
  structure: {
    linearityScore: number;     // 0-1, higher = more linear reasoning
    revisionRate: number;       // Revisions / total thoughts
    maxDepth: number;           // Count of distinct branch IDs
    thoughtDensity: number;     // Thoughts per minute
  };
  quality: {
    critiqueRequests: number;   // Thoughts with critique: true
    hasConvergence: boolean;    // Main chain continues after branches
    isComplete: boolean;        // Final thought has nextThoughtNeeded: false
  };
}

/**
 * Extracted learning from a session for DGM evolution
 * Used by the session toolhost `extract_learnings` operation
 */
export interface ExtractedLearning {
  type: 'pattern' | 'anti-pattern' | 'signal';
  content: string;              // Markdown or JSON content
  targetPath: string;           // Suggested file path for DGM evolution
  metadata: {
    sourceSession: string;      // Session ID
    sourceThoughts: number[];   // Thought numbers involved
    extractedAt: string;        // ISO 8601
    behaviorCharacteristics?: {
      specificity: number;      // 1-10: How specific vs general
      applicability: number;    // 1-10: How broadly applicable
      complexity: number;       // 1-10: How complex to implement
      maturity: number;         // 1-10: How proven/tested
    };
  };
}

// =============================================================================
// Storage Interface
// =============================================================================

/**
 * Abstract storage interface for Thoughtbox persistence
 *
 * Implementations can use different backends (filesystem, cloud, etc.)
 * while maintaining the same API.
 */
export interface ThoughtboxStorage {
  /**
   * Initialize storage (create directories, run migrations)
   */
  initialize(): Promise<void>;

  // ---------------------------------------------------------------------------
  // Config Operations
  // ---------------------------------------------------------------------------

  /**
   * Get server configuration
   */
  getConfig(): Promise<Config | null>;

  /**
   * Update server configuration (upsert)
   */
  updateConfig(attrs: Partial<Config>): Promise<Config>;

  // ---------------------------------------------------------------------------
  // Session Operations
  // ---------------------------------------------------------------------------

  /**
   * Create a new reasoning session
   */
  createSession(params: CreateSessionParams): Promise<Session>;

  /**
   * Get session by ID
   */
  getSession(id: string): Promise<Session | null>;

  /**
   * Update session metadata
   */
  updateSession(id: string, attrs: Partial<Session>): Promise<Session>;

  /**
   * Delete a session and all its contents
   */
  deleteSession(id: string): Promise<void>;

  /**
   * List sessions with optional filtering
   */
  listSessions(filter?: SessionFilter): Promise<Session[]>;

  // ---------------------------------------------------------------------------
  // Thought Operations
  // ---------------------------------------------------------------------------

  /**
   * Save a thought to a session (main chain)
   */
  saveThought(sessionId: string, thought: ThoughtData): Promise<void>;

  /**
   * Get all thoughts for a session (main chain)
   */
  getThoughts(sessionId: string): Promise<ThoughtData[]>;

  /**
   * Get a specific thought by number
   */
  getThought(
    sessionId: string,
    thoughtNumber: number
  ): Promise<ThoughtData | null>;

  /**
   * Save a thought to a branch
   */
  saveBranchThought(
    sessionId: string,
    branchId: string,
    thought: ThoughtData
  ): Promise<void>;

  /**
   * Get all thoughts for a branch
   */
  getBranch(sessionId: string, branchId: string): Promise<ThoughtData[]>;

  /**
   * Update a thought with critique metadata (Phase 3: Sampling Loops)
   * Called after sampling API returns critique results
   */
  updateThoughtCritique(
    sessionId: string,
    thoughtNumber: number,
    critique: { text: string; model: string; timestamp: string }
  ): Promise<void>;

  /**
   * Update RLM result for a thought
   */
  updateThoughtRlmResult(
    sessionId: string,
    thoughtNumber: number,
    rlm: { text: string; model?: string; logs?: string[]; timestamp: string }
  ): Promise<void>;

  // ---------------------------------------------------------------------------
  // Export Operations
  // ---------------------------------------------------------------------------

  /**
   * Export session to specified format
   */
  exportSession(sessionId: string, format: 'json' | 'markdown'): Promise<string>;

  /**
   * Export session as linked node structure (for filesystem export)
   */
  toLinkedExport(sessionId: string): Promise<SessionExport>;

  // ---------------------------------------------------------------------------
  // Integrity Operations
  // ---------------------------------------------------------------------------

  /**
   * Validate filesystem integrity for a session
   * Checks if session directory, manifest, and thought files exist
   */
  validateSessionIntegrity(sessionId: string): Promise<IntegrityValidationResult>;
}
