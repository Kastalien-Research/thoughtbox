import { createHmac, randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';

import { BranchHandlers } from '../branch/handlers.js';
import {
  createServiceClient,
  ensureTestWorkspace,
  isSupabaseAvailable,
  SUPABASE_TEST_SERVICE_ROLE_KEY,
  SUPABASE_TEST_URL,
  TEST_WORKSPACE_ID,
} from './supabase-test-helpers.js';

type BranchTokenPayload = {
  session_id: string;
  branch_id: string;
  workspace_id: string;
  branch_from_thought: number;
  expires_at: string;
};

function signBranchToken(payload: BranchTokenPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', SUPABASE_TEST_SERVICE_ROLE_KEY)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

async function createSession(title: string): Promise<string> {
  const client = createServiceClient();
  const { data, error } = await client
    .from('sessions')
    .insert({
      workspace_id: TEST_WORKSPACE_ID,
      title,
      status: 'active',
      thought_count: 0,
      branch_count: 0,
    })
    .select('id')
    .single();

  expect(error).toBeNull();
  return data!.id;
}

async function insertMainThought(sessionId: string): Promise<void> {
  const client = createServiceClient();
  const { error } = await client.from('thoughts').insert({
    session_id: sessionId,
    workspace_id: TEST_WORKSPACE_ID,
    thought_number: 1,
    thought: 'Initial main-track thought',
    total_thoughts: 1,
    next_thought_needed: true,
    thought_type: 'reasoning',
  });

  expect(error).toBeNull();
}

describe('Branch workers', () => {
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
    if (available) {
      await ensureTestWorkspace();
    }
  });

  it('handleMerge records synthesis thoughts with the session workspace_id', async () => {
    if (!available) return expect(true).toBe(true);

    const client = createServiceClient();
    const sessionId = await createSession(`merge-${randomUUID()}`);
    await insertMainThought(sessionId);

    const { error: branchInsertError } = await client.from('branches').insert([
      {
        session_id: sessionId,
        workspace_id: TEST_WORKSPACE_ID,
        branch_id: 'branch-a',
        description: 'Explore option A',
        branch_from_thought: 1,
        status: 'completed',
      },
      {
        session_id: sessionId,
        workspace_id: TEST_WORKSPACE_ID,
        branch_id: 'branch-b',
        description: 'Explore option B',
        branch_from_thought: 1,
        status: 'completed',
      },
    ]);
    expect(branchInsertError).toBeNull();

    const handlers = new BranchHandlers({
      supabaseUrl: SUPABASE_TEST_URL,
      serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
      workspaceId: TEST_WORKSPACE_ID,
    });

    const result = await handlers.handleMerge({
      sessionId,
      synthesis: 'Branch A is the best resolution.',
      selectedBranchId: 'branch-a',
      resolution: 'selected',
    });

    expect(result.mergeThoughtNumber).toBe(2);
    expect(result.updatedBranches).toEqual([
      { branchId: 'branch-a', status: 'merged' },
      { branchId: 'branch-b', status: 'rejected' },
    ]);

    const { data: mergeThought, error: mergeThoughtError } = await client
      .from('thoughts')
      .select('workspace_id, thought, branch_id')
      .eq('session_id', sessionId)
      .eq('thought_number', 2)
      .is('branch_id', null)
      .single();

    expect(mergeThoughtError).toBeNull();
    expect(mergeThought).toMatchObject({
      workspace_id: TEST_WORKSPACE_ID,
      thought: 'Branch A is the best resolution.',
      branch_id: null,
    });
  });

  it('handleList returns branch counts and spawnedAt metadata', async () => {
    if (!available) return expect(true).toBe(true);

    const client = createServiceClient();
    const sessionId = await createSession(`list-${randomUUID()}`);
    await insertMainThought(sessionId);

    const { error: branchInsertError } = await client.from('branches').insert([
      {
        session_id: sessionId,
        workspace_id: TEST_WORKSPACE_ID,
        branch_id: 'branch-a',
        description: 'Explore option A',
        branch_from_thought: 1,
        status: 'active',
      },
      {
        session_id: sessionId,
        workspace_id: TEST_WORKSPACE_ID,
        branch_id: 'branch-b',
        description: 'Explore option B',
        branch_from_thought: 1,
        status: 'completed',
      },
    ]);
    expect(branchInsertError).toBeNull();

    const { error: thoughtInsertError } = await client.from('thoughts').insert([
      {
        session_id: sessionId,
        workspace_id: TEST_WORKSPACE_ID,
        branch_id: 'branch-a',
        branch_from_thought: 1,
        thought_number: 1,
        thought: 'Branch A thought 1',
        total_thoughts: 2,
        next_thought_needed: true,
        thought_type: 'reasoning',
      },
      {
        session_id: sessionId,
        workspace_id: TEST_WORKSPACE_ID,
        branch_id: 'branch-a',
        branch_from_thought: 1,
        thought_number: 2,
        thought: 'Branch A thought 2',
        total_thoughts: 2,
        next_thought_needed: false,
        thought_type: 'reasoning',
      },
      {
        session_id: sessionId,
        workspace_id: TEST_WORKSPACE_ID,
        branch_id: 'branch-b',
        branch_from_thought: 1,
        thought_number: 1,
        thought: 'Branch B thought 1',
        total_thoughts: 1,
        next_thought_needed: false,
        thought_type: 'reasoning',
      },
    ]);
    expect(thoughtInsertError).toBeNull();

    const handlers = new BranchHandlers({
      supabaseUrl: SUPABASE_TEST_URL,
      serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
      workspaceId: TEST_WORKSPACE_ID,
    });

    const result = await handlers.handleList({ sessionId });
    const counts = Object.fromEntries(
      result.branches.map((branch) => [branch.branchId, branch.thoughtCount]),
    );

    expect(result.branches).toHaveLength(2);
    expect(counts).toEqual({
      'branch-a': 2,
      'branch-b': 1,
    });
    expect(result.branches.every((branch) => typeof branch.spawnedAt === 'string')).toBe(true);
  });

  it('tb-branch rejects requests without a signed token', async () => {
    if (!available) return expect(true).toBe(true);

    const response = await fetch(`${SUPABASE_TEST_URL}/functions/v1/tb-branch/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'missing-token',
        method: 'tools/list',
      }),
    });

    expect(response.status).toBe(401);
  });

  it('tb-branch accepts a valid signed token for concurrent branch thoughts', async () => {
    if (!available) return expect(true).toBe(true);

    const client = createServiceClient();
    const sessionId = await createSession(`worker-${randomUUID()}`);
    await insertMainThought(sessionId);

    const { error: branchInsertError } = await client.from('branches').insert({
      session_id: sessionId,
      workspace_id: TEST_WORKSPACE_ID,
      branch_id: 'parallel-worker',
      description: 'Concurrent branch worker test',
      branch_from_thought: 1,
      status: 'active',
    });
    expect(branchInsertError).toBeNull();

    const token = signBranchToken({
      session_id: sessionId,
      branch_id: 'parallel-worker',
      workspace_id: TEST_WORKSPACE_ID,
      branch_from_thought: 1,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });

    const endpoint =
      `${SUPABASE_TEST_URL}/functions/v1/tb-branch/mcp` +
      `?token=${encodeURIComponent(token)}`;

    const responses = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: `parallel-${index}`,
            method: 'tools/call',
            params: {
              name: 'branch_thought',
              arguments: {
                thought: `Parallel branch thought ${index + 1}`,
                thoughtType: 'reasoning',
                nextThoughtNeeded: index < 4,
              },
            },
          }),
        }),
      ),
    );

    const bodies = await Promise.all(responses.map((response) => response.json()));
    const errors = bodies.filter((body) => body.error);

    expect(responses.every((response) => response.ok)).toBe(true);
    expect(errors).toEqual([]);

    const { data: thoughts, error: thoughtQueryError } = await client
      .from('thoughts')
      .select('thought_number')
      .eq('session_id', sessionId)
      .eq('branch_id', 'parallel-worker')
      .order('thought_number', { ascending: true });

    expect(thoughtQueryError).toBeNull();
    expect(thoughts?.map((thought) => thought.thought_number)).toEqual([1, 2, 3, 4, 5]);
  });
});
