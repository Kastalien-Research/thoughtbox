-- Add the payload-free inquiry-session thought types to the
-- thoughts.thought_type CHECK constraint (feedback spec
-- .specs/agent-user-feedback/claude-code-001.md A1): finding, synthesis,
-- question, conclusion. They validate like 'reasoning' — no structured
-- metadata columns are involved.
--
-- Non-destructive: widens the allowed value set only; existing rows are
-- untouched. Mirrors the pattern of
-- 20260323020000_add_action_receipt_thoughttype.sql.

ALTER TABLE thoughts DROP CONSTRAINT IF EXISTS thoughts_thought_type_check;
ALTER TABLE thoughts ADD CONSTRAINT thoughts_thought_type_check CHECK (
  thought_type = ANY (ARRAY[
    'reasoning', 'decision_frame', 'action_report',
    'belief_snapshot', 'assumption_update', 'context_snapshot',
    'progress', 'action_receipt',
    'finding', 'synthesis', 'question', 'conclusion'
  ]::text[])
);
