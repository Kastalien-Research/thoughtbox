-- ADR-022 Part 2: atomic peer manifest approval/activation.
-- The control plane calls this with service-role authority after compiling a
-- notebook-authored draft manifest as data.

CREATE OR REPLACE FUNCTION public.approve_and_activate_peer_manifest(
  p_workspace_id uuid,
  p_peer_slug text,
  p_manifest_id uuid,
  p_approved_by text,
  p_approved_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  peer_row public.peer_notebooks;
  manifest_row public.peer_manifests;
  effective_approved_at timestamptz;
BEGIN
  IF NULLIF(btrim(p_approved_by), '') IS NULL THEN
    RAISE EXCEPTION 'approved_by is required'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO peer_row
  FROM public.peer_notebooks
  WHERE workspace_id = p_workspace_id
    AND slug = p_peer_slug
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Peer % does not exist in workspace %', p_peer_slug, p_workspace_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO manifest_row
  FROM public.peer_manifests
  WHERE workspace_id = p_workspace_id
    AND id = p_manifest_id
    AND peer_id = peer_row.id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Manifest % does not belong to peer % in workspace %', p_manifest_id, p_peer_slug, p_workspace_id
      USING ERRCODE = 'P0002';
  END IF;

  IF manifest_row.status NOT IN ('draft', 'approved', 'active') THEN
    RAISE EXCEPTION 'Manifest % cannot be activated from status %', p_manifest_id, manifest_row.status
      USING ERRCODE = '22023';
  END IF;

  effective_approved_at := COALESCE(p_approved_at, now());

  UPDATE public.peer_manifests
  SET status = 'retired'
  WHERE workspace_id = p_workspace_id
    AND peer_id = peer_row.id
    AND status = 'active'
    AND id <> p_manifest_id;

  UPDATE public.peer_manifests
  SET status = 'active',
      approved_by = btrim(p_approved_by),
      approved_at = effective_approved_at
  WHERE id = p_manifest_id;

  UPDATE public.peer_notebooks
  SET status = 'active',
      active_manifest_id = p_manifest_id,
      updated_at = effective_approved_at
  WHERE id = peer_row.id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_and_activate_peer_manifest(uuid, text, uuid, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_and_activate_peer_manifest(uuid, text, uuid, text, timestamptz)
  TO service_role;

COMMENT ON FUNCTION public.approve_and_activate_peer_manifest(uuid, text, uuid, text, timestamptz) IS
  'ADR-022 atomic control-plane transition that retires the previous active peer manifest and activates an approved notebook-derived draft.';
