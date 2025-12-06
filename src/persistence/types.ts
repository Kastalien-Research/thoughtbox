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
 * Server configuration stored in SQLite (single row)
 */
export interface Config {
  installId: string;
  dataDir: string;
  disableThoughtLogging: boolean;
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
