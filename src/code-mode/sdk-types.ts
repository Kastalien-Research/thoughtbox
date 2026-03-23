/**
 * TypeScript type declarations for the `tb` SDK object.
 * Embedded in the thoughtbox_execute tool description so the LLM
 * gets type hints without loading operation catalogs.
 *
 * IMPORTANT: This file must stay in sync with the source Zod schemas:
 * - thought:       src/thought/tool.ts (thoughtToolInputSchema)
 * - session:       src/sessions/tool.ts (sessionToolInputSchema)
 * - knowledge:     src/knowledge/tool.ts (knowledgeToolInputSchema)
 * - notebook:      src/notebook/tool.ts (notebookToolInputSchema)
 * - theseus:       src/protocol/theseus-tool.ts (theseusToolInputSchema)
 * - ulysses:       src/protocol/ulysses-tool.ts (ulyssesToolInputSchema)
 * - observability: src/observability/gateway-handler.ts (ObservabilityInputSchema)
 */

export const TB_SDK_TYPES = `\`\`\`ts
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
    addObservation(entityId: string, content: string, args?: { source_session?: string; added_by?: string }): Promise<unknown>;
    createRelation(args: { from_id: string; to_id: string; relation_type: "RELATES_TO" | "BUILDS_ON" | "CONTRADICTS" | "EXTRACTED_FROM" | "APPLIED_IN" | "LEARNED_BY" | "DEPENDS_ON" | "SUPERSEDES" | "MERGED_FROM"; properties?: Record<string, unknown> }): Promise<unknown>;
    queryGraph(startEntityId: string, args?: { relation_types?: string[]; max_depth?: number; filter?: Record<string, unknown> }): Promise<unknown>;
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
    listCells(notebookId: string): Promise<unknown>;
    getCell(notebookId: string, cellId: string): Promise<unknown>;
    installDeps(notebookId: string): Promise<unknown>;
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

  /** Ulysses Protocol: surprise-gated debugging. Source: src/protocol/ulysses-tool.ts */
  ulysses(input: {
    operation: "init" | "plan" | "outcome" | "reflect" | "status" | "complete";
    problem?: string;
    constraints?: string[];
    primary?: string;
    recovery?: string;
    irreversible?: boolean;
    assessment?: "expected" | "unexpected-favorable" | "unexpected-unfavorable";
    severity?: number;
    details?: string;
    hypothesis?: string;
    falsification?: string;
    terminalState?: "resolved" | "insufficient_information" | "environment_compromised";
    summary?: string;
  }): Promise<unknown>;

  /** Observability queries. Source: src/observability/gateway-handler.ts */
  observability(input: {
    operation: "health" | "metrics" | "metrics_range" | "sessions" | "session_info" | "alerts" | "dashboard_url";
    args?: Record<string, unknown>;
  }): Promise<unknown>;
}
\`\`\``;
