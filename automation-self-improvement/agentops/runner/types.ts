/**
 * Shared TypeScript interfaces for AgentOps runner
 */

// === Proposal Types ===

export interface Proposal {
  proposal_id: string;
  title: string;
  category: 'compatibility' | 'reliability' | 'performance' | 'UX' | 'docs';
  effort_estimate: 'S' | 'M' | 'L';
  risk: 'low' | 'medium' | 'high';
  evidence: string[];  // Required: URLs from input signals (arXiv, RSS, repo commits, etc.)
  why_now: string[];
  expected_impact: {
    users: string[];
    outcome: string;
  };
  design_sketch: string;
  touch_points: string[];
  test_plan: string[];
  rollout: string;
  rollback: string;
  acceptance: string[];
}

export interface ProposalsPayload {
  run_id: string;
  repo_ref: string;
  git_sha: string;
  generated_at: string;
  proposals: Proposal[];
}

// === Run Types ===

export interface RunSummary {
  run_id: string;
  job_name: string;
  job_version: string;
  status: 'SUCCEEDED' | 'FAILED' | 'PARTIAL';
  trigger: {
    type: 'schedule' | 'manual' | 'label';
    source: string;
    event: string;
  };
  repo: {
    url: string;
    ref: string;
    git_sha: string;
  };
  started_at: string;
  ended_at: string;
  budgets: {
    max_llm_cost_usd: number;
    max_wall_clock_minutes: number;
    max_tool_calls: number;
  };
  metrics: {
    llm_cost_usd: number;  // Estimated based on token counts and known pricing; may drift
    wall_clock_seconds: number;
    sources_scanned: number;
    items_shortlisted: number;
    proposals_emitted: number;
  };
  signal_collection?: {
    sources_attempted: string[];
    sources_succeeded: string[];
    sources_failed: Array<{ source: string; error: string }>;
  };
  artifact_index: Array<{
    name: string;
    path: string;
    sha256?: string;
  }>;
  links: {
    trace?: string;
    issue?: string;
    workflow_run?: string;
  };
  errors: Array<{
    phase: string;
    message: string;
    timestamp: string;
  }>;
}

// === Implementation Types ===

export interface ImplementationMode {
  mode: 'SMOKE' | 'REAL';
  proposal_id: string;
}

export interface ImplementationResult {
  run_id: string;
  upstream_run_id: string;
  proposal_id: string;
  proposal_title: string;
  mode: 'SMOKE' | 'REAL';
  branch_name?: string;
  base_ref: string;
  base_sha: string;
  status: 'SUCCEEDED' | 'FAILED' | 'PARTIAL';
  diffstat?: string;
  files_changed: string[];
  commands_executed: string[];
  test_results: {
    passed: number;
    failed: number;
    skipped: number;
    output: string;
  };
  eval_results?: {
    baseline_score?: number;
    candidate_score?: number;
    summary: string;
  };
  risks: string[];
  rollback_plan: string;
  recommendation: 'MERGE' | 'DO NOT MERGE' | 'NEEDS DECISION';
  pr_url?: string;
  trace_url?: string;
  artifact_index_url?: string;
}

// === Template Types ===

export interface TemplateContext {
  DATE_LOCAL: string;
  RUN_ID: string;
  JOB_NAME: string;
  JOB_VERSION: string;
  GIT_SHA: string;
  REPO_REF: string;
  TRACE_URL: string;
  ARTIFACT_INDEX_URL: string;
  BUDGET_SUMMARY: string;
  SOURCES_SUMMARY: string;
  DIGEST_BULLETS: string;
  PROPOSALS_SUMMARY: string;
  PROPOSALS_JSON: string;
  HUMAN_QUESTIONS_OR_NONE: string;
}

export interface ImplementationTemplateContext {
  RUN_ID: string;
  UPSTREAM_RUN_ID: string;
  PROPOSAL_ID: string;
  PROPOSAL_TITLE: string;
  BRANCH_NAME: string;
  BASE_REF: string;
  BASE_SHA: string;
  TRACE_URL: string;
  ARTIFACT_INDEX_URL: string;
  DIFFSTAT: string;
  FILES_CHANGED_LIST: string;
  COMMANDS_EXECUTED: string;
  TEST_RESULTS_SUMMARY: string;
  EVAL_RESULTS_SUMMARY: string;
  RISKS_AND_LIMITATIONS: string;
  ROLLBACK_PLAN: string;
  RECOMMENDATION: string;
  PR_URL: string;
  CHANGE_SUMMARY: string;
  CHANGE_RATIONALE: string;
  SCOPE_NOTES: string;
  STATUS: string;
  MODE: string;
}

// === State Types ===

export interface BootstrapState {
  sessionId: string;
  phase: 'design' | 'validate' | 'orchestrate' | 'complete';
  phaseStatus: {
    design: { complete: boolean; timestamp?: string };
    validate: { complete: boolean; timestamp?: string };
    orchestrate: { complete: boolean; timestamp?: string };
  };
  createdAt: string;
  lastUpdated: string;
  checkpoints: Array<{
    phase: string;
    timestamp: string;
    description: string;
  }>;
}

// === GitHub Types ===

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  labels: Array<{ name: string }>;
  html_url: string;
}

export interface GitHubComment {
  id: number;
  body: string;
  html_url: string;
}

// === Tracing Types ===

export interface TracingConfig {
  projectName: string;
  apiKey?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface TraceSpan {
  name: string;
  startTime: number;
  endTime?: number;
  attributes?: Record<string, unknown>;
  status?: 'ok' | 'error';
  statusMessage?: string;
}
