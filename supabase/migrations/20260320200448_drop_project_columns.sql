-- Drop vestigial project columns. Code uses workspace_id for isolation.
-- Affects: entities, relations, observations, sessions, thoughts.

-- Drop RLS policies that reference project
DROP POLICY IF EXISTS project_isolation ON entities;
DROP POLICY IF EXISTS project_isolation ON relations;
DROP POLICY IF EXISTS project_isolation ON observations;
DROP POLICY IF EXISTS project_isolation ON sessions;
DROP POLICY IF EXISTS project_isolation ON thoughts;

-- Drop indexes on project columns
DROP INDEX IF EXISTS idx_entities_project;
DROP INDEX IF EXISTS idx_entities_type;
DROP INDEX IF EXISTS idx_relations_project;
DROP INDEX IF EXISTS idx_observations_project;
DROP INDEX IF EXISTS idx_sessions_project;
DROP INDEX IF EXISTS idx_sessions_updated;

-- Drop the columns
ALTER TABLE entities DROP COLUMN IF EXISTS project;
ALTER TABLE relations DROP COLUMN IF EXISTS project;
ALTER TABLE observations DROP COLUMN IF EXISTS project;
ALTER TABLE sessions DROP COLUMN IF EXISTS project;
ALTER TABLE thoughts DROP COLUMN IF EXISTS project;

-- Recreate entities unique constraint without project
ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_project_name_type_key;
ALTER TABLE entities ADD CONSTRAINT entities_name_type_key UNIQUE (name, type);

-- Recreate entities type index without project
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
