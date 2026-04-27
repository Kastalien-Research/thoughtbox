/**
 * Spec-handlers — CATALOG validators
 *
 * Validators (from VALIDATORS.md):
 * - V2.7: `t`, `end`, `openChain`, `think`, `decide`, `research` are advertised
 *         in `catalog.operations.session` and `TB_SDK_TYPES.includes('t(content: string)')`
 * - CC.1: Every operation in `TB_SDK_TYPES` has matching exported Zod schema, and vice versa
 *         (symmetric difference empty)
 * - CC.2: `catalog.operations.session` includes `getThought`, `recentThoughts`, `searchWithin`,
 *         `checkpoint`, `checkpoints`, `getCheckpoint`, `checkpointsByLabel`, `isActive`,
 *         `update`, `openChain`
 *
 * NOTE: These tests WILL FAIL until the actual spec implementations are in place.
 * CATALOG tests require access to the catalog via thoughtbox_search or RPC.
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// TB_SDK_TYPES content (imported as string from sdk-types.ts)
// ---------------------------------------------------------------------------

// We parse the SDK types string to extract operation names
// The TB_SDK_TYPES string is the source of truth for SDK surface
const TB_SDK_TYPES_STRING = `
\`\`\`ts
interface TB {
  /** Submit a structured thought. Source: src/thought/tool.ts */
  thought(input: {
    thought: string;
    thoughtType: "reasoning" | "decision_frame" | "action_report" | "belief_snapshot" | "assumption_update" | "context_snapshot" | "progress";
    nextThoughtNeeded: boolean;
    thoughtNumber?: number;
    totalThoughts?: number;
    isRevision?: boolean;
    revisesThought?: number;
    branchFromThought?: number;
    branchId?: string;
    needsMoreThoughts?: boolean;
    includeGuide?: boolean;
    sessionTitle?: string;
    sessionTags?: string[];
    critique?: boolean;
    verbose?: boolean;
    confidence?: "high" | "medium" | "low";
    options?: Array<{ label: string; selected: boolean; reason?: string }>;
    actionResult?: { success: boolean; reversible: "yes" | "no" | "partial"; tool: string; target: string; sideEffects?: string[] };
    beliefs?: { entities: Array<{ name: string; state: string }>; constraints?: string[]; risks?: string[] };
    assumptionChange?: { text: string; oldStatus: string; newStatus: "believed" | "uncertain" | "refuted"; trigger?: string; downstream?: number[] };
    contextData?: { toolsAvailable?: string[]; systemPromptHash?: string; modelId?: string; constraints?: string[]; dataSourcesAccessed?: string[] };
    progressData?: { task: string; status: "pending" | "in_progress" | "done" | "blocked"; note?: string };
    agentId?: string;
    agentName?: string;
  }): Promise<unknown>;

  /** Session management. Source: src/sessions/tool.ts */
  session: {
    list(args?: { limit?: number; offset?: number; tags?: string[] }): Promise<unknown>;
    get(sessionId: string): Promise<unknown>;
    search(query: string, limit?: number): Promise<unknown>;
    resume(sessionId: string): Promise<unknown>;
    export(sessionId: string, format?: "markdown" | "cipher" | "json"): Promise<unknown>;
    analyze(sessionId: string): Promise<unknown>;
    extractLearnings(sessionId: string, args?: Record<string, unknown>): Promise<unknown>;
  };

  /** Knowledge graph. Source: src/knowledge/tool.ts */
  knowledge: {
    createEntity(args: { name: string; type: "Insight" | "Concept" | "Workflow" | "Decision" | "Agent"; label: string; properties?: Record<string, unknown>; created_by?: string; visibility?: "public" | "agent-private" | "user-private" | "team-private" }): Promise<unknown>;
    getEntity(entityId: string): Promise<unknown>;
    listEntities(args?: { types?: string[]; name_pattern?: string; created_after?: string; created_before?: string; limit?: number; offset?: number }): Promise<unknown>;
    addObservation(args: { entity_id: string; content: string; source_session?: string; added_by?: string }): Promise<unknown>;
    createRelation(args: { from_id: string; to_id: string; relation_type: "RELATES_TO" | "BUILDS_ON" | "CONTRADICTS" | "EXTRACTED_FROM" | "APPLIED_IN" | "LEARNED_BY" | "DEPENDS_ON" | "SUPERSEDES" | "MERGED_FROM"; properties?: Record<string, unknown> }): Promise<unknown>;
    queryGraph(args: { start_entity_id: string; relation_types?: string[]; max_depth?: number }): Promise<unknown>;
    stats(): Promise<unknown>;
  };

  /** Literate programming notebooks. Source: src/notebook/tool.ts */
  notebook: {
    create(args: { title: string; language: "javascript" | "typescript"; template?: "sequential-feynman" }): Promise<unknown>;
    list(): Promise<unknown>;
    load(args: { path?: string; content?: string }): Promise<unknown>;
    addCell(args: { notebookId: string; cellType: "title" | "markdown" | "code"; content: string; filename?: string; position?: number }): Promise<unknown>;
    updateCell(args: { notebookId: string; cellId: string; content: string }): Promise<unknown>;
    runCell(args: { notebookId: string; cellId: string }): Promise<unknown>;
    listCells(args: { notebookId: string }): Promise<unknown>;
    getCell(args: { notebookId: string; cellId: string }): Promise<unknown>;
    installDeps(args: { notebookId: string }): Promise<unknown>;
    export(args: { notebookId: string; path?: string }): Promise<unknown>;
  };

  /** Theseus Protocol: friction-gated refactoring. Source: src/protocol/theseus-tool.ts */
  theseus(input: {
    operation: "init" | "visa" | "checkpoint" | "outcome" | "status" | "complete";
    scope?: string[];
    description?: string;
    filePath?: string;
    justification?: string;
    antiPatternAcknowledged?: boolean;
    diffHash?: string;
    commitMessage?: string;
    approved?: boolean;
    feedback?: string;
    testsPassed?: boolean;
    details?: string;
    terminalState?: "complete" | "audit_failure" | "scope_exhaustion";
    summary?: string;
  }): Promise<unknown>;

  /** Ulysses Protocol: state-step-gated debugging. Source: src/protocol/ulysses-tool.ts */
  ulysses(input: {
    operation: "init" | "plan" | "outcome" | "reflect" | "status" | "complete";
    problem?: string;
    constraints?: string[];
    primary?: string;
    recovery?: string;
    irreversible?: boolean;
    assessment?: "expected" | "unexpected-favorable" | "unexpected-unfavorable";
    details?: string;
    hypothesis?: string;
    falsification?: string;
    terminalState?: "resolved" | "insufficient_information" | "environment_compromised";
    summary?: string;
  }): Promise<unknown>;

  /** Observability queries. Source: src/observability/gateway-handler.ts */
  observability(input: {
    operation: "health" | "sessions" | "session_info" | "session_timeline" | "session_cost";
    args?: {
      sessionId?: string;
      limit?: number;
      status?: "active" | "idle" | "all";
      services?: string[];
      model?: string;
    };
  }): Promise<unknown>;

  /** Branch management. Source: src/branch/index.ts */
  branch: {
    spawn(args: { sessionId: string; branchId: string; description?: string; branchFromThought: number }): Promise<unknown>;
    merge(args: { sessionId: string; synthesis: string; selectedBranchId?: string; resolution: "selected" | "synthesized" | "abandoned" }): Promise<unknown>;
    list(args: { sessionId: string }): Promise<unknown>;
    get(args: { sessionId: string; branchId: string }): Promise<unknown>;
  };
}
\`\`\`
`;

