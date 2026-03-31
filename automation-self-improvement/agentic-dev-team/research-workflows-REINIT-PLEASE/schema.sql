-- MAP-Elites Research Workflow Library
-- Quality-diversity optimization for research methodologies
--
-- Usage: sqlite3 research-workflows/workflows.db < research-workflows/schema.sql

-- Active workflow population (the MAP-Elites grid)
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,                    -- workflow-{uuid}
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'seed')),

    -- Behavioral coordinates (1-5 each, define position in the MAP-Elites grid)
    coord_scope INTEGER NOT NULL CHECK (coord_scope BETWEEN 1 AND 5),
    coord_domain_structure INTEGER NOT NULL CHECK (coord_domain_structure BETWEEN 1 AND 5),
    coord_evidence_type INTEGER NOT NULL CHECK (coord_evidence_type BETWEEN 1 AND 5),
    coord_time_horizon INTEGER NOT NULL CHECK (coord_time_horizon BETWEEN 1 AND 5),
    coord_fidelity INTEGER NOT NULL CHECK (coord_fidelity BETWEEN 1 AND 5),

    -- Fitness (composite and per-dimension)
    fitness_score REAL DEFAULT 0.0 CHECK (fitness_score BETWEEN 0 AND 1),
    fitness_coherence REAL DEFAULT 0.0,
    fitness_grounding REAL DEFAULT 0.0,
    fitness_compression REAL DEFAULT 0.0,
    fitness_surprise REAL DEFAULT 0.0,
    fitness_actionability REAL DEFAULT 0.0,

    -- Usage tracking
    times_used INTEGER NOT NULL DEFAULT 0,
    times_selected_as_parent INTEGER NOT NULL DEFAULT 0,

    -- Lineage
    archetype TEXT,                          -- e.g., 'exploratory', 'confirmatory', 'analytical', 'generative', 'applied'
    notes TEXT
);

-- Steps within a workflow (ordered)
CREATE TABLE IF NOT EXISTS workflow_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT NOT NULL,                 -- WHY this step exists (critical for intelligent recombination)
    tools_required TEXT,                     -- comma-separated list of tools
    skip_condition TEXT,                     -- when to skip this step
    outputs TEXT,                            -- what this step produces
    UNIQUE(workflow_id, step_order)
);

-- Parent-child lineage (which workflows contributed to a new one)
CREATE TABLE IF NOT EXISTS workflow_lineage (
    child_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    parent_id TEXT NOT NULL REFERENCES workflows(id),
    contribution TEXT,                       -- what was borrowed from the parent
    PRIMARY KEY (child_id, parent_id)
);

-- Execution log (every research run)
CREATE TABLE IF NOT EXISTS executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    executed_at TEXT NOT NULL DEFAULT (datetime('now')),
    task_description TEXT NOT NULL,

    -- Task characterization (behavioral coordinates of the task, not the workflow)
    task_scope INTEGER CHECK (task_scope BETWEEN 1 AND 5),
    task_domain_structure INTEGER CHECK (task_domain_structure BETWEEN 1 AND 5),
    task_evidence_type INTEGER CHECK (task_evidence_type BETWEEN 1 AND 5),
    task_time_horizon INTEGER CHECK (task_time_horizon BETWEEN 1 AND 5),
    task_fidelity INTEGER CHECK (task_fidelity BETWEEN 1 AND 5),

    -- Which workflows were considered and used
    workflows_retrieved TEXT,                -- JSON array of workflow IDs considered
    workflow_composed TEXT,                  -- JSON description of the composed plan
    techniques_borrowed TEXT,                -- JSON: [{from: workflow_id, technique: "..."}]

    -- Output quality scores
    score_coherence REAL CHECK (score_coherence BETWEEN 0 AND 1),
    score_grounding REAL CHECK (score_grounding BETWEEN 0 AND 1),
    score_compression REAL CHECK (score_compression BETWEEN 0 AND 1),
    score_surprise REAL CHECK (score_surprise BETWEEN 0 AND 1),
    score_actionability REAL CHECK (score_actionability BETWEEN 0 AND 1),
    score_composite REAL CHECK (score_composite BETWEEN 0 AND 1),

    -- Did this execution update the library?
    library_updated INTEGER NOT NULL DEFAULT 0,
    workflow_displaced TEXT,                 -- ID of workflow that was replaced, if any
    beads_issue_id TEXT                      -- linked beads issue, if any
);

-- Taste evaluations (log of /taste runs)
CREATE TABLE IF NOT EXISTS taste_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluated_at TEXT NOT NULL DEFAULT (datetime('now')),
    proposal TEXT NOT NULL,
    compression TEXT,                        -- single-sentence formulation
    verdict TEXT NOT NULL CHECK (verdict IN ('proceed', 'simplify', 'defer', 'kill')),
    rationale TEXT NOT NULL,
    depth TEXT CHECK (depth IN ('compression_only', 'landscape_deadend', 'full_pipeline', 'cross_pollination', 'prediction_only')),
    time_to_signal_estimate TEXT,
    simplification_opportunity TEXT,
    cross_domain_resonance TEXT,
    followed_up INTEGER NOT NULL DEFAULT 0,  -- was this actually pursued?
    outcome_notes TEXT                       -- what happened if followed up
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workflows_coords ON workflows(coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity);
CREATE INDEX IF NOT EXISTS idx_workflows_fitness ON workflows(fitness_score DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_executions_date ON executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_taste_verdict ON taste_evaluations(verdict);

-- View: current MAP-Elites grid (active workflows only, best fitness per coordinate region)
CREATE VIEW IF NOT EXISTS map_elites_grid AS
SELECT
    id, name, archetype,
    coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity,
    fitness_score, times_used, times_selected_as_parent
FROM workflows
WHERE status = 'active'
ORDER BY fitness_score DESC;

-- View: most reused techniques (which parent workflows contribute most often)
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
