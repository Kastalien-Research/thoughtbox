-- Atomic supersede for the claim graph (SPEC-AGX-SUBSTRATE B2, claim c1).
--
-- supersede replaces an existing claim with a new "asserted" claim and flips
-- the original to 'superseded' pointing at the replacement. The two writes
-- must be one transaction: claims.superseded_by is an immediate FK to
-- claims(id) (20260612000000), so the original cannot point at a replacement
-- that has not been inserted yet, and a half-applied supersede must never
-- leave an orphaned replacement or a dangling pointer.
--
-- The application orchestrated this as two separate writes, which both
-- ordering choices break: insert-first orphans the replacement on a lost CAS
-- race; update-first violates the FK on every call. This function does both
-- writes plus the optimistic CAS in a single transaction instead.
--
-- Returns the original claim's new version on success. On a lost version race
-- it raises (rolling back the replacement insert) with a 'concurrent update'
-- message the storage layer surfaces to callers for reload-and-retry.

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
    evidence_refs, created_by, version, created_at, updated_at
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
    (p_replacement->>'updated_at')::timestamptz
  );

  -- Compare-and-swap the original onto the now-existing replacement.
  UPDATE public.claims
     SET status = 'superseded',
         superseded_by = p_replacement->>'id',
         version = p_expected_version + 1,
         updated_at = p_superseded_at
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
