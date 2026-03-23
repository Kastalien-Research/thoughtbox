-- Add Delphi protocol terminal states to the protocol_sessions CHECK constraint.
-- Delphi is the third operational epistemics protocol (alongside Theseus and Ulysses).

ALTER TABLE protocol_sessions DROP CONSTRAINT IF EXISTS protocol_sessions_check;
ALTER TABLE protocol_sessions ADD CONSTRAINT protocol_sessions_check CHECK (
  (protocol = 'theseus' AND status IN ('active','superseded','complete','audit_failure','scope_exhaustion'))
  OR (protocol = 'ulysses' AND status IN ('active','superseded','resolved','insufficient_information','environment_compromised'))
  OR (protocol = 'delphi' AND status IN ('active','superseded','supported_thesis','refined_question','capability_gap','irreducible_uncertainty'))
);
