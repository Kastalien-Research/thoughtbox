-- Research workflow library and agent playbook schema
-- Usage:
--   rm -f research-workflows/workflows.db
--   sqlite3 research-workflows/workflows.db < research-workflows/schema.sql
--   sqlite3 research-workflows/workflows.db < research-workflows/seed.sql

PRAGMA foreign_keys = ON;

-- MAP-Elites workflow population
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'seed')),
    coord_scope INTEGER NOT NULL CHECK (coord_scope BETWEEN 1 AND 5),
    coord_domain_structure INTEGER NOT NULL CHECK (coord_domain_structure BETWEEN 1 AND 5),
    coord_evidence_type INTEGER NOT NULL CHECK (coord_evidence_type BETWEEN 1 AND 5),
    coord_time_horizon INTEGER NOT NULL CHECK (coord_time_horizon BETWEEN 1 AND 5),
    coord_fidelity INTEGER NOT NULL CHECK (coord_fidelity BETWEEN 1 AND 5),
    fitness_score REAL DEFAULT 0.0 CHECK (fitness_score BETWEEN 0 AND 1),
    fitness_coherence REAL DEFAULT 0.0,
    fitness_grounding REAL DEFAULT 0.0,
    fitness_compression REAL DEFAULT 0.0,
    fitness_surprise REAL DEFAULT 0.0,
    fitness_actionability REAL DEFAULT 0.0,
    times_used INTEGER NOT NULL DEFAULT 0,
    times_selected_as_parent INTEGER NOT NULL DEFAULT 0,
    archetype TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS workflow_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT NOT NULL,
    tools_required TEXT,
    skip_condition TEXT,
    outputs TEXT,
    UNIQUE(workflow_id, step_order)
);

CREATE TABLE IF NOT EXISTS workflow_lineage (
    child_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    parent_id TEXT NOT NULL REFERENCES workflows(id),
    contribution TEXT,
    PRIMARY KEY (child_id, parent_id)
);

CREATE TABLE IF NOT EXISTS executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    executed_at TEXT NOT NULL DEFAULT (datetime('now')),
    task_description TEXT NOT NULL,
    task_scope INTEGER CHECK (task_scope BETWEEN 1 AND 5),
    task_domain_structure INTEGER CHECK (task_domain_structure BETWEEN 1 AND 5),
    task_evidence_type INTEGER CHECK (task_evidence_type BETWEEN 1 AND 5),
    task_time_horizon INTEGER CHECK (task_time_horizon BETWEEN 1 AND 5),
    task_fidelity INTEGER CHECK (task_fidelity BETWEEN 1 AND 5),
    workflows_retrieved TEXT,
    workflow_composed TEXT,
    techniques_borrowed TEXT,
    score_coherence REAL CHECK (score_coherence BETWEEN 0 AND 1),
    score_grounding REAL CHECK (score_grounding BETWEEN 0 AND 1),
    score_compression REAL CHECK (score_compression BETWEEN 0 AND 1),
    score_surprise REAL CHECK (score_surprise BETWEEN 0 AND 1),
    score_actionability REAL CHECK (score_actionability BETWEEN 0 AND 1),
    score_composite REAL CHECK (score_composite BETWEEN 0 AND 1),
    library_updated INTEGER NOT NULL DEFAULT 0,
    workflow_displaced TEXT,
    beads_issue_id TEXT
);

CREATE TABLE IF NOT EXISTS taste_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluated_at TEXT NOT NULL DEFAULT (datetime('now')),
    proposal TEXT NOT NULL,
    compression TEXT,
    verdict TEXT NOT NULL CHECK (verdict IN ('proceed', 'simplify', 'defer', 'kill')),
    rationale TEXT NOT NULL,
    depth TEXT CHECK (depth IN ('compression_only', 'landscape_deadend', 'full_pipeline', 'cross_pollination', 'prediction_only')),
    time_to_signal_estimate TEXT,
    simplification_opportunity TEXT,
    cross_domain_resonance TEXT,
    followed_up INTEGER NOT NULL DEFAULT 0,
    outcome_notes TEXT
);

