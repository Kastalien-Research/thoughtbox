/**
 * Merge tool wiring tests (SPEC-MERGE-CORE c9): the shared-session
 * identity convention from tb.hub/tb.claims applies to tb.merge — one
 * register/quick_join grants the session identity, explicit agentId is
 * accepted only for agents registered in the same session.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHubToolHandler, type HubToolHandler } from '../../hub/hub-tool-handler.js';
import { SessionIdentityRegistry } from '../../hub/session-identity.js';
import {
  createInMemoryHubStorage,
  createInMemoryThoughtStore,
} from '../../hub/__tests__/test-helpers.js';
import { createStubMergeEvidenceGenerator } from '../evidence-generator.js';
import { InMemoryMergeCommitStorage } from '../in-memory-merge-storage.js';
import { createMergeToolHandler, type MergeToolHandler } from '../merge-tool-handler.js';

const SESSION = 'session-aaa';

function parseText(result: { content: Array<{ type: string; text?: string }> }): any {
  const block = result.content.find(b => b.type === 'text');
  return JSON.parse(block!.text!);
}

describe('Merge tool wiring — shared session identity', () => {
  let hubHandler: HubToolHandler;
  let mergeHandler: MergeToolHandler;

  beforeEach(() => {
    const identityRegistry = new SessionIdentityRegistry();
    hubHandler = createHubToolHandler({
      hubStorage: createInMemoryHubStorage(),
      thoughtStore: createInMemoryThoughtStore(),
      identityRegistry,
    });
    mergeHandler = createMergeToolHandler({
      mergeStorage: new InMemoryMergeCommitStorage(),
      evidenceGenerator: createStubMergeEvidenceGenerator(),
      identityRegistry,
    });
  });

  async function registerAgent(name: string, session = SESSION): Promise<string> {
    const result = await hubHandler.handle({ operation: 'register', name }, session);
    return parseText(result).agentId;
  }

  it('a hub registration becomes the implicit tb.merge identity', async () => {
    const agentId = await registerAgent('alice');
    const result = await mergeHandler.handle(
      { operation: 'request', workspaceId: 'ws-1', branchIds: ['branch-a'] },
      SESSION,
    );
    expect(result.isError).toBeFalsy();
    const record = parseText(result);
    expect(record.requestedBy).toBe(agentId);
    expect(record.status).toBe('pending_approval');
  });

  it('request before any registration fails with guidance', async () => {
    const result = await mergeHandler.handle(
      { operation: 'request', workspaceId: 'ws-1', branchIds: ['branch-a'] },
      SESSION,
    );
    expect(result.isError).toBe(true);
    expect(parseText(result).error).toContain('tb.hub.register');
  });

  it('explicit agentId works for agents registered in the same session', async () => {
    await registerAgent('first');
    const second = await registerAgent('second');
    const result = await mergeHandler.handle(
      { operation: 'request', agentId: second, workspaceId: 'ws-1', branchIds: ['b'] },
      SESSION,
    );
    expect(result.isError).toBeFalsy();
    expect(parseText(result).requestedBy).toBe(second);
  });

  it('rejects agentIds not registered in this session', async () => {
    await registerAgent('alice');
    const result = await mergeHandler.handle(
      { operation: 'request', agentId: 'spoofed', workspaceId: 'ws-1', branchIds: ['b'] },
      SESSION,
    );
    expect(result.isError).toBe(true);
    expect(parseText(result).error).toContain('not registered in this session');
  });

  it('embeds the operation definition as a resource block', async () => {
    await registerAgent('alice');
    const result = await mergeHandler.handle(
      { operation: 'request', workspaceId: 'ws-1', branchIds: ['branch-a'] },
      SESSION,
    );
    const resource = result.content.find(b => b.type === 'resource') as {
      resource: { uri: string };
    };
    expect(resource.resource.uri).toBe('thoughtbox://merge/operations/request');
  });

  it('reads work without any registration', async () => {
    const result = await mergeHandler.handle(
      { operation: 'list', workspaceId: 'ws-1' },
      'session-without-identity',
    );
    expect(result.isError).toBeFalsy();
    expect(parseText(result).count).toBe(0);
  });
});
