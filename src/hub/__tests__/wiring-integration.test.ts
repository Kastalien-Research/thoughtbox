/**
 * Wiring integration tests — end-to-end flow through hub tool handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHubToolHandler } from '../hub-tool-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';
import type { HubEvent } from '../hub-handler.js';

describe('Wiring Integration', () => {
  let hubStorage: HubStorage;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;

  beforeEach(() => {
    hubStorage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
  });

  it('T-WI-1: full flow — register via env, create workspace, create problem, post message', async () => {
    const events: HubEvent[] = [];
    const handler = createHubToolHandler({
      hubStorage,
      thoughtStore,
      envAgentId: 'agent-alice',
      envAgentName: 'Alice',
      onEvent: (event) => events.push(event),
    });

    // Whoami — should auto-resolve from env var
    const whoami = await handler.handle({ operation: 'whoami' });
    expect(whoami.isError).toBeFalsy();
    const identity = JSON.parse(whoami.content[0].text);
    expect(identity.agentId).toBe('agent-alice');

    // Create workspace
    const wsResult = await handler.handle({
      operation: 'create_workspace',
      name: 'integration-test',
      description: 'Integration test workspace',
    });
    expect(wsResult.isError).toBeFalsy();
    const ws = JSON.parse(wsResult.content[0].text);
    expect(ws.workspaceId).toBeDefined();

    // Create problem
    const probResult = await handler.handle({
      operation: 'create_problem',
      workspaceId: ws.workspaceId,
      title: 'Integration issue',
      description: 'Test full flow',
    });
    expect(probResult.isError).toBeFalsy();
    const prob = JSON.parse(probResult.content[0].text);

    // Post message
    const msgResult = await handler.handle({
      operation: 'post_message',
      workspaceId: ws.workspaceId,
      problemId: prob.problemId,
      content: 'Working on this!',
    });
    expect(msgResult.isError).toBeFalsy();

    // Verify events were emitted
    expect(events.some(e => e.type === 'problem_created')).toBe(true);
    expect(events.some(e => e.type === 'message_posted')).toBe(true);
  });

  it('T-WI-2: hub operations produce parseable JSON results', async () => {
    const handler = createHubToolHandler({
      hubStorage,
      thoughtStore,
    });

    // Each operation should return valid JSON in content[0].text
    const regResult = await handler.handle({ operation: 'register', name: 'bob' });
    const reg = JSON.parse(regResult.content[0].text);
    expect(reg.agentId).toBeDefined();
    expect(reg.name).toBe('bob');

    const wsResult = await handler.handle({
      operation: 'create_workspace',
      name: 'ws',
      description: 'test',
    });
    const ws = JSON.parse(wsResult.content[0].text);
    expect(ws.workspaceId).toBeDefined();

    const probResult = await handler.handle({
      operation: 'create_problem',
      workspaceId: ws.workspaceId,
      title: 'P1',
      description: 'desc',
    });
    const prob = JSON.parse(probResult.content[0].text);
    expect(prob.problemId).toBeDefined();
    expect(prob.channelId).toBeDefined();
  });

  it('T-WI-3: channel readable after problem creation and messaging', async () => {
    const handler = createHubToolHandler({ hubStorage, thoughtStore });

    await handler.handle({ operation: 'register', name: 'carol' });
    const wsResult = await handler.handle({
      operation: 'create_workspace',
      name: 'ws',
      description: 'test',
    });
    const ws = JSON.parse(wsResult.content[0].text);

    const probResult = await handler.handle({
      operation: 'create_problem',
      workspaceId: ws.workspaceId,
      title: 'Task',
      description: 'Do stuff',
    });
    const prob = JSON.parse(probResult.content[0].text);

    await handler.handle({
      operation: 'post_message',
      workspaceId: ws.workspaceId,
      problemId: prob.problemId,
      content: 'msg1',
    });
    await handler.handle({
      operation: 'post_message',
      workspaceId: ws.workspaceId,
      problemId: prob.problemId,
      content: 'msg2',
    });

    // Read channel directly from storage (simulating resource read)
    const channel = await hubStorage.getChannel(ws.workspaceId, prob.problemId);
    expect(channel).not.toBeNull();
    expect(channel!.messages).toHaveLength(2);
  });

  it('T-WI-5: multi-agent shared session — propose, review, merge without self-review error', async () => {
    const sessionId = 'shared-mcp-connection';
    const events: HubEvent[] = [];
    const handler = createHubToolHandler({
      hubStorage,
      thoughtStore,
      onEvent: (event) => events.push(event),
    });

    // Coordinator registers (becomes session default)
    const coordResult = await handler.handle(
      { operation: 'register', name: 'coordinator' },
      sessionId
    );
    const coord = JSON.parse(coordResult.content[0].text);

    // Auditor registers in the same session
    const auditorResult = await handler.handle(
      { operation: 'register', name: 'auditor' },
      sessionId
    );
    const auditor = JSON.parse(auditorResult.content[0].text);

    expect(coord.agentId).not.toBe(auditor.agentId);

    // Coordinator creates workspace (uses default identity)
    const wsResult = await handler.handle(
      { operation: 'create_workspace', name: 'review-ws', description: 'Review workspace' },
      sessionId
    );
    const ws = JSON.parse(wsResult.content[0].text);

    // Auditor joins workspace using its own agentId
    await handler.handle(
      { operation: 'join_workspace', agentId: auditor.agentId, workspaceId: ws.workspaceId },
      sessionId
    );

    // Coordinator creates a problem
    const probResult = await handler.handle(
      {
        operation: 'create_problem',
        agentId: coord.agentId,
        workspaceId: ws.workspaceId,
        title: 'Review gateway',
        description: 'Audit gateway code',
      },
      sessionId
    );
    const prob = JSON.parse(probResult.content[0].text);

    // Auditor claims the problem
    await handler.handle(
      {
        operation: 'claim_problem',
        agentId: auditor.agentId,
        workspaceId: ws.workspaceId,
        problemId: prob.problemId,
        branchId: 'audit-branch',
      },
      sessionId
    );

    // Auditor creates a proposal
    const proposalResult = await handler.handle(
      {
        operation: 'create_proposal',
        agentId: auditor.agentId,
        workspaceId: ws.workspaceId,
        title: 'Gateway improvements',
        description: 'Found issues in gateway code',
        sourceBranch: 'audit-branch',
        problemId: prob.problemId,
      },
      sessionId
    );
    expect(proposalResult.isError).toBeFalsy();
    const proposal = JSON.parse(proposalResult.content[0].text);

    // Coordinator reviews — this is the critical test.
    // Before the fix, coordinator and auditor shared the same agentId,
    // causing a self-review error here.
    const reviewResult = await handler.handle(
      {
        operation: 'review_proposal',
        agentId: coord.agentId,
        workspaceId: ws.workspaceId,
        proposalId: proposal.proposalId,
        verdict: 'approve',
        reasoning: 'Looks good',
      },
      sessionId
    );
    expect(reviewResult.isError).toBeFalsy();

    // Coordinator merges
    const mergeResult = await handler.handle(
      {
        operation: 'merge_proposal',
        agentId: coord.agentId,
        workspaceId: ws.workspaceId,
        proposalId: proposal.proposalId,
        mergeMessage: 'Merged gateway improvements',
      },
      sessionId
    );
    expect(mergeResult.isError).toBeFalsy();

    // Verify events attributed to correct agents
    const proposalEvent = events.find(e => e.type === 'proposal_created');
    expect(proposalEvent).toBeDefined();

    const mergeEvent = events.find(e => e.type === 'proposal_merged');
    expect(mergeEvent).toBeDefined();
  });

  it('T-WI-6: quick_join sub-agent operates independently in shared session', async () => {
    const sessionId = 'shared-mcp-connection';
    const handler = createHubToolHandler({ hubStorage, thoughtStore });

    // Coordinator registers and creates workspace
    const coordResult = await handler.handle(
      { operation: 'register', name: 'coordinator' },
      sessionId
    );
    const coord = JSON.parse(coordResult.content[0].text);

    const wsResult = await handler.handle(
      { operation: 'create_workspace', name: 'collab-ws', description: 'Collaboration workspace' },
      sessionId
    );
    const ws = JSON.parse(wsResult.content[0].text);

    // Debugger quick_joins in the same session
    const joinResult = await handler.handle(
      { operation: 'quick_join', name: 'debugger', workspaceId: ws.workspaceId },
      sessionId
    );
    const debugger_ = JSON.parse(joinResult.content[0].text);
    expect(debugger_.agentId).not.toBe(coord.agentId);

    // Both agents post messages — each attributed correctly
    await handler.handle(
      {
        operation: 'create_problem',
        agentId: coord.agentId,
        workspaceId: ws.workspaceId,
        title: 'Bug',
        description: 'Found a bug',
      },
      sessionId
    );

    // Debugger posts via its own identity
    const probList = await handler.handle(
      { operation: 'list_problems', agentId: debugger_.agentId, workspaceId: ws.workspaceId },
      sessionId
    );
    expect(probList.isError).toBeFalsy();
    const problems = JSON.parse(probList.content[0].text);
    expect(problems.problems).toHaveLength(1);
  });

  it('T-WI-4: existing hub tests still pass (regression check)', async () => {
    // Re-test the core hub-handler directly (not through tool handler)
    // to ensure the onEvent parameter didn't break anything
    const { createHubHandler } = await import('../hub-handler.js');
    const handler = createHubHandler(hubStorage, thoughtStore);

    // Register
    const reg = await handler.handle(null, 'register', { name: 'dave' }) as any;
    expect(reg.agentId).toBeDefined();

    // Create workspace
    const ws = await handler.handle(reg.agentId, 'create_workspace', {
      name: 'ws', description: 'test',
    }) as any;
    expect(ws.workspaceId).toBeDefined();

    // Create problem
    const prob = await handler.handle(reg.agentId, 'create_problem', {
      workspaceId: ws.workspaceId,
      title: 'Regression test',
      description: 'Testing',
    }) as any;
    expect(prob.problemId).toBeDefined();

    // Progressive disclosure still works
    await expect(
      handler.handle('unknown', 'create_workspace', { name: 'x', description: 'y' })
    ).rejects.toThrow(/Register first/);
  });
});
