import { describe, expect, it } from 'vitest';

import { BranchHandlers } from '../handlers.js';

const WORKSPACE_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_WORKSPACE_ID = '22222222-2222-2222-2222-222222222222';

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;

function createHandlerWithFakeClient(fakeClient: unknown): BranchHandlers {
  const handler = new BranchHandlers({
    supabaseUrl: 'http://127.0.0.1:54321',
    serviceRoleKey: 'service-role-key',
    signingSecret: 'test-branch-signing-secret',
    workspaceId: WORKSPACE_ID,
  });

  (handler as unknown as { client: unknown }).client = fakeClient;
  return handler;
}

function createWorkspaceAwareFakeClient(
  initialTables: Tables,
  options: { updateError?: string } = {},
) {
  const tables: Tables = Object.fromEntries(
    Object.entries(initialTables).map(([name, rows]) => [
      name,
      rows.map((row) => ({ ...row })),
    ]),
  );

  return {
    tables,
    from(table: string) {
      if (!tables[table]) {
        throw new Error(`Unexpected table: ${table}`);
      }

      const filters: Array<[string, unknown]> = [];
      const nullFilters: Array<[string, unknown]> = [];
      const inFilters: Array<[string, unknown[]]> = [];
      let limitRows: number | null = null;
      let updatePayload: Row | null = null;

      const applyFilters = () => {
        let rows = tables[table].filter((row) => {
          return filters.every(([column, value]) => row[column] === value)
            && nullFilters.every(([column, value]) => row[column] === value)
            && inFilters.every(([column, values]) => values.includes(row[column]));
        });

        if (limitRows !== null) {
          rows = rows.slice(0, limitRows);
        }

        return rows;
      };

      const builder = {
        select() {
          return this;
        },
        update(payload: Row) {
          updatePayload = payload;
          return this;
        },
        insert(payload: Row) {
          tables[table].push({ ...payload });
          return Promise.resolve({ error: null });
        },
        eq(column: string, value: unknown) {
          filters.push([column, value]);
          return this;
        },
        is(column: string, value: unknown) {
          nullFilters.push([column, value]);
          return this;
        },
        in(column: string, values: unknown[]) {
          inFilters.push([column, values]);
          return this;
        },
        order() {
          return this;
        },
        limit(count: number) {
          limitRows = count;
          return this;
        },
        single() {
          const row = applyFilters()[0] ?? null;
          return Promise.resolve({
            data: row,
            error: row ? null : { message: 'not found' },
          });
        },
        then(resolve: (value: { data?: Row[]; error: null | { message: string } }) => unknown) {
          if (updatePayload) {
            if (options.updateError) {
              return Promise.resolve({ error: { message: options.updateError } }).then(resolve);
            }

            for (const row of applyFilters()) {
              Object.assign(row, updatePayload);
            }
            return Promise.resolve({ error: null }).then(resolve);
          }

          return Promise.resolve({ data: applyFilters(), error: null }).then(resolve);
        },
      };

      return builder;
    },
  };
}

