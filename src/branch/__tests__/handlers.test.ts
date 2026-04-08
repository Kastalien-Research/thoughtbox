import { describe, expect, it } from 'vitest';

import { BranchHandlers } from '../handlers.js';

function createHandlerWithFakeClient(fakeClient: unknown): BranchHandlers {
  const handler = new BranchHandlers({
    supabaseUrl: 'http://127.0.0.1:54321',
    serviceRoleKey: 'service-role-key',
    workspaceId: '11111111-1111-1111-1111-111111111111',
  });

  (handler as unknown as { client: unknown }).client = fakeClient;
  return handler;
}

describe('BranchHandlers.handleMerge', () => {
  it('throws when a branch status update fails', async () => {
    const fakeClient = {
      from(table: string) {
        if (table === 'branches') {
          return {
            select() {
              return {
                eq: async () => ({
                  data: [{ branch_id: 'branch-a', status: 'completed' }],
                  error: null,
                }),
              };
            },
            update() {
              let eqCalls = 0;
              return {
                eq() {
                  eqCalls += 1;
                  if (eqCalls < 2) return this;
                  return Promise.resolve({
                    error: { message: 'write failed' },
                  });
                },
              };
            },
          };
        }

        if (table === 'thoughts') {
          return {
            select() {
              return {
                eq() {
                  return this;
                },
                is() {
                  return this;
                },
                order() {
                  return this;
                },
                limit() {
                  return this;
                },
                single: async () => ({
                  data: { thought_number: 1 },
                }),
              };
            },
            insert: async () => ({ error: null }),
          };
        }

        if (table === 'sessions') {
          return {
            select() {
              return {
                eq() {
                  return this;
                },
                single: async () => ({
                  data: { id: 'session-1', workspace_id: '11111111-1111-1111-1111-111111111111' },
                  error: null,
                }),
              };
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    };

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
