/**
 * Profiles Integration Tests — SPEC-HUB-002 Module 6
 *
 * End-to-end integration tests that verify all profile modules work together
 * through the hub handler and with existing workspace operations.
 */

import { describe, it, expect } from 'vitest';
import { createHubHandler } from '../hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';

describe('profiles-integration', () => {
  function setup() {
    const storage = createInMemoryHubStorage();
    const thoughtStore = createInMemoryThoughtStore();
    const handler = createHubHandler(storage, thoughtStore);
    return { storage, thoughtStore, handler };
  }

  // T-PI-1: hub handler routes get_profile_prompt at Stage 1
  it('hub handler routes get_profile_prompt at Stage 1', async () => {
    const { handler } = setup();

    // Register first (Stage 0 → Stage 1)
    const reg = await handler.handle(null, 'register', { name: 'Agent1' }) as { agentId: string };

    // get_profile_prompt is Stage 1 — should work after registration
    const result = await handler.handle(reg.agentId, 'get_profile_prompt', { profile: 'COORDINATOR' }) as any;

    expect(result.prompt).toContain('COORDINATOR');
    expect(result.modelNames).toContain('decomposition');
  });

  // T-PI-2: register-with-profile round-trips through whoami via hub handler
  it('register-with-profile round-trips through whoami', async () => {
    const { handler } = setup();

    const reg = await handler.handle(null, 'register', {
      name: 'ProfiledAgent',
      profile: 'DEBUGGER',
    }) as { agentId: string };

    const whoami = await handler.handle(reg.agentId, 'whoami', {}) as any;

    expect(whoami.name).toBe('ProfiledAgent');
    expect(whoami.profile).toBe('DEBUGGER');
    expect(whoami.mentalModels).toContain('five-whys');
    expect(whoami.mentalModels).toContain('rubber-duck');
    expect(whoami.mentalModels).toContain('assumption-surfacing');
  });

  // T-PI-3: Manager pattern end-to-end (register → create workspace → create problem → claim → sub-problem)
  it('manager pattern: register → workspace → problem → claim → sub-problem', async () => {
    const { handler } = setup();

    // Manager registers with profile
    const manager = await handler.handle(null, 'register', {
      name: 'Manager',
      profile: 'COORDINATOR',
    }) as { agentId: string };

    // Create workspace
    const ws = await handler.handle(manager.agentId, 'create_workspace', {
      name: 'Project Alpha',
      description: 'Test workspace',
    }) as { workspaceId: string };

    // Create a problem (decomposition)
    const problem = await handler.handle(manager.agentId, 'create_problem', {
      workspaceId: ws.workspaceId,
      title: 'Implement authentication',
      description: 'Need auth system',
    }) as { problemId: string };

    expect(problem.problemId).toBeDefined();

    // Claim the problem
    await handler.handle(manager.agentId, 'claim_problem', {
      workspaceId: ws.workspaceId,
      problemId: problem.problemId,
    });

    // Create sub-problem (delegation)
    const subProblem = await handler.handle(manager.agentId, 'create_sub_problem', {
      workspaceId: ws.workspaceId,
      parentId: problem.problemId,
      title: 'Implement JWT tokens',
      description: 'Handle token generation',
    }) as { problemId: string };

    expect(subProblem.problemId).toBeDefined();

    // Verify sub-problem exists in problem list
    const result = await handler.handle(manager.agentId, 'list_problems', {
      workspaceId: ws.workspaceId,
    }) as any;

    expect(result.problems).toHaveLength(2);
  });

  // T-PI-4: Profiled agents don't break flat workspace operations
  it('profiled agents work in flat workspace operations', async () => {
    const { handler } = setup();

    // Register with profile
    const agent = await handler.handle(null, 'register', {
      name: 'Architect',
      profile: 'ARCHITECT',
    }) as { agentId: string };

    // Standard workspace flow should still work
    const ws = await handler.handle(agent.agentId, 'create_workspace', {
      name: 'Design Workspace',
      description: 'Architecture review',
    }) as { workspaceId: string };

    // Create a problem
    const problem = await handler.handle(agent.agentId, 'create_problem', {
      workspaceId: ws.workspaceId,
      title: 'Review API design',
      description: 'Need review',
    }) as { problemId: string };

    // Post a message
    const msg = await handler.handle(agent.agentId, 'post_message', {
      workspaceId: ws.workspaceId,
      problemId: problem.problemId,
      content: 'Starting architecture review',
    }) as any;

    expect(msg.messageId).toBeDefined();

    // Read channel
    const channel = await handler.handle(agent.agentId, 'read_channel', {
      workspaceId: ws.workspaceId,
      problemId: problem.problemId,
    }) as any;

    expect(channel.messages).toHaveLength(1);
    expect(channel.messages[0].content).toBe('Starting architecture review');
  });

  // T-PI-5: get_profile_prompt via hub handler returns content
  it('get_profile_prompt via hub handler returns all profile content', async () => {
    const { handler } = setup();
    const reg = await handler.handle(null, 'register', { name: 'Agent' }) as { agentId: string };

    // Test each profile
    for (const profile of ['COORDINATOR', 'ARCHITECT', 'DEBUGGER', 'SECURITY']) {
      const result = await handler.handle(reg.agentId, 'get_profile_prompt', { profile }) as any;
      expect(result.prompt).toContain(profile);
      expect(result.modelNames.length).toBeGreaterThan(0);
    }
  });

  // T-PI-6: Multiple profiled agents with different profiles in same workspace
  it('multiple profiled agents coexist in same workspace', async () => {
    const { handler } = setup();

    // Register agents with different profiles
    const manager = await handler.handle(null, 'register', {
      name: 'ManagerAgent',
      profile: 'COORDINATOR',
    }) as { agentId: string };

    const debugger_ = await handler.handle(null, 'register', {
      name: 'DebuggerAgent',
      profile: 'DEBUGGER',
    }) as { agentId: string };

    const security = await handler.handle(null, 'register', {
      name: 'SecurityAgent',
      profile: 'SECURITY',
    }) as { agentId: string };

    // Manager creates workspace
    const ws = await handler.handle(manager.agentId, 'create_workspace', {
      name: 'Multi-Profile WS',
      description: 'Testing multiple profiles',
    }) as { workspaceId: string };

    // Others join
    await handler.handle(debugger_.agentId, 'join_workspace', { workspaceId: ws.workspaceId });
    await handler.handle(security.agentId, 'join_workspace', { workspaceId: ws.workspaceId });

    // Verify each agent's whoami shows their profile
    const mInfo = await handler.handle(manager.agentId, 'whoami', {}) as any;
    expect(mInfo.profile).toBe('COORDINATOR');

    const dInfo = await handler.handle(debugger_.agentId, 'whoami', {}) as any;
    expect(dInfo.profile).toBe('DEBUGGER');

    const sInfo = await handler.handle(security.agentId, 'whoami', {}) as any;
    expect(sInfo.profile).toBe('SECURITY');

    // All agents can see workspace status
    const status = await handler.handle(manager.agentId, 'workspace_status', {
      workspaceId: ws.workspaceId,
    }) as any;

    expect(status.agents).toHaveLength(3);
  });
});
