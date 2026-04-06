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
export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface Session {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  mcpSessionId?: string;
  thoughtCount: number;
  branchCount: number;
  status: SessionStatus;
  /**
   * Time partition path for this session (e.g., '2025-12' for monthly).
   * Used to locate the session directory on filesystem.
   * Null for legacy sessions created before time-partitioning.
   */
  partitionPath?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
}

/**
 * Parameters for creating a new session
 */
export interface CreateSessionParams {
  /** Optional pre-generated session ID. If omitted, storage generates one. */
  id?: string;
  title: string;
  description?: string;
  tags?: string[];
  mcpSessionId?: string;
}

export interface Run {
  id: string;
  workspaceId?: string;
  sessionId: string;
  mcpSessionId?: string;
  otelSessionId?: string;
  startedAt: Date;
  endedAt?: Date;
}

export interface CreateRunParams {
  id?: string;
  sessionId: string;
  mcpSessionId?: string;
  otelSessionId?: string;
  startedAt?: Date;
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

  /** Operations mode: structured thought type for programmatic filtering */
  thoughtType: 'reasoning' | 'decision_frame' | 'action_report' | 'belief_snapshot' | 'assumption_update' | 'context_snapshot' | 'progress' | 'action_receipt';

  /** Confidence level for decision_frame thoughts */
  confidence?: 'high' | 'medium' | 'low';
  /** Options considered for decision_frame thoughts */
  options?: Array<{ label: string; selected: boolean; reason?: string }>;
  /** Action outcome for action_report thoughts */
  actionResult?: { success: boolean; reversible: 'yes' | 'no' | 'partial'; tool: string; target: string; sideEffects?: string[] };
  /** Current beliefs for belief_snapshot thoughts */
  beliefs?: { entities: Array<{ name: string; state: string }>; constraints?: string[]; risks?: string[] };
  /** Assumption change for assumption_update thoughts */
  assumptionChange?: { text: string; oldStatus: string; newStatus: 'believed' | 'uncertain' | 'refuted'; trigger?: string; downstream?: number[] };
  /** Operating context for context_snapshot thoughts */
  contextData?: { toolsAvailable?: string[]; systemPromptHash?: string; modelId?: string; constraints?: string[]; dataSourcesAccessed?: string[] };
  /** Progress update for progress thoughts */
  progressData?: {
    task: string;
    status: 'pending' | 'in_progress' | 'done' | 'blocked';
    note?: string;
  };
  /** Post-action receipt for action_receipt thoughts */
  receiptData?: {
    toolName: string;
    expected: string;
    actual: string;
    match: boolean;
    residual?: string;
    durationMs?: number;
  };

  /**
   * Multi-agent attribution (optional)
   * Present when thought is created by an identified agent
   */
  agentId?: string;
  agentName?: string;

  /**
   * Content-addressable hash (Merkle chain)
   * SHA-256 of (content + thoughtNumber + parentHash + agentId + timestamp)
   */
  contentHash?: string;
  parentHash?: string;

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

  /** AUDIT-003: Session audit manifest (auto-generated at session close) */
  auditManifest?: AuditManifest;

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
  runs?: Array<{
    id: string;
    sessionId: string;
    mcpSessionId?: string;
    otelSessionId?: string;
    startedAt: string;
    endedAt?: string;
  }>;
  metadata: {
    title: string;
    description?: string;
    tags: string[];
    mcpSessionId?: string;
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
  };
}

// =============================================================================
// Audit Manifest Types (AUDIT-002/003)
// =============================================================================

/**
 * AUDIT-003: Session audit manifest — auto-generated at session close
 * Also used as the shape for audit_summary analysis (AUDIT-002)
 */
export interface AuditManifest {
  sessionId: string;
  generatedAt: string;
  thoughtCounts: {
    total: number;
    reasoning: number;
    decision_frame: number;
    action_report: number;
    belief_snapshot: number;
    assumption_update: number;
    context_snapshot: number;
    progress: number;
    action_receipt: number;
  };
  decisions: {
    total: number;
    byConfidence: { high: number; medium: number; low: number };
  };
  actions: {
    total: number;
    successful: number;
    failed: number;
    reversible: number;
    irreversible: number;
    partiallyReversible: number;
  };
  gaps: Array<{
    type: 'decision_without_action' | 'critique_override';
    thoughtNumber: number;
    description: string;
  }>;
  assumptionFlips: number;
  critiques: {
    generated: number;
    addressed: number;
    overridden: number;
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

  /**
   * Set the project scope. Project scope is set via MCP roots or
   * THOUGHTBOX_PROJECT env var.
   * Implementations perform backend-specific initialization:
   * filesystem creates directories, Supabase sets tenant/schema.
   * No-op if already set to the same project.
   * Throws if already set to a different project.
   */
  setProject(project: string): Promise<void>;

  /**
   * Get the current project scope. Throws if not yet scoped.
   */
  getProject(): string;

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

  /**
   * Create a run binding row for a session.
   */
  createRun(params: CreateRunParams): Promise<Run>;

  /**
   * List run bindings for a session.
   */
  listRunsForSession(sessionId: string): Promise<Run[]>;

  /**
   * Attach an OTEL session ID to the latest matching MCP-bound run.
   */
  bindRunOtelSession(
    mcpSessionId: string,
    otelSessionId: string,
    attrs?: { endedAt?: Date }
  ): Promise<Run | null>;

  /**
   * Close any open runs for a session.
   */
  endRunsForSession(sessionId: string, endedAt?: Date): Promise<void>;

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
   * Get all thoughts for a session (main chain + all branches)
   */
  getAllThoughts(sessionId: string): Promise<ThoughtData[]>;

  /**
   * Get all branch IDs for a session
   */
  getBranchIds(sessionId: string): Promise<string[]>;

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
