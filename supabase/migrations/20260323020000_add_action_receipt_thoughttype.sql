-- Add action_receipt to thoughts.thought_type CHECK constraint.
-- Part of control loop wiring: post-action receipts verify state changes.

ALTER TABLE thoughts DROP CONSTRAINT IF EXISTS thoughts_thought_type_check;
ALTER TABLE thoughts ADD CONSTRAINT thoughts_thought_type_check CHECK (
  thought_type = ANY (ARRAY[
    'reasoning', 'decision_frame', 'action_report',
    'belief_snapshot', 'assumption_update', 'context_snapshot',
    'progress', 'action_receipt'
  ]::text[])
);

-- Add receipt_data JSONB column for structured receipt metadata.
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS receipt_data jsonb;
