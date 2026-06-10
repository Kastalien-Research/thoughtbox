-- Allow Ulysses validator audit events already emitted by the protocol handler.
ALTER TABLE public.protocol_history
  DROP CONSTRAINT IF EXISTS protocol_history_event_type_check;

ALTER TABLE public.protocol_history
  ADD CONSTRAINT protocol_history_event_type_check
  CHECK (
    event_type = ANY (
      ARRAY[
        'plan'::text,
        'outcome'::text,
        'reflect'::text,
        'checkpoint'::text,
        'final_validator_bound'::text,
        'validator_tampering'::text
      ]
    )
  );
