-- supersede_claim: stamp status_changed_at (SPEC-AGX-SUBSTRATE B2 × B3).
--
-- The atomic supersede function (20260613000000) predates the
-- status_changed_at column (20260612090000): its INSERT omitted the column
-- (DEFAULT now() covered it) and its UPDATE moved only updated_at, so a
-- superseded claim's status_changed_at stayed at its previous value and
-- tb.claims.verify / changed_since reported a stale transition time for the
-- single most decision-relevant transition.
--
-- Replace the function so both writes carry status_changed_at: the
-- replacement inserts the handler-supplied value, and the CAS update stamps
-- p_superseded_at (the handler sets updatedAt and statusChangedAt to the
-- same instant on a supersede, so reusing it is exact). CREATE OR REPLACE;
-- signature unchanged.

CREATE OR REPLACE FUNCTION public.supersede_claim(
  p_tenant_workspace_id uuid,
  p_original_id text,
  p_expected_version integer,
  p_superseded_at timestamptz,
  p_replacement jsonb
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_version integer;
BEGIN
  -- Insert the replacement first so the original's superseded_by FK is
  -- satisfied when the UPDATE below sets the pointer.
  INSERT INTO public.claims (
    id, workspace_id, tenant_workspace_id, type, statement, status,
    evidence_refs, created_by, version, created_at, updated_at,
    status_changed_at
  ) VALUES (
    p_replacement->>'id',
    p_replacement->>'workspace_id',
    p_tenant_workspace_id,
    p_replacement->>'type',
    p_replacement->>'statement',
    p_replacement->>'status',
    COALESCE(p_replacement->'evidence_refs', '[]'::jsonb),
    p_replacement->>'created_by',
    1,
    (p_replacement->>'created_at')::timestamptz,
    (p_replacement->>'updated_at')::timestamptz,
    (p_replacement->>'status_changed_at')::timestamptz
  );

  -- Compare-and-swap the original onto the now-existing replacement; the
  -- supersede is itself a status transition, so move status_changed_at too.
  UPDATE public.claims
     SET status = 'superseded',
         superseded_by = p_replacement->>'id',
         version = p_expected_version + 1,
         updated_at = p_superseded_at,
         status_changed_at = p_superseded_at
   WHERE id = p_original_id
     AND tenant_workspace_id = p_tenant_workspace_id
     AND version = p_expected_version
  RETURNING version INTO v_new_version;

  IF v_new_version IS NULL THEN
    -- Lost the version race (or the original is gone): abort the whole
    -- transaction so the replacement insert is rolled back too.
    RAISE EXCEPTION
      'concurrent update detected for claim % (expected version %); reload and retry',
      p_original_id, p_expected_version;
  END IF;

  RETURN v_new_version;
END;
$$;
