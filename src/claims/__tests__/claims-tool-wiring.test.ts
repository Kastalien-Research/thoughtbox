/**
 * Claims tool wiring tests (SPEC-AGX-SUBSTRATE B2): the explicit-agentId
 * convention shared with tb.hub — one register/quick_join grants the
 * session identity to tb.claims, explicit agentId is accepted only for
 * agents registered in the same session, and sessions are isolated.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHubToolHandler, type HubToolHandler } from '../../hub/hub-tool-handler.js';
import { SessionIdentityRegistry } from '../../hub/session-identity.js';
import {
  createInMemoryHubStorage,
  createInMemoryThoughtStore,
} from '../../hub/__tests__/test-helpers.js';
import { createClaimsToolHandler, type ClaimsToolHandler } from '../claims-tool-handler.js';
import { InMemoryClaimStorage } from '../in-memory-claim-storage.js';

const SESSION = 'session-aaa';

function parseText(result: { content: Array<{ type: string; text?: string }> }): any {
  const block = result.content.find(b => b.type === 'text');
  return JSON.parse(block!.text!);
}

describe('Claims tool wiring — shared session identity', () => {
  let hubHandler: HubToolHandler;
  let claimsHandler: ClaimsToolHandler;

  beforeEach(() => {
    const identityRegistry = new SessionIdentityRegistry();
    hubHandler = createHubToolHandler({
      hubStorage: createInMemoryHubStorage(),
      thoughtStore: createInMemoryThoughtStore(),
      identityRegistry,
    });
    claimsHandler = createClaimsToolHandler({
      claimStorage: new InMemoryClaimStorage(),
      identityRegistry,
    });
  });

  async function registerAgent(name: string, session = SESSION): Promise<string> {
    const result = await hubHandler.handle({ operation: 'register', name }, session);
    return parseText(result).agentId;
  }

  it('a hub registration becomes the implicit tb.claims identity', async () => {
    const agentId = await registerAgent('alice');

    const result = await claimsHandler.handle(
      {
        operation: 'assert',
        workspaceId: 'ws-1',
        type: 'assumption',
        statement: 'shared identity works',
      },
      SESSION,
    );
    expect(result.isError).toBeFalsy();
    const claim = parseText(result);
    expect(claim.createdBy).toBe(agentId);
  });

  it('mutations before any registration fail with guidance', async () => {
    const result = await claimsHandler.handle(
      {
        operation: 'assert',
        workspaceId: 'ws-1',
        type: 'assumption',
        statement: 'no identity yet',
      },
      SESSION,
    );
    expect(result.isError).toBe(true);
    expect(parseText(result).error).toContain('tb.hub.register');
  });

  it('explicit agentId works for any agent registered in the same session', async () => {
    const first = await registerAgent('first');
    const second = await registerAgent('second');

    const result = await claimsHandler.handle(
      {
        operation: 'assert',
        agentId: second,
        workspaceId: 'ws-1',
        type: 'decision',
        statement: 'attributed to the second agent',
      },
      SESSION,
    );
    expect(result.isError).toBeFalsy();
    expect(parseText(result).createdBy).toBe(second);
    expect(parseText(result).createdBy).not.toBe(first);
  });

  it('rejects agentIds not registered in this session', async () => {
    await registerAgent('alice');
    await registerAgent('bob', 'session-bbb');

    const result = await claimsHandler.handle(
      {
        operation: 'invalidate',
        agentId: 'spoofed-agent',
        claimId: 'claim-x',
      },
      SESSION,
    );
    expect(result.isError).toBe(true);
    expect(parseText(result).error).toContain('not registered in this session');
  });

  it('session identities are isolated', async () => {
    const aliceA = await registerAgent('alice', 'session-aaa');
    const bobB = await registerAgent('bob', 'session-bbb');

    const fromA = await claimsHandler.handle(
      { operation: 'assert', workspaceId: 'ws-1', type: 'assumption', statement: 'from A' },
      'session-aaa',
    );
    const fromB = await claimsHandler.handle(
      { operation: 'assert', workspaceId: 'ws-1', type: 'assumption', statement: 'from B' },
      'session-bbb',
    );
    expect(parseText(fromA).createdBy).toBe(aliceA);
    expect(parseText(fromB).createdBy).toBe(bobB);
  });

  it('reads (query, affected) work without any registration', async () => {
    const result = await claimsHandler.handle(
      { operation: 'query', workspaceId: 'ws-1' },
      SESSION,
    );
    expect(result.isError).toBeFalsy();
    expect(parseText(result)).toEqual({ claims: [], count: 0 });
  });

  it('embeds the per-operation catalog resource block', async () => {
    await registerAgent('alice');
    const result = await claimsHandler.handle(
      {
        operation: 'assert',
        workspaceId: 'ws-1',
        type: 'assumption',
        statement: 'discoverability',
      },
      SESSION,
    );
    const resource = result.content.find(block => block.type === 'resource') as
      | { resource: { uri: string } }
      | undefined;
    expect(resource).toBeDefined();
    expect(resource!.resource.uri).toBe('thoughtbox://claims/operations/assert');
  });

  it('end-to-end: assert, link, invalidate, affected through the tool surface', async () => {
    await registerAgent('alice');

    const base = parseText(
      await claimsHandler.handle(
        { operation: 'assert', workspaceId: 'ws-1', type: 'assumption', statement: 'base' },
        SESSION,
      ),
    );
    const dependent = parseText(
      await claimsHandler.handle(
        { operation: 'assert', workspaceId: 'ws-1', type: 'decision', statement: 'dependent' },
        SESSION,
      ),
    );
    await claimsHandler.handle(
      {
        operation: 'link',
        fromClaimId: dependent.id,
        toClaimId: base.id,
        kind: 'depends_on',
      },
      SESSION,
    );
    await claimsHandler.handle(
      { operation: 'subscribe', claimId: base.id, subscriber: 'runbook:i1/c1' },
      SESSION,
    );

    const invalidated = parseText(
      await claimsHandler.handle({ operation: 'invalidate', claimId: base.id }, SESSION),
    );
    expect(invalidated.status).toBe('invalidated');

    const affected = parseText(
      await claimsHandler.handle({ operation: 'affected', claimId: base.id }, SESSION),
    );
    expect(affected.count).toBe(1);
    expect(affected.affected[0].claim.id).toBe(dependent.id);
    expect(affected.affected[0].depth).toBe(1);
  });
});

describe('Claims tool wiring — search catalog discoverability', () => {
  it('tb.claims operations are indexed in the Code Mode search catalog', async () => {
    const { buildSearchCatalog } = await import('../../code-mode/search-index.js');
    const catalog = buildSearchCatalog();
    expect(Object.keys(catalog.operations.claims!)).toEqual([
      'assert',
      'support',
      'invalidate',
      'supersede',
      'link',
      'subscribe',
      'unsubscribe',
      'query',
      'affected',
    ]);
  });
});
