-- Harden tenant isolation by removing over-broad RLS policies that grant the
-- public/anon roles unrestricted, cross-workspace access.
--
-- Context: production is live multi-tenant (16 workspaces). The MCP server
-- reaches these tables only via the service_role key, which bypasses RLS, and
-- no authenticated/anon client reads the protocol_* tables or relies on anon
-- reads of api_keys (key validation uses the service_role admin client in
-- src/auth/api-key.ts). The policies dropped below were therefore both unused
-- by the server and exploitable by anyone holding the public anon key.

-- 1. api_keys: drop the anon SELECT-everything policy. It exposed every
--    workspace's key metadata (workspace_id, name, prefix, key_hash,
--    created_by_user_id) to the public anon role.
DROP POLICY IF EXISTS api_keys_anon_validate ON public.api_keys;

-- 2. protocol_sessions: the existing policy named "service_role_all" was
--    mis-granted to the public role with USING (true)/WITH CHECK (true),
--    giving anon and authenticated full cross-tenant read/write. Replace it
--    with a real service_role policy plus a workspace-scoped read for
--    authenticated users (matching the hub_events / otel_events pattern).
DROP POLICY IF EXISTS service_role_all ON public.protocol_sessions;

CREATE POLICY service_role_all ON public.protocol_sessions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS tenant_member_read ON public.protocol_sessions;
-- NOTE: protocol_sessions.workspace_id is text (unlike the uuid column used
-- everywhere else), so cast the membership uuid to text for comparison.
-- Normalizing this column to uuid is tracked as a follow-up.
CREATE POLICY tenant_member_read ON public.protocol_sessions
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT wm.workspace_id::text FROM public.workspace_memberships wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- 3. protocol_audits / protocol_history / protocol_scope / protocol_visas:
--    same mis-granted public "service_role_all" policy. These tables have no
--    workspace_id column and are server-internal protocol-enforcement state,
--    so restrict them to the service_role only. (A workspace_id column for
--    defense-in-depth is added in a follow-up migration.)
DROP POLICY IF EXISTS service_role_all ON public.protocol_audits;
CREATE POLICY service_role_all ON public.protocol_audits
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all ON public.protocol_history;
CREATE POLICY service_role_all ON public.protocol_history
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all ON public.protocol_scope;
CREATE POLICY service_role_all ON public.protocol_scope
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all ON public.protocol_visas;
CREATE POLICY service_role_all ON public.protocol_visas
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