describe('BranchHandlers workspace binding', () => {
  it('denies spawn for a session in another workspace', async () => {
    const fakeClient = createWorkspaceAwareFakeClient({
      sessions: [{ id: 'session-1', workspace_id: OTHER_WORKSPACE_ID }],
      thoughts: [
        {
          id: 'thought-1',
          session_id: 'session-1',
          workspace_id: OTHER_WORKSPACE_ID,
          thought_number: 1,
          branch_id: null,
        },
      ],
      branches: [],
    });
    const handler = createHandlerWithFakeClient(fakeClient);

    await expect(
      handler.handleSpawn({
        sessionId: 'session-1',
        branchId: 'branch-a',
        branchFromThought: 1,
      }),
    ).rejects.toThrow('Session session-1 not found');

    expect(fakeClient.tables.branches).toHaveLength(0);
  });

  it('mints branch worker tokens only for the API-key workspace', async () => {
    const fakeClient = createWorkspaceAwareFakeClient({
      sessions: [{ id: 'session-1', workspace_id: WORKSPACE_ID }],
      thoughts: [
        {
          id: 'thought-1',
          session_id: 'session-1',
          workspace_id: WORKSPACE_ID,
          thought_number: 1,
          branch_id: null,
        },
      ],
      branches: [],
    });
    const handler = createHandlerWithFakeClient(fakeClient);

    const result = await handler.handleSpawn({
      sessionId: 'session-1',
      branchId: 'branch-a',
      branchFromThought: 1,
    });
    const token = new URL(result.workerUrl).searchParams.get('token');
    const [encodedPayload] = token?.split('.') ?? [];
    const tokenPayload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as { workspace_id: string };

    expect(fakeClient.tables.branches[0]).toMatchObject({
      session_id: 'session-1',
      workspace_id: WORKSPACE_ID,
      branch_id: 'branch-a',
    });
    expect(tokenPayload.workspace_id).toBe(WORKSPACE_ID);
  });

  it('denies merge for a session in another workspace', async () => {
    const fakeClient = createWorkspaceAwareFakeClient({
      sessions: [{ id: 'session-1', workspace_id: OTHER_WORKSPACE_ID }],
      thoughts: [],
      branches: [
        {
          session_id: 'session-1',
          workspace_id: OTHER_WORKSPACE_ID,
          branch_id: 'branch-a',
          status: 'completed',
        },
      ],
    });
    const handler = createHandlerWithFakeClient(fakeClient);

    await expect(
      handler.handleMerge({
        sessionId: 'session-1',
        synthesis: 'Synthesis thought',
        selectedBranchId: 'branch-a',
        resolution: 'selected',
      }),
    ).rejects.toThrow('Session session-1 not found');
  });

  it('returns no branches when list targets another workspace session', async () => {
    const fakeClient = createWorkspaceAwareFakeClient({
      sessions: [{ id: 'session-1', workspace_id: OTHER_WORKSPACE_ID }],
      thoughts: [
        {
          session_id: 'session-1',
          workspace_id: OTHER_WORKSPACE_ID,
          branch_id: 'branch-a',
        },
      ],
      branches: [
        {
          session_id: 'session-1',
          workspace_id: OTHER_WORKSPACE_ID,
          branch_id: 'branch-a',
          description: null,
          status: 'active',
          branch_from_thought: 1,
          spawned_at: '2026-04-25T00:00:00.000Z',
          completed_at: null,
        },
      ],
    });
    const handler = createHandlerWithFakeClient(fakeClient);

    await expect(handler.handleList({ sessionId: 'session-1' })).resolves.toEqual({
      branches: [],
    });
  });

  it('denies get for a branch in another workspace', async () => {
    const fakeClient = createWorkspaceAwareFakeClient({
      sessions: [{ id: 'session-1', workspace_id: OTHER_WORKSPACE_ID }],
      thoughts: [
        {
          session_id: 'session-1',
          workspace_id: OTHER_WORKSPACE_ID,
          branch_id: 'branch-a',
          thought_number: 1,
        },
      ],
      branches: [
        {
          session_id: 'session-1',
          workspace_id: OTHER_WORKSPACE_ID,
          branch_id: 'branch-a',
        },
      ],
    });
    const handler = createHandlerWithFakeClient(fakeClient);

    await expect(
      handler.handleGet({ sessionId: 'session-1', branchId: 'branch-a' }),
    ).rejects.toThrow('Branch branch-a not found in session session-1');
  });
});

describe('BranchHandlers.handleMerge', () => {
  it('throws when a branch status update fails', async () => {
    const fakeClient = createWorkspaceAwareFakeClient(
      {
        sessions: [{ id: 'session-1', workspace_id: WORKSPACE_ID }],
        thoughts: [
          {
            session_id: 'session-1',
            workspace_id: WORKSPACE_ID,
            branch_id: null,
            thought_number: 1,
          },
        ],
        branches: [
          {
            session_id: 'session-1',
            workspace_id: WORKSPACE_ID,
            branch_id: 'branch-a',
            status: 'completed',
          },
        ],
      },
      { updateError: 'write failed' },
    );
    const handler = createHandlerWithFakeClient(fakeClient);

    await expect(
      handler.handleMerge({
        sessionId: 'session-1',
        synthesis: 'Synthesis thought',
        selectedBranchId: 'branch-a',
        resolution: 'selected',
      }),
    ).rejects.toThrow('Failed to update branch branch-a: write failed');
  });
});
