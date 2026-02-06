import { describe, it, expect, beforeEach } from 'vitest';
import { createHubHandler } from '../hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';

describe('Hub Handler — Not-Found Errors', () => {
  let handler: ReturnType<typeof createHubHandler>;
  let aliceId: string;
  let workspaceId: string;

  beforeEach(async () => {
    const storage = createInMemoryHubStorage();
    const thoughtStore = createInMemoryThoughtStore();
    handler = createHubHandler(storage, thoughtStore);

    const reg = await handler.handle(null, 'register', { name: 'alice' }) as any;
    aliceId = reg.agentId;
    const ws = await handler.handle(aliceId, 'create_workspace', { name: 'ws', description: '...' }) as any;
    workspaceId = ws.workspaceId;
  });

  // T-ERR-1: Join nonexistent workspace
  it('join nonexistent workspace throws error', async () => {
    await expect(
      handler.handle(aliceId, 'join_workspace', { workspaceId: 'nonexistent' }),
    ).rejects.toThrow('Workspace not found: nonexistent');
  });

  // T-ERR-2: Claim nonexistent problem
  it('claim nonexistent problem throws error', async () => {
    await expect(
      handler.handle(aliceId, 'claim_problem', { workspaceId, problemId: 'nonexistent', branchId: 'x' }),
    ).rejects.toThrow('Problem not found: nonexistent');
  });

  // T-ERR-3: Review nonexistent proposal
  it('review nonexistent proposal throws error', async () => {
    await expect(
      handler.handle(aliceId, 'review_proposal', { workspaceId, proposalId: 'nonexistent', verdict: 'approve', reasoning: '...' }),
    ).rejects.toThrow('Proposal not found: nonexistent');
  });

  // T-ERR-4: Post message to nonexistent problem's channel
  it('post message to nonexistent channel throws error', async () => {
    await expect(
      handler.handle(aliceId, 'post_message', { workspaceId, problemId: 'nonexistent', content: 'hello' }),
    ).rejects.toThrow('Channel not found for problem: nonexistent');
  });

  // T-ERR-5: Endorse nonexistent consensus marker
  it('endorse nonexistent consensus marker throws error', async () => {
    await expect(
      handler.handle(aliceId, 'endorse_consensus', { workspaceId, consensusId: 'nonexistent' }),
    ).rejects.toThrow('Consensus marker not found: nonexistent');
  });

  // T-ERR-6: Merge nonexistent proposal
  it('merge nonexistent proposal throws error', async () => {
    await expect(
      handler.handle(aliceId, 'merge_proposal', { workspaceId, proposalId: 'nonexistent', mergeMessage: '...' }),
    ).rejects.toThrow('Proposal not found: nonexistent');
  });
});
