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
 * - hub:           src/hub/operations.ts (HUB_OPERATIONS catalog)
 * - claims:        src/claims/operations.ts (CLAIMS_OPERATIONS catalog)
 */

export const TB_SDK_TYPES = `\`\`\`ts
type HubProfile = "MANAGER" | "ARCHITECT" | "DEBUGGER" | "SECURITY" | "RESEARCHER" | "REVIEWER";
type ClaimType = "assumption" | "decision" | "observation" | "requirement" | "outcome";
type ClaimStatus = "asserted" | "supported" | "invalidated" | "superseded";

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

  /** Notebook Evidence Engine. Source: src/notebook/tool.ts */
  notebook: {
    create(args: { title: string; language: "javascript" | "typescript"; template?: "sequential-feynman" | "evidence-runbook" | "evidence-simulation" | "evidence-eval-workbook" | "evidence-failure-capsule" | "evidence-adr-pack" | "evidence-skill-certification" | "evidence-scenario-factory" | "evidence-system-audit" | "merge-evidence" }): Promise<unknown>;
    list(): Promise<unknown>;
    /** Exactly one source: path (filesystem), content (raw .src.md), or notebookId (restore a persisted document under its original id). */
    load(args: { path?: string; content?: string; notebookId?: string }): Promise<unknown>;
    addCell(args: { notebookId: string; cellType: "title" | "markdown" | "code"; content: string; filename?: string; position?: number }): Promise<unknown>;
    updateCell(args: { notebookId: string; cellId: string; content: string }): Promise<unknown>;
    /** With instanceId, execution is instance-aware and ordered (only the next unsatisfied cell may run). */
    runCell(args: { notebookId: string; cellId: string; instanceId?: string }): Promise<unknown>;
    listCells(args: { notebookId: string }): Promise<unknown>;
    getCell(args: { notebookId: string; cellId: string }): Promise<unknown>;
    installDeps(args: { notebookId: string }): Promise<unknown>;
    export(args: { notebookId: string; path?: string }): Promise<unknown>;
    /**
     * Run a code cell as a deterministic predicate over JSON-serialisable observed data.
     * The cell reads observed via process.env.TB_OBSERVED_PATH and writes its verdict
     * to process.env.TB_VERDICT_PATH (use the auto-materialised tb-validate helper).
     */
    validate(args: { notebookId: string; cellId: string; observed: unknown; expectedSnapshotHash?: string }): Promise<unknown>;
    /** Persist the notebook: in-process artifact always; durably (file_system/supabase, upsert by id) when a document backend is configured — the response's 'persistence' field names the backend. Restore with load({ notebookId }). */
    persist(args: { notebookId: string }): Promise<unknown>;
    /** Execute the notebook's cells and derive a mode-specific verdict from real results: runbook = pass/fail RunbookVerdict, eval = EvalScorecard (score = passed/evaluated over declared expectations), merge_evidence = MergeEvidenceRunResult (runbook semantics, retagged). */
    startRun(args: { notebookId: string; mode: "runbook" | "eval" | "merge_evidence"; inputs?: Record<string, unknown> }): Promise<unknown>;
    getRun(args: { runId: string }): Promise<unknown>;
    listRuns(args?: { notebookId?: string }): Promise<unknown>;
    cancelRun(args: { runId: string; reason?: string }): Promise<unknown>;
    getArtifact(args: { artifactId: string }): Promise<unknown>;
    /**
     * Read the fitness ledger for a runbook template (SPEC-AGX-SUBSTRATE §7):
     * per-version aggregates (instances, pass rate, error rate, distinct agents)
     * from machine-checked expectation rows only. templateId = the source notebook id.
     */
    fitness(args: { templateId: string; templateVersion?: number; includeRows?: boolean }): Promise<unknown>;
    /**
     * Instantiate a runbook from a persisted template version, or resume an
     * existing instance from its durable records alone (fresh-session path,
     * SPEC-AGX-SUBSTRATE c5). Returns the notebookId (= templateId), the
     * instance (with derived status and nextCellId), and the template cell map.
     * Continue execution with runCell({ notebookId, cellId, instanceId }).
     */
    instantiate(args: { templateId?: string; templateVersion?: number; instanceId?: string }): Promise<unknown>;
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

  /** Ulysses Protocol: state-step-gated debugging with notebook-cell validators. plan binds primaryValidator + recoveryValidator (notebook code cells); outcome takes observed JSON and the bound validator decides the assessment; bind_final_validator pins a predicate that hard-gates complete(resolved). Source: src/protocol/ulysses-tool.ts */
  ulysses(input: {
    operation: "init" | "plan" | "outcome" | "reflect" | "status" | "complete" | "bind_final_validator";
    problem?: string;
    constraints?: string[];
    primary?: string;
    recovery?: string;
    irreversible?: boolean;
    primaryValidator?: { notebookId: string; cellId: string };
    recoveryValidator?: { notebookId: string; cellId: string };
    observed?: unknown;
    notebookId?: string;
    cellId?: string;
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

  /**
   * Multi-agent hub coordination: workspaces, problems, proposals, consensus,
   * channels. Call register or quickJoin once per session — the returned
   * agentId is then implicit for every other call. Pass agentId explicitly
   * only to act as another agent registered in this session.
   * Source: src/hub/operations.ts
   */
  hub: {
    register(args: { name: string; profile?: HubProfile; clientInfo?: string }): Promise<unknown>;
    quickJoin(args: { name: string; workspaceId: string; profile?: HubProfile; clientInfo?: string }): Promise<unknown>;
    listWorkspaces(): Promise<unknown>;
    whoami(args?: { agentId?: string }): Promise<unknown>;
    createWorkspace(args: { name: string; description: string; agentId?: string }): Promise<unknown>;
    joinWorkspace(args: { workspaceId: string; agentId?: string }): Promise<unknown>;
    getProfilePrompt(args: { profile: HubProfile }): Promise<unknown>;
    createProblem(args: { workspaceId: string; title: string; description: string; agentId?: string }): Promise<unknown>;
    claimProblem(args: { workspaceId: string; problemId: string; branchId?: string; agentId?: string }): Promise<unknown>;
    updateProblem(args: { workspaceId: string; problemId: string; status: "open" | "in-progress" | "resolved" | "closed"; resolution?: string; agentId?: string }): Promise<unknown>;
    listProblems(args: { workspaceId: string; status?: "open" | "in-progress" | "resolved" | "closed"; assignedTo?: string }): Promise<unknown>;
    addDependency(args: { workspaceId: string; problemId: string; dependsOnProblemId: string; agentId?: string }): Promise<unknown>;
    removeDependency(args: { workspaceId: string; problemId: string; dependsOnProblemId: string; agentId?: string }): Promise<unknown>;
    readyProblems(args: { workspaceId: string }): Promise<unknown>;
    blockedProblems(args: { workspaceId: string }): Promise<unknown>;
    createSubProblem(args: { workspaceId: string; parentId: string; title: string; description: string; agentId?: string }): Promise<unknown>;
    createProposal(args: { workspaceId: string; title: string; description: string; sourceBranch: string; problemId?: string; agentId?: string }): Promise<unknown>;
    reviewProposal(args: { workspaceId: string; proposalId: string; verdict: "approve" | "request-changes" | "reject"; reasoning: string; thoughtRefs?: number[]; agentId?: string }): Promise<unknown>;
    /** Coordinator-only; requires at least one approve review. The synthesis thought persists to the workspace main session. */
    mergeProposal(args: { workspaceId: string; proposalId: string; mergeMessage: string; agentId?: string }): Promise<unknown>;
    listProposals(args: { workspaceId: string; status?: "open" | "reviewing" | "merged" | "rejected" }): Promise<unknown>;
    markConsensus(args: { workspaceId: string; name: string; description: string; thoughtRef: number; branchId?: string; agentId?: string }): Promise<unknown>;
    endorseConsensus(args: { workspaceId: string; consensusId: string; agentId?: string }): Promise<unknown>;
    listConsensus(args: { workspaceId: string }): Promise<unknown>;
    postMessage(args: { workspaceId: string; problemId: string; content: string; ref?: { sessionId?: string; thoughtNumber?: number; branchId?: string }; agentId?: string }): Promise<unknown>;
    readChannel(args: { workspaceId: string; problemId: string; since?: string }): Promise<unknown>;
    postSystemMessage(args: { workspaceId: string; problemId: string; content: string; ref?: { sessionId?: string; thoughtNumber?: number; branchId?: string } }): Promise<unknown>;
    workspaceStatus(args: { workspaceId: string }): Promise<unknown>;
    workspaceDigest(args: { workspaceId: string }): Promise<unknown>;
  };

  /**
   * Claim graph: typed, tenant-isolated assertions with dependency edges
   * and explicit subscriptions (SPEC-AGX-SUBSTRATE). Identity is shared
   * with tb.hub — register or quickJoin once, then mutations use that
   * agentId implicitly (override per call via agentId). Invalidate and
   * supersede preserve the claim (append-history; supersede sets a
   * superseded_by pointer to the replacement). affected = transitive
   * dependents via reverse depends_on edges (cycle-safe, depth-capped).
   * Staleness primitives (pull, not push): verify = cheap revalidation of
   * specific claim ids before acting on them; changedSince = digest of
   * status transitions after a timestamp for session-start recall.
   * Source: src/claims/operations.ts
   */
  claims: {
    assert(args: { workspaceId: string; type: ClaimType; statement: string; evidenceRefs?: string[]; agentId?: string }): Promise<unknown>;
    support(args: { claimId: string; evidenceRefs: string[]; agentId?: string }): Promise<unknown>;
    invalidate(args: { claimId: string; agentId?: string }): Promise<unknown>;
    supersede(args: { claimId: string; statement: string; type?: ClaimType; evidenceRefs?: string[]; agentId?: string }): Promise<unknown>;
    link(args: { fromClaimId: string; toClaimId: string; kind: "depends_on" | "derives_from" | "contradicts"; agentId?: string }): Promise<unknown>;
    subscribe(args: { claimId: string; subscriber?: string; agentId?: string }): Promise<unknown>;
    unsubscribe(args: { claimId: string; subscriber?: string; agentId?: string }): Promise<unknown>;
    query(args: { workspaceId: string; type?: ClaimType; status?: ClaimStatus; createdBy?: string; text?: string }): Promise<unknown>;
    verify(args: { ids: string[] }): Promise<unknown>;
    changedSince(args: { since: string; workspaceId?: string }): Promise<unknown>;
    affected(args: { claimId: string; maxDepth?: number }): Promise<unknown>;
  };

  /**
   * Reactive runbooks (SPEC-AGX-SUBSTRATE B6+B8): pull-based advancement of
   * durable runbook instances, with await cells bound to claims. An await
   * cell parks the instance until its claim's CURRENT status is in \`until\`;
   * advance() re-checks the claim and executes the cells behind it. Exec
   * cells advance behind a compare-and-swap reservation, so concurrent
   * advancers execute side effects exactly once (losers get outcome
   * "in_flight"). advance() is state-mutating — one call per
   * thoughtbox_execute; status() is read-only and chains freely.
   * Source: src/notebook/runbook/operations.ts
   */
  runbook: {
    /** Outcomes: completed | parked (awaiting claim) | halted (cell failed) | in_flight (another advancer holds the step) | advanced (maxCells reached). */
    advance(args: { instanceId: string; maxCells?: number; force?: boolean }): Promise<unknown>;
    /** Read-only: derived status, next cell, awaited claim, execution records, pending reservations. Works from a fresh session with only the instance id. */
    status(args: { instanceId: string }): Promise<unknown>;
    /** Author an await cell (dispatches to notebook_add_cell with cellType "await"). */
    addAwaitCell(args: { notebookId: string; claimId: string; until: ClaimStatus | ClaimStatus[]; position?: number }): Promise<unknown>;
  };
}
\`\`\``;
