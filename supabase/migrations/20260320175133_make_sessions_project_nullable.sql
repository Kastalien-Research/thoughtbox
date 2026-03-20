-- C1/M2: sessions.project is vestigial (workspace_id is the isolation boundary).
-- Make nullable so createSession() doesn't crash on NOT NULL constraint.
ALTER TABLE sessions ALTER COLUMN project DROP NOT NULL;
ALTER TABLE sessions ALTER COLUMN project SET DEFAULT NULL;
