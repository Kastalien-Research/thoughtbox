-- ADR-DATA-01: Supabase Product Schema
-- Creates sessions, thoughts, entities, relations, observations tables
-- with indexes, triggers, RLS policies, and FTS support.

-- =============================================================================
-- Helper function for updated_at columns
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- sessions
-- =============================================================================

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project         TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  thought_count   INTEGER NOT NULL DEFAULT 0,
  branch_count    INTEGER NOT NULL DEFAULT 0,
  partition_path  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_project ON sessions(project);
CREATE INDEX idx_sessions_updated ON sessions(project, updated_at DESC);
CREATE INDEX idx_sessions_tags ON sessions USING GIN(tags);

CREATE TRIGGER trigger_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- thoughts
-- =============================================================================

CREATE TABLE thoughts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  project             TEXT NOT NULL,

  thought             TEXT NOT NULL,
  thought_number      INTEGER NOT NULL,
  total_thoughts      INTEGER NOT NULL,
  next_thought_needed BOOLEAN NOT NULL,
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT now(),

  is_revision         BOOLEAN DEFAULT false,
  revises_thought     INTEGER,
  branch_from_thought INTEGER,
  branch_id           TEXT,
  needs_more_thoughts BOOLEAN,

  thought_type        TEXT NOT NULL DEFAULT 'reasoning'
    CHECK (thought_type IN (
      'reasoning', 'decision_frame', 'action_report',
      'belief_snapshot', 'assumption_update',
      'context_snapshot', 'progress'
    )),

  confidence          TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  options             JSONB,
  action_result       JSONB,
  beliefs             JSONB,
  assumption_change   JSONB,
  context_data        JSONB,
  progress_data       JSONB,

  agent_id            TEXT,
  agent_name          TEXT,

  content_hash        TEXT,
  parent_hash         TEXT,

  critique            JSONB,

  UNIQUE NULLS NOT DISTINCT (session_id, thought_number, branch_id)
);

CREATE INDEX idx_thoughts_session ON thoughts(session_id, thought_number);
CREATE INDEX idx_thoughts_project ON thoughts(project);
CREATE INDEX idx_thoughts_branch ON thoughts(session_id, branch_id)
  WHERE branch_id IS NOT NULL;
CREATE INDEX idx_thoughts_type ON thoughts(thought_type);
CREATE INDEX idx_thoughts_revision ON thoughts(session_id, revises_thought)
  WHERE revises_thought IS NOT NULL;

-- Trigger to maintain denormalized counts on sessions.
-- Uses atomic increment/decrement for concurrency safety under parallel inserts.
CREATE OR REPLACE FUNCTION update_session_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.branch_id IS NULL THEN
      UPDATE sessions SET thought_count = thought_count + 1
      WHERE id = NEW.session_id;
    ELSE
      -- Increment branch_count only if this is the first thought for this branch
      IF NOT EXISTS (
        SELECT 1 FROM thoughts
        WHERE session_id = NEW.session_id
          AND branch_id = NEW.branch_id
          AND id != NEW.id
      ) THEN
        UPDATE sessions SET branch_count = branch_count + 1
        WHERE id = NEW.session_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.branch_id IS NULL THEN
      UPDATE sessions SET thought_count = thought_count - 1
      WHERE id = OLD.session_id;
    ELSE
      -- Decrement branch_count only if this was the last thought for this branch
      IF NOT EXISTS (
        SELECT 1 FROM thoughts
        WHERE session_id = OLD.session_id
          AND branch_id = OLD.branch_id
          AND id != OLD.id
      ) THEN
        UPDATE sessions SET branch_count = branch_count - 1
        WHERE id = OLD.session_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_counts
  AFTER INSERT OR DELETE ON thoughts
  FOR EACH ROW EXECUTE FUNCTION update_session_counts();

-- =============================================================================
-- entities
-- =============================================================================

CREATE TABLE entities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project           TEXT NOT NULL,
  name              TEXT NOT NULL,
  type              TEXT NOT NULL
    CHECK (type IN ('Insight', 'Concept', 'Workflow', 'Decision', 'Agent')),
  label             TEXT NOT NULL,
  properties        JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        TEXT,
  visibility        TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'agent-private', 'user-private', 'team-private')),
  valid_from        TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to          TIMESTAMPTZ,
  superseded_by     UUID REFERENCES entities(id),
  access_count      INTEGER NOT NULL DEFAULT 0,
  last_accessed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  importance_score  REAL NOT NULL DEFAULT 0.5,

  UNIQUE(project, name, type)
);

CREATE INDEX idx_entities_project ON entities(project);
CREATE INDEX idx_entities_type ON entities(project, type);
CREATE INDEX idx_entities_visibility ON entities(visibility);
CREATE INDEX idx_entities_valid ON entities(valid_from, valid_to);
CREATE INDEX idx_entities_importance ON entities(importance_score DESC);

CREATE TRIGGER trigger_entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- relations
-- =============================================================================

CREATE TABLE relations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project     TEXT NOT NULL,
  from_id     UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  to_id       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
    CHECK (type IN (
      'RELATES_TO', 'BUILDS_ON', 'CONTRADICTS', 'EXTRACTED_FROM',
      'APPLIED_IN', 'LEARNED_BY', 'DEPENDS_ON', 'SUPERSEDES', 'MERGED_FROM'
    )),
  properties  JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  TEXT
);

CREATE INDEX idx_relations_project ON relations(project);
CREATE INDEX idx_relations_from ON relations(from_id);
CREATE INDEX idx_relations_to ON relations(to_id);
CREATE INDEX idx_relations_type ON relations(type);

-- =============================================================================
-- observations
-- =============================================================================

CREATE TABLE observations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project         TEXT NOT NULL,
  entity_id       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  source_session  UUID REFERENCES sessions(id),
  added_by        TEXT,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to        TIMESTAMPTZ,
  superseded_by   UUID REFERENCES observations(id)
);

CREATE INDEX idx_observations_project ON observations(project);
CREATE INDEX idx_observations_entity ON observations(entity_id);
CREATE INDEX idx_observations_session ON observations(source_session);
CREATE INDEX idx_observations_valid ON observations(valid_from, valid_to);

-- Full-text search column and index
ALTER TABLE observations
  ADD COLUMN content_tsv TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX idx_observations_fts ON observations USING GIN(content_tsv);

-- =============================================================================
-- Row-Level Security
-- =============================================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_isolation ON sessions
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON thoughts
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON entities
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON relations
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON observations
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

-- Service role bypass (allows admin operations)
CREATE POLICY service_role_bypass ON sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass ON thoughts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass ON entities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass ON relations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass ON observations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
