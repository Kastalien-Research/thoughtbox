-- Reconcile protocol_history.event_type CHECK with the application code.
--
-- src/protocol/types.ts emits six event_type values; the two validator events
-- (final_validator_bound, validator_tampering, added in commit d764ae6) were
-- applied directly to the prod and staging databases but never captured as a
-- migration. A database built from migrations alone therefore allows only the
-- original four values and would reject validator events at runtime.
--
-- This migration brings the constraint to the full six values, matching the
-- code and both live databases. It is an idempotent no-op on prod/staging
-- (their constraint is already identical) and corrects fresh/migration-built
-- databases. Tracked in issue #321.
--
-- Value order mirrors the live constraint so pg_get_constraintdef renders an
-- identical definition (keeps the db-parity fingerprint in agreement).

ALTER TABLE protocol_history
  DROP CONSTRAINT IF EXISTS protocol_history_event_type_check;

ALTER TABLE protocol_history
  ADD CONSTRAINT protocol_history_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'plan'::text,
    'outcome'::text,
    'reflect'::text,
    'checkpoint'::text,
    'final_validator_bound'::text,
    'validator_tampering'::text
  ]));