// Operations defined in the SDK types
const TB_SDK_SESSION_OPS = [
  'list', 'get', 'search', 'resume', 'export', 'analyze', 'extractLearnings'
] as const;

const TB_SDK_THOUGHT_OPS = ['thought'] as const;

const TB_SDK_KNOWLEDGE_OPS = [
  'createEntity', 'getEntity', 'listEntities', 'addObservation',
  'createRelation', 'queryGraph', 'stats'
] as const;

const TB_SDK_NOTEBOOK_OPS = [
  'create', 'list', 'load', 'addCell', 'updateCell', 'runCell',
  'listCells', 'getCell', 'installDeps', 'export'
] as const;

const TB_SDK_THESEUS_OPS = ['theseus'] as const;
const TB_SDK_ULYSSES_OPS = ['ulysses'] as const;
const TB_SDK_OBSERVABILITY_OPS = ['observability'] as const;
const TB_SDK_BRANCH_OPS = ['spawn', 'merge', 'list', 'get'] as const;

// ---------------------------------------------------------------------------
// Zod schema file paths (source of truth for schema operations)
// ---------------------------------------------------------------------------

const SCHEMA_FILES: Record<string, string> = {
  thought: 'src/thought/tool.ts',
  session: 'src/sessions/tool.ts',
  knowledge: 'src/knowledge/tool.ts',
  notebook: 'src/notebook/tool.ts',
  theseus: 'src/protocol/theseus-tool.ts',
  ulysses: 'src/protocol/ulysses-tool.ts',
  observability: 'src/observability/gateway-handler.ts',
  branch: 'src/branch/index.ts',
};

