-- H4: check_protocol_enforcement needs workspace_id filter.
-- Without it, any workspace's active session can block another workspace.

CREATE OR REPLACE FUNCTION check_protocol_enforcement(target_path text, ws_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
    session record;
    is_test_file boolean;
    is_in_scope boolean;
begin
    select * into session
    from protocol_sessions
    where status = 'active'
    and (ws_id IS NULL OR workspace_id = ws_id)
    order by created_at desc limit 1;

    if session is null then
        return json_build_object('enforce', false);
    end if;

    if session.protocol = 'theseus' then
        is_test_file := target_path ~ '(/tests/|/test/|/__tests__/|\.test\.|\.spec\.)';
        if is_test_file then
            return json_build_object(
                'enforce', true,
                'blocked', true,
                'reason', 'TEST LOCK: Cannot modify test files during refactoring',
                'session_id', session.id
            );
        end if;

        select exists(
            select 1 from protocol_scope
            where session_id = session.id
            and target_path like file_path || '%'
        ) into is_in_scope;

        if not is_in_scope then
            return json_build_object(
                'enforce', true,
                'blocked', true,
                'reason', 'VISA REQUIRED: File outside declared scope',
                'session_id', session.id
            );
        end if;
    end if;

    return json_build_object(
        'enforce', true,
        'blocked', false,
        'session_id', session.id,
        'protocol', session.protocol
    );
end;
$$;

-- H5: Add workspace-scoped RLS policies for knowledge graph tables.
-- service_role_bypass already exists. These add authenticated user access
-- scoped to their workspace memberships.

-- Note: knowledge graph tables don't have workspace_id columns yet.
-- For now, authenticated users go through service_role via the API.
-- When workspace_id is added to these tables, uncomment and update:
--
-- CREATE POLICY workspace_member_access ON entities
--   FOR ALL USING (is_workspace_member(workspace_id))
--   WITH CHECK (is_workspace_member(workspace_id));
--
-- CREATE POLICY workspace_member_access ON relations
--   FOR ALL USING (is_workspace_member(workspace_id))
--   WITH CHECK (is_workspace_member(workspace_id));
--
-- CREATE POLICY workspace_member_access ON observations
--   FOR ALL USING (is_workspace_member(workspace_id))
--   WITH CHECK (is_workspace_member(workspace_id));
