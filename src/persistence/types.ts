/**
 * Persistence Layer Type Definitions
 *
 * Defines interfaces for the SQLite + filesystem hybrid storage pattern.
 * SQLite stores queryable metadata, filesystem stores human-readable content.
 */

// =============================================================================
// Configuration
// =============================================================================

/**
 * Time partitioning granularity for session storage
 */
export type TimePartitionGranularity = 'monthly' | 'weekly' | 'daily' | 'none';

/**
 * Server configuration stored in SQLite (single row)
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
}

/**
 * Extended thought input with session metadata (for auto-create)
 */
export interface ThoughtInput extends ThoughtData {
  sessionTitle?: string;
  sessionTags?: string[];
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

  // ---------------------------------------------------------------------------
  // Export Operations
  // ---------------------------------------------------------------------------

  /**
   * Export session to specified format
   */
  exportSession(sessionId: string, format: 'json' | 'markdown'): Promise<string>;

  // ---------------------------------------------------------------------------
  // Integrity Operations
  // ---------------------------------------------------------------------------

  /**
   * Validate filesystem integrity for a session
   * Checks if session directory, manifest, and thought files exist
   */
  validateSessionIntegrity(sessionId: string): Promise<IntegrityValidationResult>;
}