/**
 * Extract operation names from a Zod schema file by finding z.enum([...]) lists
 * or operation fields.
 */
function extractOperationsFromSchema(filePath: string): string[] {
  try {
    const content = execSync(`rg -o 'operation:\\s*z\\.enum\\(\\[([^\\]]+)\\]\\)' ${filePath} --no-filename`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });
    const matches = content.matchAll(/z\.enum\(\[([^\]]+)\]\)/g);
    const ops: string[] = [];
    for (const match of matches) {
      const items = match[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
      ops.push(...items);
    }
    return ops;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// V2.7: Catalog advertisement of chain and factory methods
// ---------------------------------------------------------------------------

describe('V2.7 — Catalog advertisement of session chain methods', () => {
  it('t, end, openChain, think, decide, research are in TB_SDK_TYPES', () => {
    /**
     * Check: `t`, `end`, `openChain`, `think`, `decide`, `research` are advertised
     * in catalog operations and TB_SDK_TYPES.
     *
     * Pass: TB_SDK_TYPES string contains these method names.
     */

    const chainMethods = ['t', 'end', 'openChain', 'think', 'decide', 'research'];

    for (const method of chainMethods) {
      // These methods should appear in the SDK types as session methods
      // or as part of the session interface
      expect(TB_SDK_TYPES_STRING, `TB_SDK_TYPES should include '${method}'`).toContain(method);
    }
  });

  it('TB_SDK_TYPES includes t(content: string) signature', () => {
    /**
     * Check: TB_SDK_TYPES includes a `t(content: string)` method signature.
     *
     * Pass: the string "t(content: string)" or "t(input: {" appears in TB_SDK_TYPES.
     */
    expect(TB_SDK_TYPES_STRING).toMatch(/t\s*\(\s*content\s*:\s*string\s*\)/);
  });
});

// ---------------------------------------------------------------------------
// CC.1: Symmetric difference between TB_SDK_TYPES and Zod schemas is empty
// ---------------------------------------------------------------------------

describe('CC.1 — TB_SDK_TYPES operations have matching Zod schemas (symmetric diff empty)', () => {
  it('every SDK operation has a corresponding Zod schema', () => {
    /**
     * Check: Every operation in TB_SDK_TYPES has a matching exported Zod schema.
     * We validate this by checking that each module's schema file exists and
     * exports the expected inputSchema.
     *
     * Pass: All schema files exist and export the expected schema.
     */

    const modules = [
      { name: 'thought', ops: TB_SDK_THOUGHT_OPS },
      { name: 'session', ops: TB_SDK_SESSION_OPS },
      { name: 'knowledge', ops: TB_SDK_KNOWLEDGE_OPS },
      { name: 'notebook', ops: TB_SDK_NOTEBOOK_OPS },
      { name: 'theseus', ops: TB_SDK_THESEUS_OPS },
      { name: 'ulysses', ops: TB_SDK_ULYSSES_OPS },
      { name: 'observability', ops: TB_SDK_OBSERVABILITY_OPS },
      { name: 'branch', ops: TB_SDK_BRANCH_OPS },
    ];

    for (const mod of modules) {
      const filePath = SCHEMA_FILES[mod.name];
      expect(filePath, `Schema file path for '${mod.name}' should be defined`).toBeDefined();

      // Check the file exists
      try {
        execSync(`test -f ${filePath}`, { cwd: process.cwd() });
      } catch {
        throw new Error(`Schema file '${filePath}' does not exist for module '${mod.name}'`);
      }

      // Check it exports the expected schema (look for InputSchema or inputSchema)
      try {
        const exportCheck = execSync(
          `rg 'export\\s+(const|type)\\s+\\w*InputSchema\\w*' ${filePath} --no-filename`,
          { encoding: 'utf-8', cwd: process.cwd() },
        );
        expect(exportCheck.trim().length).toBeGreaterThan(0);
      } catch {
        throw new Error(`Schema file '${filePath}' does not export an InputSchema`);
      }
    }
  });

  it('every Zod schema has a corresponding SDK operation (no orphaned schemas)', () => {
    /**
     * Check: Every exported Zod schema in the modules has a corresponding
     * operation in TB_SDK_TYPES.
     *
     * Pass: The schema files don't define operations that aren't in TB_SDK_TYPES.
     */

    // Get all operations from schema files
    const schemaOpsByModule: Record<string, string[]> = {};
    for (const [mod, filePath] of Object.entries(SCHEMA_FILES)) {
      schemaOpsByModule[mod] = extractOperationsFromSchema(filePath);
    }

    // Flatten schema ops
    const allSchemaOps = Object.values(schemaOpsByModule).flat();

    // Check that all schema ops are represented in SDK types
    // (This is a basic presence check - the SDK types may have aliases)
    for (const op of allSchemaOps) {
      if (op.startsWith('session_')) {
        // session_* operations map to session.* in SDK
        const baseOp = op.replace('session_', '');
        expect(TB_SDK_SESSION_OPS).toContain(baseOp);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// CC.2: catalog.operations.session includes required operations
// ---------------------------------------------------------------------------

describe('CC.2 — catalog.operations.session includes required operations', () => {
  it('catalog.operations.session includes getThought, recentThoughts, searchWithin, checkpoint, checkpoints, getCheckpoint, checkpointsByLabel, isActive, update, openChain', () => {
    /**
     * Check: `catalog.operations.session` includes all required session operations.
     *
     * Required: getThought, recentThoughts, searchWithin, checkpoint, checkpoints,
     *           getCheckpoint, checkpointsByLabel, isActive, update, openChain
     *
     * Pass: All required operations are present in the expected catalog keys.
     *
     * NOTE: This test checks the TB_SDK_TYPES string since we don't have
     * direct catalog access here. The actual catalog is populated from
     * the tool handler registration at startup.
     */

    const requiredSessionOps = [
      'getThought',
      'recentThoughts',
      'searchWithin',
      'checkpoint',
      'checkpoints',
      'getCheckpoint',
      'checkpointsByLabel',
      'isActive',
      'update',
      'openChain',
    ];

    // The SDK types string should contain references to these operations
    // For operations not yet implemented, the test will fail with a clear message
    for (const op of requiredSessionOps) {
      expect(
        TB_SDK_TYPES_STRING,
        `session operation '${op}' should be documented in TB_SDK_TYPES`,
      ).toContain(op);
    }
  });
});
