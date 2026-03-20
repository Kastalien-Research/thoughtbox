-- C2: Knowledge graph tables (entities, relations, observations) missing from remote.
-- Recreate from original 20260313000000 DDL. RLS policies use legacy project
-- isolation model — H5 bead will modernize to workspace-based isolation.

CREATE TABLE IF NOT EXISTS entities (
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

CREATE INDEX IF NOT EXISTS idx_entities_project ON entities(project);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(project, type);
CREATE INDEX IF NOT EXISTS idx_entities_visibility ON entities(visibility);
CREATE INDEX IF NOT EXISTS idx_entities_valid ON entities(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_entities_importance ON entities(importance_score DESC);

CREATE TRIGGER trigger_entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS relations (
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

CREATE INDEX IF NOT EXISTS idx_relations_project ON relations(project);
CREATE INDEX IF NOT EXISTS idx_relations_from ON relations(from_id);
CREATE INDEX IF NOT EXISTS idx_relations_to ON relations(to_id);
CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(type);

CREATE TABLE IF NOT EXISTS observations (
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

CREATE INDEX IF NOT EXISTS idx_observations_project ON observations(project);
CREATE INDEX IF NOT EXISTS idx_observations_entity ON observations(entity_id);
CREATE INDEX IF NOT EXISTS idx_observations_session ON observations(source_session);
CREATE INDEX IF NOT EXISTS idx_observations_valid ON observations(valid_from, valid_to);

ALTER TABLE observations
  ADD COLUMN content_tsv TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX IF NOT EXISTS idx_observations_fts ON observations USING GIN(content_tsv);

-- RLS
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

-- Legacy project-isolation policies (H5 will modernize to workspace model)
CREATE POLICY project_isolation ON entities
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON relations
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON observations
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

-- Service role bypass
CREATE POLICY service_role_bypass ON entities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass ON relations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass ON observations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