-- Runtime playbook tables used by agent scripts
CREATE TABLE IF NOT EXISTS adversarial_findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    found_at TEXT NOT NULL DEFAULT (datetime('now')),
    agent TEXT NOT NULL DEFAULT 'devils-advocate',
    target_file TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('spec', 'implementation', 'hook', 'config', 'plan', 'test', 'agent_definition')),
    attack_pattern TEXT NOT NULL,
    finding TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'major', 'minor', 'observation')),
    was_real_bug INTEGER NOT NULL DEFAULT 1,
    false_positive INTEGER NOT NULL DEFAULT 0,
    fixed INTEGER NOT NULL DEFAULT 0,
    fix_commit TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS attack_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    target_types TEXT NOT NULL,
    times_used INTEGER NOT NULL DEFAULT 0,
    times_hit INTEGER NOT NULL DEFAULT 0,
    hit_rate REAL GENERATED ALWAYS AS (
        CASE WHEN times_used > 0 THEN CAST(times_hit AS REAL) / times_used ELSE 0.0 END
    ) STORED,
    avg_severity REAL NOT NULL DEFAULT 0.0,
    last_used TEXT,
    discovered_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS verification_audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    verified_at TEXT NOT NULL DEFAULT (datetime('now')),
    agent TEXT NOT NULL DEFAULT 'verification-judge',
    target_artifact TEXT NOT NULL,
    target_spec TEXT NOT NULL,
    verdict TEXT NOT NULL CHECK (verdict IN ('VERIFIED', 'REJECTED', 'ESCALATE')),
    deterministic_pass INTEGER NOT NULL DEFAULT 0,
    spec_compliance_pass INTEGER NOT NULL DEFAULT 0,
    perspective_review_pass INTEGER NOT NULL DEFAULT 0,
    total_blocking_issues INTEGER NOT NULL DEFAULT 0,
    total_advisory_issues INTEGER NOT NULL DEFAULT 0,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS verification_failures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id INTEGER NOT NULL REFERENCES verification_audits(id),
    failure_type TEXT NOT NULL CHECK (failure_type IN ('deterministic', 'spec_compliance', 'logic', 'architecture', 'security', 'completeness', 'spec_ambiguity')),
    description TEXT NOT NULL,
    discovered_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_workflows_coords ON workflows(coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity);
CREATE INDEX IF NOT EXISTS idx_workflows_fitness ON workflows(fitness_score DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_executions_date ON executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_taste_verdict ON taste_evaluations(verdict);
CREATE INDEX IF NOT EXISTS idx_adversarial_findings_agent_date ON adversarial_findings(agent, found_at DESC);
CREATE INDEX IF NOT EXISTS idx_adversarial_findings_target ON adversarial_findings(target_file, attack_pattern);
CREATE INDEX IF NOT EXISTS idx_verification_audits_date ON verification_audits(verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_failures_audit ON verification_failures(audit_id);

CREATE VIEW IF NOT EXISTS map_elites_grid AS
SELECT
    id,
    name,
    archetype,
    coord_scope,
    coord_domain_structure,
    coord_evidence_type,
    coord_time_horizon,
    coord_fidelity,
    fitness_score,
    times_used,
    times_selected_as_parent
FROM workflows
WHERE status = 'active'
ORDER BY fitness_score DESC;

CREATE VIEW IF NOT EXISTS technique_frequency AS
SELECT
    parent_id,
    w.name AS parent_name,
    COUNT(*) AS times_contributed,
    w.times_selected_as_parent
FROM workflow_lineage wl
JOIN workflows w ON w.id = wl.parent_id
GROUP BY parent_id
ORDER BY times_contributed DESC;